/**
 * Provider Tracker Tests
 * 
 * Tests tracking of authentication providers:
 * - Initial provider detection
 * - Current providers listing
 * - Provider history
 * - Provider statistics
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { PrismaProviderTrackerService } from '@/lib/auth/provider-tracker';
import { prisma } from '@/lib/prisma';

describe('Provider Tracker Service', () => {
  let service: PrismaProviderTrackerService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    service = new PrismaProviderTrackerService();
    jest.clearAllMocks();
  });

  describe('getUserProviderHistory', () => {
    it('should return provider history for user with single provider', async () => {
      const userData = {
        id: 'user-123',
        email: 'user@example.com',
        createdAt: new Date('2024-01-01'),
        accounts: [
          {
            provider: 'credentials',
            type: 'credentials',
            createdAt: new Date('2024-01-01')
          }
        ]
      };

      mockPrisma.user.findUnique.mockResolvedValue(userData);

      const result = await service.getUserProviderHistory('user-123');

      expect(result).toEqual({
        userId: 'user-123',
        email: 'user@example.com',
        initialProvider: {
          provider: 'credentials',
          type: 'credentials',
          linkedAt: new Date('2024-01-01'),
          isPrimary: true
        },
        currentProviders: [
          {
            provider: 'credentials',
            type: 'credentials',
            linkedAt: new Date('2024-01-01'),
            isPrimary: true
          }
        ],
        hasMultipleProviders: false,
        createdAt: new Date('2024-01-01')
      });
    });

    it('should return provider history for user with multiple providers', async () => {
      const userData = {
        id: 'user-456',
        email: 'user@example.com',
        createdAt: new Date('2024-01-01'),
        accounts: [
          {
            provider: 'credentials',
            type: 'credentials',
            createdAt: new Date('2024-01-01')
          },
          {
            provider: 'google',
            type: 'oauth',
            createdAt: new Date('2024-01-15')
          },
          {
            provider: 'github',
            type: 'oauth',
            createdAt: new Date('2024-02-01')
          }
        ]
      };

      mockPrisma.user.findUnique.mockResolvedValue(userData);

      const result = await service.getUserProviderHistory('user-456');

      expect(result?.hasMultipleProviders).toBe(true);
      expect(result?.currentProviders).toHaveLength(3);
      expect(result?.initialProvider?.provider).toBe('credentials');
      expect(result?.currentProviders[1].provider).toBe('google');
      expect(result?.currentProviders[2].provider).toBe('github');
    });

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserProviderHistory('non-existent');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await service.getUserProviderHistory('user-123');

      expect(result).toBeNull();
    });
  });

  describe('getInitialProvider', () => {
    it('should return the first provider used for signup', async () => {
      mockPrisma.account.findFirst.mockResolvedValue({
        provider: 'google',
        type: 'oauth',
        createdAt: new Date('2024-01-01')
      });

      const result = await service.getInitialProvider('user-123');

      expect(result).toEqual({
        provider: 'google',
        type: 'oauth',
        linkedAt: new Date('2024-01-01'),
        isPrimary: true
      });

      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        select: {
          provider: true,
          type: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' }
      });
    });

    it('should return null if user has no providers', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);

      const result = await service.getInitialProvider('user-123');

      expect(result).toBeNull();
    });
  });

  describe('getCurrentProviders', () => {
    it('should return all linked providers in order', async () => {
      mockPrisma.account.findMany.mockResolvedValue([
        {
          provider: 'credentials',
          type: 'credentials',
          createdAt: new Date('2024-01-01')
        },
        {
          provider: 'google',
          type: 'oauth',
          createdAt: new Date('2024-01-15')
        },
        {
          provider: 'github',
          type: 'oauth',
          createdAt: new Date('2024-02-01')
        }
      ]);

      const result = await service.getCurrentProviders('user-123');

      expect(result).toHaveLength(3);
      expect(result[0].provider).toBe('credentials');
      expect(result[0].isPrimary).toBe(true);
      expect(result[1].provider).toBe('google');
      expect(result[1].isPrimary).toBe(false);
      expect(result[2].provider).toBe('github');
      expect(result[2].isPrimary).toBe(false);
    });

    it('should return empty array if user has no providers', async () => {
      mockPrisma.account.findMany.mockResolvedValue([]);

      const result = await service.getCurrentProviders('user-123');

      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.account.findMany.mockRejectedValue(new Error('Database error'));

      const result = await service.getCurrentProviders('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('hasProvider', () => {
    it('should return true if user has provider', async () => {
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 'account-123',
        provider: 'google'
      });

      const result = await service.hasProvider('user-123', 'google');

      expect(result).toBe(true);
    });

    it('should return false if user does not have provider', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);

      const result = await service.hasProvider('user-123', 'github');

      expect(result).toBe(false);
    });

    it('should check for specific provider', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);

      await service.hasProvider('user-123', 'google');

      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          provider: 'google'
        }
      });
    });
  });

  describe('getProviderStats', () => {
    it('should return stats for user with mixed providers', async () => {
      mockPrisma.account.findMany.mockResolvedValue([
        { provider: 'credentials', type: 'credentials' },
        { provider: 'google', type: 'oauth' },
        { provider: 'github', type: 'oauth' }
      ]);

      const result = await service.getProviderStats('user-123');

      expect(result).toEqual({
        totalProviders: 3,
        providers: ['credentials', 'google', 'github'],
        hasCredentials: true,
        hasOAuth: true,
        oauthProviders: ['google', 'github']
      });
    });

    it('should return stats for OAuth-only user', async () => {
      mockPrisma.account.findMany.mockResolvedValue([
        { provider: 'google', type: 'oauth' },
        { provider: 'github', type: 'oauth' }
      ]);

      const result = await service.getProviderStats('user-123');

      expect(result).toEqual({
        totalProviders: 2,
        providers: ['google', 'github'],
        hasCredentials: false,
        hasOAuth: true,
        oauthProviders: ['google', 'github']
      });
    });

    it('should return stats for credentials-only user', async () => {
      mockPrisma.account.findMany.mockResolvedValue([
        { provider: 'credentials', type: 'credentials' }
      ]);

      const result = await service.getProviderStats('user-123');

      expect(result).toEqual({
        totalProviders: 1,
        providers: ['credentials'],
        hasCredentials: true,
        hasOAuth: false,
        oauthProviders: []
      });
    });

    it('should return empty stats if user has no providers', async () => {
      mockPrisma.account.findMany.mockResolvedValue([]);

      const result = await service.getProviderStats('user-123');

      expect(result).toEqual({
        totalProviders: 0,
        providers: [],
        hasCredentials: false,
        hasOAuth: false,
        oauthProviders: []
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.account.findMany.mockRejectedValue(new Error('Database error'));

      const result = await service.getProviderStats('user-123');

      expect(result).toEqual({
        totalProviders: 0,
        providers: [],
        hasCredentials: false,
        hasOAuth: false,
        oauthProviders: []
      });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should track user journey: Email/Password → Google → GitHub', async () => {
      // Initial signup with email/password
      mockPrisma.account.findFirst.mockResolvedValue({
        provider: 'credentials',
        type: 'credentials',
        createdAt: new Date('2024-01-01')
      });

      const initialProvider = await service.getInitialProvider('user-123');
      expect(initialProvider?.provider).toBe('credentials');

      // Later linked Google
      // Later linked GitHub
      mockPrisma.account.findMany.mockResolvedValue([
        {
          provider: 'credentials',
          type: 'credentials',
          createdAt: new Date('2024-01-01')
        },
        {
          provider: 'google',
          type: 'oauth',
          createdAt: new Date('2024-01-15')
        },
        {
          provider: 'github',
          type: 'oauth',
          createdAt: new Date('2024-02-01')
        }
      ]);

      const currentProviders = await service.getCurrentProviders('user-123');
      expect(currentProviders).toHaveLength(3);
      expect(currentProviders[0].provider).toBe('credentials');
      expect(currentProviders[1].provider).toBe('google');
      expect(currentProviders[2].provider).toBe('github');
    });

    it('should track user journey: Google → Email/Password', async () => {
      // Initial signup with Google
      mockPrisma.account.findFirst.mockResolvedValue({
        provider: 'google',
        type: 'oauth',
        createdAt: new Date('2024-01-01')
      });

      const initialProvider = await service.getInitialProvider('user-456');
      expect(initialProvider?.provider).toBe('google');

      // Later added email/password
      mockPrisma.account.findMany.mockResolvedValue([
        {
          provider: 'google',
          type: 'oauth',
          createdAt: new Date('2024-01-01')
        },
        {
          provider: 'credentials',
          type: 'credentials',
          createdAt: new Date('2024-01-20')
        }
      ]);

      const currentProviders = await service.getCurrentProviders('user-456');
      expect(currentProviders).toHaveLength(2);
      expect(currentProviders[0].provider).toBe('google');
      expect(currentProviders[1].provider).toBe('credentials');
    });
  });
});