import { test, expect } from "@playwright/test";
import { buildSession, SAMPLE_PROMPTS } from "./helpers/fixtures";
import {
  createOnboardingState,
  mockAuthSession,
  mockOnboardingApis,
  mockWorkspaces,
  mockRunsApi,
  mockPromptsApi,
  mockScrapeApi,
} from "./helpers/mocks";
import { gotoDashboard, selectTab } from "./helpers/dashboard";

test.describe("dashboard error handling", () => {
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
    await page.route("**/api/audit/history**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ history: [] }),
      }),
    );
  });

  test("API error on prompt run shows message and does not crash UI", async ({ page }) => {
    await mockScrapeApi(page, () => ({ status: 500, body: { error: "Scrape failed" } }));

    await gotoDashboard(page);
    await selectTab(page, "Prompts");
    await page.getByRole("button", { name: "Run" }).first().click();

    await expect(page.getByText(/All scrape requests failed/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Prompts" })).toBeVisible();
  });

  test("API error on audit shows message and does not crash UI", async ({ page }) => {
    await page.route("**/api/audit**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Audit failed" }),
      }),
    );

    await gotoDashboard(page);
    await selectTab(page, "AEO Audit");
    await page.getByRole("button", { name: /Run New Audit|Re-run Audit/i }).click();

    await expect(page.getByText("Audit failed")).toBeVisible();
    await expect(page.getByRole("heading", { name: "AEO Audit" })).toBeVisible();
  });
});

test.describe("error boundary", () => {
  test.use({ extraHTTPHeaders: { "x-e2e-auth-bypass": "1" } });

  test("renders fallback UI on component crash", async ({ page }) => {
    await page.goto("/e2e/error-boundary");
    await expect(page.getByText("Something went wrong")).toBeVisible();
    await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
  });
});
