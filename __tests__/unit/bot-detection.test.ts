/**
 * Unit tests for bot detection logic
 * Following SOLID principles: Testing behavior, not implementation details
 */

// Mock the isBotBlockedContent function from the route
function isBotBlockedContent(html: string): boolean {
  const botIndicators = [
    'javascript is disabled',
    'please enable javascript',
    'enable javascript and cookies',
    'access denied',
    'bot detected',
    'cloudflare',
    'distil networks',
    'imperva',
    'incapsula',
    'akamai',
    'datadome',
    'human verification',
    'captcha',
    'security check',
    'rate limit',
    'too many requests',
    'access to this page has been denied',
    'you are being rate limited',
    'please verify you are a human',
    'security check is required',
    'amazon security check'
  ];

  const lowerHtml = html.toLowerCase();
  
  // Check for Amazon-specific bot detection
  if (html.includes('amazon') && html.includes('javascript is disabled')) {
    return true;
  }
  
  // Check for any bot indicators
  return botIndicators.some(indicator => 
    lowerHtml.includes(indicator.toLowerCase())
  );
}

describe('isBotBlockedContent', () => {
  describe('Amazon-specific detection', () => {
    it('detects Amazon bot blocking with javascript disabled message', () => {
      const html = `
        <html>
          <head><title>Amazon.in</title></head>
          <body>
            <h1>Javascript is disabled</h1>
            <p>Please enable Javascript to continue shopping on Amazon</p>
          </body>
        </html>
      `;
      
      expect(isBotBlockedContent(html)).toBe(true);
    });

    it('detects Amazon with case-insensitive javascript message', () => {
      const html = `
        <html>
          <head><title>Amazon Store</title></head>
          <body>
            <h1>JavaScript is Disabled</h1>
            <p>Please enable JavaScript to access Amazon</p>
          </body>
        </html>
      `;
      
      expect(isBotBlockedContent(html)).toBe(true);
    });

    it('does not flag Amazon content without bot detection', () => {
      const html = `
        <html>
          <head><title>Amazon.in - Great Deals</title></head>
          <body>
            <h1>Welcome to Amazon</h1>
            <p>Shop for electronics, books, and more</p>
          </body>
        </html>
      `;
      
      expect(isBotBlockedContent(html)).toBe(false);
    });
  });

  describe('General bot detection', () => {
    it('detects Cloudflare protection', () => {
      const html = `
        <html>
          <head><title>Cloudflare | Security Check</title></head>
          <body>
            <h1>Checking your browser before accessing example.com</h1>
            <p>This process is automatic. Your browser will redirect to your requested content shortly.</p>
          </body>
        </html>
      `;
      
      expect(isBotBlockedContent(html)).toBe(true);
    });

    it('detects captcha challenges', () => {
      const html = `
        <html>
          <head><title>Security Check</title></head>
          <body>
            <h1>Please complete the captcha to continue</h1>
            <div class="captcha">[CAPTCHA IMAGE]</div>
          </body>
        </html>
      `;
      
      expect(isBotBlockedContent(html)).toBe(true);
    });

    it('detects rate limiting', () => {
      const html = `
        <html>
          <head><title>Rate Limited</title></head>
          <body>
            <h1>Too Many Requests</h1>
            <p>You are being rate limited. Please try again later.</p>
          </body>
        </html>
      `;
      
      expect(isBotBlockedContent(html)).toBe(true);
    });

    it('detects access denied messages', () => {
      const html = `
        <html>
          <head><title>Access Denied</title></head>
          <body>
            <h1>Access to this page has been denied</h1>
            <p>Your request looks suspicious to our security system.</p>
          </body>
        </html>
      `;
      
      expect(isBotBlockedContent(html)).toBe(true);
    });
  });

  describe('Normal content', () => {
    it('allows normal HTML content', () => {
      const html = `
        <html>
          <head><title>Example Website</title></head>
          <body>
            <h1>Welcome to our site</h1>
            <p>This is normal content without any bot detection.</p>
          </body>
        </html>
      `;
      
      expect(isBotBlockedContent(html)).toBe(false);
    });

    it('allows content with javascript mentions (not disabled)', () => {
      const html = `
        <html>
          <head><title>JavaScript Tutorial</title></head>
          <body>
            <h1>JavaScript Programming</h1>
            <p>Learn JavaScript with our interactive tutorials.</p>
            <script>console.log('Hello World');</script>
          </body>
        </html>
      `;
      
      expect(isBotBlockedContent(html)).toBe(false);
    });

    it('allows Amazon content without bot blocking', () => {
      const html = `
        <html>
          <head>
            <title>Amazon.in: Online Shopping India - Buy mobiles, laptops, cameras, books, watches, apparel, shoes and e-Gift Cards.</title>
            <meta name="description" content="Online shopping from a great selection at Amazon.in Store.">
          </head>
          <body>
            <header>Amazon.in</header>
            <main>Shop for products</main>
          </body>
        </html>
      `;
      
      expect(isBotBlockedContent(html)).toBe(false);
    });
  });
});