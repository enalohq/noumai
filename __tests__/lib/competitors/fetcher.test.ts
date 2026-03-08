import { CompetitorFetcher } from "@/lib/competitors/fetcher";
import { CompetitorSource } from "@/lib/competitors/types";

// Create mock fetchers for testing
const createMockFetcher = (
  name: string,
  competitors: any[]
): CompetitorSource => ({
  name,
  fetch: jest.fn().mockResolvedValue(competitors),
});

interface Competitor {
  name: string;
  url?: string;
  type: string;
  confidence: number;
  source: string;
}

describe("CompetitorFetcher", () => {
  let fetcher: CompetitorFetcher;

  beforeEach(() => {
    fetcher = new CompetitorFetcher();
  });

  describe("fetchAll", () => {
    it("should aggregate results from all fetchers", async () => {
      const mockFetcher1 = createMockFetcher("fetcher1", [
        { name: "Competitor A", url: "https://a.com", type: "direct", confidence: 0.9, source: "fetcher1" },
      ]);
      const mockFetcher2 = createMockFetcher("fetcher2", [
        { name: "Competitor B", url: "https://b.com", type: "direct", confidence: 0.8, source: "fetcher2" },
      ]);

      const customFetcher = new CompetitorFetcher([mockFetcher1, mockFetcher2]);
      const result = await customFetcher.fetchAll({ name: "TestBrand" });

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.name).sort()).toEqual(["Competitor A", "Competitor B"]);
    });

    it("should deduplicate competitors by name (case-insensitive)", async () => {
      const mockFetcher1 = createMockFetcher("fetcher1", [
        { name: "Competitor A", url: "https://a.com", type: "direct", confidence: 0.5, source: "fetcher1" },
      ]);
      const mockFetcher2 = createMockFetcher("fetcher2", [
        { name: "competitor a", url: "https://a2.com", type: "direct", confidence: 0.9, source: "fetcher2" },
      ]);

      const customFetcher = new CompetitorFetcher([mockFetcher1, mockFetcher2]);
      const result = await customFetcher.fetchAll({ name: "TestBrand" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("competitor a");
      expect(result[0].confidence).toBe(0.9); // Higher confidence wins
    });

    it("should keep highest confidence duplicate", async () => {
      const mockFetcher1 = createMockFetcher("fetcher1", [
        { name: "Competitor A", url: "https://a1.com", type: "direct", confidence: 0.6, source: "fetcher1" },
      ]);
      const mockFetcher2 = createMockFetcher("fetcher2", [
        { name: "Competitor A", url: "https://a2.com", type: "direct", confidence: 0.9, source: "fetcher2" },
      ]);

      const customFetcher = new CompetitorFetcher([mockFetcher1, mockFetcher2]);
      const result = await customFetcher.fetchAll({ name: "TestBrand" });

      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBe(0.9);
      expect(result[0].url).toBe("https://a2.com");
    });

    it("should sort results by confidence (highest first)", async () => {
      const mockFetcher1 = createMockFetcher("fetcher1", [
        { name: "Low Confidence", url: "https://low.com", type: "direct", confidence: 0.55, source: "fetcher1" },
        { name: "Medium Confidence", url: "https://medium.com", type: "direct", confidence: 0.6, source: "fetcher1" },
      ]);
      const mockFetcher2 = createMockFetcher("fetcher2", [
        { name: "High Confidence", url: "https://high.com", type: "direct", confidence: 0.9, source: "fetcher2" },
      ]);

      const customFetcher = new CompetitorFetcher([mockFetcher1, mockFetcher2]);
      const result = await customFetcher.fetchAll({ name: "TestBrand" });

      expect(result[0].name).toBe("High Confidence");
      expect(result[1].name).toBe("Medium Confidence");
      expect(result[2].name).toBe("Low Confidence");
    });

    it("should filter out competitors with confidence below 50%", async () => {
      const mockFetcher1 = createMockFetcher("fetcher1", [
        { name: "Very Low Confidence", url: "https://verylow.com", type: "direct", confidence: 0.3, source: "fetcher1" },
        { name: "Below Threshold", url: "https://below.com", type: "direct", confidence: 0.49, source: "fetcher1" },
        { name: "At Threshold", url: "https://at.com", type: "direct", confidence: 0.51, source: "fetcher1" },
        { name: "Above Threshold", url: "https://above.com", type: "direct", confidence: 0.6, source: "fetcher1" },
      ]);

      const customFetcher = new CompetitorFetcher([mockFetcher1]);
      const result = await customFetcher.fetchAll({ name: "TestBrand" });

      // Only competitors with confidence >= 0.5 should be included
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.name)).toEqual(["Above Threshold", "At Threshold"]);
    });

    it("should handle fetcher errors gracefully", async () => {
      const mockFetcher1 = createMockFetcher("fetcher1", [
        { name: "Competitor A", url: "https://a.com", type: "direct", confidence: 0.9, source: "fetcher1" },
      ]);
      const mockFetcher2: CompetitorSource = {
        name: "error-fetcher",
        fetch: jest.fn().mockRejectedValue(new Error("Fetcher error")),
      };

      const customFetcher = new CompetitorFetcher([mockFetcher1, mockFetcher2]);
      const result = await customFetcher.fetchAll({ name: "TestBrand" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Competitor A");
    });

    it("should handle empty fetcher results", async () => {
      const mockFetcher1 = createMockFetcher("fetcher1", []);
      const mockFetcher2 = createMockFetcher("fetcher2", [
        { name: "Competitor A", url: "https://a.com", type: "direct", confidence: 0.9, source: "fetcher2" },
      ]);

      const customFetcher = new CompetitorFetcher([mockFetcher1, mockFetcher2]);
      const result = await customFetcher.fetchAll({ name: "TestBrand" });

      expect(result).toHaveLength(1);
    });

    it("should handle all fetchers returning empty", async () => {
      const mockFetcher1 = createMockFetcher("fetcher1", []);
      const mockFetcher2 = createMockFetcher("fetcher2", []);

      const customFetcher = new CompetitorFetcher([mockFetcher1, mockFetcher2]);
      const result = await customFetcher.fetchAll({ name: "TestBrand" });

      expect(result).toEqual([]);
    });

    it("should use default fetchers when none provided", async () => {
      // This test just verifies the default constructor works
      // We can't easily test the actual fetchers without mocking them
      const fetcher = new CompetitorFetcher();
      expect(fetcher).toBeInstanceOf(CompetitorFetcher);
    });

    it("should pass brand context to all fetchers", async () => {
      const mockFetcher1 = createMockFetcher("fetcher1", []);
      const mockFetcher2 = createMockFetcher("fetcher2", []);

      const customFetcher = new CompetitorFetcher([mockFetcher1, mockFetcher2]);
      await customFetcher.fetchAll({
        name: "TestBrand",
        website: "https://testbrand.com",
        industry: "Technology",
      });

      expect(mockFetcher1.fetch).toHaveBeenCalledWith({
        name: "TestBrand",
        website: "https://testbrand.com",
        industry: "Technology",
      });
      expect(mockFetcher2.fetch).toHaveBeenCalledWith({
        name: "TestBrand",
        website: "https://testbrand.com",
        industry: "Technology",
      });
    });

    it("should run fetchers in parallel", async () => {
      let fetcher1Called = false;
      let fetcher2Called = false;

      const mockFetcher1: CompetitorSource = {
        name: "fetcher1",
        fetch: jest.fn().mockImplementation(async () => {
          fetcher1Called = true;
          await new Promise((resolve) => setTimeout(resolve, 100));
          return [{ name: "A", type: "direct", confidence: 0.9, source: "fetcher1" }];
        }),
      };
      const mockFetcher2: CompetitorSource = {
        name: "fetcher2",
        fetch: jest.fn().mockImplementation(async () => {
          fetcher2Called = true;
          await new Promise((resolve) => setTimeout(resolve, 100));
          return [{ name: "B", type: "direct", confidence: 0.8, source: "fetcher2" }];
        }),
      };

      const customFetcher = new CompetitorFetcher([mockFetcher1, mockFetcher2]);
      const startTime = Date.now();
      await customFetcher.fetchAll({ name: "TestBrand" });
      const elapsed = Date.now() - startTime;

      // Both should be called immediately (parallel execution)
      expect(fetcher1Called).toBe(true);
      expect(fetcher2Called).toBe(true);
      // Should complete in ~100ms (parallel) not ~200ms (sequential)
      expect(elapsed).toBeLessThan(200);
    });
  });
});