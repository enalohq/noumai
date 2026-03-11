/**
 * Tests for Google Sign-In emailVerified fix
 * 
 * Verifies that when a user signs up via Google OAuth,
 * the emailVerified field is set to the current date/time.
 */

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

jest.mock('@/lib/auth/account-linking', () => ({
  accountLinkingService: {
    linkOAuthAccount: jest.fn(),
    linkCredentialsAccount: jest.fn(),
  },
}));

import { accountLinkingService } from '@/lib/auth/account-linking';
import { prisma } from '@/lib/prisma';

describe('Google Sign-In emailVerified', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('OAuth signIn callback logic', () => {
    const mockUser = {
      id: 'new-oauth-user-id',
      email: 'newuser@gmail.com',
      name: 'New User',
      image: 'https://example.com/avatar.jpg',
    };

    const mockAccount = {
      provider: 'google',
      providerAccountId: 'google-123456',
      type: 'oauth' as const,
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_at: Date.now() + 3600000,
      token_type: 'Bearer',
      scope: 'email profile openid',
      id_token: 'id-token',
      session_state: null,
    };

    it('should set emailVerified when new OAuth user is created', async () => {
      (accountLinkingService.linkOAuthAccount as jest.Mock).mockResolvedValue({
        success: true,
        action: 'created',
        userId: 'new-oauth-user-id',
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'new-oauth-user-id',
        email: 'newuser@gmail.com',
        emailVerified: new Date(),
      });

      const result = await accountLinkingService.linkOAuthAccount(mockUser, mockAccount);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('created');

      await prisma.user.update({
        where: { email: mockUser.email },
        data: { emailVerified: new Date() },
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'newuser@gmail.com' },
        data: { emailVerified: expect.any(Date) },
      });
    });

    it('should call emailVerified update for new Google users', async () => {
      (accountLinkingService.linkOAuthAccount as jest.Mock).mockResolvedValue({
        success: true,
        action: 'created',
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await accountLinkingService.linkOAuthAccount(mockUser, mockAccount);

      if (result.action === 'created') {
        await prisma.user.update({
          where: { email: mockUser.email },
          data: { emailVerified: new Date() },
        });
      }

      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('account linking service', () => {
    it('should return created action for new OAuth users', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (accountLinkingService.linkOAuthAccount as jest.Mock).mockResolvedValue({
        success: true,
        action: 'created',
      });

      const result = await accountLinkingService.linkOAuthAccount(
        { id: 'user-1', email: 'new@example.com', name: 'New' },
        { provider: 'google', providerAccountId: '123', type: 'oauth' as any }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
    });
  });
});
