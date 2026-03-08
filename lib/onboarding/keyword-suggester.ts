/**
 * Keyword Suggester Interface and Strategy Pattern Implementation
 */

export interface KeywordSuggestContext {
  brandName: string;
  industry?: string;
  description?: string;
  competitorNames?: string[];
  country?: string;
}

export interface KeywordSuggester {
  name: string;
  suggest(ctx: KeywordSuggestContext): Promise<string[]>;
}

/**
 * Filter utility for common junk words in keywords
 */
export class KeywordFilter {
  private static readonly COMMON_WORDS = new Set([
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
    'brand', 'brands', 'platform',
  ]);

  /**
   * Remove junk characters, possessives, and normalize
   */
  static normalize(word: string): string {
    return word
      .toLowerCase()
      .trim()
      // Remove trailing 's (possessive)
      .replace(/'s$/, '')
      // Remove trailing punctuation
      .replace(/[.,:;?!'"]+$/, '')
      // Remove leading punctuation
      .replace(/^[.,:;?!'"]+/, '');
  }

  static isUseful(word: string): boolean {
    const normalized = this.normalize(word);
    return normalized.length > 1 && normalized.length < 100 && !this.COMMON_WORDS.has(normalized);
  }

  static clean(keywords: string[]): string[] {
    const cleaned = keywords
      .map(k => this.normalize(k))
      .filter(k => this.isUseful(k));
    
    return Array.from(new Set(cleaned)).sort();
  }
}

/**
 * Strategy 1: Rule-based extraction from names
 * Follows SRP: Only focuses on structural name breakdown
 */
export class RuleBasedSuggester implements KeywordSuggester {
  name = "rule-based";

  async suggest(ctx: KeywordSuggestContext): Promise<string[]> {
    const rawKeywords: string[] = [];
    const names = [...(ctx.competitorNames || [])];
    if (ctx.brandName) names.push(ctx.brandName);

    for (const name of names) {
      if (!name) continue;

      // 1. Full name as keyword
      if (name.length > 2 && name.length < 100) {
        rawKeywords.push(name.toLowerCase());
      }

      // 2. Structural breakdown (SRP: delegating filtering to KeywordFilter)
      const parts = name
        .toLowerCase()
        .split(/[\s\-_\.&,]+/)
        .filter(part => part.length > 1 && part.length < 50);
      
      rawKeywords.push(...parts);
    }

    return KeywordFilter.clean(rawKeywords);
  }
}
