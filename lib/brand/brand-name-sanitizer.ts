/**
 * Brand Name Sanitizer - Centralized logic for cleaning and validating brand names
 * 
 * Following SOLID principles:
 * - SRP: Single responsibility for brand name normalization and validation
 * - OCP: Blacklist and cleaning patterns are easily extendable
 * - DRY: Prevents repetition of cleaning logic across providers and routes
 */

import { TAGLINE_BLACKLIST, SEPARATOR_PATTERNS } from './constants';

export class BrandNameSanitizer {
    /**
     * Main entry point for sanitization
     */
    static sanitize(text: string | null | undefined): string | null {
        if (!text) return null;

        // 1. Decode HTML entities
        let cleaned = this.decodeHtmlEntities(text);

        // 2. Remove common separators and trailing descriptors
        for (const pattern of SEPARATOR_PATTERNS) {
            cleaned = cleaned.replace(pattern, "");
        }

        cleaned = cleaned.trim();

        // 3. Check against tagline blacklist (exact match or start/end)
        const lowerCleaned = cleaned.toLowerCase();

        const isBlacklisted = TAGLINE_BLACKLIST.some(tagline => {
            // Exact match
            if (lowerCleaned === tagline.toLowerCase()) return true;

            // If the extracted "name" is just a long known tagline
            if (lowerCleaned.includes(tagline.toLowerCase()) && cleaned.length < tagline.length + 5) return true;

            return false;
        });

        if (isBlacklisted) return null;

        // 4. Length and valid character validation
        if (cleaned.length < 2 || cleaned.length > 60) return null;

        // If it's mostly numbers or symbols, it's likely not a brand name
        if (/^[^a-zA-Z]{3,}$/.test(cleaned)) return null;

        return cleaned;
    }

    /**
     * Decode common HTML entities
     */
    private static decodeHtmlEntities(text: string): string {
        const entities: { [key: string]: string } = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&#8211;': '–',
            '&#8212;': '—',
            '&#8217;': "'",
            '&#8220;': '"',
            '&#8221;': '"',
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

        // Handle numeric and hex entities
        decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
        decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

        return decoded;
    }
}
