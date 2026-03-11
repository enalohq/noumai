import { NextRequest, NextResponse } from "next/server";
import {
  createDefaultBrandNameProviderChain,
  BrandNameProviderChain,
  type BrandData,
} from "@/lib/brand/brand-name-providers";
import {
  extractTwitterHandle,
  extractLinkedinUrl,
} from "@/lib/brand/social-handle-extractor";
import { extractCountry } from "@/lib/utils/country-detector";

interface FetchHtmlResult {
  response: Response;
  html: string;
}

// Lazy initialization of provider chain
let brandNameProviderChain: BrandNameProviderChain | null = null;

function getBrandNameProviderChain(): BrandNameProviderChain {
  if (!brandNameProviderChain) {
    brandNameProviderChain = createDefaultBrandNameProviderChain();
  }
  return brandNameProviderChain;
}

/**
 * Normalize URL - add protocol and handle www
 */
function normalizeUrl(url: string): string {
  if (url.startsWith("//")) {
    return `https:${url}`;
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
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

/**
 * Clean brand name by removing common separators and descriptors
 */
function cleanBrandName(text: string): string | null {
  if (!text) return null;
  
  // Decode HTML entities
  const decoded = decodeHtmlEntities(text);
  
  // Remove common separators and everything after them
  const cleaned = decoded
    .replace(/\s*[\|\-–—]\s*.*$/i, '')  // Remove | - – — and everything after
    .replace(/\s*::\s*.*$/i, '')         // Remove :: and everything after
    .replace(/\s*[-–—]\s*(bulk|manufacturer|distributor|supplier|wholesale|retail|store|shop|online|india|usa|uk|co\.?m?|org|net|io).*$/i, '') // Remove common business descriptors
    .trim();
  
  return cleaned && cleaned.length >= 2 ? cleaned : null;
}

/**
 * Extract meta content - handles various HTML formats
 */
function extractMeta(html: string, selectors: string[]): string | null {
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

/**
 * Check if HTML content indicates bot detection
 * Following SRP: Single responsibility for bot detection checking
 */
function isBotBlockedContent(html: string): boolean {
  const botIndicators = [
    'javascript is disabled',
    'please enable javascript',
    'enable javascript and cookies',
    'access denied',
    'bot detected',
    'cloudflare',
    'distil networks',
    'imperva',
    'incapsula',
    'akamai',
    'datadome',
    'human verification',
    'captcha',
    'security check',
    'rate limit',
    'too many requests',
    'access to this page has been denied',
    'you are being rate limited',
    'please verify you are a human',
    'security check is required',
    'amazon security check'
  ];

  const lowerHtml = html.toLowerCase();
  
  // Check for Amazon-specific bot detection
  if (html.includes('amazon') && html.includes('javascript is disabled')) {
    return true;
  }
  
  // Check for any bot indicators
  return botIndicators.some(indicator => 
    lowerHtml.includes(indicator.toLowerCase())
  );
}

/**
 * Alternative fetch with different headers for bot-protected sites
 * Includes user-agent rotation and retry logic
 * Following SOLID principles:
 * - SRP: Single responsibility for fetching with alternative headers
 * - OCP: Can be extended with new header configurations without modification
 */
async function fetchWithAlternativeHeaders(url: string): Promise<FetchHtmlResult | null> {
  // Enhanced user agents with more diversity
  const userAgents = [
    // Chrome on various platforms
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    
    // Firefox
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0",
    
    // Safari
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    
    // Edge
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
    
    // Mobile - Amazon often treats mobile traffic differently
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
  ];

  // Different header configurations to try
  const headerConfigs = [
    // Standard browser headers
    {
      "User-Agent": userAgents[0],
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "cross-site",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    },
    // Mobile browser headers (often bypasses bot detection)
    {
      "User-Agent": userAgents[7], // Mobile user agent
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    },
    // Minimal headers (some sites block complex headers)
    {
      "User-Agent": userAgents[1],
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    // Amazon-specific headers (mimics real browser traffic to Amazon)
    {
      "User-Agent": userAgents[0],
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Charset": "utf-8",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "max-age=0",
      "Referer": "https://www.google.com/",
    }
  ];

  // Try each header configuration with retries
  for (let attempt = 0; attempt < 4; attempt++) {
    const headers = headerConfigs[attempt % headerConfigs.length];
    
    // Add small delay between attempts to mimic human behavior
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }

    try {
      const response = await fetch(url, {
        headers: headers as any,
        signal: AbortSignal.timeout(20000),
      });

      // Check if response is successful
      if (response.ok) {
        const html = await response.text();
        
        // Check if content indicates bot blocking
        if (!isBotBlockedContent(html)) {
          return { response, html };
        }
        
        // If bot blocked, try next configuration
        console.log(`Bot detection on attempt ${attempt + 1} for ${url}`);
      }
    } catch (error) {
      // Continue to next attempt
      if (attempt === 3) {
        console.log(`All fetch attempts failed for ${url}:`, error);
      }
    }
  }

  return null;
}




/**
 * GET /api/scrape-metadata — Fetches website metadata for brand auto-population.
 * Uses provider chain for brand name extraction (HTML → Brandfetch API → URL fallback)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  let fetchUrl: URL;
  try {
    fetchUrl = new URL(normalizeUrl(url));
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    let response = await fetch(fetchUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
      },
      signal: AbortSignal.timeout(15000),
    });

    let brandName: string | null = null;
    let html = "";

    if (response.ok) {
      html = await response.text();
    }

    // Retry with alternative headers if the first fetch failed or returned bot-blocked HTML
    if (!response.ok || isBotBlockedContent(html)) {
      const alternativeResult = await fetchWithAlternativeHeaders(fetchUrl.toString());
      if (alternativeResult) {
        response = alternativeResult.response;
        html = alternativeResult.html;
      }
    }

    if (response.ok && html) {
      
      // Try to extract brand name from HTML first
      const ogSiteName = extractMeta(html, ["og:site_name"]);
      if (ogSiteName && ogSiteName.length >= 2) {
        brandName = cleanBrandName(ogSiteName);
      } else {
        const appName = extractMeta(html, ["application-name"]);
        if (appName && appName.length >= 2) {
          brandName = cleanBrandName(appName);
        } else {
          const ogTitle = extractMeta(html, ["og:title"]);
          if (ogTitle) {
            const cleaned = cleanBrandName(ogTitle);
            if (cleaned && cleaned.length >= 2) {
              brandName = cleaned;
            }
          }
        }
      }
    }

    const directTwitterHandle = html ? extractTwitterHandle(html) : null;
    const directLinkedinHandle = html ? extractLinkedinUrl(html) : null;

    let providerData: BrandData = {
      brandName: null,
      twitterHandle: null,
      linkedinHandle: null,
    };

    // Only fall back to the provider chain for fields still missing after direct HTML extraction
    if (!brandName || !directTwitterHandle || !directLinkedinHandle) {
      providerData = await getBrandNameProviderChain().fetch(fetchUrl.toString());
    }
    
    // Use provider chain for brandName if not found from HTML
    if (!brandName) {
      brandName = providerData.brandName;
    }
    
    // Prefer direct extraction from already-fetched HTML, then fall back to provider chain
    const twitterHandle = directTwitterHandle || providerData.twitterHandle;
    const linkedinHandle = directLinkedinHandle || providerData.linkedinHandle;

    // Extract country from domain or website content
    const country = extractCountry(fetchUrl.hostname, html);

    const metadata = {
      brandName: brandName || "",
      twitterHandle: twitterHandle || "",
      linkedinHandle: linkedinHandle || "",
      country: country || "",
      url: fetchUrl.toString(),
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Scrape metadata error:", error);
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timed out. The website may be slow." }, { status: 408 });
    }
    return NextResponse.json({ error: "Failed to fetch website data" }, { status: 500 });
  }
}
