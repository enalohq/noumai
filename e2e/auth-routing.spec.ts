import { test, expect } from "@playwright/test";
import { buildSession } from "./helpers/fixtures";
import {
  createOnboardingState,
  mockAuthSession,
  mockAuthSignOut,
  mockOnboardingApis,
  mockWorkspaces,
  mockRunsApi,
  mockPromptsApi,
  mockAuditApis,
} from "./helpers/mocks";

test("unauthenticated user hitting / redirects to /auth/signin when demo mode is disabled", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL("**/auth/signin**");
});

test.describe("authenticated routing", () => {
  test.use({ extraHTTPHeaders: { "x-e2e-auth-bypass": "1" } });

  test("authenticated user with onboarding incomplete is redirected to /onboarding", async ({ page }) => {
    await mockAuthSession(page, buildSession({ onboardingCompleted: false }));
    await mockOnboardingApis(page, createOnboardingState({ onboardingCompleted: false, currentStep: 0 }));
    await page.goto("/");
    await page.waitForURL("**/onboarding");
    await expect(page.getByRole("heading", { name: "Your Brand" })).toBeVisible();
  });

  test("authenticated user with onboarding complete lands on the dashboard", async ({ page }) => {
    await mockAuthSession(page, buildSession({ onboardingCompleted: true }));
    await mockOnboardingApis(page, createOnboardingState({ onboardingCompleted: true, currentStep: 5 }));
    await mockWorkspaces(page, [{ id: "ws-1", name: "Primary", brandName: "NoumAI" }]);
    await mockRunsApi(page, []);
    await mockPromptsApi(page, []);
    await mockAuditApis(page, { history: [] });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "AEO Audit" })).toBeVisible();
  });

  test("stale session triggers sign-out and redirects to /auth/signin", async ({ page }) => {
    await mockAuthSession(page, buildSession({ onboardingCompleted: true }));
    await mockAuthSignOut(page);
    await page.route("**/api/auth/csrf", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ csrfToken: "test-token" }),
      }),
    );

    await page.route("**/api/onboarding", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unauthorized" }),
      }),
    );

    await page.goto("/");
    await page.waitForURL("**/auth/signin**");
  });

  test("demo mode loads dashboard without auth", async ({ page }) => {
    await mockAuthSession(page, null);
    await page.goto("/demo");
    await expect(page.getByText("Read-only demo")).toBeVisible();
  });
});
