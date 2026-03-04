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
  // twitter:site meta tag (most reliable)
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
      // Reject single characters and ensure it's a valid handle
      return /^[a-z0-9_]{2,15}$/.test(cleaned) ? cleaned : null;
    }
  },
  // twitter:site content with @ symbol
  {
    type: 'meta',
    selector: 'twitter:site',
    extract: (value: string) => {
      const cleaned = value
        .replace(/^@/, '')
        .trim()
        .toLowerCase();
      // Reject single characters
      return /^[a-z0-9_]{2,15}$/.test(cleaned) ? cleaned : null;
    }
  },
  // Anchor tags with Twitter URLs - specific pattern for full handle URLs
  {
    type: 'link',
    pattern: /<a\s+[^>]*href=["'](https?:\/\/(?:www\.)?(?:twitter|x)\.com\/@?([a-zA-Z0-9_]+))["'][^>]*>/gi,
    extract: (match: RegExpExecArray) => {
      // match[1] = full URL, match[2] = handle
      const handle = match[2]?.toLowerCase();
      if (handle && handle.length >= 2 && handle.length <= 15) {
        return handle;
      }
      return null;
    }
  },
  // Anchor tags with rel="me" and Twitter URL
  {
    type: 'link',
    pattern: /<a\s+[^>]*rel=["']me["'][^>]*href=["']([^"']*(?:twitter|x)\.com\/[@]?([a-zA-Z0-9_]+))["'][^>]*>/gi,
    extract: (match: RegExpExecArray) => {
      const handle = match[2]?.toLowerCase();
      if (handle && handle.length >= 2) {
        return handle;
      }
      return null;
    }
  },
  // data-twitter attribute
  {
    type: 'data',
    pattern: /data-twitter=["']([^"'\s]+)["']/gi,
    extract: (match: RegExpExecArray) => {
      const cleaned = match[1].toLowerCase().replace(/^@/, '');
      return /^[a-z0-9_]{2,15}$/.test(cleaned) ? cleaned : null;
    }
  },
  // aria-label containing Twitter handle
  {
    type: 'aria',
    pattern: /aria-label=["']([^"']*(?:twitter|x)[^"']*[@]?([a-zA-Z0-9_]+)[^"']*)["']/gi,
    extract: (match: RegExpExecArray) => {
      const handle = match[2]?.toLowerCase();
      if (handle && handle.length >= 2) {
        return handle;
      }
      return null;
    }
  },
  // Amazon-specific: Twitter handle in social links section with title/aria-label
  {
    type: 'link',
    pattern: /<a[^>]*href=["'](?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)["'][^>]*>(?:[^<]*(?:follow|twitter|amazon)[^<]*|<[^>]*>)/gi,
    extract: (match: RegExpExecArray) => {
      const handle = match[1]?.toLowerCase();
      // Validate: Twitter handles are 2-15 alphanumeric characters and underscores only
      if (handle && /^[a-z0-9_]{2,15}$/.test(handle)) {
        return handle;
      }
      return null;
    }
  },
  // Amazon-specific: Follow us on Twitter text
  {
    type: 'text',
    pattern: /follow\s+us?\s+(?:on\s+)?(?:twitter|x)\.com\/[@]?([a-zA-Z0-9_]+)/gi,
    extract: (match: RegExpExecArray) => {
      const handle = match[1]?.toLowerCase();
      if (handle && handle.length >= 2) {
        return handle;
      }
      return null;
    }
  },
  // Generic: Text content patterns for twitter.com and x.com URLs
  {
    type: 'text',
    pattern: /(?:twitter|x)\.com\/([a-zA-Z0-9_]{2,15})(?:\/|$|\?|#)/gi,
    extract: (match: RegExpExecArray) => {
      const handle = match[1]?.toLowerCase();
      if (handle && handle.length >= 2 && handle.length <= 15) {
        return handle;
      }
      return null;
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
    extract: (match: RegExpExecArray) => {
      let url = match[1];
      // Add www if missing
      if (!url.includes('www.')) {
        url = url.replace('https://', 'https://www.');
      }
      return url;
    }
  },
  // Anchor tags with LinkedIn profile URLs
  {
    type: 'link',
    pattern: /<a\s+[^>]*href=["'](https?:\/\/(?:www\.)?linkedin\.com\/in\/([^"'\/\s]+))["'][^>]*>/gi,
    extract: (match: RegExpExecArray) => {
      let url = match[1];
      // Add www if missing
      if (!url.includes('www.')) {
        url = url.replace('https://', 'https://www.');
      }
      return url;
    }
  },
  // data-linkedin attribute
  {
    type: 'data',
    pattern: /data-linkedin=["']([^"'\s]+)["']/gi,
    extract: (match: RegExpExecArray) => {
      let url = match[1].trim();
      // Add www if missing
      if (!url.includes('www.') && url.includes('linkedin.com')) {
        url = url.replace('https://', 'https://www.');
      }
      return url;
    }
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
    const result = (metaPattern.extract as (v: string) => string | null)(metaMatch[1]);
    if (result) return result;
  }

  // Try all regex patterns
  for (let i = 1; i < TWITTER_PATTERNS.length; i++) {
    const pattern = TWITTER_PATTERNS[i] as any;
    if (!pattern.pattern) continue;
    
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
    let match: RegExpExecArray | null;
    
    while ((match = regex.exec(html)) !== null) {
      const result = (pattern.extract as (m: RegExpExecArray) => string | null)(match);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Extract LinkedIn URL from HTML
 */
export function extractLinkedinUrl(html: string): string | null {
  for (const pattern of LINKEDIN_PATTERNS as any[]) {
    if (!pattern.pattern) continue;
    
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