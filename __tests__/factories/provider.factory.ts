/**
 * Provider Factory - Creates test data for authentication provider tests
 */

import { ProviderInfo } from '@/lib/auth/provider-tracker';

export const providerFactory = {
  /**
   * Create a provider info object
   */
  create(overrides: Partial<ProviderInfo> = {}): ProviderInfo {
    return {
      provider: 'google',
      type: 'oauth',
      linkedAt: new Date('2024-01-01'),
      isPrimary: true,
      ...overrides,
    };
  },

  /**
   * Create a credentials provider
   */
  credentials(overrides: Partial<ProviderInfo> = {}): ProviderInfo {
    return this.create({
      provider: 'credentials',
      type: 'credentials',
      isPrimary: true,
      ...overrides,
    });
  },

  /**
   * Create a Google OAuth provider
   */
  google(overrides: Partial<ProviderInfo> = {}): ProviderInfo {
    return this.create({
      provider: 'google',
      type: 'oauth',
      ...overrides,
    });
  },

  /**
   * Create a GitHub OAuth provider
   */
  github(overrides: Partial<ProviderInfo> = {}): ProviderInfo {
    return this.create({
      provider: 'github',
      type: 'oauth',
      ...overrides,
    });
  },

  /**
   * Create multiple providers in sequence
   */
  sequence(providers: Array<{ provider: string; type: string }> = []): ProviderInfo[] {
    const defaults = [
      { provider: 'credentials', type: 'credentials' },
      { provider: 'google', type: 'oauth' },
      { provider: 'github', type: 'oauth' },
    ];

    const providerList = providers.length > 0 ? providers : defaults;

    return providerList.map((p, index) =>
      this.create({
        provider: p.provider,
        type: p.type,
        linkedAt: new Date(new Date('2024-01-01').getTime() + index * 86400000), // +1 day each
        isPrimary: index === 0,
      })
    );
  },
};
