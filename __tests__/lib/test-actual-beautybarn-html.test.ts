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

    // Test extractSocialFromStructuredData directly
    const structuredData = extractSocialFromStructuredData(html);
    console.log('Structured data result:', structuredData);
    expect(structuredData.twitter).toBe('beautybarnindia');

    // Test extractTwitterHandle (which should use structured data)
    const result = extractTwitterHandle(html);
    console.log('extractTwitterHandle result:', result);
    expect(result).toBe('beautybarnindia');
  });

  it('should also extract from twitter:site meta tag', () => {
    const html = `
      <html>
        <head>
          <meta name="twitter:site" content="@beautybarnindia" />
        </head>
      </html>
    `;

    const result = extractTwitterHandle(html);
    console.log('From twitter:site meta:', result);
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

    const result = extractTwitterHandle(html);
    console.log('From multiple JSON-LD scripts:', result);
    expect(result).toBe('beautybarnindia');
  });
});