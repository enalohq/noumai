/**
 * Provider Tracker Service
 * 
 * Tracks which authentication providers a user has used
 * - Initial provider (first signup method)
 * - Current providers (all linked accounts)
 * - Provider history and usage
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Only tracks provider information
 * - Dependency Inversion: Uses Prisma abstractions
 */

import { prisma } from "@/lib/prisma";

export interface ProviderInfo {
  provider: string;
  type: string;
  linkedAt?: Date;
  isPrimary?: boolean;
}

export interface UserProviderHistory {
  userId: string;
  email: string;
  initialProvider: ProviderInfo | null;
  currentProviders: ProviderInfo[];
  hasMultipleProviders: boolean;
  createdAt: Date;
}

export interface ProviderTrackerService {
  getUserProviderHistory(userId: string): Promise<UserProviderHistory | null>;
  getInitialProvider(userId: string): Promise<ProviderInfo | null>;
  getCurrentProviders(userId: string): Promise<ProviderInfo[]>;
  hasProvider(userId: string, provider: string): Promise<boolean>;
  getProviderStats(userId: string): Promise<ProviderStats>;
}

export interface ProviderStats {
  totalProviders: number;
  providers: string[];
  hasCredentials: boolean;
  hasOAuth: boolean;
  oauthProviders: string[];
}

/**
 * Default implementation of ProviderTrackerService
 */
export class PrismaProviderTrackerService implements ProviderTrackerService {
  
  /**
   * Get complete provider history for a user
   * Shows initial provider and all current linked providers
   */
  async getUserProviderHistory(userId: string): Promise<UserProviderHistory | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          createdAt: true,
          accounts: {
            select: {
              provider: true,
              type: true,
            }
          }
        }
      });

      if (!user) {
        return null;
      }

      // First account is the initial provider
      const initialProvider = user.accounts.length > 0 
        ? {
            provider: user.accounts[0].provider,
            type: user.accounts[0].type,
            linkedAt: user.createdAt,
            isPrimary: true
          }
        : null;

      // All accounts are current providers
      const currentProviders = user.accounts.map((acc, index) => ({
        provider: acc.provider,
        type: acc.type,
        linkedAt: user.createdAt,
        isPrimary: index === 0
      }));

      return {
        userId: user.id,
        email: user.email,
        initialProvider,
        currentProviders,
        hasMultipleProviders: user.accounts.length > 1,
        createdAt: user.createdAt
      };
    } catch (error) {
      console.error('Error getting provider history:', error);
      return null;
    }
  }

  /**
   * Get the initial provider used for signup
   * This is the first account created for the user
   */
  async getInitialProvider(userId: string): Promise<ProviderInfo | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          createdAt: true,
          accounts: {
            select: {
              provider: true,
              type: true,
            },
            take: 1
          }
        }
      });

      if (!user || user.accounts.length === 0) {
        return null;
      }

      return {
        provider: user.accounts[0].provider,
        type: user.accounts[0].type,
        linkedAt: user.createdAt,
        isPrimary: true
      };
    } catch (error) {
      console.error('Error getting initial provider:', error);
      return null;
    }
  }

  /**
   * Get all current providers linked to user account
   */
  async getCurrentProviders(userId: string): Promise<ProviderInfo[]> {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId },
        select: {
          provider: true,
          type: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' }
      });

      return accounts.map((acc, index) => ({
        provider: acc.provider,
        type: acc.type,
        linkedAt: acc.createdAt,
        isPrimary: index === 0
      }));
    } catch (error) {
      console.error('Error getting current providers:', error);
      return [];
    }
  }

  /**
   * Check if user has a specific provider linked
   */
  async hasProvider(userId: string, provider: string): Promise<boolean> {
    try {
      const account = await prisma.account.findFirst({
        where: {
          userId,
          provider
        }
      });

      return !!account;
    } catch (error) {
      console.error('Error checking provider:', error);
      return false;
    }
  }

  /**
   * Get provider statistics for a user
   */
  async getProviderStats(userId: string): Promise<ProviderStats> {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId },
        select: { provider: true, type: true }
      });

      const providers = accounts.map(acc => acc.provider);
      const hasCredentials = providers.includes('credentials');
      const oauthProviders = providers.filter(p => p !== 'credentials');

      return {
        totalProviders: providers.length,
        providers,
        hasCredentials,
        hasOAuth: oauthProviders.length > 0,
        oauthProviders
      };
    } catch (error) {
      console.error('Error getting provider stats:', error);
      return {
        totalProviders: 0,
        providers: [],
        hasCredentials: false,
        hasOAuth: false,
        oauthProviders: []
      };
    }
  }
}

// Export singleton instance
export const providerTrackerService = new PrismaProviderTrackerService();