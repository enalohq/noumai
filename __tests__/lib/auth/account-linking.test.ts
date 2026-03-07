/**
 * Tests for Account Linking Service
 * 
 * Tests follow SOLID principles:
 * - Single Responsibility: Each test focuses on one specific behavior
 * - Interface Segregation: Tests use minimal interfaces
 * - Dependency Inversion: Uses mocks for external dependencies
 */

import { PrismaAccountLinkingService } from '@/lib/auth/account-linking';
import type { User, Account } from 'next-auth';

// Mock Prisma
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

import { prisma } from '@/lib/prisma';

describe('Account Linking Service', () => {
  let service: PrismaAccountLinkingService;
  let mockUser: User;
  let mockAccount: Account;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new PrismaAccountLinkingService();
    
    mockUser = {
      id: 'oauth-user-id',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
    };

    mockAccount = {
      provider: 'google',
      providerAccountId: 'google-123',
      type: 'oauth',
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_at: 1234567890,
      token_type: 'Bearer',
      scope: 'email profile',
      id_token: 'id-token',
      session_state: 'session-state',
    };

    // Reset all mocks
    jest.clearAllMocks();
    // Suppress console.error for all tests in this suite
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('linkOAuthAccount', () => {
    it('should return error when user has no email', async () => {
      const userWithoutEmail = { ...mockUser, email: undefined };
      
      const result = await service.linkOAuthAccount(userWithoutEmail, mockAccount);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No email provided');
    });

    it('should link OAuth account to existing user successfully', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: 'test@example.com',
        name: 'Existing User',
        accounts: [], // No existing OAuth accounts
        workspaces: [{ id: 'workspace-1' }], // Has workspace
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (prisma.account.create as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.linkOAuthAccount(mockUser, mockAccount);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('existing-user-id');
      expect(result.action).toBe('linked');
      
      // Verify account was created
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          userId: 'existing-user-id',
          type: 'oauth',
          provider: 'google',
          providerAccountId: 'google-123',
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_at: 1234567890,
          token_type: 'Bearer',
          scope: 'email profile',
          id_token: 'id-token',
          session_state: 'session-state',
        },
      });

      // Verify user was updated
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'existing-user-id' },
        data: {
          emailVerified: expect.any(Date),
          image: 'https://example.com/avatar.jpg',
        },
      });
    });

    it('should return existing when OAuth provider already linked', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: 'test@example.com',
        accounts: [{ provider: 'google' }], // Already has Google account
        workspaces: [{ id: 'workspace-1' }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const result = await service.linkOAuthAccount(mockUser, mockAccount);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('existing-user-id');
      expect(result.action).toBe('existing');
      
      // Should not create new account
      expect(prisma.account.create).not.toHaveBeenCalled();
    });

    it('should create workspace for user without one', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: 'test@example.com',
        name: null, // No existing name
        accounts: [],
        workspaces: [], // No workspace
      };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser) // First call in linkOAuthAccount
        .mockResolvedValueOnce({ name: null }); // Second call in updateUserWithOAuthData
      
      (prisma.workspaceMember.count as jest.Mock).mockResolvedValue(0);
      (prisma.account.create as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.workspace.create as jest.Mock).mockResolvedValue({});

      const result = await service.linkOAuthAccount(mockUser, mockAccount);

      expect(result.success).toBe(true);
      
      // Verify workspace was created
      expect(prisma.workspace.create).toHaveBeenCalledWith({
        data: {
          name: "Test User's Workspace",
          description: "Default workspace",
          members: {
            create: { userId: 'existing-user-id', role: "owner" },
          },
        },
      });
    });

    it('should handle errors gracefully', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await service.linkOAuthAccount(mockUser, mockAccount);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      // Verify that the error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'OAuth account linking error:',
        expect.any(Error)
      );
    });

    it('should return created action for new users', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // No existing user

      const result = await service.linkOAuthAccount(mockUser, mockAccount);

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
    });
  });

  describe('findExistingUser', () => {
    it('should find user with accounts and workspaces', async () => {
      const mockUserData = {
        id: 'user-id',
        email: 'test@example.com',
        accounts: [],
        workspaces: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserData);

      const result = await service.findExistingUser('test@example.com');

      expect(result).toEqual(mockUserData);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          accounts: true,
          workspaces: { take: 1 },
        },
      });
    });
  });

  describe('createAccountLink', () => {
    it('should create account with correct data', async () => {
      (prisma.account.create as jest.Mock).mockResolvedValue({});

      await service.createAccountLink('user-id', mockAccount);

      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id',
          type: 'oauth',
          provider: 'google',
          providerAccountId: 'google-123',
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_at: 1234567890,
          token_type: 'Bearer',
          scope: 'email profile',
          id_token: 'id-token',
          session_state: 'session-state',
        },
      });
    });

    it('should handle null values in account data', async () => {
      const accountWithNulls = {
        ...mockAccount,
        access_token: null,
        refresh_token: null,
        expires_at: null,
      };

      (prisma.account.create as jest.Mock).mockResolvedValue({});

      await service.createAccountLink('user-id', accountWithNulls);

      expect(prisma.account.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          access_token: null,
          refresh_token: null,
          expires_at: null,
        }),
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with existing name correctly', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: 'test@example.com',
        name: 'Existing Name', // User already has a name
        accounts: [],
        workspaces: [{ id: 'workspace-1' }],
      };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ name: 'Existing Name' }); // For updateUserWithOAuthData

      (prisma.account.create as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await service.linkOAuthAccount(mockUser, mockAccount);

      // Should not update name since user already has one
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'existing-user-id' },
        data: {
          emailVerified: expect.any(Date),
          image: 'https://example.com/avatar.jpg',
          // name should not be included
        },
      });
    });

    it('should handle account with string session_state', async () => {
      const accountWithStringSession = {
        ...mockAccount,
        session_state: 'string-session-state',
      };

      const existingUser = {
        id: 'existing-user-id',
        email: 'test@example.com',
        accounts: [],
        workspaces: [{ id: 'workspace-1' }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (prisma.account.create as jest.Mock).mockResolvedValue({});

      await service.linkOAuthAccount(mockUser, accountWithStringSession);

      expect(prisma.account.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          session_state: 'string-session-state',
        }),
      });
    });
  });
});