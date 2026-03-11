import { test, expect } from "@playwright/test";
import { buildSession, SAMPLE_PROMPTS } from "./helpers/fixtures";
import {
  createOnboardingState,
  mockAuthSession,
  mockOnboardingApis,
  mockWorkspaces,
  mockRunsApi,
  mockPromptsApi,
  mockAuditApis,
  mockScrapeApi,
} from "./helpers/mocks";
import { gotoDashboard, selectTab } from "./helpers/dashboard";

test.use({ extraHTTPHeaders: { "x-e2e-auth-bypass": "1" } });

test.beforeEach(async ({ page }) => {
  await mockAuthSession(page, buildSession({ onboardingCompleted: true }));
  await mockOnboardingApis(page, createOnboardingState({
    onboardingCompleted: true,
    workspace: { brandName: "NoumAI", website: "https://noumai.ai" },
  }));
  await mockWorkspaces(page, [{ id: "ws-1", name: "Primary", brandName: "NoumAI" }]);
  await mockRunsApi(page, []);
  await mockPromptsApi(page, SAMPLE_PROMPTS);
  await mockAuditApis(page, { history: [] });
});

test("run a single prompt across one provider and update progress + history", async ({ page }) => {
  await mockScrapeApi(page, async (body) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return {
      body: {
        provider: body.provider,
        prompt: body.prompt,
        answer: `Answer for ${body.prompt}`,
        sources: ["https://example.com/source1"],
        createdAt: new Date().toISOString(),
      },
    };
  });

  await gotoDashboard(page);
  await selectTab(page, "Prompts");

  await page.getByRole("button", { name: "Run" }).first().click();
  await expect(page.getByText(/Scraping AI models/i)).toBeVisible();
  await expect(page.getByText(/Done: 1\/1 model returned results/i)).toBeVisible();

  const totalRunsCard = page.getByText("Total Runs").locator("xpath=../..");
  await expect(totalRunsCard).toContainText("1");

  await selectTab(page, "Responses");
  await expect(page.getByText(/What is .* known for in AI visibility/)).toBeVisible();
});

test("run all prompts across multiple providers and confirm completion status", async ({ page }) => {
  await mockScrapeApi(page, async (body) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      body: {
        provider: body.provider,
        prompt: body.prompt,
        answer: `Batch answer for ${body.prompt}`,
        sources: ["https://example.com/source2"],
        createdAt: new Date().toISOString(),
      },
    };
  });

  await gotoDashboard(page);
  await page.getByRole("button", { name: "Gemini" }).click();

  await selectTab(page, "Prompts");
  await page.getByRole("button", { name: /Run All/i }).click();

  await expect(page.getByText(/Batch complete:/i)).toBeVisible();
});
