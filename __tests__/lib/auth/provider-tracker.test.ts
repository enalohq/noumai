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
  default: {
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
import { providerFactory } from '@/__tests__/factories/provider.factory';

describe('Provider Tracker Service', () => {
  let service: PrismaProviderTrackerService;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new PrismaProviderTrackerService();
    // Reset mock call history but keep implementations
    (prisma.user.findUnique as jest.Mock).mockClear();
    (prisma.account.findFirst as jest.Mock).mockClear();
    (prisma.account.findMany as jest.Mock).mockClear();
    // Suppress console.error for all tests in this suite
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
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

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userData);

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

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userData);

      const result = await service.getUserProviderHistory('user-456');

      expect(result?.hasMultipleProviders).toBe(true);
      expect(result?.currentProviders).toHaveLength(3);
      expect(result?.initialProvider?.provider).toBe('credentials');
      expect(result?.currentProviders[1].provider).toBe('google');
      expect(result?.currentProviders[2].provider).toBe('github');
    });

    it('should return null for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getUserProviderHistory('non-existent');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await service.getUserProviderHistory('user-123');

      expect(result).toBeNull();
      // Verify that the error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.any(Error)
      );
    });
  });

  describe('getInitialProvider', () => {
    it('should return the first provider used for signup', async () => {
      const createdAt = new Date('2024-01-01');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        createdAt,
        accounts: [
          {
            provider: 'google',
            type: 'oauth',
          }
        ]
      });

      const result = await service.getInitialProvider('user-123');

      expect(result).toEqual(providerFactory.google({ linkedAt: createdAt, isPrimary: true }));
    });

    it('should return null if user has no providers', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        createdAt: new Date('2024-01-01'),
        accounts: []
      });

      const result = await service.getInitialProvider('user-123');

      expect(result).toBeNull();
    });
  });

  describe('getCurrentProviders', () => {
    it('should return all linked providers in order', async () => {
      const createdAt = new Date('2024-01-01');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        createdAt,
        accounts: [
          {
            provider: 'credentials',
            type: 'credentials',
          },
          {
            provider: 'google',
            type: 'oauth',
          },
          {
            provider: 'github',
            type: 'oauth',
          }
        ]
      });

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
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        createdAt: new Date('2024-01-01'),
        accounts: []
      });

      const result = await service.getCurrentProviders('user-123');

      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await service.getCurrentProviders('user-123');

      expect(result).toEqual([]);
      // Verify that the error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.any(Error)
      );
    });
  });

  describe('hasProvider', () => {
    it('should return true if user has provider', async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue({
        id: 'account-123',
        provider: 'google'
      });

      const result = await service.hasProvider('user-123', 'google');

      expect(result).toBe(true);
    });

    it('should return false if user does not have provider', async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.hasProvider('user-123', 'github');

      expect(result).toBe(false);
    });

    it('should check for specific provider', async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);

      await service.hasProvider('user-123', 'google');

      expect((prisma.account.findFirst as jest.Mock)).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          provider: 'google'
        }
      });
    });
  });

  describe('getProviderStats', () => {
    it('should return stats for user with mixed providers', async () => {
      (prisma.account.findMany as jest.Mock).mockResolvedValue([
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
      (prisma.account.findMany as jest.Mock).mockResolvedValue([
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
      (prisma.account.findMany as jest.Mock).mockResolvedValue([
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
      (prisma.account.findMany as jest.Mock).mockResolvedValue([]);

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
      (prisma.account.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await service.getProviderStats('user-123');

      expect(result).toEqual({
        totalProviders: 0,
        providers: [],
        hasCredentials: false,
        hasOAuth: false,
        oauthProviders: []
      });
      // Verify that the error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.any(Error)
      );
    });
  });

  describe('Real-world Scenarios', () => {
    it('should track user journey: Email/Password → Google → GitHub', async () => {
      // Initial signup with email/password
      const createdAt = new Date('2024-01-01');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        createdAt,
        accounts: [
          {
            provider: 'credentials',
            type: 'credentials',
          }
        ]
      });

      const initialProvider = await service.getInitialProvider('user-123');
      expect(initialProvider?.provider).toBe('credentials');

      // Later linked Google and GitHub
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        createdAt,
        accounts: [
          {
            provider: 'credentials',
            type: 'credentials',
          },
          {
            provider: 'google',
            type: 'oauth',
          },
          {
            provider: 'github',
            type: 'oauth',
          }
        ]
      });

      const currentProviders = await service.getCurrentProviders('user-123');
      expect(currentProviders).toHaveLength(3);
      expect(currentProviders[0]).toEqual(providerFactory.credentials({ linkedAt: createdAt, isPrimary: true }));
      expect(currentProviders[1]).toEqual(providerFactory.google({ linkedAt: createdAt, isPrimary: false }));
      expect(currentProviders[2]).toEqual(providerFactory.github({ linkedAt: createdAt, isPrimary: false }));
    });

    it('should track user journey: Google → Email/Password', async () => {
      // Initial signup with Google
      const createdAt = new Date('2024-01-01');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        createdAt,
        accounts: [
          {
            provider: 'google',
            type: 'oauth',
          }
        ]
      });

      const initialProvider = await service.getInitialProvider('user-456');
      expect(initialProvider?.provider).toBe('google');

      // Later added email/password
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        createdAt,
        accounts: [
          {
            provider: 'google',
            type: 'oauth',
          },
          {
            provider: 'credentials',
            type: 'credentials',
          }
        ]
      });

      const currentProviders = await service.getCurrentProviders('user-456');
      expect(currentProviders).toHaveLength(2);
      expect(currentProviders[0]).toEqual(providerFactory.google({ linkedAt: createdAt, isPrimary: true }));
      expect(currentProviders[1]).toEqual(providerFactory.credentials({ linkedAt: createdAt, isPrimary: false }));
    });
  });
});
