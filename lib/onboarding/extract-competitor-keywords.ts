import { RuleBasedSuggester, KeywordFilter } from "./keyword-suggester";

/**
 * Extract keyword suggestions from competitor names
 * Now follows Strategy Pattern (RuleBasedSuggester) and SRP (KeywordFilter)
 * 
 * @deprecated Use RuleBasedSuggester directly or DiscoveryService for multiple strategies
 */
export function extractCompetitorKeywords(competitorNames: string[]): string[] {
  // We use the new strategy class but wrap it for backward compatibility with 
  // existing synchronous calls in the UI.
  const suggester = new RuleBasedSuggester();
  
  // Note: Local implementation of RuleBasedSuggester is sync-compatible if we want, 
  // but the interface is async. For this legacy wrapper, we can just run it or 
  // use the logic directly.
  
  const keywords = new Set<string>();

  for (const name of competitorNames) {
    if (!name) continue;
    
    // Add full name
    if (name.length > 2 && name.length < 100) {
      keywords.add(name.toLowerCase().trim());
    }

    // Split and filter
    const parts = name
      .toLowerCase()
      .split(/[\s\-_\.&,]+/)
      .filter(part => part.length > 1 && part.length < 50)
      .filter(part => KeywordFilter.isUseful(part));

    for (const part of parts) {
      keywords.add(part);
    }
  }

  return Array.from(keywords).sort();
}
