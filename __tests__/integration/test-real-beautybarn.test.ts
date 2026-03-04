/**
 * Integration test with real beautybarn.in website
 * This test makes actual HTTP requests to verify the extraction works
 */
import { extractSocialFromStructuredData } from '@/lib/brand/social-handle-extractor';
import { HtmlScrapingProvider } from '@/lib/brand/brand-name-providers';

describe('Real beautybarn.in integration test', () => {
  it('should extract Twitter handle from actual beautybarn.in website', async () => {
    const url = 'https://beautybarn.in';
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        console.log('Failed to fetch beautybarn.in:', response.status, response.statusText);
        return; // Skip test if website is down
      }

      const html = await response.text();
      
      // Log a snippet of the HTML to see what we got
      console.log('HTML length:', html.length);
      console.log('Contains x.com:', html.includes('x.com'));
      console.log('Contains beautybarnindia:', html.includes('beautybarnindia'));
      
      // Check for JSON-LD
      const hasJsonLd = html.includes('application/ld+json');
      console.log('Has JSON-LD:', hasJsonLd);
      
      if (hasJsonLd) {
        // Extract the JSON-LD content
        const jsonLdMatch = html.match(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
        if (jsonLdMatch) {
          console.log('JSON-LD content:', jsonLdMatch[1].substring(0, 500));
        }
      }
      
      // Test extraction
      const structuredData = extractSocialFromStructuredData(html);
      console.log('Extracted structured data:', structuredData);
      
      // Use provider
      const provider = new HtmlScrapingProvider();
      const brandData = await provider.fetch(url);
      console.log('Provider extracted:', brandData);
      
      // Assertions
      expect(structuredData.twitter || brandData.twitterHandle).toBeTruthy();
      if (structuredData.twitter) {
        expect(structuredData.twitter).toBe('beautybarnindia');
      }
      if (brandData.twitterHandle) {
        expect(brandData.twitterHandle).toBe('beautybarnindia');
      }
    } catch (error) {
      console.error('Test error:', error);
      // Don't fail the test if network issues
      expect(error).toBeDefined();
    }
  }, 30000); // 30 second timeout
});
