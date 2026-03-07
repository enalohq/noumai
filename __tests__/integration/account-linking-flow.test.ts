/**
 * Integration test for account linking flow
 * 
 * Tests the complete user journey:
 * 1. User signs up with email/password
 * 2. User tries to sign in with Google using same email
 * 3. Accounts should be automatically linked
 * 4. User should be redirected to appropriate page
 */

// Mock the Prisma module BEFORE importing the service
jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
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
  };

  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

import { PrismaAccountLinkingService } from '@/lib/auth/account-linking';
import { prisma } from '@/lib/prisma';

describe('Account Linking Integration Flow', () => {
  let service: PrismaAccountLinkingService;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new PrismaAccountLinkingService();
    jest.clearAllMocks();
    // Suppress console.error for all tests in this suite
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Complete User Journey', () => {
    it('should handle the complete account linking flow', async () => {
      // Scenario: User has existing email/password account, tries OAuth sign-in
      
      // 1. Mock existing user with email/password account
      const existingUser = {
        id: 'existing-user-123',
        email: 'user@example.com',
        name: 'John Doe',
        password: 'hashed-password',
        accounts: [
          { provider: 'credentials', type: 'credentials' }
        ],
        workspaces: [
          { id: 'workspace-123' }
        ]
      };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ name: 'John Doe' }); // For updateUserWithOAuthData
      
      (prisma.account.create as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.workspaceMember.count as jest.Mock).mockResolvedValue(1); // Has workspace

      // 2. Simulate OAuth sign-in attempt
      const oauthUser = {
        id: 'google-user-456', // Different ID from OAuth provider
        email: 'user@example.com', // Same email
        name: 'John Doe',
        image: 'https://google.com/avatar.jpg'
      };

      const oauthAccount = {
        provider: 'google',
        providerAccountId: 'google-123456',
        type: 'oauth',
        access_token: 'google-access-token',
        refresh_token: 'google-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
        scope: 'email profile',
        id_token: 'google-id-token',
        session_state: null,
      };

      // 3. Execute account linking
      const result = await service.linkOAuthAccount(oauthUser, oauthAccount);

      // 4. Verify successful linking
      expect(result.success).toBe(true);
      expect(result.action).toBe('linked');
      expect(result.userId).toBe('existing-user-123');

      // 5. Verify account was created with correct data
      expect((prisma.account.create as jest.Mock)).toHaveBeenCalledWith({
        data: {
          userId: 'existing-user-123',
          type: 'oauth',
          provider: 'google',
          providerAccountId: 'google-123456',
          access_token: 'google-access-token',
          refresh_token: 'google-refresh-token',
          expires_at: expect.any(Number),
          token_type: 'Bearer',
          scope: 'email profile',
          id_token: 'google-id-token',
          session_state: null,
        },
      });

      // 6. Verify user was updated with OAuth data
      expect((prisma.user.update as jest.Mock)).toHaveBeenCalledWith({
        where: { id: 'existing-user-123' },
        data: {
          emailVerified: expect.any(Date),
          image: 'https://google.com/avatar.jpg',
        },
      });
    });

    it('should handle user without workspace during linking', async () => {
      // User exists but has no workspace
      const existingUser = {
        id: 'user-no-workspace',
        email: 'user@example.com',
        name: 'Jane Doe',
        accounts: [],
        workspaces: [] // No workspace
      };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ name: 'Jane Doe' }); // For updateUserWithOAuthData
      
      (prisma.workspaceMember.count as jest.Mock).mockResolvedValue(0);
      (prisma.account.create as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.workspace.create as jest.Mock).mockResolvedValue({});

      const oauthUser = {
        id: 'oauth-user',
        email: 'user@example.com',
        name: 'Jane Doe Updated',
        image: 'https://oauth.com/avatar.jpg'
      };

      const oauthAccount = {
        provider: 'google',
        providerAccountId: 'google-789',
        type: 'oauth',
      };

      const result = await service.linkOAuthAccount(oauthUser, oauthAccount);

      expect(result.success).toBe(true);
      expect(result.action).toBe('linked');

      // Should create workspace
      expect((prisma.workspace.create as jest.Mock)).toHaveBeenCalledWith({
        data: {
          name: "Jane Doe Updated's Workspace",
          description: "Default workspace",
          members: {
            create: { userId: 'user-no-workspace', role: "owner" },
          },
        },
      });
    });

    it('should handle new user creation flow', async () => {
      // No existing user found
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const newUser = {
        id: 'new-oauth-user',
        email: 'newuser@example.com',
        name: 'New User',
        image: 'https://oauth.com/new-avatar.jpg'
      };

      const oauthAccount = {
        provider: 'google',
        providerAccountId: 'google-new-123',
        type: 'oauth',
      };

      const result = await service.linkOAuthAccount(newUser, oauthAccount);

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');

      // Should not create account link (NextAuth handles new user creation)
      expect((prisma.account.create as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should handle already linked provider gracefully', async () => {
      const existingUser = {
        id: 'user-with-google',
        email: 'user@example.com',
        accounts: [
          { provider: 'credentials' },
          { provider: 'google' } // Already has Google account
        ],
        workspaces: [{ id: 'workspace-1' }]
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const oauthUser = {
        id: 'google-user',
        email: 'user@example.com',
        name: 'User Name'
      };

      const oauthAccount = {
        provider: 'google',
        providerAccountId: 'google-existing',
        type: 'oauth',
      };

      const result = await service.linkOAuthAccount(oauthUser, oauthAccount);

      expect(result.success).toBe(true);
      expect(result.action).toBe('existing');
      expect(result.userId).toBe('user-with-google');

      // Should not create new account
      expect((prisma.account.create as jest.Mock)).not.toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const user = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'User'
      };

      const account = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth',
      };

      const result = await service.linkOAuthAccount(user, account);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
      // Verify that the error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'OAuth account linking error:',
        expect.any(Error)
      );
    });

    it('should handle missing email', async () => {
      const userWithoutEmail = {
        id: 'user-id',
        email: undefined,
        name: 'User'
      };

      const account = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth',
      };

      const result = await service.linkOAuthAccount(userWithoutEmail, account);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No email provided');
    });
  });
});