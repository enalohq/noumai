import type { TabKey } from "@/components/dashboard/types";

export const tabMeta: Record<TabKey, { title: string; tooltip: string; details: string }> = {
  "Prompts": {
    title: "Prompts",
    tooltip: "Manage your tracking prompt library.",
    details:
      "Build a library of prompts to track over time. Use {brand} to inject your brand name. Run individual prompts or batch-run all across selected models.",
  },
  "Persona Fan-Out": {
    title: "Persona Fan-Out",
    tooltip: "Create and run persona-specific prompt variants.",
    details:
      "Write one core query, define personas, and generate persona-specific variants. Run each variant independently to compare how different audience angles change model responses.",
  },
  "Prompt Explorer": {
    title: "Prompt Explorer",
    tooltip: "Generate high-intent GEO/AEO prompts/queries.",
    details:
      "Build a reusable bank of niche prompts focused on discoverability, citations, and buyer intent so your tracking set stays comprehensive.",
  },
  Automation: {
    title: "Automation",
    tooltip: "Configure recurring runs via cron/workflows.",
    details:
      "Store deployment-ready scheduling templates for Vercel Cron and GitHub Actions so tracking can run automatically on a repeat cadence.",
  },
  "Competitor Battlecards": {
    title: "Competitors",
    tooltip: "Compare model sentiment vs competitors.",
    details:
      "Generate side-by-side competitor summaries and sentiment snapshots. See which competitors are mentioned alongside your brand and identify gaps.",
  },
  Responses: {
    title: "Responses",
    tooltip: "Browse AI model responses with brand highlighting.",
    details:
      "Browse all collected AI responses. Brand and competitor mentions are highlighted in-context. View visibility scores, sentiment, and cited sources per response.",
  },
  "Visibility Analytics": {
    title: "Analytics",
    tooltip: "Track visibility score and sentiment trends over time.",
    details:
      "Monitor your brand visibility score over time, track sentiment distribution across responses, and export data as CSV for further analysis.",
  },
  Citations: {
    title: "Citations",
    tooltip: "Analyze cited sources grouped by domain.",
    details:
      "See which domains and URLs get cited most in AI responses. Group by domain to find citation hubs, or search by URL for specific sources. Export data as CSV.",
  },
  "Citation Opportunities": {
    title: "Citation Opportunities",
    tooltip: "Competitor-cited sources where you're not mentioned.",
    details:
      "Discover high-value outreach targets: URLs where AI models cite your competitors but don't mention your brand. Each opportunity includes an outreach brief.",
  },
  "AEO Audit": {
    title: "AEO Audit",
    tooltip: "Audit site readiness for LLM discovery.",
    details:
      "Run checks for llms.txt, schema signals, and BLUF-style clarity indicators to quickly assess AI-answer readiness.",
  },
  Documentation: {
    title: "Documentation",
    tooltip: "Learn about every feature in the tracker.",
    details:
      "A comprehensive guide to all tabs, features, scoring methodology, supported models, and data privacy. Searchable and browsable.",
  },
  "Settings": {
    title: "Settings",
    tooltip: "Set your brand, site, keywords, and context.",
    details:
      "Define the exact brand and website to track. This context is reused across analysis flows.",
  },
};
