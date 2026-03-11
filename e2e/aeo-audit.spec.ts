import { test, expect } from "@playwright/test";
import { buildSession, SAMPLE_PROMPTS, SAMPLE_AUDIT_REPORT } from "./helpers/fixtures";
import {
  createOnboardingState,
  mockAuthSession,
  mockOnboardingApis,
  mockWorkspaces,
  mockRunsApi,
  mockPromptsApi,
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
  await page.route("**/api/audit/history**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ history: [] }),
    }),
  );
});

test("audit starts, shows progress, and renders report", async ({ page }) => {
  await page.route("**/api/audit**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(SAMPLE_AUDIT_REPORT),
    });
  });

  await gotoDashboard(page);
  await selectTab(page, "AEO Audit");

  const runButton = page.getByRole("button", { name: /Run New Audit|Re-run Audit/i });
  await runButton.click();
  await expect(page.getByText(/Running AEO audit/i)).toBeVisible();
  await expect(page.getByText("Audit complete.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "AEO Readiness Score" })).toBeVisible();
});

test("audit error shows a user-facing error message", async ({ page }) => {
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
