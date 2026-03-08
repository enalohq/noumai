/**
 * Visibility Scoring & Analysis
 *
 * Pure functions for brand mention detection, sentiment analysis,
 * visibility scoring, and drift detection.
 *
 * No React dependencies — usable in both client and server contexts.
 */

import type { DriftAlert, ScrapeRun } from "@/components/dashboard/types";

// ── Brand / Competitor Term Extraction ──

/** Build list of brand names + aliases from config strings */
export function extractBrandTerms(brandName: string, brandAliases: string): string[] {
  const terms: string[] = [];
  if (brandName.trim()) terms.push(brandName.trim());
  if (brandAliases.trim()) {
    brandAliases.split(",").forEach((a) => {
      const t = a.trim();
      if (t) terms.push(t);
    });
  }
  return terms;
}

/** Build list of competitor names from config string or structured array */
export function extractCompetitorTerms(competitors: string | any[]): string[] {
  if (Array.isArray(competitors)) {
    return competitors.map((c) => (typeof c === "string" ? c : c.name)).filter(Boolean);
  }
  return (competitors || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

// ── Mention Detection ──

/** Find which terms appear in text (case-insensitive) */
export function findMentions(text: string, terms: string[]): string[] {
  const lower = text.toLowerCase();
  return terms.filter((t) => lower.includes(t.toLowerCase()));
}

// ── Sentiment Detection ──

const POSITIVE_WORDS = [
  "best", "leading", "top", "excellent", "recommend", "great", "outstanding",
  "innovative", "trusted", "powerful", "superior", "preferred", "popular",
  "reliable", "impressive", "standout", "strong", "ideal",
];

const NEGATIVE_WORDS = [
  "worst", "poor", "bad", "avoid", "lacking", "weak", "inferior",
  "disappointing", "overpriced", "limited", "outdated", "risky",
  "problematic", "concern", "drawback", "downside",
];

/** Detect basic sentiment toward brand in an AI answer */
export function detectSentiment(
  answer: string,
  brandTerms: string[],
): "positive" | "neutral" | "negative" | "not-mentioned" {
  if (brandTerms.length === 0) return "not-mentioned";
  const lower = answer.toLowerCase();
  const mentioned = brandTerms.some((t) => lower.includes(t.toLowerCase()));
  if (!mentioned) return "not-mentioned";

  let posScore = 0;
  let negScore = 0;
  POSITIVE_WORDS.forEach((w) => { if (lower.includes(w)) posScore++; });
  NEGATIVE_WORDS.forEach((w) => { if (lower.includes(w)) negScore++; });

  if (posScore > negScore + 1) return "positive";
  if (negScore > posScore + 1) return "negative";
  return "neutral";
}

// ── Visibility Scoring ──

/**
 * Calculate 0–100 visibility score for a single AI response.
 *
 * Scoring factors:
 * - Brand mentioned at all: +30
 * - Prominent position (first 200 chars): +20
 * - Multiple mentions (2×: +8, 3×: +15): up to +15
 * - Brand website cited in sources: +20
 * - Positive sentiment: +15 (neutral: +5)
 */
export function calcVisibilityScore(
  answer: string,
  sources: string[],
  brandTerms: string[],
  websiteDomain: string,
): number {
  if (brandTerms.length === 0) return 0;
  const lower = answer.toLowerCase();

  // Brand mentioned at all? +30
  const mentioned = brandTerms.some((t) => lower.includes(t.toLowerCase()));
  if (!mentioned) return 0;
  let score = 30;

  // Mentioned in first 200 chars (prominent position)? +20
  const first200 = lower.slice(0, 200);
  if (brandTerms.some((t) => first200.includes(t.toLowerCase()))) score += 20;

  // Multiple mentions? +15
  const mentionCount = brandTerms.reduce((acc, t) => {
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    return acc + (lower.match(re)?.length ?? 0);
  }, 0);
  if (mentionCount >= 3) score += 15;
  else if (mentionCount >= 2) score += 8;

  // Brand website in sources? +20
  const domain = websiteDomain.toLowerCase();
  if (domain && sources.some((s) => s.toLowerCase().includes(domain))) {
    score += 20;
  }

  // Positive sentiment bonus +15
  const sent = detectSentiment(answer, brandTerms);
  if (sent === "positive") score += 15;
  else if (sent === "neutral") score += 5;

  return Math.min(100, score);
}

// ── Drift Detection ──

const DRIFT_THRESHOLD = 10;

/**
 * Compare new scrape runs against existing ones.
 * Generate drift alerts when the visibility score for a prompt+provider
 * changes by ≥ DRIFT_THRESHOLD points.
 */
export function detectDrift(
  newRuns: ScrapeRun[],
  existingRuns: ScrapeRun[],
): DriftAlert[] {
  const alerts: DriftAlert[] = [];

  newRuns.forEach((newRun) => {
    const prev = existingRuns.find(
      (r) => r.prompt === newRun.prompt && r.provider === newRun.provider,
    );
    if (!prev) return;
    const delta = (newRun.visibilityScore ?? 0) - (prev.visibilityScore ?? 0);
    if (Math.abs(delta) >= DRIFT_THRESHOLD) {
      alerts.push({
        id: `drift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        prompt: newRun.prompt,
        provider: newRun.provider,
        oldScore: prev.visibilityScore ?? 0,
        newScore: newRun.visibilityScore ?? 0,
        delta,
        createdAt: new Date().toISOString(),
        dismissed: false,
      });
    }
  });

  return alerts;
}

// ── URL Filtering ──

const JUNK_HOSTS = [
  "cloudfront.net", "cdn.prod.website-files.com", "cdn.jsdelivr.net",
  "cdnjs.cloudflare.com", "unpkg.com", "fastly.net", "akamaihd.net",
  "connect.facebook.net", "facebook.net", "google-analytics.com",
  "googletagmanager.com", "doubleclick.net", "w3.org", "schema.org",
  "amazonaws.com", "cloudflare.com", "hotjar.com", "sentry.io",
];

const JUNK_EXT_PATTERN = /\.(png|jpe?g|gif|svg|webp|avif|ico|css|js|woff2?|ttf|eot|mp4|webm)(\?|$)/i;

/** Check if a URL is a real content page (not a CDN asset, tracker, etc.) */
export function isCleanUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (JUNK_HOSTS.some((j) => host === j || host.endsWith(`.${j}`))) return false;
    if (JUNK_EXT_PATTERN.test(parsed.pathname)) return false;
    if (parsed.search.length > 200) return false;
    return true;
  } catch {
    return false;
  }
}
