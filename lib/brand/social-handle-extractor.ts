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
  // Anchor tags with x.com URLs (with or without www, various protocols)
  {
    type: 'link',
    pattern: /<a\s+[^>]*href=["'](https?:\/\/(?:www\.)?x\.com\/([a-zA-Z0-9_]+))["'][^>]*>/gi,
    extract: (match: RegExpExecArray) => {
      const handle = match[2]?.toLowerCase();
      if (handle && handle.length >= 2 && handle.length <= 15) {
        return handle;
      }
      return null;
    }
  },
  // Anchor tags with x.com URLs (protocol-less, e.g., x.com/handle)
  {
    type: 'link',
    pattern: /<a\s+[^>]*href=["'](x\.com\/([a-zA-Z0-9_]+))["'][^>]*>/gi,
    extract: (match: RegExpExecArray) => {
      const handle = match[2]?.toLowerCase();
      if (handle && handle.length >= 2 && handle.length <= 15) {
        return handle;
      }
      return null;
    }
  },
  // Anchor tags with protocol-relative x.com URLs (e.g., //x.com/handle)
  {
    type: 'link',
    pattern: /<a\s+[^>]*href=["'](\/\/x\.com\/([a-zA-Z0-9_]+))["'][^>]*>/gi,
    extract: (match: RegExpExecArray) => {
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
 * Decode Unicode escapes in HTML (e.g., \u003c to <)
 * Some sites embed meta tags in JavaScript strings with Unicode escapes
 */
export function decodeUnicodeEscapes(html: string): string {
  return html
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/\\u007b/gi, '{')
    .replace(/\\u007d/gi, '}')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t');
}

/**
 * Extract Twitter handle from HTML
 */
export function extractTwitterHandle(html: string): string | null {
  // Decode Unicode escapes first (some sites embed meta tags in JS strings)
  const decodedHtml = decodeUnicodeEscapes(html);
  
  // Try meta tag first
  const metaPattern = TWITTER_PATTERNS[0];
  const metaMatch = decodedHtml.match(new RegExp(
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
    
    while ((match = regex.exec(decodedHtml)) !== null) {
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
  
  // Decode Unicode escapes first
  const decodedHtml = decodeUnicodeEscapes(html);
  
  const jsonLdRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = jsonLdRegex.exec(decodedHtml)) !== null) {
    try {
      const jsonContent = match[1];
      
      // Debug logging
      if (typeof console !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('[extractSocialFromStructuredData] Found JSON-LD:', jsonContent.substring(0, 200));
      }
      
      // Clean the JSON content - remove trailing commas that can break JSON parsing
      // Don't remove // comments as they might be part of URLs (e.g., https://)
      const cleanedContent = jsonContent
        .replace(/,\s*}/g, '}')  // Remove trailing commas before }
        .replace(/,\s*]/g, ']'); // Remove trailing commas before ]
      
      const json = JSON.parse(cleanedContent);
      const items = Array.isArray(json) ? json : [json];
      
      for (const item of items) {
        const sameAs = item.sameAs;
        const urls = Array.isArray(sameAs) ? sameAs : (typeof sameAs === "string" ? [sameAs] : []);
        
        // Debug logging
        if (typeof console !== 'undefined' && process.env.NODE_ENV === 'development' && urls.length > 0) {
          console.log('[extractSocialFromStructuredData] Found sameAs URLs:', urls);
        }
        
        for (const url of urls) {
          if (typeof url !== "string") continue;
          
          if (!result.twitter && (url.includes('twitter.com/') || url.includes('x.com/'))) {
            const twitterMatch = url.match(/(?:twitter|x)\.com\/[@]?([a-z0-9_]+)/i);
            if (twitterMatch) {
              result.twitter = twitterMatch[1].toLowerCase();
              if (typeof console !== 'undefined' && process.env.NODE_ENV === 'development') {
                console.log('[extractSocialFromStructuredData] Extracted Twitter handle:', result.twitter);
              }
            }
          }
          
          if (!result.linkedin && (url.includes('linkedin.com/company/') || url.includes('linkedin.com/in/'))) {
            result.linkedin = url;
          }
        }
      }
    } catch (error) {
      // Debug logging for errors
      if (typeof console !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.error('[extractSocialFromStructuredData] JSON parse error:', error);
      }
    }
  }
  
  return result;
}

/**
 * Extract social handles from inline JavaScript data (not JSON-LD)
 * Some sites embed social links in regular script tags with JSON arrays
 * Example: ["https://x.com/beautybarnindia", "https://instagram.com/...", ...]
 */
export function extractSocialFromInlineScripts(html: string): { twitter?: string; linkedin?: string } {
  const result: { twitter?: string; linkedin?: string } = {};
  
  // Decode Unicode escapes first
  const decodedHtml = decodeUnicodeEscapes(html);
  
  // Match regular script tags containing social media URLs
  // Pattern: <script>...["https://x.com/handle", "https://instagram.com/..."...]...</script>
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = scriptRegex.exec(decodedHtml)) !== null) {
    const scriptContent = match[1];
    
    // Skip if it's a JSON-LD script (already handled by extractSocialFromStructuredData)
    if (scriptContent.includes('application/ld+json') || scriptContent.includes('@type')) {
      continue;
    }
    
    // Look for arrays of URLs containing social media links
    // Pattern: ["https://x.com/handle", "https://instagram.com/...", ...]
    const urlArrayRegex = /\["([^"\]]*(?:twitter\.com|x\.com|linkedin\.com|instagram\.com|youtube\.com|facebook\.com)[^"\]]*)"\]/gi;
    let urlMatch;
    
    while ((urlMatch = urlArrayRegex.exec(scriptContent)) !== null) {
      const urls = urlMatch[1].split('","');
      
      for (const url of urls) {
        const cleanUrl = url.trim();
        
        // Extract Twitter/X handle
        if (!result.twitter && (cleanUrl.includes('twitter.com/') || cleanUrl.includes('x.com/'))) {
          const twitterMatch = cleanUrl.match(/(?:twitter|x)\.com\/[@]?([a-z0-9_]+)/i);
          if (twitterMatch) {
            result.twitter = twitterMatch[1].toLowerCase();
            if (typeof console !== 'undefined' && process.env.NODE_ENV === 'development') {
              console.log('[extractSocialFromInlineScripts] Extracted Twitter handle:', result.twitter);
            }
          }
        }
        
        // Extract LinkedIn URL
        if (!result.linkedin && (cleanUrl.includes('linkedin.com/company/') || cleanUrl.includes('linkedin.com/in/'))) {
          result.linkedin = cleanUrl;
          if (typeof console !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.log('[extractSocialFromInlineScripts] Extracted LinkedIn URL:', result.linkedin);
          }
        }
        
        // Early exit if we have both
        if (result.twitter && result.linkedin) {
          return result;
        }
      }
    }
  }
  
  return result;
}