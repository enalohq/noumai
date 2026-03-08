/**
 * Extract keyword suggestions from competitor names
 * Breaks down competitor names into meaningful keyword components
 */
export function extractCompetitorKeywords(competitorNames: string[]): string[] {
  const keywords = new Set<string>();

  for (const name of competitorNames) {
    if (!name || typeof name !== 'string') continue;

    // Split by common delimiters and clean up
    const parts = name
      .toLowerCase()
      .split(/[\s\-_\.&,]+/)
      .filter((part) => part.length > 1 && part.length < 50); // Require at least 2 chars

    // Add individual parts as keywords
    for (const part of parts) {
      // Skip common words that aren't useful as keywords
      if (!isCommonWord(part)) {
        keywords.add(part);
      }
    }

    // Add the full name as a keyword if it's reasonable length
    if (name.length > 2 && name.length < 100) {
      keywords.add(name.toLowerCase().trim());
    }
  }

  return Array.from(keywords).sort();
}

/**
 * Check if a word is too common to be useful as a keyword
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'it', 'its', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which',
    'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'co', 'inc',
    'ltd', 'llc', 'corp', 'corporation', 'company', 'group', 'solutions',
    'services', 'systems', 'technologies', 'tech', 'digital', 'online',
  ]);

  return commonWords.has(word);
}
