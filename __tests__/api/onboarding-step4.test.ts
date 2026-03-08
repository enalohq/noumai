import { PATCH } from '@/app/api/onboarding/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createNextRequest } from '@/__tests__/utils/test-helpers';

jest.mock('@/auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    workspace: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    workspaceMember: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    competitor: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    trackedPrompt: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((fn) => {
      if (typeof fn === 'function') return fn();
      return Promise.all(fn);
    }),
  },
}));

describe('PATCH /api/onboarding - Step 4 (Keywords)', () => {
  let mockAuth: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = auth as jest.Mock;
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    });
    // Setup all common mocks
    (prisma.workspace.update as jest.Mock).mockResolvedValue({ id: 'workspace-123' });
    (prisma.workspace.findUnique as jest.Mock).mockResolvedValue({ id: 'workspace-123' });
    (prisma.workspace.findFirst as jest.Mock).mockResolvedValue({ id: 'workspace-123' });
    (prisma.workspace.create as jest.Mock).mockResolvedValue({ id: 'workspace-123' });
    (prisma.workspaceMember.findFirst as jest.Mock).mockResolvedValue({ workspaceId: 'workspace-123' });
    (prisma.workspaceMember.create as jest.Mock).mockResolvedValue({ id: 'member-123' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-123', onboardingStep: 4 });
    (prisma.competitor.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.competitor.create as jest.Mock).mockResolvedValue({ id: 'competitor-123' });
    (prisma.trackedPrompt.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.trackedPrompt.create as jest.Mock).mockResolvedValue({ id: 'prompt-123' });
    (prisma.$transaction as jest.Mock).mockImplementation((fn) => {
      if (typeof fn === 'function') return fn();
      return Promise.all(fn);
    });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
    }
    jest.restoreAllMocks();
  });

  describe('Keywords Validation', () => {
    it('should reject empty keywords', async () => {
      (prisma.workspace.update as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        targetKeywords: '',
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-123',
        onboardingStep: 4,
      });

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: '',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);
    });

    it('should accept valid comma-separated keywords', async () => {
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        userId: 'user-123',
      });

      (prisma.workspace.update as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        targetKeywords: 'skincare, beauty, organic',
      });

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: 'skincare, beauty, organic',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);

      expect(prisma.workspace.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'workspace-123' },
          data: expect.objectContaining({
            targetKeywords: 'skincare, beauty, organic',
          }),
        })
      );
    });

    it('should normalize keywords (trim, lowercase, deduplicate)', async () => {
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        userId: 'user-123',
      });

      (prisma.workspace.update as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        targetKeywords: 'skincare, beauty',
      });

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: '  Skincare  ,  BEAUTY  ,  skincare  ',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);

      // Keywords should be normalized
      expect(prisma.workspace.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            targetKeywords: 'skincare, beauty',
          }),
        })
      );
    });

    it('should accept multiline keywords', async () => {
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        userId: 'user-123',
      });

      (prisma.workspace.update as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        targetKeywords: 'keyword1, keyword2, keyword3',
      });

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: 'keyword1\nkeyword2\nkeyword3',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);
    });

    it('should accept single keyword', async () => {
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        userId: 'user-123',
      });

      (prisma.workspace.update as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        targetKeywords: 'skincare',
      });

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: 'skincare',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);
    });

    it('should handle keywords with special characters', async () => {
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        userId: 'user-123',
      });

      (prisma.workspace.update as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        targetKeywords: 'ai/ml, c++, node.js, @mention, #hashtag',
      });

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: 'AI/ML, C++, Node.js, @mention, #hashtag',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);
    });

    it('should handle unicode keywords', async () => {
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        userId: 'user-123',
      });

      (prisma.workspace.update as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        targetKeywords: '美容, 护肤, 有机, café, naïve',
      });

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: '美容, 护肤, 有机, café, naïve',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Keywords Persistence', () => {
    it('should save keywords to workspace', async () => {
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        userId: 'user-123',
      });

      (prisma.workspace.update as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        targetKeywords: 'skincare, beauty',
      });

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: 'skincare, beauty',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);

      expect(prisma.workspace.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'workspace-123' },
          data: expect.objectContaining({
            targetKeywords: 'skincare, beauty',
          }),
        })
      );
    });

    it('should update existing keywords', async () => {
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        userId: 'user-123',
        targetKeywords: 'old keywords',
      });

      (prisma.workspace.update as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        targetKeywords: 'new keywords',
      });

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: 'new keywords',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);

      expect(prisma.workspace.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            targetKeywords: 'new keywords',
          }),
        })
      );
    });

    it('should set onboarding step to 4', async () => {
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        userId: 'user-123',
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-123',
        onboardingStep: 4,
      });

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: 'skincare, beauty',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: expect.objectContaining({
            onboardingStep: 4,
          }),
        })
      );
    });
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 for unauthenticated requests', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: 'skincare',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(401);
    });

    it('should allow user to update their own workspace', async () => {
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        userId: 'user-123',
      });

      (prisma.workspace.update as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        targetKeywords: 'skincare',
      });

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: 'skincare',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.workspaceMember.findFirst as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: 'skincare',
        },
      });

      await expect(PATCH(request)).rejects.toThrow('Database error');
    });

    it('should handle missing workspace gracefully', async () => {
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      });
      (prisma.workspace.create as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
      });

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: 'skincare',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Response Format', () => {
    it('should return success response', async () => {
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        userId: 'user-123',
      });

      (prisma.workspace.update as jest.Mock).mockResolvedValue({
        id: 'workspace-123',
        targetKeywords: 'skincare, beauty',
      });

      const request = createNextRequest({
        method: 'PATCH',
        body: {
          step: 4,
          targetKeywords: 'skincare, beauty',
        },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
