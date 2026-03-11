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
