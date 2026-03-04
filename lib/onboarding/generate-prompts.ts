/**
 * Pure function — generates contextual starter prompts from onboarding brand data.
 * No side effects, no I/O. Fully testable.
 *
 * Design principles:
 * - Every prompt uses {brand} placeholder so it works with the dashboard's interpolation
 * - Prompts are grouped by intent: visibility, comparison, sentiment, use-case, trust
 * - Industry-specific prompts are appended when industry is known
 * - Competitor-aware prompts are added when competitors are provided
 */

export interface PromptBrandContext {
  brandName: string;
  website?: string;
  industry?: string;
  description?: string;
  keywords?: string;
  competitors?: Array<{ name: string; type: string }>;
}

export interface GeneratedPrompt {
  text: string;
  category: "visibility" | "comparison" | "sentiment" | "use-case" | "trust" | "competitor";
  /** Whether this prompt was generated from competitor data */
  fromCompetitor?: boolean;
}

// Industry → tailored prompt fragments
const INDUSTRY_PROMPTS: Record<string, string[]> = {
  "SaaS / Software": [
    "What are the best {brand} alternatives for enterprise teams?",
    "How does {brand} compare to other SaaS tools for team productivity?",
    "Is {brand} worth it for a startup? What do AI models say?",
  ],
  "E-commerce / Retail": [
    "What do AI models recommend when someone asks about {brand} products?",
    "How is {brand} perceived compared to other online retailers?",
    "What are customers saying about {brand} shipping and returns?",
  ],
  "FinTech / Finance": [
    "Is {brand} a trusted financial platform according to AI models?",
    "How does {brand} compare to traditional banks and fintech competitors?",
    "What compliance and security features does {brand} offer?",
  ],
  "HealthTech / Healthcare": [
    "Is {brand} recommended by AI models for healthcare professionals?",
    "How does {brand} handle patient data privacy?",
    "What clinical use cases is {brand} best suited for?",
  ],
  "EdTech / Education": [
    "What learning outcomes does {brand} support according to AI models?",
    "How does {brand} compare to other online learning platforms?",
    "Is {brand} suitable for corporate training programs?",
  ],
  "Marketing / Advertising": [
    "What AI models say about {brand} as a marketing platform?",
    "How does {brand} compare to other marketing automation tools?",
    "What ROI can marketers expect from {brand}?",
  ],
  "Legal / Compliance": [
    "Is {brand} recommended for legal research and compliance?",
    "How does {brand} handle data privacy and regulatory requirements?",
    "What law firms or legal teams use {brand}?",
  ],
  "Real Estate": [
    "How does {brand} help buyers and sellers in the real estate market?",
    "What do AI models say about {brand} for property investment?",
    "How does {brand} compare to other real estate platforms?",
  ],
  "Travel / Hospitality": [
    "What do AI models recommend about {brand} for travel planning?",
    "How does {brand} compare to other travel booking platforms?",
    "What is the customer experience like with {brand}?",
  ],
  "Consulting / Professional Services": [
    "What expertise is {brand} known for according to AI models?",
    "How does {brand} compare to other consulting firms in this space?",
    "What results have clients achieved working with {brand}?",
  ],
};

// Universal prompts that work for any brand
const UNIVERSAL_PROMPTS: GeneratedPrompt[] = [
  {
    text: "What is {brand} and what problem does it solve?",
    category: "visibility",
  },
  {
    text: "Is {brand} mentioned when AI models answer questions about its category?",
    category: "visibility",
  },
  {
    text: "What are the top reasons to choose {brand} over alternatives?",
    category: "use-case",
  },
  {
    text: "What do experts and trusted sources say about {brand}?",
    category: "trust",
  },
  {
    text: "What are the strengths and weaknesses of {brand} according to AI models?",
    category: "sentiment",
  },
  {
    text: "Who is {brand} best suited for and why?",
    category: "use-case",
  },
  {
    text: "How has {brand} evolved and what makes it stand out today?",
    category: "visibility",
  },
];

export function generateStarterPrompts(ctx: PromptBrandContext): GeneratedPrompt[] {
  const prompts: GeneratedPrompt[] = [...UNIVERSAL_PROMPTS];

  // Keyword-aware prompts
  if (ctx.keywords?.trim()) {
    const kws = ctx.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 3);

    for (const kw of kws) {
      prompts.push({
        text: `When someone asks about "${kw}", does {brand} appear in AI model responses?`,
        category: "visibility",
      });
    }
  }

  // Industry-specific prompts
  if (ctx.industry) {
    const industryTemplates = INDUSTRY_PROMPTS[ctx.industry];
    if (industryTemplates) {
      for (const text of industryTemplates) {
        prompts.push({ text, category: "use-case" });
      }
    }
  }

  // Competitor-aware prompts
  const directCompetitors = (ctx.competitors ?? [])
    .filter((c) => c.type === "direct" && c.name?.trim())
    .slice(0, 3);

  for (const comp of directCompetitors) {
    prompts.push({
      text: `How does {brand} compare to ${comp.name}?`,
      category: "competitor",
      fromCompetitor: true,
    });
    prompts.push({
      text: `What are the key differences between {brand} and ${comp.name}?`,
      category: "competitor",
      fromCompetitor: true,
    });
  }

  const indirectCompetitors = (ctx.competitors ?? [])
    .filter((c) => c.type === "indirect" && c.name?.trim())
    .slice(0, 2);

  for (const comp of indirectCompetitors) {
    prompts.push({
      text: `Is {brand} a good alternative to ${comp.name}?`,
      category: "comparison",
      fromCompetitor: true,
    });
  }

  // Deduplicate by text
  const seen = new Set<string>();
  return prompts.filter((p) => {
    if (seen.has(p.text)) return false;
    seen.add(p.text);
    return true;
  });
}
