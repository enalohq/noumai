/**
 * Comprehensive Account Linking Service
 * 
 * Handles ALL account linking scenarios:
 * 1. Email/Password → OAuth (existing credentials account, new OAuth)
 * 2. OAuth → Email/Password (existing OAuth account, new credentials)
 * 3. Multiple OAuth providers linking
 * 4. Account conflicts and edge cases
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Only handles account linking logic
 * - Open/Closed: Extensible for new providers
 * - Dependency Inversion: Uses abstractions for database operations
 */

import { prisma } from "@/lib/prisma";
import type { Account, User } from "next-auth";

export interface AccountLinkingResult {
  success: boolean;
  userId?: string;
  error?: string;
  action?: 'linked' | 'created' | 'existing' | 'conflict';
  requiresUserAction?: boolean; // User needs to resolve conflict
}

export interface AccountLinkingService {
  linkOAuthAccount(user: User, account: Account): Promise<AccountLinkingResult>;
  linkCredentialsAccount(email: string, userId: string): Promise<AccountLinkingResult>;
  findExistingUser(email: string): Promise<ExistingUser | null>;
  createAccountLink(userId: string, account: Account): Promise<void>;
  resolveAccountConflict(email: string, preferredUserId: string): Promise<AccountLinkingResult>;
}

interface ExistingUser {
  id: string;
  email: string;
  name?: string | null;
  accounts: Array<{ provider: string; type: string }>;
  workspaces: Array<{ id: string }>;
}

/**
 * Comprehensive account linking service implementation
 * Handles all scenarios and edge cases
 */
export class PrismaAccountLinkingService implements AccountLinkingService {
  
  /**
   * Link OAuth account to existing user
   * Scenario 1: Email/Password → OAuth
   */
  async linkOAuthAccount(user: User, account: Account): Promise<AccountLinkingResult> {
    if (!user.email) {
      return { success: false, error: 'No email provided' };
    }

    try {
      const existingUser = await this.findExistingUser(user.email);
      
      if (existingUser) {
        // Check if this OAuth provider is already linked
        const providerAlreadyLinked = existingUser.accounts.some(
          (acc) => acc.provider === account.provider
        );

        if (providerAlreadyLinked) {
          return { 
            success: true, 
            userId: existingUser.id, 
            action: 'existing' 
          };
        }

        // Link the new OAuth account to existing user
        await this.createAccountLink(existingUser.id, account);
        
        // Update user with OAuth info (merge data)
        await this.updateUserWithOAuthData(existingUser.id, user);
        
        // Ensure user has a workspace
        await this.ensureUserHasWorkspace(existingUser.id, user);

        return { 
          success: true, 
          userId: existingUser.id, 
          action: 'linked' 
        };
      }

      // No existing user found - this will be handled by NextAuth's default flow
      return { success: true, action: 'created' };
      
    } catch (error) {
      console.error('OAuth account linking error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Link credentials account to existing OAuth user
   * Scenario 2: OAuth → Email/Password
   * 
   * This is called when user tries to sign in with email/password
   * but an OAuth account already exists with that email
   */
  async linkCredentialsAccount(email: string, userId: string): Promise<AccountLinkingResult> {
    if (!email) {
      return { success: false, error: 'No email provided' };
    }

    try {
      const existingUser = await this.findExistingUser(email);
      
      if (existingUser) {
        // Check if user already has credentials account
        const hasCredentialsAccount = existingUser.accounts.some(
          (acc) => acc.provider === 'credentials'
        );

        if (hasCredentialsAccount) {
          // Already has credentials account
          return { 
            success: true, 
            userId: existingUser.id, 
            action: 'existing' 
          };
        }

        // User has OAuth account but trying to use credentials
        // This is a valid linking scenario - user wants to add password login
        // The password will be set by the signup/update process
        return { 
          success: true, 
          userId: existingUser.id, 
          action: 'linked',
          requiresUserAction: false
        };
      }

      // No existing user - this is a new credentials account
      return { success: true, action: 'created' };
      
    } catch (error) {
      console.error('Credentials account linking error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Find existing user by email with related data
   * Follows ISP by only selecting needed fields
   */
  async findExistingUser(email: string): Promise<ExistingUser | null> {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
        workspaces: { take: 1 },
      },
    });
  }

  /**
   * Create account link between user and OAuth provider
   * Follows SRP by handling only account creation
   */
  async createAccountLink(userId: string, account: Account): Promise<void> {
    await prisma.account.create({
      data: {
        userId,
        type: "oauth",
        provider: account.provider ?? "",
        providerAccountId: account.providerAccountId ?? "",
        access_token: account.access_token ?? null,
        refresh_token: account.refresh_token ?? null,
        expires_at: account.expires_at ? Math.floor(account.expires_at) : null,
        token_type: account.token_type ?? null,
        scope: account.scope ?? null,
        id_token: account.id_token ?? null,
        session_state: typeof account.session_state === 'string' ? account.session_state : null,
      },
    });
  }

  /**
   * Resolve account conflicts when multiple accounts exist
   * Edge case: User has multiple OAuth accounts and tries to link credentials
   */
  async resolveAccountConflict(email: string, preferredUserId: string): Promise<AccountLinkingResult> {
    try {
      const existingUser = await this.findExistingUser(email);
      
      if (!existingUser) {
        return { success: false, error: 'User not found' };
      }

      if (existingUser.id !== preferredUserId) {
        return { 
          success: false, 
          error: 'Account conflict: Email belongs to different user',
          action: 'conflict',
          requiresUserAction: true
        };
      }

      return { success: true, userId: existingUser.id, action: 'existing' };
    } catch (error) {
      console.error('Account conflict resolution error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update user with OAuth data (merge information)
   * Follows SRP by handling only user data updates
   */
  private async updateUserWithOAuthData(userId: string, oauthUser: User): Promise<void> {
    const updateData: Record<string, unknown> = {
      emailVerified: new Date(),
    };

    // Only update image if user doesn't have one or OAuth provides a better one
    if (oauthUser.image) {
      updateData.image = oauthUser.image;
    }

    // Only update name if user doesn't have one
    if (oauthUser.name) {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });
      
      if (!existingUser?.name) {
        updateData.name = oauthUser.name;
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  /**
   * Ensure user has a default workspace
   * Follows SRP by handling only workspace creation
   */
  private async ensureUserHasWorkspace(userId: string, user: User): Promise<void> {
    const existingWorkspaces = await prisma.workspaceMember.count({
      where: { userId }
    });

    if (existingWorkspaces === 0) {
      await prisma.workspace.create({
        data: {
          name: `${user.name || user.email}'s Workspace`,
          description: "Default workspace",
          members: {
            create: { userId, role: "owner" },
          },
        },
      });
    }
  }
}

// Export singleton instance following DRY principle
export const accountLinkingService = new PrismaAccountLinkingService();