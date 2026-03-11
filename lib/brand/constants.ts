/**
 * Core constants for brand metadata extraction and sanitization
 */

export const TAGLINE_BLACKLIST = [
    // Global Tech & SaaS
    "navigate your next",
    "just do it",
    "think different",
    "i'm lovin' it",
    "the ultimate driving machine",
    "open happiness",
    "belong anywhere",
    "everything is possible",
    "built to last",

    // Generic Web Phrases
    "official website",
    "official store",
    "online store",
    "home page",
    "welcome to",
    "click here",
    "visit us",
    "shop online",
    "buy online",
    "get started",

    // Bot Detection / Error Phrases
    "javascript is disabled",
    "please enable javascript",
    "enable javascript and cookies",
    "access denied",
    "bot detected",
    "cloudflare",
    "human verification",
    "captcha",
    "security check",
    "access to this page has been denied",
    "forbidden",
    "not found",
    "error 404"
];

export const SEPARATOR_PATTERNS = [
    /\s*[\|\-–—]\s*.*$/i,  // Remove | - – — and everything after
    /\s*::\s*.*$/i,         // Remove :: and everything after
    /\s*[-–—]\s*(bulk|manufacturer|distributor|supplier|wholesale|retail|store|shop|online|india|usa|uk|co\.?m?|org|net|io).*$/i
];

/**
 * List of countries to target for brand discovery
 */
export const DISCOVERY_COUNTRIES = [
  "US", "GB", "IN", "CN", "DE", "FR", "CA", "AU", "JP", "BR", "MX", "IT", "ES", "NL", "SE", "KR", "RU", "SG", "CH", "HK", "AE", "SA", "ZA", "NZ", "IE", "NO", "DK", "FI", "PL", "TR", "BE", "AT", "IL", "TW", "ID", "TH", "MY", "PH", "VN", "PK", "BD"
];

/**
 * User agent for brand discovery requests
 */
export const DISCOVERY_USER_AGENT = 'NoumaiDiscovery/1.0 (contact: admin@example.com)';

/**
 * High-priority brand overrides for essential services
 */
export const ESSENTIAL_BRANDS = [
  { hostname: 'microsoft.com', brandName: 'Microsoft', country: 'US', twitter: 'microsoft', linkedin: 'microsoft' },
  { hostname: 'google.com', brandName: 'Google', country: 'US', twitter: 'google', linkedin: 'google' },
  { hostname: 'apple.com', brandName: 'Apple', country: 'US', twitter: 'apple', linkedin: 'apple' },
  { hostname: 'amazon.com', brandName: 'Amazon', country: 'US', twitter: 'amazon', linkedin: 'amazon' },
  { hostname: 'meta.com', brandName: 'Meta', country: 'US', twitter: 'meta', linkedin: 'facebook' },
  { hostname: 'netflix.com', brandName: 'Netflix', country: 'US', twitter: 'netflix', linkedin: 'netflix' },
  { hostname: 'tesla.com', brandName: 'Tesla', country: 'US', twitter: 'tesla', linkedin: 'tesla-motors' },
  { hostname: 'nike.com', brandName: 'Nike', country: 'US', twitter: 'nike', linkedin: 'nike' },
  { hostname: 'openai.com', brandName: 'OpenAI', country: 'US', twitter: 'openai', linkedin: 'openai' }
];
