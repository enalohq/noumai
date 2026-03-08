/**
 * Deduplicate competitors by domain
 * Removes duplicate competitors that share the same domain
 */

import { Competitor } from "./types";

/**
 * Extract domain from URL
 * Handles various URL formats and returns normalized domain
 */
function extractDomain(url: string | undefined): string | null {
  if (!url) return null;

  let domain: string;

  try {
    // Add protocol if missing
    const urlWithProtocol = url.startsWith("http") ? url : `https://${url}`;
    domain = new URL(urlWithProtocol).hostname || "";
  } catch {
    // If URL parsing fails, use basic normalization
    domain = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }

  // Normalize: lowercase and remove www prefix
  domain = domain.toLowerCase();
  if (domain.startsWith("www.")) {
    domain = domain.slice(4);
  }

  return domain || null;
}

/**
 * Deduplicate competitors by domain
 * Keeps the competitor with highest confidence for each domain
 * Falls back to first occurrence if confidence is equal
 */
export function deduplicateByDomain(competitors: Competitor[]): Competitor[] {
  const domainMap = new Map<string, Competitor>();
  const noUrlCompetitors: Competitor[] = [];

  for (const competitor of competitors) {
    const domain = extractDomain(competitor.url);

    if (!domain) {
      // Keep competitors without URLs (can't deduplicate)
      noUrlCompetitors.push(competitor);
      continue;
    }

    const existing = domainMap.get(domain);
    if (!existing) {
      domainMap.set(domain, competitor);
    } else {
      // Keep the one with higher confidence
      if (competitor.confidence > existing.confidence) {
        domainMap.set(domain, competitor);
      }
    }
  }

  // Combine deduplicated URL-based competitors with no-URL competitors
  return [...Array.from(domainMap.values()), ...noUrlCompetitors];
}

/**
 * Get deduplication stats
 * Returns information about duplicates found
 */
export function getDeduplicationStats(
  original: Competitor[],
  deduplicated: Competitor[]
): {
  totalOriginal: number;
  totalDeduplicated: number;
  duplicatesRemoved: number;
  uniqueDomains: number;
} {
  const uniqueDomains = new Set(
    original
      .map((c) => extractDomain(c.url))
      .filter((d) => d !== null)
  ).size;

  return {
    totalOriginal: original.length,
    totalDeduplicated: deduplicated.length,
    duplicatesRemoved: original.length - deduplicated.length,
    uniqueDomains,
  };
}
