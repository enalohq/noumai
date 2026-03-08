import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CompetitorFetcher } from "@/lib/competitors/fetcher";
import { DiscoverCompetitorsInput } from "@/lib/competitors/types";
import { deduplicateByDomain, getDeduplicationStats } from "@/lib/competitors/deduplicator";

/**
 * POST /api/competitors/discover
 * Auto-discover competitors for a brand
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Validate input
  const { brandName, website, industry, country } = body as DiscoverCompetitorsInput;

  if (!brandName || typeof brandName !== "string" || !brandName.trim()) {
    return NextResponse.json(
      { error: "brandName is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  try {
    const fetcher = new CompetitorFetcher();
    const competitors = await fetcher.fetchAll({
      name: brandName.trim(),
      website,
      industry,
      country,
    });

    // Deduplicate competitors by domain
    const deduplicated = deduplicateByDomain(competitors);
    const stats = getDeduplicationStats(competitors, deduplicated);

    return NextResponse.json(
      {
        competitors: deduplicated,
        meta: {
          total: deduplicated.length,
          sources: [...new Set(deduplicated.map((c) => c.source))],
          deduplication: {
            originalCount: stats.totalOriginal,
            deduplicatedCount: stats.totalDeduplicated,
            duplicatesRemoved: stats.duplicatesRemoved,
            uniqueDomains: stats.uniqueDomains,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[competitors/discover] Error:", error);
    return NextResponse.json(
      { error: "Failed to discover competitors" },
      { status: 500 }
    );
  }
}