/**
 * Competitor Fetcher Orchestrator
 * Aggregates results from multiple fetchers with deduplication
 */

import { CompetitorSource, Competitor } from "./types";
import { LlmCompetitorExtractor } from "./fetchers/llm-extractor";
import { BrightDataScraper } from "./fetchers/brightdata-scraper";

/**
 * Orchestrator for competitor discovery
 * Runs fetchers in parallel and aggregates results
 */
export class CompetitorFetcher {
  private fetchers: CompetitorSource[];

  /**
   * Initialize with default fetchers
   * Priority order: LLM first (most comprehensive), Bright Data fallback
   */
  constructor(fetchers?: CompetitorSource[]) {
    this.fetchers = fetchers ?? [
      new LlmCompetitorExtractor(), // Priority 1: Intelligent extraction
      new BrightDataScraper(), // Priority 2: Website scraping fallback
    ];
  }

  /**
   * Fetch competitors from all sources in parallel
   */
  async fetchAll(brand: {
    name: string;
    website?: string;
    industry?: string;
    country?: string;
  }): Promise<Competitor[]> {
    const results = await Promise.allSettled(
      this.fetchers.map((fetcher) => fetcher.fetch(brand))
    );

    const allCompetitors = results
      .filter(
        (r): r is PromiseFulfilledResult<Competitor[]> =>
          r.status === "fulfilled"
      )
      .flatMap((r) => r.value);

    return this.deduplicate(allCompetitors);
  }

  /**
   * Deduplicate competitors by name (case-insensitive)
   * Keep highest confidence duplicate
   * Filter out competitors with confidence below MIN_CONFIDENCE_SCORE from .env
   */
  private deduplicate(competitors: Competitor[]): Competitor[] {
    const seen = new Map<string, Competitor>();
    
    // Read minimum confidence threshold from environment variable, default to 0.5
    const minConfidenceStr = process.env.MIN_CONFIDENCE_SCORE || "0.51";
    const MIN_CONFIDENCE = parseFloat(minConfidenceStr);
    
    // Validate the parsed value
    if (isNaN(MIN_CONFIDENCE) || MIN_CONFIDENCE < 0 || MIN_CONFIDENCE > 1) {
      console.warn(
        `[CompetitorFetcher] Invalid MIN_CONFIDENCE_SCORE: "${minConfidenceStr}", using default 0.5`
      );
      const defaultThreshold = 0.5;
      return this.deduplicateWithThreshold(competitors, defaultThreshold);
    }

    return this.deduplicateWithThreshold(competitors, MIN_CONFIDENCE);
  }

  /**
   * Internal method to deduplicate with a specific confidence threshold
   */
  private deduplicateWithThreshold(competitors: Competitor[], minConfidence: number): Competitor[] {
    const seen = new Map<string, Competitor>();

    for (const competitor of competitors) {
      // Skip competitors below confidence threshold
      if (competitor.confidence < minConfidence) {
        continue;
      }

      const key = competitor.name.toLowerCase().trim();
      const existing = seen.get(key);

      if (!existing || competitor.confidence > existing.confidence) {
        seen.set(key, competitor);
      }
    }

    return Array.from(seen.values()).sort(
      (a, b) => b.confidence - a.confidence
    );
  }
}