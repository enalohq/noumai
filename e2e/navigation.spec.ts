import { test } from "@playwright/test";
import { gotoDemo, selectTab } from "./helpers/dashboard";
import { mockAuthSession } from "./helpers/mocks";

test("navigate between key dashboard tabs", async ({ page }) => {
  await mockAuthSession(page, null);
  await gotoDemo(page);

  await selectTab(page, "Prompts");
  await selectTab(page, "Documentation");
  await selectTab(page, "AEO Audit");
});
