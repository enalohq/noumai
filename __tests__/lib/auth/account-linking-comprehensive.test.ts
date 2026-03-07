/**
 * Comprehensive Account Linking Tests
 * 
 * Tests ALL scenarios:
 * 1. Email/Password → OAuth (existing credentials, new OAuth)
 * 2. OAuth → Email/Password (existing OAuth, new credentials)
 * 3. Multiple OAuth providers
 * 4. Edge cases and conflicts
 */

// Mock Prisma BEFORE importing the service
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    account: {
      create: jest.fn(),
    },
    workspace: {
      create: jest.fn(),
    },
    workspaceMember: {
      count: jest.fn(),
    },
  },
}));

import { PrismaAccountLinkingService } from '@/lib/auth/account-linking';
import { prisma } from '@/lib/prisma';

describe('Comprehensive Account Linking', () => {
  let service: PrismaAccountLinkingService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    service = new PrismaAccountLinkingService();
    jest.clearAllMocks();
  });

  describe('Scenario 1: Email/Password → OAuth', () => {
    it('should link Google OAuth to existing email/password account', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        accounts: [
          { provider: 'credentials', type: 'credentials' }
        ],
        workspaces: [{ id: 'workspace-1' }]
      };

      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ name: 'John Doe' });
      
      (mockPrisma.account.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.workspaceMember.count as jest.Mock).mockResolvedValue(1);

      const oauthUser = {
        id: 'google-user-456',
        email: 'user@example.com',
        name: 'John Doe',
        image: 'https://google.com/avatar.jpg'
      };

      const oauthAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth',
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: 1234567890,
        token_type: 'Bearer',
        scope: 'email profile',
        id_token: 'id-token',
        session_state: null,
      };

      const result = await service.linkOAuthAccount(oauthUser as any, oauthAccount as any);

      expect(result.success).toBe(true);
      expect(result.action).toBe('linked');
      expect(result.userId).toBe('user-123');
      expect(mockPrisma.account.create).toHaveBeenCalled();
    });

    it('should link multiple OAuth providers to same account', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        accounts: [
          { provider: 'credentials', type: 'credentials' },
          { provider: 'google', type: 'oauth' }
        ],
        workspaces: [{ id: 'workspace-1' }]
      };

      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ name: 'John Doe' });
      
      (mockPrisma.account.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.workspaceMember.count as jest.Mock).mockResolvedValue(1);

      const oauthUser = {
        id: 'github-user-789',
        email: 'user@example.com',
        name: 'John Doe',
        image: 'https://github.com/avatar.jpg'
      };

      const githubAccount = {
        provider: 'github',
        providerAccountId: 'github-123',
        type: 'oauth',
      };

      const result = await service.linkOAuthAccount(oauthUser as any, githubAccount as any);

      expect(result.success).toBe(true);
      expect(result.action).toBe('linked');
      expect(mockPrisma.account.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            provider: 'github'
          })
        })
      );
    });
  });

  describe('Scenario 2: OAuth → Email/Password', () => {
    it('should link email/password to existing Google OAuth account', async () => {
      const existingUser = {
        id: 'user-oauth-123',
        email: 'user@example.com',
        name: 'John Doe',
        accounts: [
          { provider: 'google', type: 'oauth' }
        ],
        workspaces: [{ id: 'workspace-1' }]
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const result = await service.linkCredentialsAccount('user@example.com', 'user-oauth-123');

      expect(result.success).toBe(true);
      expect(result.action).toBe('linked');
      expect(result.userId).toBe('user-oauth-123');
    });

    it('should handle user with multiple OAuth providers adding credentials', async () => {
      const existingUser = {
        id: 'user-multi-oauth',
        email: 'user@example.com',
        name: 'Jane Doe',
        accounts: [
          { provider: 'google', type: 'oauth' },
          { provider: 'github', type: 'oauth' }
        ],
        workspaces: [{ id: 'workspace-1' }]
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const result = await service.linkCredentialsAccount('user@example.com', 'user-multi-oauth');

      expect(result.success).toBe(true);
      expect(result.action).toBe('linked');
      expect(result.userId).toBe('user-multi-oauth');
    });

    it('should detect when credentials account already exists', async () => {
      const existingUser = {
        id: 'user-both',
        email: 'user@example.com',
        name: 'John Doe',
        accounts: [
          { provider: 'google', type: 'oauth' },
          { provider: 'credentials', type: 'credentials' }
        ],
        workspaces: [{ id: 'workspace-1' }]
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const result = await service.linkCredentialsAccount('user@example.com', 'user-both');

      expect(result.success).toBe(true);
      expect(result.action).toBe('existing');
      expect(result.userId).toBe('user-both');
      // Should not create new account
      expect(mockPrisma.account.create).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle new user creation (no existing account)', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const oauthUser = {
        id: 'new-oauth-user',
        email: 'newuser@example.com',
        name: 'New User',
        image: 'https://oauth.com/avatar.jpg'
      };

      const oauthAccount = {
        provider: 'google',
        providerAccountId: 'google-new',
        type: 'oauth',
      };

      const result = await service.linkOAuthAccount(oauthUser as any, oauthAccount as any);

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
      expect(mockPrisma.account.create).not.toHaveBeenCalled();
    });

    it('should create workspace for user without one', async () => {
      const existingUser = {
        id: 'user-no-workspace',
        email: 'user@example.com',
        name: 'John Doe',
        accounts: [],
        workspaces: []
      };

      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ name: 'John Doe' });
      
      (mockPrisma.workspaceMember.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.account.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.workspace.create as jest.Mock).mockResolvedValue({});

      const oauthUser = {
        id: 'oauth-user',
        email: 'user@example.com',
        name: 'John Doe',
        image: 'https://oauth.com/avatar.jpg'
      };

      const oauthAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth',
      };

      const result = await service.linkOAuthAccount(oauthUser as any, oauthAccount as any);

      expect(result.success).toBe(true);
      expect(mockPrisma.workspace.create).toHaveBeenCalled();
    });

    it('should handle duplicate OAuth provider gracefully', async () => {
      const existingUser = {
        id: 'user-google',
        email: 'user@example.com',
        name: 'John Doe',
        accounts: [
          { provider: 'google', type: 'oauth' }
        ],
        workspaces: [{ id: 'workspace-1' }]
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const oauthUser = {
        id: 'google-user-different',
        email: 'user@example.com',
        name: 'John Doe',
        image: 'https://google.com/avatar.jpg'
      };

      const oauthAccount = {
        provider: 'google',
        providerAccountId: 'google-different-id',
        type: 'oauth',
      };

      const result = await service.linkOAuthAccount(oauthUser as any, oauthAccount as any);

      expect(result.success).toBe(true);
      expect(result.action).toBe('existing');
      expect(mockPrisma.account.create).not.toHaveBeenCalled();
    });

    it('should handle missing email gracefully', async () => {
      const userWithoutEmail = {
        id: 'user-id',
        email: undefined,
        name: 'User'
      };

      const oauthAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth',
      };

      const result = await service.linkOAuthAccount(userWithoutEmail as any, oauthAccount as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No email provided');
    });

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const oauthUser = {
        id: 'oauth-user',
        email: 'user@example.com',
        name: 'User'
      };

      const oauthAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth',
      };

      const result = await service.linkOAuthAccount(oauthUser as any, oauthAccount as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should merge user data intelligently', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: null, // No existing name
        accounts: [],
        workspaces: [{ id: 'workspace-1' }]
      };

      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ name: null }); // For updateUserWithOAuthData
      
      (mockPrisma.account.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.workspaceMember.count as jest.Mock).mockResolvedValue(1);

      const oauthUser = {
        id: 'oauth-user',
        email: 'user@example.com',
        name: 'John Doe', // OAuth provides name
        image: 'https://oauth.com/avatar.jpg'
      };

      const oauthAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth',
      };

      await service.linkOAuthAccount(oauthUser as any, oauthAccount as any);

      // Should update with OAuth name since user doesn't have one
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          name: 'John Doe',
          image: 'https://oauth.com/avatar.jpg',
          emailVerified: expect.any(Date)
        })
      });
    });

    it('should preserve existing user data when merging', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Existing Name',
        image: 'https://existing.com/avatar.jpg',
        accounts: [],
        workspaces: [{ id: 'workspace-1' }]
      };

      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ name: 'Existing Name' }); // For updateUserWithOAuthData
      
      (mockPrisma.account.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.workspaceMember.count as jest.Mock).mockResolvedValue(1);

      const oauthUser = {
        id: 'oauth-user',
        email: 'user@example.com',
        name: 'OAuth Name', // Different name from OAuth
        image: 'https://oauth.com/avatar.jpg' // Different image
      };

      const oauthAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth',
      };

      await service.linkOAuthAccount(oauthUser as any, oauthAccount as any);

      // Should NOT update name since user already has one
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          emailVerified: expect.any(Date),
          image: 'https://oauth.com/avatar.jpg'
          // name should NOT be included
        })
      });
    });
  });

  describe('Account Conflict Resolution', () => {
    it('should detect account conflicts', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'user@example.com',
        accounts: [],
        workspaces: []
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const result = await service.resolveAccountConflict('user@example.com', 'different-user-id');

      expect(result.success).toBe(false);
      expect(result.action).toBe('conflict');
      expect(result.requiresUserAction).toBe(true);
    });

    it('should resolve valid account conflicts', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'user@example.com',
        accounts: [],
        workspaces: []
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const result = await service.resolveAccountConflict('user@example.com', 'user-123');

      expect(result.success).toBe(true);
      expect(result.action).toBe('existing');
      expect(result.userId).toBe('user-123');
    });
  });
});