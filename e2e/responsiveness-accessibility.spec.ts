import { test, expect } from "@playwright/test";
import { mockAuthSession } from "./helpers/mocks";
test("dashboard renders on mobile viewport without horizontal overflow", async ({ page }) => {
  await mockAuthSession(page, null);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "AEO Audit" })).toBeVisible();

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 2);
});

test("keyboard navigation reaches main controls", async ({ page }) => {
  await mockAuthSession(page, null);
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "AEO Audit" })).toBeVisible();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  const active = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return null;
    return {
      tag: el.tagName,
      text: el.textContent?.trim() ?? "",
      aria: el.getAttribute("aria-label") ?? "",
    };
  });

  expect(active).not.toBeNull();
  expect(["BUTTON", "INPUT", "TEXTAREA", "A"].includes(active!.tag)).toBeTruthy();
  expect((active!.text || active!.aria).length).toBeGreaterThan(0);
});
