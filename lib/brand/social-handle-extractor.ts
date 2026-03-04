/**
 * Social Handle Extractor - extracts Twitter and LinkedIn handles from HTML
 * Following SOLID principles:
 * - SRP: Single responsibility for social handle extraction
 * - OCP: New patterns can be added without modifying extraction logic
 * - DIP: Depends on abstraction (extraction patterns)
 */

/**
 * Twitter extraction patterns
 */
const TWITTER_PATTERNS = [
  // twitter:site meta tag
  {
    type: 'meta',
    selector: 'twitter:site',
    extract: (value: string) => {
      const cleaned = value
        .replace(/^https?:\/\/(twitter|x)\.com\//i, '')
        .replace(/^@/, '')
        .replace(/^\//, '')
        .trim()
        .toLowerCase();
      return /^[a-z0-9_]{1,15}$/.test(cleaned) ? cleaned : null;
    }
  },
  // Anchor tags with Twitter URLs (twitter.com and x.com)
  {
    type: 'link',
    pattern: /<a\s+[^>]*href=["'](https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[@]?([^"'\/\s]+))["'][^>]*>/gi,
    extract: (match: RegExpExecArray) => {
      const handle = (match[1] || match[0]).toLowerCase();
      const cleaned = handle.replace(/^@/, '').split(/[\s#?]/)[0];
      return /^[a-z0-9_]{1,15}$/.test(cleaned) ? cleaned : null;
    }
  },
  // data-twitter attribute
  {
    type: 'data',
    pattern: /data-twitter=["']([^"'\s]+)["']/gi,
    extract: (match: RegExpExecArray) => {
      const cleaned = match[1].toLowerCase().replace(/^@/, '');
      return /^[a-z0-9_]{1,15}$/.test(cleaned) ? cleaned : null;
    }
  },
  // aria-label containing Twitter
  {
    type: 'aria',
    pattern: /aria-label=["'][^"']*(?:twitter|x)[^"']*[@]?([^"'\s,]+)[^"']*["']/gi,
    extract: (match: RegExpExecArray) => {
      const cleaned = match[1].toLowerCase().replace(/^@/, '');
      return /^[a-z0-9_]{1,15}$/.test(cleaned) ? cleaned : null;
    }
  },
  // Text content patterns for twitter.com and x.com
  {
    type: 'text',
    pattern: /(?:twitter|x)\.com\/[@]?([a-z0-9_]+)/gi,
    extract: (match: RegExpExecArray) => {
      const cleaned = match[1].toLowerCase();
      return /^[a-z0-9_]{1,15}$/.test(cleaned) ? cleaned : null;
    }
  },
];

/**
 * LinkedIn extraction patterns
 */
const LINKEDIN_PATTERNS = [
  // Anchor tags with LinkedIn company URLs
  {
    type: 'link',
    pattern: /<a\s+[^>]*href=["'](https?:\/\/(?:www\.)?linkedin\.com\/company\/([^"'\/\s]+))["'][^>]*>/gi,
    extract: (match: RegExpExecArray) => match[1]
  },
  // Anchor tags with LinkedIn profile URLs
  {
    type: 'link',
    pattern: /<a\s+[^>]*href=["'](https?:\/\/(?:www\.)?linkedin\.com\/in\/([^"'\/\s]+))["'][^>]*>/gi,
    extract: (match: RegExpExecArray) => match[1]
  },
  // data-linkedin attribute
  {
    type: 'data',
    pattern: /data-linkedin=["']([^"'\s]+)["']/gi,
    extract: (match: RegExpExecArray) => match[1].trim()
  },
  // Text content patterns for company URLs
  {
    type: 'text',
    pattern: /https?:\/\/(?:www\.)?linkedin\.com\/company\/([a-z0-9\-]+)/gi,
    extract: (match: RegExpExecArray) => `https://www.linkedin.com/company/${match[1]}`
  },
  // Text content patterns for profile URLs
  {
    type: 'text',
    pattern: /https?:\/\/(?:www\.)?linkedin\.com\/in\/([a-z0-9\-]+)/gi,
    extract: (match: RegExpExecArray) => `https://www.linkedin.com/in/${match[1]}`
  },
  // LinkedIn URLs without protocol
  {
    type: 'text',
    pattern: /linkedin\.com\/company\/([a-z0-9\-]+)/gi,
    extract: (match: RegExpExecArray) => `https://www.linkedin.com/company/${match[1]}`
  },
  {
    type: 'text',
    pattern: /linkedin\.com\/in\/([a-z0-9\-]+)/gi,
    extract: (match: RegExpExecArray) => `https://www.linkedin.com/in/${match[1]}`
  },
];

/**
 * Extract Twitter handle from HTML
 */
export function extractTwitterHandle(html: string): string | null {
  // Try meta tag first
  const metaPattern = TWITTER_PATTERNS[0];
  const metaMatch = html.match(new RegExp(
    `<meta\\s+[^>]*name=["']${metaPattern.selector}["'][^>]*content=["']([^"']*)["']`,
    'i'
  ));
  if (metaMatch && metaMatch[1]) {
    const result = metaPattern.extract(metaMatch[1]);
    if (result) return result;
  }

  // Try all regex patterns
  for (let i = 1; i < TWITTER_PATTERNS.length; i++) {
    const pattern = TWITTER_PATTERNS[i];
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
    let match: RegExpExecArray | null;
    
    while ((match = regex.exec(html)) !== null) {
      const result = pattern.extract(match);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Extract LinkedIn URL from HTML
 */
export function extractLinkedinUrl(html: string): string | null {
  for (const pattern of LINKEDIN_PATTERNS) {
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
    let match: RegExpExecArray | null;
    
    while ((match = regex.exec(html)) !== null) {
      const result = pattern.extract(match);
      if (result && result.startsWith('http')) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Extract social handles from JSON-LD structured data
 */
export function extractSocialFromStructuredData(html: string): { twitter?: string; linkedin?: string } {
  const result: { twitter?: string; linkedin?: string } = {};
  
  const jsonLdRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonContent = match[1];
      const json = JSON.parse(jsonContent);
      const items = Array.isArray(json) ? json : [json];
      
      for (const item of items) {
        const sameAs = item.sameAs;
        const urls = Array.isArray(sameAs) ? sameAs : (typeof sameAs === "string" ? [sameAs] : []);
        
        for (const url of urls) {
          if (typeof url !== "string") continue;
          
          if (!result.twitter && url.includes('twitter.com/')) {
            const twitterMatch = url.match(/twitter\.com\/[@]?([a-z0-9_]+)/i);
            if (twitterMatch) {
              result.twitter = twitterMatch[1].toLowerCase();
            }
          }
          
          if (!result.linkedin && (url.includes('linkedin.com/company/') || url.includes('linkedin.com/in/'))) {
            result.linkedin = url;
          }
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  
  return result;
}