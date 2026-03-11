import type { Page, Route, Request } from "@playwright/test";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

async function fulfillJson(route: Route, data: JsonValue, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  });
}

export async function mockAuthSession(page: Page, session: JsonValue | null) {
  await page.route("**/api/auth/session**", (route) => fulfillJson(route, session));
}

export async function mockAuthSignOut(page: Page) {
  await page.route("**/api/auth/signout**", (route) => fulfillJson(route, {}));
}

export type OnboardingState = {
  currentStep: number;
  onboardingCompleted: boolean;
  workspace: Record<string, JsonValue>;
  suggestedPrompts: Array<{ text: string; category: string }>;
  savedStarterPrompts: string[];
  autoFillMarket?: { industry: string; brandDescription: string } | null;
};

export function createOnboardingState(overrides: Partial<OnboardingState> = {}): OnboardingState {
  const base: OnboardingState = {
    currentStep: 0,
    onboardingCompleted: false,
    workspace: {
      brandName: "",
      brandAliases: "",
      website: "",
      twitterHandle: "",
      linkedinHandle: "",
      country: "",
      industry: "",
      brandDescription: "",
      targetKeywords: "",
      competitors: [],
    },
    suggestedPrompts: [
      { text: "What are the best AI visibility tracking tools in 2026?", category: "visibility" },
      { text: "Compare {brand} to its top competitors.", category: "comparison" },
    ],
    savedStarterPrompts: [],
    autoFillMarket: null,
  };

  return {
    ...base,
    ...overrides,
    workspace: { ...base.workspace, ...(overrides.workspace ?? {}) },
    suggestedPrompts: overrides.suggestedPrompts ?? base.suggestedPrompts,
    savedStarterPrompts: overrides.savedStarterPrompts ?? base.savedStarterPrompts,
    autoFillMarket: overrides.autoFillMarket ?? base.autoFillMarket,
  };
}

export async function mockOnboardingApis(page: Page, state: OnboardingState) {
  await page.route("**/api/onboarding**", async (route, request) => {
    if (request.method() === "GET") {
      await fulfillJson(route, {
        currentStep: state.currentStep,
        onboardingCompleted: state.onboardingCompleted,
        workspace: state.workspace,
        suggestedPrompts: state.suggestedPrompts,
        savedStarterPrompts: state.savedStarterPrompts,
      });
      return;
    }

    if (request.method() === "PATCH") {
      const body = (request.postDataJSON?.() ?? {}) as Record<string, JsonValue>;
      if (body.skip) {
        state.onboardingCompleted = true;
        await fulfillJson(route, { ok: true });
        return;
      }

      const step = Number(body.step ?? 0);
      if (step) state.currentStep = step;

      if (step === 1) {
        state.workspace = {
          ...state.workspace,
          brandName: String(body.brandName ?? state.workspace.brandName),
          brandAliases: String(body.brandAliases ?? state.workspace.brandAliases),
          website: String(body.website ?? state.workspace.website),
          twitterHandle: String(body.twitterHandle ?? state.workspace.twitterHandle),
          linkedinHandle: String(body.linkedinHandle ?? state.workspace.linkedinHandle),
          country: String(body.country ?? state.workspace.country),
        };
      }

      if (step === 2) {
        const nextIndustry = body.industry ? String(body.industry) : undefined;
        const nextDescription = body.brandDescription ? String(body.brandDescription) : undefined;

        state.workspace = {
          ...state.workspace,
          brandName: String(body.brandName ?? state.workspace.brandName),
          brandAliases: String(body.brandAliases ?? state.workspace.brandAliases),
          website: String(body.website ?? state.workspace.website),
          country: String(body.country ?? state.workspace.country),
          industry: nextIndustry ?? state.workspace.industry,
          brandDescription: nextDescription ?? state.workspace.brandDescription,
        };

        if (!nextIndustry && !nextDescription && state.autoFillMarket) {
          state.workspace = {
            ...state.workspace,
            industry: state.autoFillMarket.industry,
            brandDescription: state.autoFillMarket.brandDescription,
          };
        }
      }

      if (step === 3) {
        state.workspace = {
          ...state.workspace,
          competitors: (body.competitors as JsonValue) ?? state.workspace.competitors,
        };
      }

      if (step === 4) {
        state.workspace = {
          ...state.workspace,
          targetKeywords: String(body.targetKeywords ?? state.workspace.targetKeywords),
        };
      }

      if (step === 5) {
        const prompts = Array.isArray(body.prompts) ? body.prompts.map(String) : [];
        state.savedStarterPrompts = prompts;
        state.onboardingCompleted = true;
      }

      await fulfillJson(route, { ok: true });
      return;
    }

    await fulfillJson(route, { error: "Method not allowed" }, 405);
  });
}

export async function mockScrapeMetadata(
  page: Page,
  resolver: (url: string) => { status?: number; body: JsonValue },
) {
  await page.route("**/api/scrape-metadata**", async (route, request) => {
    const urlParam = new URL(request.url()).searchParams.get("url") ?? "";
    const decoded = decodeURIComponent(urlParam);
    const result = resolver(decoded);
    await fulfillJson(route, result.body, result.status ?? 200);
  });
}

export async function mockCompetitorDiscovery(page: Page, competitors: JsonValue) {
  await page.route("**/api/competitors/discover**", (route) =>
    fulfillJson(route, { competitors }),
  );
}

export async function mockKeywordSuggestions(page: Page, suggestions: string[]) {
  await page.route("**/api/onboarding/suggest-keywords**", (route) =>
    fulfillJson(route, { suggestions }),
  );
}

export async function mockWorkspaces(page: Page, workspaces: Array<{ id: string; name: string; brandName?: string }>) {
  await page.route("**/api/workspaces**", (route) => fulfillJson(route, { workspaces }));
}

export async function mockRunsApi(page: Page, initialRuns: JsonValue[] = []) {
  const runs = [...initialRuns];
  await page.route("**/api/runs**", async (route, request) => {
    if (request.method() === "GET") {
      await fulfillJson(route, { runs });
      return;
    }
    if (request.method() === "POST") {
      const body = (request.postDataJSON?.() ?? {}) as Record<string, JsonValue>;
      const created = { ...body, createdAt: String(body.createdAt ?? new Date().toISOString()) };
      runs.unshift(created);
      await fulfillJson(route, created);
      return;
    }
    await fulfillJson(route, { error: "Method not allowed" }, 405);
  });
}

export async function mockPromptsApi(page: Page, initialPrompts: JsonValue[] = []) {
  let prompts = [...initialPrompts];

  await page.route("**/api/prompts**", async (route, request) => {
    const url = new URL(request.url());
    const isRoot = url.pathname === "/api/prompts";

    if (request.method() === "GET" && isRoot) {
      await fulfillJson(route, { prompts });
      return;
    }

    if (request.method() === "POST" && isRoot) {
      const body = (request.postDataJSON?.() ?? {}) as Record<string, JsonValue>;
      const now = new Date().toISOString();
      const created = {
        id: `prompt-${Date.now()}`,
        text: String(body.text ?? ""),
        label: body.label ?? null,
        isActive: true,
        schedule: "none",
        lastRunAt: null,
        createdAt: now,
        updatedAt: now,
      };
      prompts = [created, ...prompts];
      await fulfillJson(route, created);
      return;
    }

    if (!isRoot) {
      const id = url.pathname.split("/").pop() ?? "";
      if (request.method() === "PATCH") {
        const body = (request.postDataJSON?.() ?? {}) as Record<string, JsonValue>;
        prompts = prompts.map((p) =>
          (p as Record<string, JsonValue>).id === id
            ? { ...(p as Record<string, JsonValue>), ...body, updatedAt: new Date().toISOString() }
            : p,
        );
        const updated = prompts.find((p) => (p as Record<string, JsonValue>).id === id) ?? null;
        await fulfillJson(route, updated ?? { error: "Not found" }, updated ? 200 : 404);
        return;
      }
      if (request.method() === "DELETE") {
        prompts = prompts.filter((p) => (p as Record<string, JsonValue>).id !== id);
        await fulfillJson(route, { ok: true });
        return;
      }
    }

    await fulfillJson(route, { error: "Method not allowed" }, 405);
  });
}

export async function mockAuditApis(page: Page, options: { history?: JsonValue[]; report?: JsonValue; shouldFail?: boolean }) {
  const history = options.history ?? [];
  const report = options.report ?? null;

  await page.route("**/api/audit/history**", (route) => fulfillJson(route, { history }));

  await page.route("**/api/audit**", (route, request) => {
    if (request.method() !== "POST") {
      return fulfillJson(route, { error: "Method not allowed" }, 405);
    }
    if (options.shouldFail) {
      return fulfillJson(route, { error: "Audit failed" }, 500);
    }
    return fulfillJson(route, report ?? { error: "No report" }, report ? 200 : 500);
  });
}

export async function mockAnalyzeApi(page: Page, payload: JsonValue) {
  await page.route("**/api/analyze**", (route) => fulfillJson(route, payload));
}

export async function mockScrapeApi(
  page: Page,
  responder: (body: Record<string, JsonValue>) => Promise<{ status?: number; body: JsonValue }> | { status?: number; body: JsonValue },
) {
  await page.route("**/api/scrape**", async (route, request) => {
    const body = (request.postDataJSON?.() ?? {}) as Record<string, JsonValue>;
    const result = await responder(body);
    await fulfillJson(route, result.body, result.status ?? 200);
  });
}
