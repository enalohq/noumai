import { tabs } from "@/components/dashboard/types";

describe("Dashboard Tabs Configuration", () => {
  it("has AEO Audit as the first tab for priority visibility", () => {
    // Ensuring the refactoring correctly moved AEO Audit to the top
    expect(tabs[0]).toBe("AEO Audit");
  });

  it("maintains Competitor Battlecards as the second tab", () => {
    expect(tabs[1]).toBe("Competitor Battlecards");
  });

  it("contains exactly 12 tabs", () => {
    expect(tabs).toHaveLength(12);
  });
});
