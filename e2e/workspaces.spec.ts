import { test, expect } from "@playwright/test";
import { buildSession, buildAppState, SAMPLE_PROMPTS } from "./helpers/fixtures";
import {
  createOnboardingState,
  mockAuthSession,
  mockOnboardingApis,
  mockWorkspaces,
  mockRunsApi,
  mockPromptsApi,
  mockAuditApis,
} from "./helpers/mocks";
import { gotoDashboard } from "./helpers/dashboard";

test.use({ extraHTTPHeaders: { "x-e2e-auth-bypass": "1" } });

test("workspaces load, switch, and persist across reloads", async ({ page }) => {
  const email = "test@noumai.ai";
  const prefix = `noumai-v1-${email.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const alphaKey = `${prefix}-ws-alpha`;
  const betaKey = `${prefix}-ws-beta`;

  const alphaState = buildAppState({ brand: { brandName: "Alpha Co" } });
  const betaState = buildAppState({ brand: { brandName: "Beta Co" } });

  await page.addInitScript(({ alphaKey, betaKey, alphaState, betaState }) => {
    window.sessionStorage.setItem(alphaKey, alphaState);
    window.sessionStorage.setItem(betaKey, betaState);
  }, {
    alphaKey,
    betaKey,
    alphaState: JSON.stringify(alphaState),
    betaState: JSON.stringify(betaState),
  });

  await mockAuthSession(page, buildSession({ onboardingCompleted: true, email }));
  await mockOnboardingApis(page, createOnboardingState({
    onboardingCompleted: true,
    workspace: { brandName: "Alpha Co", website: "https://alpha.example" },
  }));
  await mockWorkspaces(page, [
    { id: "ws-alpha", name: "Alpha", brandName: "Alpha" },
    { id: "ws-beta", name: "Beta", brandName: "Beta" },
  ]);
  await mockRunsApi(page, []);
  await mockPromptsApi(page, SAMPLE_PROMPTS);
  await mockAuditApis(page, { history: [] });

  await gotoDashboard(page);
  const sidebar = page.locator("aside");
  await expect(sidebar.getByText("Alpha Co")).toBeVisible();

  await sidebar.getByRole("button").first().click();
  await expect(page.getByText("Alpha")).toBeVisible();
  await expect(page.getByText("Beta")).toBeVisible();

  await page.getByRole("button", { name: "Beta" }).click();
  await expect(sidebar.getByText("Beta Co")).toBeVisible();
  await expect(page.getByText(/Switched to Beta/i)).toBeVisible();

  const activeWorkspace = await page.evaluate(() => window.sessionStorage.getItem("noumai-active-workspace"));
  expect(activeWorkspace).toBe("ws-beta");

  await page.reload();
  await expect(page.locator("aside").getByText("Beta Co")).toBeVisible();
});
