import { PrismaClient } from '@prisma/client';

/**
 * Noumai Brand Discovery Script
 * Standalone utility to bulk-sync brands from Wikidata to Prisma
 */

const COUNTRIES = [
  "US", "GB", "IN", "CN", "DE", "FR", "CA", "AU", "JP", "BR", "MX", "IT", "ES", "NL", "SE", "KR", "RU", "SG", "CH", "HK", "AE", "SA", "ZA", "NZ", "IE", "NO", "DK", "FI", "PL", "TR", "BE", "AT", "IL", "TW", "ID", "TH", "MY", "PH", "VN", "PK", "BD"
];

const USER_AGENT = 'NoumaiDiscovery/1.0 (contact: admin@example.com)';

const ESSENTIAL_BRANDS = [
  { hostname: 'microsoft.com', brandName: 'Microsoft', country: 'US', twitter: 'microsoft', linkedin: 'microsoft' },
  { hostname: 'google.com', brandName: 'Google', country: 'US', twitter: 'google', linkedin: 'google' },
  { hostname: 'apple.com', brandName: 'Apple', country: 'US', twitter: 'apple', linkedin: 'apple' },
  { hostname: 'amazon.com', brandName: 'Amazon', country: 'US', twitter: 'amazon', linkedin: 'amazon' },
  { hostname: 'meta.com', brandName: 'Meta', country: 'US', twitter: 'meta', linkedin: 'facebook' },
  { hostname: 'netflix.com', brandName: 'Netflix', country: 'US', twitter: 'netflix', linkedin: 'netflix' },
  { hostname: 'tesla.com', brandName: 'Tesla', country: 'US', twitter: 'tesla', linkedin: 'tesla-motors' },
  { hostname: 'nike.com', brandName: 'Nike', country: 'US', twitter: 'nike', linkedin: 'nike' },
  { hostname: 'openai.com', brandName: 'OpenAI', country: 'US', twitter: 'openai', linkedin: 'openai' }
];

function getCountryQuery(countryISO) {
  return `
SELECT DISTINCT ?name ?website ?twitter ?linkedinID WHERE {
  ?company wdt:P31/wdt:P279* wd:Q4830453. 
  ?company rdfs:label ?name. FILTER(LANG(?name) = "en")
  ?company wdt:P856 ?website.
  ?company wdt:P159 ?hq.
  ?hq wdt:P17 ?country.
  ?country wdt:P297 "${countryISO}".
  OPTIONAL { ?company wdt:P2002 ?twitter. }
  OPTIONAL { ?company wdt:P4264 ?linkedinID. }
} LIMIT 10000
`;
}

async function fetchByCountry(countryISO) {
  const query = getCountryQuery(countryISO);
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

  try {
    const response = await fetch(url, { 
      headers: { 
        'User-Agent': USER_AGENT, 
        'Accept': 'application/sparql-results+json' 
      },
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 504) {
        console.log(`  Target unstable (${response.status}) on ${countryISO}. Waiting 10s...`);
        await new Promise(r => setTimeout(r, 10000));
        return fetchByCountry(countryISO);
      }
      return null;
    }

    const data = await response.json();
    return data.results.bindings;
  } catch (e) {
    console.error(`  Fetch error for ${countryISO}: ${e.message}`);
    return null;
  }
}

async function run() {
  const prisma = new PrismaClient();
  console.log('--- Noumai Prisma Intelligence Sync ---');
  
  // 1. Initial essential push
  console.log('Inserting essential brands...');
  for (const b of ESSENTIAL_BRANDS) {
    try {
      await prisma.brandAuthority.upsert({
        where: { hostname: b.hostname },
        update: b,
        create: b
      });
    } catch (e) {
      console.error(`  Failed to sync essential brand ${b.hostname}: ${e.message}`);
    }
  }

  // 2. Fetch countries
  for (const iso of COUNTRIES) {
    process.stdout.write(`Syncing ${iso}... `);
    try {
      const results = await fetchByCountry(iso);
      if (!results) {
        console.log('FAILED');
        continue;
      }

      let count = 0;
      for (const item of results) {
        try {
          const website = item.website.value;
          const urlObj = new URL(website);
          const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();

          if (hostname) {
            await prisma.brandAuthority.upsert({
              where: { hostname: hostname },
              update: {
                brandName: item.name.value,
                country: iso,
                twitter: item.twitter ? item.twitter.value : null,
                linkedin: item.linkedinID ? item.linkedinID.value : null
              },
              create: {
                hostname: hostname,
                brandName: item.name.value,
                country: iso,
                twitter: item.twitter ? item.twitter.value : null,
                linkedin: item.linkedinID ? item.linkedinID.value : null
              }
            });
            count++;
          }
        } catch {
          // Silent skip for individual row errors
        }
      }
      console.log(`Done. Saved ${count} brands for ${iso}.`);
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.error(`\n  Total Error on ${iso}: ${e.message}`);
    }
  }

  await prisma.$disconnect();
  console.log('\nFULL PRISMA SYNC COMPLETE.');
}

run().catch(async (e) => {
  console.error('Fatal Sync Error:', e);
  process.exit(1);
});
