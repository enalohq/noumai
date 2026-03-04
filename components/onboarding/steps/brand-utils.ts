/**
 * Brand Utilities - Pure functions for brand-related logic
 * Follows Single Responsibility Principle
 */

/**
 * Generates example aliases for a brand name
 */
export function generateAliasExamples(brandName: string): string {
  const examples: string[] = [];
  
  if (!brandName.trim()) return "";
  
  // Remove common suffixes
  const baseName = brandName
    .replace(/\s+(Inc|Corp|Corporation|LLC|Ltd|Co|Company)\b\.?$/i, '')
    .trim();
  
  if (baseName !== brandName && baseName.length > 0) {
    examples.push(baseName);
  }
  
  // Add common variations
  if (brandName.includes(' ')) {
    const initials = brandName
      .split(' ')
      .map(word => word.charAt(0))
      .join('');
    if (initials.length > 1) {
      examples.push(initials);
    }
    
    const firstWord = brandName.split(' ')[0];
    if (firstWord && firstWord.length > 2) {
      examples.push(firstWord);
    }
  }
  
  // Add with common suffixes (if not already present)
  if (!brandName.match(/\b(Inc|Corp|Corporation|LLC|Ltd|Co|Company)\b\.?$/i)) {
    examples.push(`${brandName} Inc`, `${brandName} Corp`);
  }
  
  // Return first 3 examples
  return examples.slice(0, 3).join(', ') + (examples.length > 3 ? ', ...' : '');
}

/**
 * Validates Twitter handle format
 */
export function isValidTwitterHandle(handle: string): boolean {
  if (!handle) return false;
  return /^[a-z0-9_]{1,15}$/.test(handle);
}

/**
 * Cleans Twitter handle input (removes @ symbol, converts to lowercase)
 */
export function cleanTwitterHandle(input: string): string {
  return input.replace(/^@/, '').toLowerCase();
}

/**
 * Formats LinkedIn URL for display
 */
export function formatLinkedInUrl(url: string): string {
  if (!url) return '';
  
  // Remove trailing slash
  let cleaned = url.replace(/\/$/, '');
  
  // Ensure it starts with https://
  if (!cleaned.startsWith('http')) {
    cleaned = `https://${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Parses brand aliases from comma-separated string
 */
export function parseBrandAliases(aliases: string): string[] {
  if (!aliases) return [];
  
  return aliases
    .split(',')
    .map(alias => alias.trim())
    .filter(alias => alias.length > 0);
}

/**
 * Formats brand aliases for display
 */
export function formatBrandAliases(aliases: string[]): string {
  return aliases.join(', ');
}