/**
 * Normalize URLs for consistent handling across the application
 * Ensures URLs have protocol, removes trailing slashes, etc.
 */
export function normalizeUrl(url: string): URL {
  let normalized = url.trim();

  // Add protocol if missing
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = "https://" + normalized;
  }

  return new URL(normalized);
}

/**
 * Get the base URL (protocol + domain) from a URL string
 */
export function getBaseUrl(url: string): string {
  const parsed = normalizeUrl(url);
  return `${parsed.protocol}//${parsed.hostname}`;
}

/**
 * Check if a URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    normalizeUrl(url);
    return true;
  } catch {
    return false;
  }
}
