// Mock the auth module completely
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

// Mock the competitor fetcher BEFORE importing the route
jest.mock("@/lib/competitors/fetcher", () => ({
  CompetitorFetcher: jest.fn().mockImplementation(() => ({
    fetchAll: jest.fn().mockResolvedValue([]),
  })),
}));

import { auth } from "@/auth";
import { CompetitorFetcher } from "@/lib/competitors/fetcher";
import { POST } from "@/app/api/competitors/discover/route";
import { createMockRequest } from "@/__tests__/utils/test-helpers";
import { competitorFactory } from "@/__tests__/factories/competitor.factory";

describe("POST /api/competitors/discover", () => {
  let mockAuth: any;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = {
      user: {
        id: "user-123",
        email: "test@example.com",
      },
    };
    (auth as jest.Mock).mockResolvedValue(mockAuth);
    // Suppress console.error for all tests in this suite
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    consoleErrorSpy.mockRestore();
  });

  it("should return 401 for unauthenticated requests", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest({ brandName: "TestBrand" });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 400 for missing brandName", async () => {
    const request = createMockRequest({});

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("brandName is required");
  });

  it("should return 400 for empty brandName", async () => {
    const request = createMockRequest({ brandName: "   " });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 400 for non-string brandName", async () => {
    const request = createMockRequest({ brandName: 123 });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return competitors for valid request", async () => {
    const mockCompetitors = [
      competitorFactory.llm({ name: "Competitor A", url: "https://a.com" }),
      competitorFactory.brightdata({ name: "Competitor B", url: "https://b.com" }),
    ];

    const mockFetchAll = jest.fn().mockResolvedValue(mockCompetitors);
    (CompetitorFetcher as jest.Mock).mockImplementation(() => ({
      fetchAll: mockFetchAll,
    }));

    const request = createMockRequest({
      brandName: "TestBrand",
      website: "https://testbrand.com",
      industry: "Technology",
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.competitors).toHaveLength(2);
    expect(data.competitors[0].name).toBe("Competitor A");
    expect(data.meta.total).toBe(2);
    expect(data.meta.sources).toContain("llm");
    expect(data.meta.sources).toContain("brightdata");
  });

  it("should handle empty competitors array", async () => {
    const mockFetchAll = jest.fn().mockResolvedValue([]);
    (CompetitorFetcher as jest.Mock).mockImplementation(() => ({
      fetchAll: mockFetchAll,
    }));

    const request = createMockRequest({ brandName: "UnknownBrand" });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.competitors).toEqual([]);
    expect(data.meta.total).toBe(0);
    expect(data.meta.sources).toEqual([]);
  });

  it("should pass brand context to fetcher", async () => {
    let capturedBrand: any;
    const mockFetchAll = jest.fn().mockImplementation((brand: any) => {
      capturedBrand = brand;
      return Promise.resolve([]);
    });
    (CompetitorFetcher as jest.Mock).mockImplementation(() => ({
      fetchAll: mockFetchAll,
    }));

    const request = createMockRequest({
      brandName: "TestBrand",
      website: "https://testbrand.com",
      industry: "E-commerce",
    });

    const response = await POST(request);
    expect(capturedBrand).toEqual({
      name: "TestBrand",
      website: "https://testbrand.com",
      industry: "E-commerce",
    });
  });

  it("should return 500 when fetcher throws error", async () => {
    const mockFetchAll = jest.fn().mockRejectedValue(new Error("Fetcher error"));
    (CompetitorFetcher as jest.Mock).mockImplementation(() => ({
      fetchAll: mockFetchAll,
    }));

    const request = createMockRequest({ brandName: "TestBrand" });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain("Failed to discover competitors");
    // Verify that the error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[competitors/discover] Error:",
      expect.any(Error)
    );
  });

  it("should handle optional fields gracefully", async () => {
    const mockFetchAll = jest.fn().mockResolvedValue([]);
    (CompetitorFetcher as jest.Mock).mockImplementation(() => ({
      fetchAll: mockFetchAll,
    }));

    const request = createMockRequest({ brandName: "TestBrand" });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});