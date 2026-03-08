/**
 * Competitor Auto-Discovery Types
 * Following SOLID principles with small, focused interfaces
 */

/**
 * Interface for competitor data source fetchers
 * Each fetcher implements this interface to provide competitors
 */
export interface CompetitorSource {
  /** Human-readable name of the fetcher */
  name: string;

  /**
   * Fetch competitors for a brand
   * @param brand - Brand information
   * @returns Array of discovered competitors
   */
  fetch(brand: {
    name: string;
    website?: string;
    industry?: string;
    country?: string;
  }): Promise<Competitor[]>;
}

/**
 * Competitor data structure
 */
export interface Competitor {
  /** Company name (required) */
  name: string;
  /** Website URL (optional, normalized) */
  url?: string;
  /** Competitor type classification */
  type: "direct" | "indirect" | "substitute";
  /** Ranking score 0-1, higher = more confident */
  confidence: number;
  /** Which fetcher found this competitor */
  source: string;
}

/**
 * Input for competitor discovery
 */
export interface DiscoverCompetitorsInput {
  brandName: string;
  website?: string;
  industry?: string;
  country?: string;
}

/**
 * API response for competitor discovery
 */
export interface DiscoverCompetitorsResponse {
  competitors: Competitor[];
  meta: {
    total: number;
    sources: string[];
  };
}