import { test, expect } from "@playwright/test";
import { buildSession, SAMPLE_PROMPTS, SAMPLE_RUNS } from "./helpers/fixtures";
import {
  createOnboardingState,
  mockAuthSession,
  mockOnboardingApis,
  mockWorkspaces,
  mockRunsApi,
  mockPromptsApi,
  mockAuditApis,
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
  await mockRunsApi(page, SAMPLE_RUNS);
  await mockPromptsApi(page, SAMPLE_PROMPTS);
  await mockAuditApis(page, { history: [] });
});

test("visibility analytics renders charts and export actions", async ({ page }) => {
  await gotoDashboard(page);
  await selectTab(page, "Visibility Analytics");

  await expect(page.getByText("Avg Visibility")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export All Runs (CSV)" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Export Trend Data (CSV)" })).toBeEnabled();
});

test("citations tab renders domain list and counts", async ({ page }) => {
  await gotoDashboard(page);
  await selectTab(page, "Citations");

  await expect(page.getByText("Domains")).toBeVisible();
  await expect(page.getByText("Citations")).toBeVisible();
  await expect(page.getByText("example.com")).toBeVisible();
});

test("citation opportunities tab renders opportunities list and counts", async ({ page }) => {
  await gotoDashboard(page);
  await selectTab(page, "Citation Opportunities");

  await expect(page.getByText("Opportunities")).toBeVisible();
  await expect(page.getByText("competitor.com")).toBeVisible();
});
