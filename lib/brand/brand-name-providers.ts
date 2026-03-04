/**
 * Brand data returned by providers
 */
export interface BrandData {
  brandName: string | null;
  twitterHandle: string | null;
  linkedinHandle: string | null;
}

/**
 * Brand Name Provider Interface
 * Following SOLID principles:
 * - SRP: Each provider has single responsibility
 * - OCP: New providers can be added without modifying existing code
 * - DIP: Depends on abstraction, not concretion
 */
export interface BrandNameProvider {
  /** Provider identifier for debugging */
  readonly name: string;
  
  /** Check if this provider can fetch brand data for the given URL */
  canFetch(url: string): boolean;
  
  /** Fetch brand data from this provider */
  fetch(url: string): Promise<BrandData>;
}

import {
  extractTwitterHandle,
  extractLinkedinUrl,
  extractSocialFromStructuredData,
} from './social-handle-extractor';

/**
 * HTML Scraping Provider - extracts brand data from website HTML
 * Following SOLID: Uses external social-handle-extractor for SRP
 */
export class HtmlScrapingProvider implements BrandNameProvider {
  readonly name = 'html-scraping';

  canFetch(_url: string): boolean {
    return true;
  }

  async fetch(url: string): Promise<BrandData> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return { brandName: null, twitterHandle: null, linkedinHandle: null };
      }

      const html = await response.text();
      return this.extractBrandData(html);
    } catch {
      return { brandName: null, twitterHandle: null, linkedinHandle: null };
    }
  }

  private extractBrandData(html: string): BrandData {
    // Extract brand name
    const brandName = this.extractBrandName(html);
    
    // Try to extract social handles from JSON-LD structured data first
    const structuredData = extractSocialFromStructuredData(html);
    let twitterHandle = structuredData.twitter || null;
    let linkedinHandle = structuredData.linkedin || null;
    
    // Fallback to HTML extraction if not found in structured data
    if (!twitterHandle) {
      twitterHandle = extractTwitterHandle(html);
    }
    if (!linkedinHandle) {
      linkedinHandle = extractLinkedinUrl(html);
    }
    
    return { brandName, twitterHandle, linkedinHandle };
  }

  private extractBrandName(html: string): string | null {
    // Try og:site_name first (most reliable)
    const ogSiteName = this.extractMeta(html, ['og:site_name']);
    if (ogSiteName && ogSiteName.length >= 2) {
      return this.cleanBrandName(ogSiteName);
    }

    // Try application/name meta tag
    const appName = this.extractMeta(html, ['application-name']);
    if (appName && appName.length >= 2) {
      return this.cleanBrandName(appName);
    }

    // Try og:title
    const ogTitle = this.extractMeta(html, ['og:title']);
    if (ogTitle) {
      const cleaned = this.cleanBrandName(ogTitle);
      if (cleaned && cleaned.length >= 2) {
        return cleaned;
      }
    }

    // Fallback to <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      const cleaned = this.cleanBrandName(title);
      return cleaned && cleaned.length >= 2 ? cleaned : title;
    }

    // Try h1 tag
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      const h1 = h1Match[1].trim();
      if (h1.length >= 2 && h1.length <= 100) {
        return h1;
      }
    }

    return null;
  }

  private cleanBrandName(text: string): string | null {
    if (!text) return null;
    
    // Decode HTML entities
    const decoded = this.decodeHtmlEntities(text);
    
    // Remove common separators and everything after them
    // Handles: | - – — :: and variations
    const cleaned = decoded
      .replace(/\s*[\|\-–—]\s*.*$/i, '')  // Remove | - – — and everything after
      .replace(/\s*::\s*.*$/i, '')         // Remove :: and everything after
      .replace(/\s*[-–—]\s*(bulk|manufacturer|distributor|supplier|wholesale|retail|store|shop|online|india|usa|uk|co\.?m?|org|net|io).*$/i, '') // Remove common business descriptors
      .trim();
    
    // Enforce max length (30 characters as per requirement)
    const maxLength = 30;
    if (cleaned.length > maxLength) {
      // Try to truncate at a word boundary
      const truncated = cleaned.substring(0, maxLength);
      const lastSpace = truncated.lastIndexOf(' ');
      const lastDash = truncated.lastIndexOf('-');
      const lastUnderscore = truncated.lastIndexOf('_');
      
      // Find the best boundary (prefer spaces, then dashes, then underscores)
      const bestBoundary = Math.max(lastSpace, lastDash, lastUnderscore);
      
      if (bestBoundary > 5) {  // Ensure we keep at least 5 characters
        return cleaned.substring(0, bestBoundary).trim();
      }
      
      // If no good boundary found, just truncate
      return truncated.trim();
    }
    
    return cleaned && cleaned.length >= 2 ? cleaned : null;
  }

  private decodeHtmlEntities(text: string): string {
    // Create a map of common HTML entities
    const entities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#8211;': '–',  // en-dash
      '&#8212;': '—',  // em-dash
      '&#8217;': "'",  // right single quotation mark
      '&#8220;': '"',  // left double quotation mark
      '&#8221;': '"',  // right double quotation mark
      '&ndash;': '–',
      '&mdash;': '—',
      '&rsquo;': "'",
      '&ldquo;': '"',
      '&rdquo;': '"',
    };
    
    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }
    
    // Handle numeric entities like &#123;
    decoded = decoded.replace(/&#(\d+);/g, (match, code) => {
      return String.fromCharCode(parseInt(code, 10));
    });
    
    // Handle hex entities like &#x1F;
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, code) => {
      return String.fromCharCode(parseInt(code, 16));
    });
    
    return decoded;
  }

  private extractMeta(html: string, selectors: string[]): string | null {
    for (const selector of selectors) {
      const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const patterns = [
        `<meta\\s+[^>]*property=["']${escapedSelector}["'][^>]*content=["']([^"']*)["']`,
        `<meta\\s+[^>]*name=["']${escapedSelector}["'][^>]*content=["']([^"']*)["']`,
        `<meta\\s+[^>]*content=["']([^"']*)["'][^>]*property=["']${escapedSelector}["']`,
      ];

      for (const pattern of patterns) {
        const match = html.match(new RegExp(pattern, 'i'));
        if (match && match[1]?.trim()) {
          return match[1].trim();
        }
      }
    }
    return null;
  }
}

/**
 * URL Fallback Provider - extracts brand name from URL hostname
 */
export class UrlFallbackProvider implements BrandNameProvider {
  readonly name = 'url-fallback';

  canFetch(_url: string): boolean {
    return true;
  }

  async fetch(url: string): Promise<BrandData> {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Remove www. prefix
      const cleanHostname = hostname.replace(/^www\./i, '');
      
      // Get main domain part
      const parts = cleanHostname.split('.');
      const mainPart = parts[0];
      
      // Convert to title case
      const brandName = mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
      
      return { brandName, twitterHandle: null, linkedinHandle: null };
    } catch {
      return { brandName: null, twitterHandle: null, linkedinHandle: null };
    }
  }
}

/**
 * Brandfetch API Provider - uses external API as fallback
 */
export class BrandfetchProvider implements BrandNameProvider {
  readonly name = 'brandfetch-api';
  private readonly apiUrl = 'https://api.brandfetch.io/v2/brands';
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.BRANDFETCH_API_KEY;
  }

  canFetch(_url: string): boolean {
    return !!this.apiKey;
  }

  async fetch(url: string): Promise<BrandData> {
    if (!this.apiKey) {
      return { brandName: null, twitterHandle: null, linkedinHandle: null };
    }

    try {
      const domain = new URL(url).hostname;
      const response = await fetch(`${this.apiUrl}/${encodeURIComponent(domain)}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { brandName: null, twitterHandle: null, linkedinHandle: null };
      }

      const data = await response.json();
      
      // Validate and extract from Brandfetch response
      if (this.isValidBrandfetchResponse(data)) {
        return {
          brandName: data.name || null,
          twitterHandle: this.extractTwitterHandle(data),
          linkedinHandle: this.extractLinkedinHandle(data),
        };
      }
      
      return { brandName: null, twitterHandle: null, linkedinHandle: null };
    } catch {
      return { brandName: null, twitterHandle: null, linkedinHandle: null };
    }
  }

  private extractTwitterHandle(data: Record<string, unknown>): string | null {
    const links = data.links as Array<{ name: string; url: string }> | undefined;
    if (!links) return null;
    
    const twitterLink = links.find(
      (link) => link.name === 'twitter' || link.name === 'x'
    );
    
    if (twitterLink?.url) {
      const match = twitterLink.url.match(/twitter\.com\/[@]?([^/\s]+)/i);
      if (match) {
        const handle = match[1].toLowerCase();
        if (/^[a-z0-9_]{1,15}$/.test(handle)) {
          return handle;
        }
      }
    }
    
    return null;
  }

  private extractLinkedinHandle(data: Record<string, unknown>): string | null {
    const links = data.links as Array<{ name: string; url: string }> | undefined;
    if (!links) return null;
    
    const linkedinLink = links.find((link) => link.name === 'linkedin');
    
    if (linkedinLink?.url) {
      return linkedinLink.url;
    }
    
    return null;
  }

  private isValidBrandfetchResponse(data: unknown): data is { 
    name: string; 
    links?: Array<{ name: string; url: string }>;
  } {
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    const response = data as Record<string, unknown>;
    return typeof response.name === 'string';
  }
}

/**
 * Provider Chain - tries multiple providers in sequence and merges results
 * Following SOLID:
 * - OCP: New providers can be added to the chain
 * - DIP: Depends on BrandNameProvider abstraction
 */
export class BrandNameProviderChain implements BrandNameProvider {
  readonly name = 'chain';
  private providers: BrandNameProvider[];

  constructor(providers: BrandNameProvider[] = []) {
    this.providers = providers;
  }

  /** Add a provider to the chain */
  addProvider(provider: BrandNameProvider): void {
    this.providers.push(provider);
  }

  canFetch(url: string): boolean {
    return this.providers.some(p => p.canFetch(url));
  }

  async fetch(url: string): Promise<BrandData> {
    const result: BrandData = {
      brandName: null,
      twitterHandle: null,
      linkedinHandle: null,
    };

    for (const provider of this.providers) {
      if (provider.canFetch(url)) {
        const data = await provider.fetch(url);
        
        // Merge non-null values from provider
        if (!result.brandName && data.brandName) {
          result.brandName = data.brandName;
        }
        if (!result.twitterHandle && data.twitterHandle) {
          result.twitterHandle = data.twitterHandle;
        }
        if (!result.linkedinHandle && data.linkedinHandle) {
          result.linkedinHandle = data.linkedinHandle;
        }
        
        // If we have all data, we can stop
        if (result.brandName && result.twitterHandle && result.linkedinHandle) {
          break;
        }
      }
    }
    
    return result;
  }
}

/**
 * Factory function to create default provider chain
 */
export function createDefaultBrandNameProviderChain(): BrandNameProviderChain {
  const chain = new BrandNameProviderChain();
  
  // Priority order: HTML scraping first (most accurate), then Brandfetch API, then URL fallback
  chain.addProvider(new HtmlScrapingProvider());
  chain.addProvider(new BrandfetchProvider());
  chain.addProvider(new UrlFallbackProvider());
  
  return chain;
}