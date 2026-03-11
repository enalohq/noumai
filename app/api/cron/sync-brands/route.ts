import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DISCOVERY_COUNTRIES, DISCOVERY_USER_AGENT, ESSENTIAL_BRANDS } from "@/lib/brand/constants";
import { BrandNameSanitizer } from "@/lib/brand/brand-name-sanitizer";

function getCountryDiscoveryQuery(countryISO: string, limit: number, offset: number) {
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
} LIMIT ${limit} OFFSET ${offset}
`;
}

/**
 * Vercel Cron Job: Sync Brands from Wikidata
 * Expected Trigger: Hourly or Daily
 */
export async function GET(request: NextRequest) {
  // Authentication check (Vercel provides CRON_SECRET in production)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 0. Ensure essential brands are always up to date
    // ONLY run this on the first cron run of the day (e.g., midnight) to avoid redundant DB pressure
      if (new Date().getHours() === 0 && new Date().getMinutes() < 30) {
      console.log("Cron: Syncing essential brand overrides...");
      for (const b of ESSENTIAL_BRANDS) {
        await prisma.brandAuthority.upsert({
          where: { hostname: b.hostname },
          update: b,
          create: b
        });
      }
    }

    // 1. Determine which country to sync this round
    // Use current hour as a rotation index
    const hour = new Date().getHours();
    const countryISO = DISCOVERY_COUNTRIES[hour % DISCOVERY_COUNTRIES.length];

    // Use the minute to pick a random offset (0, 1000, 2000, etc) to discover more data over time
    // This allows many runs to eventually cover all data
    const batchOffset = (new Date().getMinutes() % 10) * 1000;
    const batchLimit = 1000;

    console.log(`Cron: Syncing ${countryISO} (Offset: ${batchOffset}, Limit: ${batchLimit})...`);

    const query = getCountryDiscoveryQuery(countryISO, batchLimit, batchOffset);
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': DISCOVERY_USER_AGENT,
        'Accept': 'application/sparql-results+json'
      },
      signal: AbortSignal.timeout(45000) // 45s timeout for SPARQL
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Wikidata failed: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    const results = data.results.bindings;

    let syncCount = 0;

    // Process results sequentially to avoid overloading the DB connections in a serverless environment
    for (const item of results) {
      try {
        const website = item.website.value;
        const urlObj = new URL(website);
        const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();

        if (hostname) {
          const sanitizedName = BrandNameSanitizer.sanitize(item.name.value) || item.name.value;
          
          await prisma.brandAuthority.upsert({
            where: { hostname },
            update: {
              brandName: sanitizedName,
              country: countryISO,
              twitter: item.twitter ? item.twitter.value : undefined,
              linkedin: item.linkedinID ? item.linkedinID.value : undefined
            },
            create: {
              hostname,
              brandName: sanitizedName,
              country: countryISO,
              twitter: item.twitter ? item.twitter.value : undefined,
              linkedin: item.linkedinID ? item.linkedinID.value : undefined
            }
          });
          syncCount++;
        }
      } catch {
        // Skip invalid rows
      }
    }

    return NextResponse.json({
      success: true,
      country: countryISO,
      offset: batchOffset,
      synced: syncCount,
      totalResults: results.length
    });

  } catch (error) {
    console.error("Cron sync error:", error);
    return NextResponse.json({ error: "Internal sync error" }, { status: 500 });
  }
}
