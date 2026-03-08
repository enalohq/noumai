/**
 * Normalize keywords by:
 * - Splitting on commas or newlines
 * - Trimming whitespace
 * - Converting to lowercase
 * - Removing empty strings
 * - Removing duplicates
 */
export function normalizeKeywords(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0)
    .filter((k, i, arr) => arr.indexOf(k) === i); // Remove duplicates
}

/**
 * Convert normalized keywords array back to comma-separated string
 */
export function keywordsToString(keywords: string[]): string {
  return keywords.join(", ");
}
