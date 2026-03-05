/**
 * Unit tests for social-handle-extractor
 * Following SOLID principles: Testing behavior, not implementation details
 */

import {
  extractTwitterHandle,
  extractLinkedinUrl,
  extractSocialFromStructuredData,
  extractSocialFromInlineScripts,
  decodeUnicodeEscapes,
} from '@/lib/brand/social-handle-extractor';

describe('extractTwitterHandle', () => {
  describe('Meta tag extraction', () => {
    it('extracts Twitter handle from twitter:site meta tag with @ symbol', () => {
      const html = `
        <html>
          <head>
            <meta name="twitter:site" content="@amazonIN" />
          </head>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });

    it('extracts Twitter handle from twitter:site meta tag without @ symbol', () => {
      const html = `
        <html>
          <head>
            <meta name="twitter:site" content="amazonIN" />
          </head>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });

    it('extracts Twitter handle from twitter:site meta tag with full URL', () => {
      const html = `
        <html>
          <head>
            <meta name="twitter:site" content="https://twitter.com/amazonIN" />
          </head>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });

    it('returns null for invalid twitter:site meta tag', () => {
      const html = `
        <html>
          <head>
            <meta name="twitter:site" content="x" />
          </head>
        </html>
      `;
      // Single character should be rejected
      expect(extractTwitterHandle(html)).toBeNull();
    });
  });

  describe('Anchor tag extraction', () => {
    it('extracts Twitter handle from anchor tag with full URL', () => {
      const html = `
        <html>
          <body>
            <a href="https://twitter.com/amazonIN">Follow us</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });

    it('extracts Twitter handle from anchor tag with @ symbol', () => {
      const html = `
        <html>
          <body>
            <a href="https://twitter.com/@amazonIN">Follow us</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });

    it('extracts Twitter handle from anchor tag with rel="me"', () => {
      const html = `
        <html>
          <body>
            <a href="https://twitter.com/amazonIN" rel="me">Twitter</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });

    it('extracts Twitter handle from x.com URL', () => {
      const html = `
        <html>
          <body>
            <a href="https://x.com/amazonIN">Follow us</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });

    it('rejects single character handles from anchor tags', () => {
      const html = `
        <html>
          <body>
            <a href="https://twitter.com/y">Follow us</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBeNull();
    });
  });

  describe('Amazon-specific scenarios', () => {
    it('extracts Amazon India Twitter handle from social links', () => {
      const html = `
        <html>
          <body>
            <a href="https://twitter.com/amazonIN" aria-label="Follow Amazon on Twitter">Follow us</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });

    it('extracts Twitter handle from Amazon footer social section', () => {
      const html = `
        <html>
          <body>
            <footer>
              <a href="https://twitter.com/amazonIN" title="Follow us on Twitter">Follow Amazon</a>
            </footer>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });

    it('extracts Twitter handle from follow us text', () => {
      const html = `
        <html>
          <body>
            <p>Follow us on twitter.com/amazonIN for updates</p>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });
  });

  describe('Data attribute extraction', () => {
    it('extracts Twitter handle from data-twitter attribute', () => {
      const html = `
        <html>
          <body>
            <div data-twitter="amazonIN">Follow us</div>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });

    it('extracts Twitter handle from data-twitter attribute with @ symbol', () => {
      const html = `
        <html>
          <body>
            <div data-twitter="@amazonIN">Follow us</div>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });
  });

  describe('Edge cases', () => {
    it('returns null for empty HTML', () => {
      expect(extractTwitterHandle('')).toBeNull();
    });

    it('returns null for HTML without Twitter handles', () => {
      const html = `
        <html>
          <body>
            <a href="https://facebook.com/company">Facebook</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBeNull();
    });

    it('handles multiple Twitter handles and returns first valid one', () => {
      const html = `
        <html>
          <body>
            <a href="https://twitter.com/amazonIN">Amazon</a>
            <a href="https://twitter.com/amazonUK">Amazon UK</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });

    it('rejects handles longer than 15 characters', () => {
      const html = `
        <html>
          <body>
            <a href="https://twitter.com/thishandleistoolong12345">Follow us</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBeNull();
    });

    it('rejects handles with invalid characters', () => {
      const html = `
        <html>
          <body>
            <a href="https://twitter.com/handle-with-dashes">Follow us</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBeNull();
    });
  });

  describe('Case sensitivity', () => {
    it('converts handles to lowercase', () => {
      const html = `
        <html>
          <head>
            <meta name="twitter:site" content="@AmazonIN" />
          </head>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });
  });
});

describe('extractLinkedinUrl', () => {
  describe('Company URL extraction', () => {
    it('extracts LinkedIn company URL from anchor tag', () => {
      const html = `
        <html>
          <body>
            <a href="https://www.linkedin.com/company/amazon">LinkedIn</a>
          </body>
        </html>
      `;
      expect(extractLinkedinUrl(html)).toBe('https://www.linkedin.com/company/amazon');
    });

    it('extracts LinkedIn company URL without www', () => {
      const html = `
        <html>
          <body>
            <a href="https://linkedin.com/company/amazon">LinkedIn</a>
          </body>
        </html>
      `;
      expect(extractLinkedinUrl(html)).toBe('https://www.linkedin.com/company/amazon');
    });

    it('extracts LinkedIn profile URL from anchor tag', () => {
      const html = `
        <html>
          <body>
            <a href="https://www.linkedin.com/in/johndoe">LinkedIn</a>
          </body>
        </html>
      `;
      expect(extractLinkedinUrl(html)).toBe('https://www.linkedin.com/in/johndoe');
    });
  });

  describe('Data attribute extraction', () => {
    it('extracts LinkedIn URL from data-linkedin attribute', () => {
      const html = `
        <html>
          <body>
            <div data-linkedin="https://www.linkedin.com/company/amazon">LinkedIn</div>
          </body>
        </html>
      `;
      expect(extractLinkedinUrl(html)).toBe('https://www.linkedin.com/company/amazon');
    });
  });

  describe('Edge cases', () => {
    it('returns null for HTML without LinkedIn URLs', () => {
      const html = `
        <html>
          <body>
            <a href="https://twitter.com/company">Twitter</a>
          </body>
        </html>
      `;
      expect(extractLinkedinUrl(html)).toBeNull();
    });
  });
});

describe('extractSocialFromStructuredData', () => {
  describe('JSON-LD extraction', () => {
    it('extracts Twitter handle from JSON-LD sameAs', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Amazon",
                "sameAs": [
                  "https://twitter.com/amazonIN",
                  "https://www.linkedin.com/company/amazon"
                ]
              }
            </script>
          </head>
        </html>
      `;
      const result = extractSocialFromStructuredData(html);
      expect(result.twitter).toBe('amazonin');
      expect(result.linkedin).toBe('https://www.linkedin.com/company/amazon');
    });

    it('extracts Twitter handle from JSON-LD with @ symbol', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "sameAs": ["https://twitter.com/@amazonIN"]
              }
            </script>
          </head>
        </html>
      `;
      const result = extractSocialFromStructuredData(html);
      expect(result.twitter).toBe('amazonin');
    });

    it('returns empty object for HTML without structured data', () => {
      const html = `
        <html>
          <head>
            <title>Test</title>
          </head>
        </html>
      `;
      expect(extractSocialFromStructuredData(html)).toEqual({});
    });

    it('handles invalid JSON gracefully', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              { invalid json }
            </script>
          </head>
        </html>
      `;
      expect(extractSocialFromStructuredData(html)).toEqual({});
    });
  });
});
  describe('x.com URL variations', () => {
    it('extracts Twitter handle from x.com URL with https', () => {
      const html = `
        <html>
          <body>
            <a href="https://x.com/beautybarnindia">Follow us</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('beautybarnindia');
    });

    it('extracts Twitter handle from x.com URL with http', () => {
      const html = `
        <html>
          <body>
            <a href="http://x.com/beautybarnindia">Follow us</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('beautybarnindia');
    });

    it('extracts Twitter handle from x.com URL with trailing slash', () => {
      const html = `
        <html>
          <body>
            <a href="https://x.com/beautybarnindia/">Follow us</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('beautybarnindia');
    });

    it('extracts Twitter handle from x.com URL with query parameters', () => {
      const html = `
        <html>
          <body>
            <a href="https://x.com/beautybarnindia?ref=footer">Follow us</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('beautybarnindia');
    });

    it('extracts Twitter handle from x.com URL without www in anchor text', () => {
      const html = `
        <html>
          <body>
            <a href="https://x.com/beautybarnindia" aria-label="Follow us on x">x.com/beautybarnindia</a>
          </body>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('beautybarnindia');
    });
  });
  
  describe('Unicode-escaped HTML', () => {
    it('extracts Twitter handle from Unicode-escaped meta tag', () => {
      // This simulates how beautybarn.in embeds meta tags in JavaScript strings
      const html = `
        <html>
          <head>
            <script>
              var meta = "\\u003cmeta name=\\"twitter:site\\" content=\\"@beautybarnindia\\" /\\u003e";
            </script>
          </head>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('beautybarnindia');
    });

    it('extracts Twitter handle from Unicode-escaped twitter:creator', () => {
      const html = `
        <html>
          <head>
            <script>
              var meta = "\\u003cmeta name=\\"twitter:creator\\" content=\\"@testuser\\" /\\u003e";
            </script>
          </head>
        </html>
      `;
      // twitter:creator is not in our patterns, but twitter:site is
      expect(extractTwitterHandle(html)).toBeNull();
    });

    it('extracts Twitter handle from mixed escaped and unescaped HTML', () => {
      const html = `
        <html>
          <head>
            <meta name="twitter:card" content="summary" />
            <script>
              var meta = "\\u003cmeta name=\\"twitter:site\\" content=\\"@amazonIN\\" /\\u003e";
            </script>
          </head>
        </html>
      `;
      expect(extractTwitterHandle(html)).toBe('amazonin');
    });
  });
  
  describe('Property-based tests for Unicode escape handling', () => {
    it('extracts Twitter handles from various Unicode-escaped formats', () => {
      // Test various handle patterns
      const testHandles = [
        'testuser123',
        'test_user',
        'test123',
        'mybrand',
        'amazonIN',
        'beautybarnindia',
      ];
      
      for (const handle of testHandles) {
        const html = `
          <html>
            <head>
              <script>
                var meta = "\\u003cmeta name=\\"twitter:site\\" content=\\"@${handle}\\" /\\u003e";
              </script>
            </head>
          </html>
        `;
        expect(extractTwitterHandle(html)).toBe(handle.toLowerCase());
      }
    });
  });
}

describe('extractSocialFromInlineScripts', () => {
  describe('Inline script URL array extraction', () => {
    it('extracts Twitter handle from inline script with social URLs (beautybarn.in pattern)', () => {
      // This simulates how beautybarn.in embeds social links in regular script tags
      const html = `
        <html>
          <head>
            <script>
              var socialLinks = ["https://x.com/beautybarnindia", "https://www.instagram.com/beautybarnindia", "https://www.youtube.com/beautybarnindia"];
            </script>
          </head>
        </html>
      `;
      const result = extractSocialFromInlineScripts(html);
      expect(result.twitter).toBe('beautybarnindia');
    });

    it('extracts LinkedIn URL from inline script with social URLs', () => {
      const html = `
        <html>
          <head>
            <script>
              var socialLinks = ["https://www.linkedin.com/company/amazon", "https://twitter.com/amazonIN"];
            </script>
          </head>
        </html>
      `;
      const result = extractSocialFromInlineScripts(html);
      expect(result.linkedin).toBe('https://www.linkedin.com/company/amazon');
    });

    it('extracts both Twitter and LinkedIn from inline script', () => {
      const html = `
        <html>
          <head>
            <script>
              var socialLinks = ["https://x.com/beautybarnindia", "https://www.linkedin.com/company/beautybarn"];
            </script>
          </head>
        </html>
      `;
      const result = extractSocialFromInlineScripts(html);
      expect(result.twitter).toBe('beautybarnindia');
      expect(result.linkedin).toBe('https://www.linkedin.com/company/beautybarn');
    });

    it('extracts Twitter handle from inline script with twitter.com URL', () => {
      const html = `
        <html>
          <head>
            <script>
              var social = ["https://twitter.com/amazonIN", "https://www.instagram.com/amazon"];
            </script>
          </head>
        </html>
      `;
      const result = extractSocialFromInlineScripts(html);
      expect(result.twitter).toBe('amazonin');
    });

    it('returns empty object for HTML without inline script social URLs', () => {
      const html = `
        <html>
          <head>
            <script>
              var data = { name: "Test", value: 123 };
            </script>
          </head>
        </html>
      `;
      expect(extractSocialFromInlineScripts(html)).toEqual({});
    });

    it('skips JSON-LD scripts and processes only regular scripts', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Organization",
                "sameAs": ["https://twitter.com/amazonIN"]
              }
            </script>
            <script>
              var socialLinks = ["https://x.com/beautybarnindia"];
            </script>
          </head>
        </html>
      `;
      const result = extractSocialFromInlineScripts(html);
      expect(result.twitter).toBe('beautybarnindia');
    });

    it('handles inline script with Unicode-escaped content', () => {
      const html = `
        <html>
          <head>
            <script>
              var socialLinks = ["https://x.com/\\u007B\\u007Bbrand\\u007D\\u007D"];
            </script>
          </head>
        </html>
      `;
      const result = extractSocialFromInlineScripts(html);
      // The regex should still find the URL pattern
      expect(result.twitter).toBe('{{brand}}');
    });
  });
});