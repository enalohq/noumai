import { getTimeAgo } from "../../../lib/client/utils";

describe("getTimeAgo", () => {
  let originalDate: number;

  beforeAll(() => {
    // Lock the system time for predictable tests
    originalDate = Date.now();
  });

  afterAll(() => {
    // Restore original Date behavior (if we mocked it fully, but simpler to just mock the difference)
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 'Never' for undefined or null dates", () => {
    expect(getTimeAgo(undefined)).toBe("Never");
    // @ts-expect-error testing invalid input
    expect(getTimeAgo(null)).toBe("Never");
  });

  it("returns 'Invalid Date' for unparseable date strings because toLocaleDateString throws it", () => {
    expect(getTimeAgo("invalid-date-string")).toBe("Invalid Date");
  });

  it("returns 'Just now' for dates less than a minute ago", () => {
    const now = new Date();
    const tenSecondsAgo = new Date(now.getTime() - 10 * 1000).toISOString();
    expect(getTimeAgo(tenSecondsAgo)).toBe("Just now");
  });

  it("returns minutes ago format", () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(getTimeAgo(fiveMinutesAgo)).toBe("5m ago");
  });

  it("returns hours ago format", () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    expect(getTimeAgo(twoHoursAgo)).toBe("2h ago");
  });

  it("returns days ago format", () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(getTimeAgo(threeDaysAgo)).toBe("3d ago");
  });

  it("falls back to local date string for dates older than 7 days", () => {
    const now = new Date();
    const overAWeekAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    expect(getTimeAgo(overAWeekAgo.toISOString())).toBe(overAWeekAgo.toLocaleDateString());
  });
});
