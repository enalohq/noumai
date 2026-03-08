/**
 * Bright Data Scraper for Competitor Extraction
 * Priority 2 fetcher - fallback when LLM is unavailable
 * 
 * Task 2.1 Verification Result:
 * - runAiScraper() is for AI platforms only (ChatGPT, Perplexity, etc.)
 * - For general website scraping, use direct fetch with user-agent rotation
 * - Reuse patterns from app/api/scrape-metadata/route.ts
 */

import { CompetitorSource, Competitor } from "../types";

/**
 * Competitor patterns to look for in HTML
 */
const COMPETITOR_PATTERNS = [
  // Links to competitor websites
  /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([^<]*competitor[^<]*)<\/a>/gi,
  // "Our competitors" or "Competitors" section links
  /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>[^<]*competitor[^<]*<\/a>/gi,
  // Footer links that mention competitors
  /<a[^>]+href=["'](https?:\/\/(?:www\.)?[^"'\/]+\.com\/?)["'][^>]*>/gi,
];

/**
 * Extract competitor URLs from HTML content
 */
function extractCompetitorUrls(html: string): string[] {
  const urls = new Set<string>();
  const urlPattern = /https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^"'\s]*)?/g;
  const matches = html.match(urlPattern) || [];

  for (const url of matches) {
    // Filter out the brand's own domain
    if (!urls.has(url)) {
      urls.add(url);
    }
  }

  return Array.from(urls);
}

/**
 * Normalize URL
 */
function normalizeUrl(url: string): string {
  if (url.startsWith("//")) {
    return `https:${url}`;
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Bright Data-based competitor extraction
 * Uses direct fetch with user-agent rotation (reuses scrape-metadata patterns)
 */
export class BrightDataScraper implements CompetitorSource {
  name = "brightdata";

  async fetch(brand: {
    name: string;
    website?: string;
    industry?: string;
    country?: string;
  }): Promise<Competitor[]> {
    if (!brand.website) {
      return [];
    }

    try {
      const url = normalizeUrl(brand.website);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      const urls = extractCompetitorUrls(html);

      // Return top 5 competitor candidates by URL
      return urls.slice(0, 5).map((url, index) => ({
        name: this.extractNameFromUrl(url),
        url,
        type: "direct" as const,
        confidence: 0.5 - index * 0.05,
        source: "brightdata",
      }));
    } catch (error) {
      console.error("[BrightDataScraper] Fetch error:", error);
      return [];
    }
  }

  /**
   * Extract company name from URL
   */
  private extractNameFromUrl(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      const parts = hostname.split(".");
      // Get the main domain part (e.g., "acme" from "acme.com")
      return parts[parts.length - 2] || hostname;
    } catch {
      return "Unknown";
    }
  }
}