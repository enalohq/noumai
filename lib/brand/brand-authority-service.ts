import { prisma } from "@/lib/prisma";
import { LOCALE_TO_COUNTRY } from "@/lib/constants/country-geography";

export interface AuthoritativeBrandData {
  brandName: string;
  country: string;
  twitterHandle: string | null;
  linkedinHandle: string | null;
}

/**
 * BrandAuthorityService - Solid Intelligence Layer
 * Responsible for retrieving verified brand data from Prisma
 */
export class BrandAuthorityService {
  /**
   * Get authoritative brand data from the Prisma-managed database
   * Checks from subdomains up to the root domain
   */
  static async getAuthoritativeBrandData(hostname: string): Promise<AuthoritativeBrandData | null> {
    try {
      const normalizedHostname = hostname.replace(/^www\./, "").toLowerCase();
      const hostParts = normalizedHostname.split(".");

      // Try matching the full hostname, then progressively shorter root versions
      // e.g., support.google.com -> then google.com
      for (let i = 0; i < hostParts.length - 1; i++) {
        const currentDomain = hostParts.slice(i).join(".");
        
        // @ts-expect-error - Prisma client property may be missing until next generate run
        const data = await prisma.brandAuthority.findUnique({
          where: { hostname: currentDomain }
        });

        if (data) {
          const linkedin = data.linkedin || null;
          return {
            brandName: data.brandName,
            twitterHandle: data.twitter || null,
            linkedinHandle: linkedin ? 
              (linkedin.startsWith('http') ? linkedin : `https://www.linkedin.com/company/${linkedin}`) 
              : null,
            country: LOCALE_TO_COUNTRY[data.country.toUpperCase()] || data.country
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching authoritative brand data:", error);
      return null;
    }
  }
}
