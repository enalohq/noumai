import { CompetitorData } from "@/components/dashboard/types";

/**
 * Sanitizes competitor data to ensure human-readable names and valid URLs.
 * If the name looks like a URL (no spaces, has dots), it extracts a brand name
 * and ensures the URL field is populated.
 */
export function sanitizeCompetitor(c: Partial<CompetitorData> | string): CompetitorData {
  if (typeof c === "string") {
    const { name, url } = sanitizeNameAndUrl(c.trim(), "");
    return { name, url, type: "direct", isAutoDiscovered: false };
  }

  const rawName = c.name?.trim() || "Unknown";
  const rawUrl = c.url?.trim() || "";
  const type = c.type || "direct";
  const isAutoDiscovered = !!c.isAutoDiscovered;
  const confidence = c.confidence;

  return {
    ...sanitizeNameAndUrl(rawName, rawUrl),
    type,
    isAutoDiscovered,
    confidence,
  };
}

function sanitizeNameAndUrl(name: string, url: string): { name: string; url: string } {
  const nameIsUrl = name.includes(".") && !name.includes(" ");
  
  if (nameIsUrl && (!url || url.includes(name))) {
    const cleanName = name
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split(".")[0];
    
    // Handle cases like "peec.ai" -> "Peec", but also "v2.peec.ai" -> "Peec"
    const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    
    return {
      name: capitalized,
      url: url || (name.startsWith("http") ? name : `https://${name}`),
    };
  }

  return { name, url };
}

/**
 * Formats a URL for clean display by removing protocol and 'www.'
 */
export function formatDisplayUrl(url: string | undefined): string {
  if (!url) return "";
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}
