/**
 * Competitor Factory - Creates test data for competitor-related tests
 * Follows factory pattern for complex object creation
 */

import { Competitor } from '@/lib/competitors/types';

export const competitorFactory = {
  /**
   * Create a single competitor with optional overrides
   */
  create(overrides: Partial<Competitor> = {}): Competitor {
    return {
      name: 'Test Competitor',
      url: 'https://example.com',
      type: 'direct',
      confidence: 0.9,
      source: 'llm',
      ...overrides,
    };
  },

  /**
   * Create multiple competitors
   */
  createMany(count: number, overrides: Partial<Competitor> = {}): Competitor[] {
    return Array.from({ length: count }, (_, i) =>
      this.create({
        name: `Competitor ${i + 1}`,
        url: `https://competitor${i + 1}.com`,
        ...overrides,
      })
    );
  },

  /**
   * Create a competitor from LLM source
   */
  llm(overrides: Partial<Competitor> = {}): Competitor {
    return this.create({
      source: 'llm',
      confidence: 0.85,
      ...overrides,
    });
  },

  /**
   * Create a competitor from BrightData source
   */
  brightdata(overrides: Partial<Competitor> = {}): Competitor {
    return this.create({
      source: 'brightdata',
      confidence: 0.95,
      ...overrides,
    });
  },

  /**
   * Create a direct competitor
   */
  direct(overrides: Partial<Competitor> = {}): Competitor {
    return this.create({
      type: 'direct',
      ...overrides,
    });
  },

  /**
   * Create an indirect competitor
   */
  indirect(overrides: Partial<Competitor> = {}): Competitor {
    return this.create({
      type: 'indirect',
      ...overrides,
    });
  },
};
