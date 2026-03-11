import { expect, type Page } from "@playwright/test";

export async function gotoDemo(page: Page) {
  await page.goto("/demo");
  await expect(page.getByText("Read-only demo")).toBeVisible();
}

export async function gotoDashboard(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "AEO Audit" })).toBeVisible();
}

export async function gotoOnboarding(page: Page) {
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Your Brand" })).toBeVisible();
}

export async function selectTab(page: Page, tabName: string) {
  await page.getByRole("button", { name: tabName, exact: true }).click();
  await expect(page.getByRole("heading", { name: tabName })).toBeVisible();
}

export async function expectStatusMessage(page: Page, text: RegExp | string) {
  await expect(page.getByText(text)).toBeVisible();
}
