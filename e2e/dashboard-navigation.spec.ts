import { test, expect } from "@playwright/test";
import { SAMPLE_PROMPTS, buildSession } from "./helpers/fixtures";
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
    workspace: {
      brandName: "NoumAI",
      website: "https://noumai.ai",
    },
  }));
  await mockWorkspaces(page, [{ id: "ws-1", name: "Primary", brandName: "NoumAI" }]);
  await mockRunsApi(page, []);
  await mockPromptsApi(page, SAMPLE_PROMPTS);
  await mockAuditApis(page, { history: [] });
});

test("side navigation switches between tabs and updates the main header", async ({ page }) => {
  await gotoDashboard(page);
  await selectTab(page, "Prompts");
  await selectTab(page, "Documentation");
  await selectTab(page, "Settings");
});

test("documentation tab renders overview content", async ({ page }) => {
  await gotoDashboard(page);
  await selectTab(page, "Documentation");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
});

test("settings tab loads and accepts edits", async ({ page }) => {
  await gotoDashboard(page);
  await selectTab(page, "Settings");

  const brandInput = page.getByPlaceholder("Acme Corp");
  await brandInput.fill("Updated Brand");
  await expect(brandInput).toHaveValue("Updated Brand");

  const description = page.getByPlaceholder(/Brief description/i);
  await description.fill("We track AI visibility for modern brands.");
  await expect(description).toHaveValue("We track AI visibility for modern brands.");
});

test("prompt hub lists prompts and allows add/remove", async ({ page }) => {
  await gotoDashboard(page);
  await selectTab(page, "Prompts");

  await expect(page.getByText(/What is .* known for in AI visibility/)).toBeVisible();

  await page.getByPlaceholder(/Best alternatives/i).fill("How does NoumAI compare for AEO?");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("How does NoumAI compare for AEO?")).toBeVisible();

  const addedRow = page.getByText("How does NoumAI compare for AEO?").locator("xpath=ancestor::li[1]");
  await addedRow.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("How does NoumAI compare for AEO?")).not.toBeVisible();
});

test("AEO Audit tab renders and shows run action", async ({ page }) => {
  await gotoDashboard(page);
  await selectTab(page, "AEO Audit");
  await expect(page.getByRole("button", { name: /Run New Audit|Re-run Audit/i })).toBeVisible();
});
