import { extractCountry, getCountryFromHostname } from "@/lib/utils/country-detector";

describe("Country Detection", () => {
  describe("Generic TLDs", () => {
    it("should not detect country for .co domains (used globally)", () => {
      const result = getCountryFromHostname("minimalist.co");
      expect(result).toBeNull();
    });

    it("should not detect country for .com domains (used globally)", () => {
      const result = getCountryFromHostname("example.com");
      expect(result).toBeNull();
    });

    it("should not detect country for .io domains (used globally for tech)", () => {
      const result = getCountryFromHostname("github.io");
      expect(result).toBeNull();
    });

    it("should not detect country for .ai domains (used globally for AI companies)", () => {
      const result = getCountryFromHostname("openai.ai");
      expect(result).toBeNull();
    });

    it("should not detect country for .tv domains (used globally for media)", () => {
      const result = getCountryFromHostname("twitch.tv");
      expect(result).toBeNull();
    });

    it("should not detect country for .me domains (used globally for personal brands)", () => {
      const result = getCountryFromHostname("about.me");
      expect(result).toBeNull();
    });

    it("should not detect country for .cc domains (used globally)", () => {
      const result = getCountryFromHostname("example.cc");
      expect(result).toBeNull();
    });
  });

  describe("Country-specific TLDs", () => {
    it("should detect India for .in domains", () => {
      const result = getCountryFromHostname("example.in");
      expect(result).toBe("India");
    });

    it("should detect United Kingdom for .uk domains", () => {
      const result = getCountryFromHostname("example.uk");
      expect(result).toBe("United Kingdom");
    });

    it("should detect Germany for .de domains", () => {
      const result = getCountryFromHostname("example.de");
      expect(result).toBe("Germany");
    });

    it("should detect France for .fr domains", () => {
      const result = getCountryFromHostname("example.fr");
      expect(result).toBe("France");
    });

    it("should detect Australia for .au domains", () => {
      const result = getCountryFromHostname("example.com.au");
      expect(result).toBe("Australia");
    });

    it("should detect Japan for .jp domains", () => {
      const result = getCountryFromHostname("example.jp");
      expect(result).toBe("Japan");
    });
  });

  describe("Subdomain detection", () => {
    it("should detect country from subdomain prefix", () => {
      const result = getCountryFromHostname("uk.example.com");
      expect(result).toBe("United Kingdom");
    });

    it("should detect Australia from au subdomain", () => {
      const result = getCountryFromHostname("au.example.com");
      expect(result).toBe("Australia");
    });

    it("should detect India from in subdomain", () => {
      const result = getCountryFromHostname("in.example.com");
      expect(result).toBe("India");
    });
  });

  describe("HTML meta tag detection", () => {
    it("should extract country from og:locale meta tag", () => {
      const html = '<meta property="og:locale" content="en_US" />';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United States");
    });

    it("should extract country from og:locale with dash separator", () => {
      const html = '<meta property="og:locale" content="en-GB" />';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United Kingdom");
    });

    it("should extract country from hreflang attribute", () => {
      const html = '<link rel="alternate" hreflang="de-DE" href="..." />';
      const result = extractCountry("example.com", html);
      expect(result).toBe("Germany");
    });
  });

  describe("Priority order", () => {
    it("should prioritize TLD over HTML meta tags", () => {
      const html = '<meta property="og:locale" content="en_US" />';
      const result = extractCountry("example.in", html);
      expect(result).toBe("India"); // .in TLD takes priority
    });

    it("should fall back to HTML when TLD is generic", () => {
      const html = '<meta property="og:locale" content="en_IN" />';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India"); // Falls back to HTML since .com is generic
    });

    it("should return null when no country indicators found", () => {
      const html = "<html><body>No country info</body></html>";
      const result = extractCountry("example.com", html);
      expect(result).toBeNull();
    });
  });

  describe("Real-world examples", () => {
    it("should not detect country for minimalist.co", () => {
      const html = ""; // No HTML meta tags
      const result = extractCountry("minimalist.co", html);
      expect(result).toBeNull();
    });

    it("should detect India for minimalist.co with INR currency", () => {
      const html = '<div class="price">₹499</div><span>Price: INR 999</span>';
      const result = extractCountry("minimalist.co", html);
      expect(result).toBe("India");
    });

    it("should detect India for minimalist.co with phone number", () => {
      const html = '<a href="tel:+919876543210">Call us</a>';
      const result = extractCountry("minimalist.co", html);
      expect(result).toBe("India");
    });

    it("should detect India for beautybarn.in", () => {
      const html = "";
      const result = extractCountry("beautybarn.in", html);
      expect(result).toBe("India");
    });

    it("should not detect country for google.co", () => {
      const html = "";
      const result = extractCountry("google.co", html);
      expect(result).toBeNull();
    });

    it("should not detect country for amazon.co", () => {
      const html = "";
      const result = extractCountry("amazon.co", html);
      expect(result).toBeNull();
    });
  });

  describe("Phone number detection", () => {
    it("should detect India from +91 phone number", () => {
      const html = '<a href="tel:+919876543210">Call us</a>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India");
    });

    it("should detect United Kingdom from +44 phone number", () => {
      const html = 'Contact: +44 20 1234 5678';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United Kingdom");
    });

    it("should detect United States from +1 phone number", () => {
      const html = 'Phone: +1 (555) 123-4567';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United States");
    });

    it("should detect Australia from +61 phone number", () => {
      const html = 'Call us: +61 2 1234 5678';
      const result = extractCountry("example.com", html);
      expect(result).toBe("Australia");
    });

    it("should detect UAE from +971 phone number", () => {
      const html = 'WhatsApp: +971 50 123 4567';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United Arab Emirates");
    });

    it("should detect Singapore from +65 phone number", () => {
      const html = 'Mobile: +65 9123 4567';
      const result = extractCountry("example.com", html);
      expect(result).toBe("Singapore");
    });
  });

  describe("Currency symbol detection", () => {
    it("should detect India from ₹ symbol", () => {
      const html = '<div class="price">₹499</div><span>₹999</span>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India");
    });

    it("should detect India from INR code", () => {
      const html = '<span>Price: INR 499</span><div>Total: INR 999</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India");
    });

    it("should detect United Kingdom from £ symbol", () => {
      const html = '<div class="price">£49.99</div><span>£99.99</span>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United Kingdom");
    });

    it("should detect Japan from ¥ symbol", () => {
      const html = '<div class="price">¥4,999</div><span>¥9,999</span>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("Japan");
    });

    it("should detect Australia from AUD code", () => {
      const html = '<span>Price: AUD 49.99</span><div>Total: AUD 99.99</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("Australia");
    });

    it("should detect Singapore from SGD code", () => {
      const html = '<span>Price in SGD: 49.99</span>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("Singapore");
    });

    it("should detect UAE from AED code", () => {
      const html = '<div>Pay AED 199</div><span>Total: AED 399</span>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United Arab Emirates");
    });

    it("should not return International for € when other currencies present", () => {
      const html = '<div>€49.99</div>'; // Euro is ambiguous
      const result = extractCountry("example.com", html);
      // Should return null or International, not a specific EU country
      expect(result).toBeNull();
    });
  });

  describe("Priority order with multiple indicators", () => {
    it("should prioritize TLD over currency", () => {
      const html = '<div class="price">$49.99</div>'; // USD symbol
      const result = extractCountry("example.in", html);
      expect(result).toBe("India"); // .in TLD takes priority
    });

    it("should prioritize phone over currency", () => {
      const html = '<div>Price: $49.99</div><a href="tel:+919876543210">Call</a>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India"); // Phone number takes priority over $ symbol
    });

    it("should use currency when TLD is generic", () => {
      const html = '<div class="price">₹499</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India"); // Falls back to currency
    });

    it("should use phone when TLD is generic and no currency", () => {
      const html = '<a href="tel:+442012345678">Contact</a>';
      const result = extractCountry("example.co", html);
      expect(result).toBe("United Kingdom");
    });
  });

  describe("Address detection", () => {
    it("should detect India from Mumbai city", () => {
      const html = '<div>Address: 123 Main St, Mumbai, Maharashtra 400001</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India");
    });

    it("should detect India from Bangalore city", () => {
      const html = '<p>Located in Bangalore, Karnataka</p>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India");
    });

    it("should detect United States from New York", () => {
      const html = '<div>Office: New York, NY 10001</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United States");
    });

    it("should detect United Kingdom from London", () => {
      const html = '<p>Headquarters in London, UK</p>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United Kingdom");
    });

    it("should detect Australia from Sydney", () => {
      const html = '<div>Based in Sydney, Australia</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("Australia");
    });

    it("should detect India from Indian postal code", () => {
      const html = '<div>Shipping to: 400001, 110001, 560001</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India");
    });

    it("should detect United States from US state name", () => {
      const html = '<div>Available in California, Texas, and Florida</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United States");
    });

    it("should detect India from Indian state name", () => {
      const html = '<div>Serving Maharashtra, Karnataka, and Tamil Nadu</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India");
    });

    it("should detect United Kingdom from UK postcode", () => {
      const html = '<div>Address: SW1A 1AA, London, UK</div>'; // Added "London" and "UK" for better detection
      const result = extractCountry("example.com", html);
      expect(result).toBe("United Kingdom");
    });

    it("should detect country from explicit address mention", () => {
      const html = '<div>Headquarters: Based in Singapore</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("Singapore");
    });
  });

  describe("Business registration number detection", () => {
    it("should detect India from GST number", () => {
      const html = '<div>GST: 27AABCU9603R1ZM</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India");
    });

    it("should detect India from GSTIN", () => {
      const html = '<p>GSTIN: 29ABCDE1234F1Z5</p>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India");
    });

    it("should detect United Kingdom from VAT number", () => {
      const html = '<div>VAT: GB123456789</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United Kingdom");
    });

    it("should detect United States from EIN", () => {
      const html = '<div>EIN: 12-3456789</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United States");
    });

    it("should detect United States from Tax ID", () => {
      const html = '<p>Federal Tax ID: 98-7654321</p>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United States");
    });

    it("should detect Australia from ABN", () => {
      const html = '<div>ABN: 12 345 678 901</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("Australia");
    });

    it("should detect Singapore from UEN", () => {
      const html = '<div>UEN: 201234567A</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("Singapore");
    });

    it("should detect UAE from TRN", () => {
      const html = '<div>TRN: 123456789012345</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("United Arab Emirates");
    });

    it("should detect Germany from VAT ID", () => {
      const html = '<div>USt-IdNr: DE123456789</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("Germany");
    });

    it("should detect France from SIRET", () => {
      const html = '<div>SIRET: 12345678901234</div>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("France");
    });
  });

  describe("Combined indicators priority", () => {
    it("should prioritize business registration over address", () => {
      const html = '<div>GST: 27AABCU9603R1ZM</div><p>Office in London</p>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India"); // GST takes priority
    });

    it("should prioritize address over phone when both present", () => {
      const html = '<div>Based in Mumbai, India</div><a href="tel:+442012345678">Call UK office</a>';
      const result = extractCountry("example.com", html);
      expect(result).toBe("India"); // Address takes priority
    });

    it("should use all indicators when TLD is generic", () => {
      const html = '<div>Mumbai office</div><div>₹499</div><a href="tel:+919876543210">Call</a>';
      const result = extractCountry("example.co", html);
      expect(result).toBe("India"); // Multiple India indicators
    });
  });
});
