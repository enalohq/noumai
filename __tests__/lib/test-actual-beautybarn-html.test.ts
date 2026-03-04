/**
 * Test with actual beautybarn.in HTML
 */
import { extractTwitterHandle, extractSocialFromStructuredData } from '@/lib/brand/social-handle-extractor';

describe('Test with actual beautybarn.in HTML', () => {
  it('should extract handle from JSON-LD in actual HTML', () => {
    // This is a simplified version of the actual HTML snippet
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Beauty Barn Blog",
              "sameAs": [
                "https://www.facebook.com/beautybarnindia",
                "https://x.com/beautybarnindia",
                "https://www.instagram.com/beautybarnindia/",
                "https://www.youtube.com/beautybarnindia"
              ]
            }
          </script>
        </head>
      </html>
    `;

    // Test extractSocialFromStructuredData - this is the correct function for JSON-LD
    const structuredData = extractSocialFromStructuredData(html);
    expect(structuredData.twitter).toBe('beautybarnindia');
    expect(structuredData.linkedin).toBeUndefined();
  });

  it('should also extract from twitter:site meta tag', () => {
    const html = `
      <html>
        <head>
          <meta name="twitter:site" content="@beautybarnindia" />
        </head>
      </html>
    `;

    // extractTwitterHandle is the correct function for HTML patterns
    const result = extractTwitterHandle(html);
    expect(result).toBe('beautybarnindia');
  });

  it('should handle multiple JSON-LD scripts', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {"@type": "WebSite", "name": "Beauty Barn"}
          </script>
          <script type="application/ld+json">
            {
              "@type": "Organization",
              "sameAs": ["https://x.com/beautybarnindia"]
            }
          </script>
        </head>
      </html>
    `;

    // extractSocialFromStructuredData handles multiple JSON-LD scripts
    const result = extractSocialFromStructuredData(html);
    expect(result.twitter).toBe('beautybarnindia');
  });
});