import { test, expect } from "@playwright/test";
import { buildSession, SAMPLE_PROMPTS } from "./helpers/fixtures";
import {
  createOnboardingState,
  mockAuthSession,
  mockOnboardingApis,
  mockScrapeMetadata,
  mockCompetitorDiscovery,
  mockKeywordSuggestions,
  mockWorkspaces,
  mockRunsApi,
  mockPromptsApi,
  mockAuditApis,
} from "./helpers/mocks";
import { gotoOnboarding } from "./helpers/dashboard";

test.use({ extraHTTPHeaders: { "x-e2e-auth-bypass": "1" } });

test.beforeEach(async ({ page }) => {
  await mockAuthSession(page, buildSession({ onboardingCompleted: false }));
});

test("brand step validates URL protocol and auto-fills metadata", async ({ page }) => {
  const onboarding = createOnboardingState();
  await mockOnboardingApis(page, onboarding);
  await mockScrapeMetadata(page, (url) => {
    if (url.includes("fail")) {
      return { status: 500, body: { error: "Failed" } };
    }
    return {
      body: {
        brandName: "Acme Corp",
        twitterHandle: "acmehq",
        linkedinHandle: "https://linkedin.com/company/acme",
        country: "India",
      },
    };
  });

  await gotoOnboarding(page);

  await page.getByRole("button", { name: /Continue/i }).click();
  await expect(page.getByText("Brand name and website are required.")).toBeVisible();

  const websiteInput = page.getByLabel(/Website URL/i);
  await websiteInput.fill("example.com");
  await expect(page.getByText("URL must start with http:// or https://")).toBeVisible();

  await websiteInput.fill("https://fail.example");
  await page.waitForResponse((resp) => resp.url().includes("/api/scrape-metadata") && resp.status() === 500);
  await expect(page.getByText("Could not fetch website data")).toBeVisible();

  await websiteInput.fill("https://acme.com");
  await page.waitForResponse((resp) => resp.url().includes("/api/scrape-metadata") && resp.status() === 200);

  await expect(page.locator("#brandName")).toHaveValue("Acme Corp");
  await page.getByRole("button", { name: "Brand Social Link" }).click();
  await expect(page.locator("#twitterHandle")).toHaveValue("acmehq");
  await expect(page.locator("#linkedinHandle")).toHaveValue("https://linkedin.com/company/acme");
  await expect(page.locator("#country")).toHaveValue("India");
});

test("brand step preserves manual edits when metadata runs", async ({ page }) => {
  const onboarding = createOnboardingState();
  await mockOnboardingApis(page, onboarding);
  await mockScrapeMetadata(page, () => ({
    body: {
      brandName: "Auto Brand",
      twitterHandle: "autohandle",
      linkedinHandle: "https://linkedin.com/company/auto",
      country: "India",
    },
  }));

  await gotoOnboarding(page);

  await page.locator("#brandName").fill("Manual Brand");
  await page.getByRole("button", { name: "Brand Social Link" }).click();
  await page.locator("#twitterHandle").fill("manualhandle");

  await page.getByLabel(/Website URL/i).fill("https://manual.example");
  await page.waitForResponse((resp) => resp.url().includes("/api/scrape-metadata"));

  await expect(page.locator("#brandName")).toHaveValue("Manual Brand");
  await expect(page.locator("#twitterHandle")).toHaveValue("manualhandle");
  await expect(page.locator("#linkedinHandle")).toHaveValue("https://linkedin.com/company/auto");
});

test("market and keyword steps enforce required fields", async ({ page }) => {
  const onboarding = createOnboardingState({
    currentStep: 1,
    workspace: {
      brandName: "Acme Corp",
      website: "https://acme.com",
      country: "India",
    },
  });
  await mockOnboardingApis(page, onboarding);
  await mockKeywordSuggestions(page, ["acme analytics", "ai visibility"]);

  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Your Market" })).toBeVisible();

  await page.getByRole("button", { name: /Continue/i }).click();
  await expect(page.getByText("Industry and brand description are required.")).toBeVisible();

  await page.getByLabel(/Industry \/ Vertical/i).selectOption("SaaS / Software");
  await page.getByLabel(/Brand Description/i).fill("We help teams track AI visibility.");
  await page.getByRole("button", { name: /Continue/i }).click();

  await expect(page.getByRole("heading", { name: "Track Competitors" })).toBeVisible();
  await page.getByRole("button", { name: /Continue/i }).click();

  await expect(page.getByRole("heading", { name: "Track Keywords" })).toBeVisible();
  await page.getByRole("button", { name: /Continue/i }).click();
  await expect(page.getByText("Please enter at least one target keyword to track.")).toBeVisible();
});

test("competitor step adds, removes, and deduplicates competitors", async ({ page }) => {
  const onboarding = createOnboardingState({
    currentStep: 2,
    workspace: {
      brandName: "Acme Corp",
      website: "https://acme.com",
      country: "India",
    },
  });
  await mockOnboardingApis(page, onboarding);
  await mockCompetitorDiscovery(page, [
    { name: "RivalOne", url: "https://rivalone.com", type: "direct", confidence: 0.9 },
  ]);

  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Track Competitors" })).toBeVisible();

  await expect(page.getByText("RivalOne")).toBeVisible();
  await page.getByText("RivalOne").click();
  await expect(page.getByText(/Manual Competitors \(1\)/)).toBeVisible();

  await page.getByRole("button", { name: "+ Add competitor" }).click();
  await page.locator("#competitorName").fill("RivalTwo");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(/Manual Competitors \(2\)/)).toBeVisible();

  await page.getByRole("button", { name: "+ Add competitor" }).click();
  await page.locator("#competitorName").fill("RivalTwo");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(/Manual Competitors \(2\)/)).toBeVisible();

  const rivalRow = page.getByText("RivalTwo").locator("xpath=..");
  await rivalRow.locator("button").click();
  await expect(page.getByText(/Manual Competitors \(1\)/)).toBeVisible();
});

test("prompts step saves and completing onboarding redirects to dashboard", async ({ page }) => {
  const onboarding = createOnboardingState({
    currentStep: 4,
    suggestedPrompts: [
      { text: "How visible is {brand} in AI responses?", category: "visibility" },
      { text: "Which AI models cite {brand}?", category: "trust" },
    ],
  });

  await mockOnboardingApis(page, onboarding);
  await mockWorkspaces(page, [{ id: "ws-1", name: "Primary", brandName: "NoumAI" }]);
  await mockRunsApi(page, []);
  await mockPromptsApi(page, SAMPLE_PROMPTS);
  await mockAuditApis(page, { history: [] });

  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Starter Prompts" })).toBeVisible();

  await page.getByRole("button", { name: /Finish setup/i }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.getByRole("heading", { name: "AEO Audit" })).toBeVisible();
});
