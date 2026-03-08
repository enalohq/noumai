/**
 * Recommendations Engine
 *
 * Analyzes scrape run data and brand configuration to generate
 * prioritized, actionable recommendations for improving AI visibility.
 *
 * Pure functions — no side effects, no React dependencies.
 */

import type { AppState, Provider, ScrapeRun } from "@/components/dashboard/types";
import { PROVIDER_LABELS } from "@/components/dashboard/types";
import { extractBrandTerms, extractCompetitorTerms } from "@/lib/scoring";

export type RecommendationPriority = "critical" | "high" | "medium" | "low";
export type RecommendationCategory =
  | "visibility"
  | "content"
  | "technical"
  | "competitor"
  | "coverage";

export interface Recommendation {
  id: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  title: string;
  description: string;
  actions: string[];
  /** The data point that triggered this recommendation */
  evidence?: string;
  /** Estimated impact on visibility score */
  estimatedImpact?: string;
}

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Generate all applicable recommendations from current app state.
 * Returns sorted by priority (critical first).
 */
export function generateRecommendations(state: AppState): Recommendation[] {
  const recs: Recommendation[] = [];

  if (state.runs.length === 0) {
    recs.push({
      id: "no-data",
      priority: "critical",
      category: "coverage",
      title: "Run your first AI visibility scan",
      description:
        "You haven't scanned any AI models yet. Run a prompt from the Prompt Hub to see how your brand appears in AI responses.",
      actions: [
        "Go to the Prompts menu",
        "Enter a query your customers would ask an AI model",
        "Click Run to see your visibility score",
      ],
      estimatedImpact: "Baseline measurement",
    });
    return recs;
  }

  // ── Compute aggregates ──

  const brandTerms = extractBrandTerms(state.brand.brandName ?? "", state.brand.brandAliases ?? "");
  const avgScore = Math.round(
    state.runs.reduce((a, r) => a + (r.visibilityScore ?? 0), 0) / state.runs.length,
  );

  // Per-provider breakdown
  const providerStats = computeProviderStats(state.runs);

  // Recent vs older comparison
  const trendInsight = computeTrendInsight(state.runs);

  // Competitor dominance analysis
  const competitorInsight = computeCompetitorInsight(state);

  // Citation gap analysis
  const citationGaps = computeCitationGaps(state);

  // ── Generate recommendations ──

  // 1. Zero-mention providers (critical)
  const zeroProviders = Object.entries(providerStats)
    .filter(([, stats]) => stats.mentionRate === 0 && stats.count >= 1)
    .map(([p]) => p as Provider);

  if (zeroProviders.length > 0) {
    const names = zeroProviders.map((p) => PROVIDER_LABELS[p]).join(", ");
    recs.push({
      id: "zero-visibility-providers",
      priority: "critical",
      category: "visibility",
      title: `Your brand is invisible on ${names}`,
      description: `Out of ${state.runs.length} total scans, ${names} never mentioned your brand. These AI models are used by millions of people daily.`,
      actions: [
        `Create content specifically optimized for AI discovery (FAQ pages, how-to guides, comparison articles)`,
        `Ensure your brand appears on authoritative sources that these AI models tend to cite`,
        `Add structured data (Schema.org) to your website to improve AI model understanding`,
        `Create an llms.txt file at your domain root to tell AI crawlers about your brand`,
      ],
      evidence: `0% mention rate across ${zeroProviders.length} AI model${zeroProviders.length > 1 ? "s" : ""}`,
      estimatedImpact: "+30 to +50 visibility points",
    });
  }

  // 2. Low overall visibility (high)
  if (avgScore < 30 && state.runs.length >= 3) {
    recs.push({
      id: "low-overall-visibility",
      priority: "high",
      category: "visibility",
      title: `Your average visibility is only ${avgScore}/100`,
      description:
        "AI models rarely mention your brand prominently. This means potential customers asking AI for recommendations in your space won't find you.",
      actions: [
        "Publish original research or data that AI models can reference",
        "Get mentioned on high-authority sites (industry publications, Wikipedia, major blogs)",
        "Create a comprehensive 'About' page with clear BLUF (Bottom Line Up Front) statements",
        "Ensure your brand name appears consistently across all online properties",
      ],
      evidence: `Average score: ${avgScore}/100 across ${state.runs.length} scans`,
      estimatedImpact: "+15 to +30 visibility points",
    });
  }

  // 3. Not in prominent position (medium)
  const runsWithMention = state.runs.filter((r) => (r.brandMentions?.length ?? 0) > 0);
  const prominentRuns = runsWithMention.filter((r) => {
    const first200 = r.answer.slice(0, 200).toLowerCase();
    return brandTerms.some((t) => first200.includes(t.toLowerCase()));
  });

  if (runsWithMention.length >= 3 && prominentRuns.length / runsWithMention.length < 0.3) {
    recs.push({
      id: "not-prominent",
      priority: "medium",
      category: "content",
      title: "Your brand is mentioned but not recommended first",
      description: `Your brand appears in ${runsWithMention.length} responses, but is only featured prominently (in the first paragraph) in ${prominentRuns.length}. AI models list you as an afterthought, not a primary recommendation.`,
      actions: [
        "Create content that positions your brand as the default/leading solution",
        "Get featured in 'best of' and comparison articles on authoritative sites",
        "Ensure your homepage clearly states what you do in the first sentence (BLUF)",
        "Build more backlinks from high-authority domains in your industry",
      ],
      evidence: `Prominent in ${prominentRuns.length}/${runsWithMention.length} mentions (${Math.round((prominentRuns.length / runsWithMention.length) * 100)}%)`,
      estimatedImpact: "+20 visibility points",
    });
  }

  // 4. Declining visibility trend (high)
  if (trendInsight && trendInsight.direction === "declining" && trendInsight.delta <= -10) {
    recs.push({
      id: "declining-trend",
      priority: "high",
      category: "visibility",
      title: `Visibility dropped ${Math.abs(trendInsight.delta)} points recently`,
      description:
        "Your brand visibility is trending downward. This could mean AI models are updating their training data or competitors are gaining ground.",
      actions: [
        "Check if competitors published new content that's being cited instead",
        "Review recent changes to your website content — avoid removing authoritative pages",
        "Publish fresh content addressing the prompts where your score dropped",
        "Run competitor battlecards to see who's gaining visibility",
      ],
      evidence: `Score trend: ${trendInsight.recentAvg} (recent) vs ${trendInsight.olderAvg} (earlier)`,
      estimatedImpact: "Recover +10 to +15 points",
    });
  }

  // 5. Competitors dominating (high)
  if (competitorInsight.dominantCompetitors.length > 0) {
    const top3 = competitorInsight.dominantCompetitors.slice(0, 3);
    recs.push({
      id: "competitor-dominance",
      priority: "high",
      category: "competitor",
      title: `${top3.map((c) => c.name).join(", ")} mentioned more than you`,
      description: `These competitors appear in AI responses more frequently than your brand. AI models are recommending them over you.`,
      actions: [
        `Create comparison content: "${state.brand.brandName} vs ${top3[0]?.name}" articles`,
        "Identify the sources AI models cite for competitors and get your brand on those sources",
        "Publish case studies and customer testimonials that differentiate your offering",
        "Use the Citation Opportunities tab to find specific URLs to target for outreach",
      ],
      evidence: top3
        .map((c) => `${c.name}: ${c.mentionCount} mentions vs your ${competitorInsight.brandMentionCount}`)
        .join("; "),
      estimatedImpact: "+10 to +25 visibility points",
    });
  }

  // 6. Citation gaps — competitor sources you're missing (medium)
  if (citationGaps.length > 0) {
    const topDomains = citationGaps.slice(0, 5).map((g) => g.domain);
    recs.push({
      id: "citation-gaps",
      priority: "medium",
      category: "content",
      title: `${citationGaps.length} citation sources where only competitors appear`,
      description:
        "AI models cite these sources alongside your competitors but never alongside your brand. Getting mentioned on these sites could significantly boost your visibility.",
      actions: [
        ...topDomains.map((d) => `Pitch content or get featured on ${d}`),
        "Check the Citation Opportunities tab for specific URLs and outreach briefs",
      ],
      evidence: `Top gaps: ${topDomains.join(", ")}`,
      estimatedImpact: "+15 to +20 visibility points per source",
    });
  }

  // 7. Missing brand configuration (medium)
  if (!state.brand.brandName?.trim()) {
    recs.push({
      id: "no-brand",
      priority: "medium",
      category: "technical",
      title: "Configure your brand name in Settings",
      description:
        "Without a brand name, the tool can't detect mentions or calculate visibility scores accurately.",
      actions: [
        "Go to Settings tab and enter your brand name",
        "Add brand aliases (abbreviations, product names)",
        "Add your website URL for citation detection",
      ],
      estimatedImpact: "Accurate scoring",
    });
  } else if (!state.brand.website?.trim()) {
    recs.push({
      id: "no-website",
      priority: "low",
      category: "technical",
      title: "Add your website URL in Settings",
      description:
        "Adding your website URL enables citation detection — when AI models link to your site, you get +20 visibility points.",
      actions: ["Go to Settings → enter your website URL"],
      estimatedImpact: "+20 points when cited",
    });
  }

  // 8. AEO audit suggestions based on audit data
  if (state.auditReport) {
    const audit = state.auditReport;
    if (!audit.pass?.llmsTxt) {
      recs.push({
        id: "missing-llms-txt",
        priority: "high",
        category: "technical",
        title: "Your site is missing llms.txt",
        description:
          "llms.txt is a standard file (like robots.txt) that tells AI crawlers about your brand, products, and key content. Without it, AI models may misunderstand or ignore your site.",
        actions: [
          "Create a file at yoursite.com/llms.txt",
          "Include: company name, description, key products/services, and links to important pages",
          "Follow the llms.txt specification at llmstxt.org",
          "Also create llms-full.txt with comprehensive brand information",
        ],
        estimatedImpact: "Improved AI model understanding",
      });
    }
    if (!audit.pass?.schema) {
      recs.push({
        id: "missing-schema",
        priority: "medium",
        category: "technical",
        title: "Add Schema.org structured data to your site",
        description: `Your site has ${audit.schemaMentions ?? 0} schema mentions. Structured data helps AI models understand your content context, products, and authority.`,
        actions: [
          "Add Organization schema to your homepage",
          "Add Product/Service schema to product pages",
          "Add FAQ schema to support/help pages",
          "Use Google's Rich Results Test to validate",
        ],
        estimatedImpact: "Better AI understanding of your content",
      });
    }
  }

  // 9. Low provider coverage (low)
  const scannedProviders = new Set(state.runs.map((r) => r.provider));
  const allProviders: Provider[] = ["chatgpt", "perplexity", "copilot", "gemini", "google_ai", "grok"];
  const unscanned = allProviders.filter((p) => !scannedProviders.has(p));
  if (unscanned.length >= 3) {
    recs.push({
      id: "low-coverage",
      priority: "low",
      category: "coverage",
      title: `${unscanned.length} AI models haven't been scanned yet`,
      description: `You're only tracking ${scannedProviders.size} out of 6 available AI models. Each model has different training data and may show different results.`,
      actions: [
        `Enable ${unscanned.map((p) => PROVIDER_LABELS[p]).join(", ")} in the provider selector`,
        "Run a batch scan to compare results across all models",
      ],
      evidence: `Scanned: ${[...scannedProviders].map((p) => PROVIDER_LABELS[p]).join(", ")}`,
      estimatedImpact: "Complete visibility picture",
    });
  }

  // 10. Negative sentiment (medium)
  const negativeRuns = state.runs.filter((r) => r.sentiment === "negative");
  if (negativeRuns.length >= 2) {
    const negPct = Math.round((negativeRuns.length / state.runs.length) * 100);
    recs.push({
      id: "negative-sentiment",
      priority: negPct > 30 ? "high" : "medium",
      category: "visibility",
      title: `${negPct}% of AI responses have negative sentiment about your brand`,
      description:
        "AI models are associating your brand with negative language. This could be due to negative reviews, bad press, or competitor comparison content that positions you unfavorably.",
      actions: [
        "Identify the specific prompts that trigger negative responses (check the Responses tab)",
        "Publish positive case studies, testimonials, and success stories",
        "Address negative reviews or press mentions directly on your site",
        "Create authoritative content that reframes the narrative",
      ],
      evidence: `${negativeRuns.length}/${state.runs.length} responses are negative`,
      estimatedImpact: "Sentiment improvement → +5 to +15 points",
    });
  }

  // Sort by priority
  recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  return recs;
}

// ── Helper functions ──

// extractBrandTerms — imported from @/lib/scoring

function computeProviderStats(
  runs: ScrapeRun[],
): Record<string, { count: number; avgScore: number; mentionRate: number }> {
  const grouped: Record<string, ScrapeRun[]> = {};
  runs.forEach((r) => {
    if (!grouped[r.provider]) grouped[r.provider] = [];
    grouped[r.provider].push(r);
  });

  const stats: Record<string, { count: number; avgScore: number; mentionRate: number }> = {};
  for (const [provider, provRuns] of Object.entries(grouped)) {
    const avgScore = Math.round(
      provRuns.reduce((a, r) => a + (r.visibilityScore ?? 0), 0) / provRuns.length,
    );
    const mentioned = provRuns.filter((r) => (r.brandMentions?.length ?? 0) > 0).length;
    stats[provider] = {
      count: provRuns.length,
      avgScore,
      mentionRate: Math.round((mentioned / provRuns.length) * 100),
    };
  }
  return stats;
}

function computeTrendInsight(
  runs: ScrapeRun[],
): { direction: "improving" | "declining" | "stable"; delta: number; recentAvg: number; olderAvg: number } | null {
  if (runs.length < 4) return null;

  const sorted = [...runs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const mid = Math.floor(sorted.length / 2);
  const recent = sorted.slice(0, mid);
  const older = sorted.slice(mid);

  const recentAvg = Math.round(
    recent.reduce((a, r) => a + (r.visibilityScore ?? 0), 0) / recent.length,
  );
  const olderAvg = Math.round(
    older.reduce((a, r) => a + (r.visibilityScore ?? 0), 0) / older.length,
  );
  const delta = recentAvg - olderAvg;

  return {
    direction: delta >= 5 ? "improving" : delta <= -5 ? "declining" : "stable",
    delta,
    recentAvg,
    olderAvg,
  };
}

function computeCompetitorInsight(state: AppState): {
  dominantCompetitors: { name: string; mentionCount: number }[];
  brandMentionCount: number;
} {
  const competitorTerms = extractCompetitorTerms(state.competitors);

  const brandMentionCount = state.runs.filter(
    (r) => (r.brandMentions?.length ?? 0) > 0,
  ).length;

  const compCounts: Record<string, number> = {};
  for (const run of state.runs) {
    for (const term of competitorTerms) {
      if (run.answer.toLowerCase().includes(term.toLowerCase())) {
        compCounts[term] = (compCounts[term] ?? 0) + 1;
      }
    }
  }

  const dominantCompetitors = Object.entries(compCounts)
    .filter(([, count]) => count > brandMentionCount)
    .map(([name, mentionCount]) => ({ name, mentionCount }))
    .sort((a, b) => b.mentionCount - a.mentionCount);

  return { dominantCompetitors, brandMentionCount };
}

function computeCitationGaps(
  state: AppState,
): { domain: string; count: number }[] {
  const brandDomain = state.brand.website
    ?.replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  // Runs where brand is NOT mentioned but competitors are
  const competitorOnly = state.runs.filter(
    (r) =>
      (r.brandMentions?.length ?? 0) === 0 &&
      (r.competitorMentions?.length ?? 0) > 0,
  );

  const domainCounts: Record<string, number> = {};
  for (const run of competitorOnly) {
    for (const source of run.sources) {
      try {
        const host = new URL(source).hostname.replace(/^www\./, "").toLowerCase();
        // Skip if it's the brand's own domain
        if (brandDomain && host.includes(brandDomain)) continue;
        domainCounts[host] = (domainCounts[host] ?? 0) + 1;
      } catch {
        /* skip invalid URLs */
      }
    }
  }

  return Object.entries(domainCounts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);
}
