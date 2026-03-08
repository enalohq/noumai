import type { CompetitorData } from "@/components/onboarding/steps/step-competitors";

/**
 * Generate default keywords from brand name and competitor names.
 * Used when user skips keyword entry step.
 * 
 * @param brandName - Primary brand name
 * @param competitors - List of competitor data
 * @returns Comma-separated default keywords
 */
export function generateDefaultKeywords(
  brandName: string,
  competitors: CompetitorData[]
): string {
  const keywords: string[] = [];

  // Add brand name as primary keyword
  if (brandName?.trim()) {
    keywords.push(brandName.trim());
  }

  // Add up to 3 competitor names as secondary keywords
  if (competitors.length > 0) {
    const competitorNames = competitors
      .map((c) => c.name?.trim())
      .filter(Boolean)
      .slice(0, 3);
    keywords.push(...competitorNames);
  }

  return keywords.filter(Boolean).join(", ");
}
