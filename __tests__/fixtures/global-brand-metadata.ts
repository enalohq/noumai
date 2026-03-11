export interface GlobalBrandMetadataFixture {
    brandName: string;
    website: string;
    twitterHandle: string;
    linkedinHandle: string;
    country: string;
}

export const GLOBAL_BRAND_METADATA_FIXTURES: GlobalBrandMetadataFixture[] = [
    { brandName: "Apple", website: "https://www.apple.com", twitterHandle: "apple", linkedinHandle: "https://www.linkedin.com/company/apple", country: "United States" },
    { brandName: "Google", website: "https://www.google.com", twitterHandle: "google", linkedinHandle: "https://www.linkedin.com/company/google", country: "United States" },
    { brandName: "Microsoft", website: "https://www.microsoft.com", twitterHandle: "microsoft", linkedinHandle: "https://www.linkedin.com/company/microsoft", country: "United States" },
    { brandName: "Amazon", website: "https://www.amazon.com", twitterHandle: "amazon", linkedinHandle: "https://www.linkedin.com/company/amazon", country: "United States" },
    { brandName: "Meta", website: "https://www.meta.com", twitterHandle: "meta", linkedinHandle: "https://www.linkedin.com/company/meta", country: "United States" },
    { brandName: "Netflix", website: "https://www.netflix.com", twitterHandle: "netflix", linkedinHandle: "https://www.linkedin.com/company/netflix", country: "United States" },
    { brandName: "Tesla", website: "https://www.tesla.com", twitterHandle: "tesla", linkedinHandle: "https://www.linkedin.com/company/tesla-motors", country: "United States" },
    { brandName: "Nike", website: "https://www.nike.com", twitterHandle: "nike", linkedinHandle: "https://www.linkedin.com/company/nike", country: "United States" },
    { brandName: "Starbucks", website: "https://www.starbucks.com", twitterHandle: "starbucks", linkedinHandle: "https://www.linkedin.com/company/starbucks", country: "United States" },
    { brandName: "OpenAI", website: "https://www.openai.com", twitterHandle: "openai", linkedinHandle: "https://www.linkedin.com/company/openai", country: "United States" },
    { brandName: "Stripe", website: "https://stripe.com", twitterHandle: "stripe", linkedinHandle: "https://www.linkedin.com/company/stripe", country: "United States" },
    { brandName: "Spotify", website: "https://www.spotify.com", twitterHandle: "spotify", linkedinHandle: "https://www.linkedin.com/company/spotify", country: "Sweden" },
    { brandName: "Airbnb", website: "https://www.airbnb.com", twitterHandle: "airbnb", linkedinHandle: "https://www.linkedin.com/company/airbnb", country: "United States" },
    { brandName: "Vercel", website: "https://vercel.com", twitterHandle: "vercel", linkedinHandle: "https://www.linkedin.com/company/vercel", country: "United States" },
    { brandName: "Supabase", website: "https://supabase.com", twitterHandle: "supabase", linkedinHandle: "https://www.linkedin.com/company/supabase", country: "United States" },
    { brandName: "Figma", website: "https://www.figma.com", twitterHandle: "figma", linkedinHandle: "https://www.linkedin.com/company/figma", country: "United States" },
    { brandName: "GitHub", website: "https://github.com", twitterHandle: "github", linkedinHandle: "https://www.linkedin.com/company/github", country: "United States" },
    { brandName: "Notion", website: "https://www.notion.so", twitterHandle: "notionhq", linkedinHandle: "https://www.linkedin.com/company/notionhq", country: "United States" },
    { brandName: "Atlassian", website: "https://www.atlassian.com", twitterHandle: "atlassian", linkedinHandle: "https://www.linkedin.com/company/atlassian", country: "Australia" },
    { brandName: "Canva", website: "https://www.canva.com", twitterHandle: "canva", linkedinHandle: "https://www.linkedin.com/company/canva", country: "Australia" }
];

export function buildGlobalBrandHtml(fixture: GlobalBrandMetadataFixture): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>${fixture.brandName} | Official Website</title>
        <meta property="og:site_name" content="${fixture.brandName}" />
        <meta property="og:title" content="${fixture.brandName} Global" />
        <meta property="og:locale" content="en_US" />
        <meta name="application-name" content="${fixture.brandName}" />
        <meta name="twitter:site" content="@${fixture.twitterHandle}" />
      </head>
      <body>
        <header>
          <h1>${fixture.brandName}</h1>
        </header>
        <main>
          <p>Headquarters: Earth, ${fixture.country} 00000</p>
          <p>Customer care: +1 800 000 0000</p>
          <a href="${fixture.linkedinHandle}">LinkedIn</a>
          <a href="https://twitter.com/${fixture.twitterHandle}">Twitter</a>
        </main>
      </body>
    </html>
  `;
}
