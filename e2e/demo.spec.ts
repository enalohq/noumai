import { test, expect } from "@playwright/test";
import { gotoDemo } from "./helpers/dashboard";
import { mockAuthSession } from "./helpers/mocks";

test("demo dashboard loads in read-only mode", async ({ page }) => {
  await mockAuthSession(page, null);
  await gotoDemo(page);
  await expect(page.getByText("Read-only demo")).toBeVisible();
});
