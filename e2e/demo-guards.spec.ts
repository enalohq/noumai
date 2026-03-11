import { test, expect } from "@playwright/test";
import { gotoDemo, selectTab } from "./helpers/dashboard";
import { mockAuthSession } from "./helpers/mocks";

test("demo mode shows read-only message", async ({ page }) => {
  await mockAuthSession(page, null);
  await gotoDemo(page);
  await expect(page.getByText("Read-only demo")).toBeVisible();
  await expect(page.getByText(/read-only demo/i)).toBeVisible();
});

test("demo mode blocks API calls for prompt runs", async ({ page }) => {
  await mockAuthSession(page, null);
  let scrapeCalls = 0;
  await page.route("**/api/scrape**", async (route) => {
    scrapeCalls += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await gotoDemo(page);
  await selectTab(page, "Prompts");

  await page.getByRole("button", { name: "Run" }).first().click();
  await page.waitForTimeout(300);

  expect(scrapeCalls).toBe(0);
});

test("demo mode blocks audit runs", async ({ page }) => {
  await mockAuthSession(page, null);
  let auditCalls = 0;
  await page.route("**/api/audit**", async (route) => {
    auditCalls += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await gotoDemo(page);
  await selectTab(page, "AEO Audit");

  await page.getByRole("button", { name: /Run New Audit|Re-run Audit|Start First Audit/i }).click();
  await expect(page.getByText(/Demo mode/i)).toBeVisible();
  expect(auditCalls).toBe(0);
});

test("demo mode blocks data mutation API calls", async ({ page }) => {
  await mockAuthSession(page, null);
  let promptCalls = 0;
  await page.route("**/api/prompts**", async (route) => {
    promptCalls += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await gotoDemo(page);
  await selectTab(page, "Prompts");

  await page.getByPlaceholder(/Best alternatives/i).fill("Add this in demo mode");
  await page.getByRole("button", { name: "Add" }).click();
  await page.waitForTimeout(200);

  expect(promptCalls).toBe(0);
});
