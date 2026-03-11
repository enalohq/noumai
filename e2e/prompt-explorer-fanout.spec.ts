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
  mockAnalyzeApi,
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

test("prompt explorer generates niche queries and allows adding to prompts", async ({ page }) => {
  await mockAnalyzeApi(page, {
    text: "1. best AI visibility tools for SaaS teams\n2. compare AEO platforms with sources",
  });

  await gotoDashboard(page);
  await selectTab(page, "Prompt Explorer");

  await page.getByPlaceholder(/AI marketing tools/i).fill("AI visibility tools for SaaS");
  await page.getByRole("button", { name: "Generate Prompts" }).click();

  await expect(page.getByText("best AI visibility tools for SaaS teams")).toBeVisible();

  await page.getByRole("button", { name: "+ Track", exact: true }).first().click();

  await selectTab(page, "Prompts");
  await expect(page.getByText("best AI visibility tools for SaaS teams")).toBeVisible();
});

test("persona fan-out generates variants and displays them", async ({ page }) => {
  await gotoDashboard(page);
  await selectTab(page, "Persona Fan-Out");

  await page.getByRole("button", { name: "Generate Persona Fan-Out" }).click();
  await expect(page.getByText("Fan-Out Queue")).toBeVisible();
  await expect(page.getByText(/CMO:/i)).toBeVisible();
});
