export const TEST_USER = {
  id: "user-1",
  email: "test@noumai.ai",
  name: "Test User",
  image: null,
  onboardingCompleted: true,
};

export function buildSession(overrides: Partial<typeof TEST_USER> = {}) {
  const user = { ...TEST_USER, ...overrides };
  return {
    user,
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

export const SAMPLE_PROMPTS = [
  {
    id: "prompt-1",
    text: "What is {brand} known for in AI visibility?",
    label: null,
    isActive: true,
    schedule: "none",
    lastRunAt: null,
    createdAt: "2026-03-10T08:00:00.000Z",
    updatedAt: "2026-03-10T08:00:00.000Z",
  },
  {
    id: "prompt-2",
    text: "Compare {brand} with leading competitors in 2026.",
    label: "Comparison",
    isActive: true,
    schedule: "none",
    lastRunAt: null,
    createdAt: "2026-03-10T08:05:00.000Z",
    updatedAt: "2026-03-10T08:05:00.000Z",
  },
];

export const SAMPLE_RUNS = [
  {
    provider: "chatgpt",
    prompt: "What is NoumAI known for in AI visibility?",
    promptId: "prompt-1",
    answer: "NoumAI is known for AI visibility tracking with clear source citations.",
    sources: ["https://example.com/visibility-guide", "https://docs.noumai.ai/overview"],
    createdAt: "2026-03-10T10:00:00.000Z",
    visibilityScore: 72,
    sentiment: "positive",
    brandMentions: ["NoumAI"],
    competitorMentions: [],
  },
  {
    provider: "gemini",
    prompt: "Compare NoumAI with leading competitors in 2026.",
    promptId: "prompt-2",
    answer: "Alternatives include other platforms with different citation coverage.",
    sources: ["https://competitor.com/review", "https://example.com/market-report"],
    createdAt: "2026-03-09T12:00:00.000Z",
    visibilityScore: 20,
    sentiment: "not-mentioned",
    brandMentions: [],
    competitorMentions: ["CompetitorX"],
  },
];

export const SAMPLE_AUDIT_REPORT = {
  url: "https://noumai.ai",
  score: 78,
  checks: [
    {
      id: "llms",
      label: "llms.txt present",
      category: "discovery",
      pass: true,
      value: "Found",
      detail: "llms.txt is present at the root.",
    },
    {
      id: "schema",
      label: "Schema markup detected",
      category: "structure",
      pass: false,
      value: "Missing",
      detail: "No JSON-LD schema found on the homepage.",
    },
  ],
  llmsTxtPresent: true,
  schemaMentions: 1,
  blufDensity: 0.6,
  createdAt: "2026-03-10T09:00:00.000Z",
  pass: {
    llmsTxt: true,
    schema: false,
    bluf: true,
  },
};

export function buildAppState(overrides: Record<string, unknown> = {}) {
  const baseState = {
    brand: {
      brandName: "NoumAI",
      brandAliases: "",
      website: "https://noumai.ai",
      industry: "B2B SaaS",
      keywords: "ai visibility, aeo",
      description: "AI visibility tracking and citation analytics platform.",
    },
    provider: "chatgpt",
    activeProviders: ["chatgpt"],
    prompt: "What is the strongest value proposition for NoumAI in 2026?",
    customPrompts: [
      "How visible is {brand} versus competitors for enterprise AI analytics tools?",
      "What are the top reasons to choose {brand} based on trusted sources?",
    ],
    personas: "CMO\nSEO Lead\nFounder",
    fanoutPrompts: [],
    niche: "AI SEO tools for SaaS",
    nicheQueries: [],
    cronExpr: "0 */6 * * *",
    githubWorkflow: "name: noumai",
    competitors: [],
    battlecards: [],
    runs: [],
    auditReport: null,
    auditHistory: [],
    scheduleEnabled: false,
    scheduleIntervalMs: 21600000,
    lastScheduledRun: null,
    driftAlerts: [],
  };

  return {
    ...baseState,
    ...overrides,
    brand: { ...baseState.brand, ...(overrides as { brand?: Record<string, unknown> }).brand },
  };
}
