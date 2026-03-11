/**
 * Country Detection Utilities
 * DRY: Centralized country detection from domain, subdomain, and HTML meta tags
 */

import {
  TLD_TO_COUNTRY,
  SUBDOMAIN_TO_COUNTRY,
  ISD_TO_COUNTRY,
  BUSINESS_REG_PATTERNS,
} from "@/lib/constants/country-identifiers";

import {
  CITY_TO_COUNTRY,
  US_STATES,
  INDIAN_STATES,
  LOCALE_TO_COUNTRY,
  LANG_TO_COUNTRY,
} from "@/lib/constants/country-geography";

import {
  CURRENCY_TO_COUNTRY,
} from "@/lib/constants/country-commerce";



/**
 * Extract country from domain TLD
 */
function getCountryFromTld(tld: string): string | null {
  return TLD_TO_COUNTRY[tld.toLowerCase()] || null;
}

/**
 * Extract country from subdomain
 */
function getCountryFromSubdomain(subdomain: string): string | null {
  return SUBDOMAIN_TO_COUNTRY[subdomain.toLowerCase()] || null;
}

/**
 * Extract country from locale string (e.g., "en-US" or "en_US")
 */
function getCountryFromLocale(locale: string): string | null {
  const countryCode = locale.split("_")[1] || locale.split("-")[1];
  if (!countryCode) return null;
  return LOCALE_TO_COUNTRY[countryCode.toUpperCase()] || null;
}

/**
 * Extract country from language code (e.g., from hreflang)
 */
function getCountryFromLang(langCode: string): string | null {
  return LANG_TO_COUNTRY[langCode.toUpperCase()] || null;
}

/**
 * Extract country from phone number with ISD code
 * Supports formats: +91, 91, +91-xxx, (91), etc.
 */
function getCountryFromPhone(phone: string): string | null {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // Try to extract ISD code (with or without +)
  const isdMatch = cleaned.match(/^\+?(\d{1,4})/);
  if (!isdMatch) return null;

  const isdCode = isdMatch[1];

  // Try exact match first (for 3-4 digit codes)
  if (ISD_TO_COUNTRY[isdCode]) {
    return ISD_TO_COUNTRY[isdCode];
  }

  // Try 3-digit prefix (e.g., 971 from 9711234567)
  if (isdCode.length >= 3 && ISD_TO_COUNTRY[isdCode.substring(0, 3)]) {
    return ISD_TO_COUNTRY[isdCode.substring(0, 3)];
  }

  // Try 2-digit prefix (e.g., 91 from 911234567)
  if (isdCode.length >= 2 && ISD_TO_COUNTRY[isdCode.substring(0, 2)]) {
    return ISD_TO_COUNTRY[isdCode.substring(0, 2)];
  }

  // Try 1-digit (e.g., 1 for US/Canada)
  if (ISD_TO_COUNTRY[isdCode.substring(0, 1)]) {
    return ISD_TO_COUNTRY[isdCode.substring(0, 1)];
  }

  return null;
}


/**
 * Extract country from phone numbers in HTML
 * Looks for common patterns like tel: links, phone numbers with ISD codes
 */
export function getCountryFromPhoneNumbers(html: string): string | null {
  // Pattern 1: tel: links with ISD codes (these are in raw HTML, targeted extraction is safe)
  const telPattern = /tel:\+?(\d{1,4}[\d\s\-\(\)\.]{7,})/gi;
  let match;

  while ((match = telPattern.exec(html)) !== null) {
    const country = getCountryFromPhone('+' + match[1]);
    if (country) return country;
  }

  // For text-based phone matching, use visible text only
  const visibleText = stripHtmlToText(html);

  // Pattern 2: Phone numbers with + prefix in text (most reliable)
  // Matches: +91 9876543210, +44 20 1234 5678, +1 (555) 123-4567, etc.
  const plusPhonePattern = /\+\d{1,4}[\s\-\(\)\.]*\d[\d\s\-\(\)\.]{6,}/g;
  while ((match = plusPhonePattern.exec(visibleText)) !== null) {
    const country = getCountryFromPhone(match[0]);
    if (country) return country;
  }

  // Pattern 3: Common phone number labels with country codes
  // E.g., "Call us: +91 1234567890", "Phone: (91) 123-456-7890", "Contact: +44 20 1234 5678"
  const labeledPhonePattern = /(?:phone|call|contact|tel|mobile|whatsapp)[:\s]+[\+\(]?\d{1,4}[\)\s\-\.]*\d[\d\s\-\(\)\.]{6,}/gi;
  while ((match = labeledPhonePattern.exec(visibleText)) !== null) {
    const country = getCountryFromPhone(match[0]);
    if (country) return country;
  }

  return null;
}

/**
 * Extract country from currency symbols in HTML
 * Looks for price patterns, currency codes, and symbols
 */
export function getCountryFromCurrencySymbols(html: string): string | null {
  const visibleText = stripHtmlToText(html);

  // Pattern 1: Currency codes (INR, USD, GBP, etc.)
  const currencyCodePattern = /\b([A-Z]{3})\s*[\d,\.]+/g;
  let match;

  const currencyCounts: Record<string, number> = {};

  while ((match = currencyCodePattern.exec(visibleText)) !== null) {
    const code = match[1];
    if (CURRENCY_TO_COUNTRY[code]) {
      currencyCounts[code] = (currencyCounts[code] || 0) + 1;
    }
  }

  // Pattern 2: Currency symbols (₹, $, £, €, ¥, etc.)
  const symbolPattern = /([₹₨₩₽₺₱₫₪₦£€¥$])\s*[\d,\.]+/g;
  while ((match = symbolPattern.exec(visibleText)) !== null) {
    const symbol = match[1];
    if (CURRENCY_TO_COUNTRY[symbol]) {
      currencyCounts[symbol] = (currencyCounts[symbol] || 0) + 1;
    }
  }

  // Pattern 3: Explicit currency mentions (e.g., "Price in INR", "₹ Indian Rupees")
  const explicitPattern = /(?:price|cost|amount|total|pay|payment)\s+(?:in\s+)?([A-Z]{3}|₹|₨|₩|₽|₺|₱|₫|₪|₦|£|€|¥|\$)/gi;
  while ((match = explicitPattern.exec(visibleText)) !== null) {
    const currency = match[1];
    if (CURRENCY_TO_COUNTRY[currency]) {
      currencyCounts[currency] = (currencyCounts[currency] || 0) + 2; // Weight explicit mentions higher
    }
  }

  // Return the most common currency's country
  let maxCount = 0;
  let mostCommonCurrency: string | null = null;

  for (const [currency, count] of Object.entries(currencyCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonCurrency = currency;
    }
  }

  return mostCommonCurrency ? CURRENCY_TO_COUNTRY[mostCommonCurrency] : null;
}

/**
 * Strip HTML to extract only visible text content.
 * Removes script/style blocks, HTML tags, URLs, and excess whitespace.
 * This prevents false positives from localized URLs, attribute values, and JS code.
 */
function stripHtmlToText(html: string): string {
  return html
    // Remove script and style blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Remove data attributes and JSON blobs in attributes (common source of false positives)
    .replace(/data-[a-z-]+='[^']*'/gi, ' ')
    .replace(/data-[a-z-]+="[^"]*"/gi, ' ')
    // Remove href/src URLs (prevents /en-in/ locale paths from matching)
    .replace(/(?:href|src|action|content)=["'][^"']*["']/gi, ' ')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Remove leaked JSON key fragments that can survive attribute stripping
    .replace(/["'][A-Za-z0-9_-]{1,32}["']\s*:/g, ' ')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract country from physical addresses in HTML
 * Looks for city names, state names, postal codes, and country mentions
 *
 * IMPORTANT: Operates on stripped visible text to avoid false positives from
 * localized URLs, HTML attributes, and JavaScript code.
 */
export function getCountryFromAddresses(html: string): string | null {
  const visibleText = stripHtmlToText(html);
  const lowerText = visibleText.toLowerCase();

  // Pattern 1: Explicit country mentions in address context
  const countryPattern = /(?:address|location|based in|headquarters|office|located in|shipping to|delivery in)[:\s,]+([^\n]{0,100}?)\b(india|united states|usa|united kingdom|uk|australia|canada|germany|france|singapore|uae|china|japan)\b/gi;
  let match;

  while ((match = countryPattern.exec(lowerText)) !== null) {
    const country = match[2].toLowerCase();
    if (country === "usa") return "United States";
    if (country === "uk") return "United Kingdom";
    if (country === "uae") return "United Arab Emirates";
    return country.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Pattern 2: Indian postal codes (6 digits) - only in address-like context
  const indianPinPattern = /(?:pin\s*code|postal\s*code|zip|pincode|address|location|shipping\s*to|delivery\s*to)[:\s]*\b([1-9]\d{5})\b/gi;
  let indianPinCount = 0;
  while ((match = indianPinPattern.exec(visibleText)) !== null) {
    indianPinCount++;
  }

  // Pattern 3: US ZIP codes (5+4 format is very specific, low false positive)
  const usZip4Pattern = /\b\d{5}-\d{4}\b/g;
  let usZipCount = 0;
  while ((match = usZip4Pattern.exec(visibleText)) !== null) {
    usZipCount++;
  }
  // Also match 5-digit ZIP in address context
  const usZipContextPattern = /(?:zip|postal|address|location)[:\s]*\b(\d{5})\b/gi;
  while ((match = usZipContextPattern.exec(visibleText)) !== null) {
    usZipCount++;
  }

  // Pattern 4: UK postal codes (alphanumeric) - very specific format
  const ukPostcodePattern = /\b[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}\b/gi;
  let ukPostcodeCount = 0;
  while ((match = ukPostcodePattern.exec(visibleText)) !== null) {
    ukPostcodeCount++;
  }

  // Pattern 5: City names on visible text only (skip short names <= 3 chars)
  const cityCounts: Record<string, number> = {};
  for (const [city, country] of Object.entries(CITY_TO_COUNTRY)) {
    if (city.length <= 3) continue;
    const cityPattern = new RegExp(`\\b${city}\\b`, 'gi');
    const matches = lowerText.match(cityPattern);
    if (matches) {
      cityCounts[country] = (cityCounts[country] || 0) + matches.length;
    }
  }

  // Pattern 6: US State full names only (skip 2-letter abbreviations to avoid false positives)
  for (const state of US_STATES) {
    if (state.length <= 2) continue;
    const statePattern = new RegExp(`\\b${state}\\b`, 'gi');
    if (statePattern.test(visibleText)) {
      cityCounts["United States"] = (cityCounts["United States"] || 0) + 2;
    }
  }

  // Pattern 7: Indian State names (full names only)
  for (const state of INDIAN_STATES) {
    const statePattern = new RegExp(`\\b${state}\\b`, 'gi');
    if (statePattern.test(visibleText)) {
      cityCounts["India"] = (cityCounts["India"] || 0) + 2;
    }
  }

  // Combine postal code counts with city counts
  if (indianPinCount >= 1) cityCounts["India"] = (cityCounts["India"] || 0) + indianPinCount * 3;
  if (usZipCount >= 1) cityCounts["United States"] = (cityCounts["United States"] || 0) + usZipCount * 3;
  if (ukPostcodeCount >= 1) cityCounts["United Kingdom"] = (cityCounts["United Kingdom"] || 0) + ukPostcodeCount * 3;

  // Return country with highest count
  let maxCount = 0;
  let mostLikelyCountry: string | null = null;

  for (const [country, count] of Object.entries(cityCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostLikelyCountry = country;
    }
  }

  // Require at least 2 matches to be confident
  return maxCount >= 2 ? mostLikelyCountry : null;
}

/**
 * Extract country from business registration numbers
 * Looks for GST, VAT, EIN, ABN, and other tax/business IDs
 */
export function getCountryFromBusinessRegistration(html: string): string | null {
  for (const [country, patterns] of Object.entries(BUSINESS_REG_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(html)) {
        return country;
      }
    }
  }
  return null;
}

/**
 * Extract meta content from HTML
 */
function extractMeta(html: string, selectors: string[]): string | null {
  for (const selector of selectors) {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      `<meta\\s+[^>]*property=["']${escapedSelector}["'][^>]*content=["']([^"']*)["']`,
      `<meta\\s+[^>]*name=["']${escapedSelector}["'][^>]*content=["']([^"']*)["']`,
      `<meta\\s+[^>]*content=["']([^"']*)["'][^>]*property=["']${escapedSelector}["']`,
    ];

    for (const pattern of patterns) {
      const match = html.match(new RegExp(pattern, "i"));
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }
  }
  return null;
}

/**
 * Extract country from hostname (domain or subdomain)
 */
export function getCountryFromHostname(hostname: string): string | null {
  const parts = hostname.split(".");
  const tld = parts[parts.length - 1].toLowerCase();

  // Check TLD first
  const tldCountry = getCountryFromTld(tld);
  if (tldCountry) return tldCountry;

  // Check for country-specific subdomains
  if (parts.length > 2) {
    const subdomain = parts[0].toLowerCase();
    const subdomainCountry = getCountryFromSubdomain(subdomain);
    if (subdomainCountry) return subdomainCountry;
  }

  return null;
}

/**
 * Extract country from HTML meta tags
 */
export function getCountryFromHtml(html: string): string | null {
  // Check og:locale
  const ogLocale = extractMeta(html, ["og:locale", "locale"]);
  if (ogLocale) {
    const localeCountry = getCountryFromLocale(ogLocale);
    if (localeCountry) return localeCountry;
  }

  // Check hreflang
  const hreflangMatch = html.match(/hreflang=["']?([a-z]{2}(-[A-Z]{2})?)["']?/i);
  if (hreflangMatch) {
    const langCode = hreflangMatch[1].split("-")[0].toUpperCase();
    const langCountry = getCountryFromLang(langCode);
    if (langCountry) return langCountry;
  }

  return null;
}

/**
 * Extract country from domain/hostname and HTML content
 * Priority order (most reliable first):
 * 1. Brand Authority Map (Authority domains for well-known brands)
 * 2. Country-specific TLD (e.g., .in, .uk, .de) - Most reliable
 * 3. Country-specific subdomain (e.g., in.example.com)
 * 4. Business registration numbers (GST, VAT, EIN, ABN) - Very reliable
 * 5. Physical addresses (city, state, postal codes) - Very reliable
 * 6. Phone numbers with ISD codes (e.g., +91, +44) - Reliable
 * 7. Currency symbols/codes (e.g., ₹, INR, £) - Reliable for e-commerce
 * 8. HTML meta tags (og:locale, hreflang) - Fallback
 * 
 * Note: Generic TLDs (.com, .co, .io, .ai, etc.) are skipped as they don't indicate country
 */

/**
 * Get authoritative brand data from the pre-verified SQLite mapping
 */
export function extractCountry(hostname: string, html: string): string | null {
  // Priority 1: Try hostname first (TLD and subdomain)
  const hostnameCountry = getCountryFromHostname(hostname);
  if (hostnameCountry) return hostnameCountry;

  // Priority 3: Try business registration numbers (highly reliable)
  const businessRegCountry = getCountryFromBusinessRegistration(html);
  if (businessRegCountry) return businessRegCountry;

  // Priority 4: Try physical addresses (very reliable)
  const addressCountry = getCountryFromAddresses(html);
  if (addressCountry) return addressCountry;

  // Priority 5: Try phone numbers (reliable indicator)
  const phoneCountry = getCountryFromPhoneNumbers(html);
  if (phoneCountry) return phoneCountry;

  // Priority 6: Try currency symbols (reliable for e-commerce sites)
  const currencyCountry = getCountryFromCurrencySymbols(html);
  if (currencyCountry && currencyCountry !== "International") {
    return currencyCountry;
  }

  // Priority 7: Fall back to HTML meta tags
  return getCountryFromHtml(html);
}
