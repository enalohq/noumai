import { NextRequest, NextResponse } from "next/server";

const SOCIAL_DOMAINS: Record<string, string[]> = {
  instagram: ["instagram.com"],
  twitter: ["twitter.com", "x.com"],
  facebook: ["facebook.com"],
  linkedin: ["linkedin.com"],
  youtube: ["youtube.com"],
  tiktok: ["tiktok.com"],
  pinterest: ["pinterest.com"],
};

/**
 * Normalize URL - add protocol and handle www
 */
function normalizeUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Extract handle from social URL - handles various formats
 */
function extractHandle(url: string, domains: string[]): string | null {
  try {
    const urlObj = new URL(normalizeUrl(url));
    const hostname = urlObj.hostname.toLowerCase();
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    
    // Check if hostname matches any domain (including www)
    const matchingDomain = domains.find(
      (d) => hostname === d || hostname === `www.${d}`
    );
    
    if (!matchingDomain) return null;
    
    // Skip common non-handle paths
    const skipPaths = ["hashtag", "search", "intent", "share", "share", "about", "help", "blog", "press"];
    if (pathParts.length > 0 && skipPaths.includes(pathParts[0].toLowerCase())) {
      return null;
    }
    
    // LinkedIn: usually /company/brand-name or /in/username
    if (matchingDomain.includes("linkedin")) {
      if (pathParts[0] === "company" && pathParts[1]) {
        return pathParts[1];
      }
      if (pathParts[0] === "in" && pathParts[1]) {
        return pathParts[1];
      }
      return null;
    }
    
    // Twitter/X: /handle or /handle/ or /@handle
    if (pathParts.length >= 1) {
      // Remove @ prefix if present, then clean the handle
      const rawHandle = pathParts[0].startsWith('@') ? pathParts[0].substring(1) : pathParts[0];
      const handle = rawHandle.replace(/[^a-zA-Z0-9_]/g, "");
      if (handle && handle.length > 1) {
        // Twitter handles are case-insensitive, return lowercase for consistency
        return handle.toLowerCase();
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract social handles from anchor tags
 */
function extractSocialHandles(html: string): { twitter?: string; linkedin?: string } {
  const result: { twitter?: string; linkedin?: string } = {};
  
  // Match all anchor tags - handle both single-line and multi-line HTML
  const linkRegex = /<a\s+[^>]*href=(["'])([^"']*)\1[^>]*>/gi;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[2];
    
    for (const [platform, domains] of Object.entries(SOCIAL_DOMAINS)) {
      if ((platform === "twitter" && result.twitter) || (platform === "linkedin" && result.linkedin)) {
        continue;
      }
      
      const matchingDomain = domains.find(
        (d) => href.toLowerCase().includes(d) || href.toLowerCase().includes(`www.${d}`)
      );
      
      if (matchingDomain) {
        const handle = extractHandle(href, domains);
        if (handle) {
          if (platform === "twitter") {
            result.twitter = handle;
          } else if (platform === "linkedin") {
            result.linkedin = handle;
          }
        }
      }
    }
  }
  
  return result;
}

/**
 * Extract social handles from JSON-LD structured data
 */
function extractFromStructuredData(html: string): { twitter?: string; linkedin?: string } {
  const result: { twitter?: string; linkedin?: string } = {};
  
  // Match application/ld+json scripts
  const jsonLdRegex = /<script\s+[^>]*type=(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonContent = match[2];
      const json = JSON.parse(jsonContent);
      
      // Handle both single object and array
      const items = Array.isArray(json) ? json : [json];
      
      for (const item of items) {
        const sameAs = item.sameAs;
        if (Array.isArray(sameAs)) {
          for (const url of sameAs) {
            if (typeof url !== "string") continue;
            
            for (const [platform, domains] of Object.entries(SOCIAL_DOMAINS)) {
              if ((platform === "twitter" && result.twitter) || (platform === "linkedin" && result.linkedin)) {
                continue;
              }
              
              const matchingDomain = domains.find(
                (d) => url.toLowerCase().includes(d) || url.toLowerCase().includes(`www.${d}`)
              );
              
              if (matchingDomain) {
                const handle = extractHandle(url, domains);
                if (handle) {
                  if (platform === "twitter") {
                    result.twitter = handle;
                  } else if (platform === "linkedin") {
                    result.linkedin = handle;
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // Invalid JSON, skip this script
    }
  }
  
  return result;
}

/**
 * Extract meta content - handles various HTML formats
 */
function extractMeta(html: string, selectors: string[]): string | null {
  for (const selector of selectors) {
    // Pattern 1: property="og:title" content="..."
    const pattern1 = new RegExp(
      `<meta\\s+[^>]*property=["']${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*content=["']([^"']*)["']`,
      "i"
    );
    const match1 = html.match(pattern1);
    if (match1 && match1[1]?.trim()) {
      return match1[1].trim();
    }
    
    // Pattern 2: name="twitter:site" content="..."
    const pattern2 = new RegExp(
      `<meta\\s+[^>]*name=["']${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*content=["']([^"']*)["']`,
      "i"
    );
    const match2 = html.match(pattern2);
    if (match2 && match2[1]?.trim()) {
      return match2[1].trim();
    }
    
    // Pattern 3: content first, then property/name (unusual but exists)
    const pattern3 = new RegExp(
      `<meta\\s+[^>]*content=["']([^"']*)["'][^>]*property=["']${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
      "i"
    );
    const match3 = html.match(pattern3);
    if (match3 && match3[1]?.trim()) {
      return match3[1].trim();
    }
  }
  return null;
}

/**
 * Clean and extract brand name from various sources
 */
function extractBrandName(html: string): string | null {
  // Try og:site_name first (most reliable)
  const ogSiteName = extractMeta(html, ["og:site_name"]);
  if (ogSiteName && ogSiteName.length >= 2) {
    return ogSiteName;
  }
  
  // Try og:title
  const ogTitle = extractMeta(html, ["og:title"]);
  if (ogTitle) {
    // Clean up common title patterns
    const cleaned = ogTitle
      .replace(/\s*[\|\-–—]\s*.*$/, "") // Remove " | Brand" or " - Brand"
      .replace(/\s*::\s*.*$/, "") // Remove " :: Brand"
      .trim();
    if (cleaned.length >= 2) {
      return cleaned;
    }
  }
  
  // Fallback to <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    const cleaned = title
      .replace(/\s*[\|\-–—]\s*.*$/, "")
      .replace(/\s*::\s*.*$/, "")
      .trim();
    if (cleaned.length >= 2) {
      return cleaned;
    }
    return title;
  }
  
  return null;
}

/**
 * GET /api/scrape-metadata — Fetches website metadata for brand auto-population.
 * Robustly handles various website formats and edge cases.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Validate URL format
  let fetchUrl: URL;
  try {
    fetchUrl = new URL(normalizeUrl(url));
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    const response = await fetch(fetchUrl.toString(), {
      headers: {
        "User-Agent": "NoumAI-Onboarding/1.0 (compatible; bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000), // 15s timeout for slower sites
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch website (status: ${response.status})` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Extract brand name
    const brandName = extractBrandName(html);

    // Extract from meta tags
    const metaTwitterHandleRaw = extractMeta(html, ["twitter:site", "twitter:site:id"]);
    const metaTwitterHandle = metaTwitterHandleRaw
      ? metaTwitterHandleRaw
          .replace(/^https?:\/\/(twitter|x)\.com\//i, "")
          .replace(/^@/, "")
          .replace(/^\//, "")
          .trim()
          .toLowerCase()
      : undefined;

    // Extract from anchor tags
    const linkHandles = extractSocialHandles(html);
    
    // Extract from JSON-LD structured data
    const structuredDataHandles = extractFromStructuredData(html);

    // Check if meta tag handle looks like a valid Twitter handle
    // Twitter handles can only contain letters, numbers, and underscores, 1-15 chars
    const isValidTwitterHandle = (handle: string | undefined) => {
      if (!handle) return false;
      return /^[a-z0-9_]{1,15}$/.test(handle);
    };

    // Get handle from URL sources (structured data or anchor links)
    const urlHandle = structuredDataHandles.twitter || linkHandles.twitter;

    // Priority logic:
    // 1. If meta tag is invalid, use URL handle
    // 2. If meta tag is valid but URL handle exists and is different, prefer URL handle
    //    (URL is an actual link, more reliable than meta tag)
    // 3. Otherwise use meta tag
    let twitterHandle: string | undefined;
    if (!metaTwitterHandle || !isValidTwitterHandle(metaTwitterHandle)) {
      twitterHandle = urlHandle;
    } else if (urlHandle && urlHandle !== metaTwitterHandle) {
      // Meta tag and URL handle are different, prefer URL (more reliable)
      twitterHandle = urlHandle;
    } else {
      twitterHandle = metaTwitterHandle;
    }
    
    const linkedinHandle = structuredDataHandles.linkedin || 
      linkHandles.linkedin;

    const metadata = {
      brandName: brandName || undefined,
      twitterHandle: twitterHandle || undefined,
      linkedinHandle: linkedinHandle || undefined,
      url: fetchUrl.toString(),
    };

    return NextResponse.json(metadata);
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timed out. The website may be slow." }, { status: 408 });
    }
    return NextResponse.json({ error: "Failed to fetch website data" }, { status: 500 });
  }
}