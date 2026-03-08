// Mock the llm-provider module BEFORE importing the extractor
jest.mock("@/lib/server/llm-provider", () => ({
  callLlm: jest.fn(),
}));

import { LlmCompetitorExtractor } from "@/lib/competitors/fetchers/llm-extractor";
import { callLlm } from "@/lib/server/llm-provider";

// Define the type locally to avoid import issues
type LlmResponse = {
  text: string;
  provider: 'ollama' | 'openrouter';
};

describe("LlmCompetitorExtractor", () => {
  let extractor: LlmCompetitorExtractor;
  let mockLlmProvider: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLlmProvider = callLlm as jest.Mock;
    extractor = new LlmCompetitorExtractor({
      llmProvider: mockLlmProvider,
    });
  });

  describe("fetch", () => {
    it("should return competitors from LLM response", async () => {
      const mockLlmResponse: LlmResponse = {
        text: JSON.stringify([
          { name: "Competitor A", url: "https://competitor-a.com" },
          { name: "Competitor B", url: "https://competitor-b.com" },
        ]),
        provider: "ollama" as const,
      };

      mockLlmProvider.mockResolvedValue(mockLlmResponse);

      const result = await extractor.fetch({
        name: "TestBrand",
        industry: "Technology",
      });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Competitor A");
      expect(result[0].url).toBe("https://competitor-a.com");
      expect(result[0].type).toBe("direct");
      expect(result[0].source).toBe("llm");
      expect(result[0].confidence).toBeCloseTo(0.9, 1);
    });

    it("should exclude the brand itself from results", async () => {
      const mockLlmResponse: LlmResponse = {
        text: JSON.stringify([
          { name: "TestBrand", url: "https://testbrand.com" },
          { name: "Competitor A", url: "https://competitor-a.com" },
        ]),
        provider: "ollama" as const,
      };

      mockLlmProvider.mockResolvedValue(mockLlmResponse);

      const result = await extractor.fetch({ name: "TestBrand" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Competitor A");
    });

    it("should handle case-insensitive brand exclusion", async () => {
      const mockLlmResponse: LlmResponse = {
        text: JSON.stringify([
          { name: "testbrand", url: "https://testbrand.com" },
          { name: "TESTBRAND", url: "https://testbrand.com" },
          { name: "Competitor A", url: "https://competitor-a.com" },
        ]),
        provider: "ollama" as const,
      };

      mockLlmProvider.mockResolvedValue(mockLlmResponse);

      const result = await extractor.fetch({ name: "TestBrand" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Competitor A");
    });

    it("should return empty array when LLM fails", async () => {
      mockLlmProvider.mockRejectedValue(new Error("LLM error"));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await extractor.fetch({ name: "TestBrand" });
      consoleSpy.mockRestore();

      expect(result).toEqual([]);
    });

    it("should return empty array for invalid JSON response", async () => {
      const mockLlmResponse: LlmResponse = {
        text: "This is not valid JSON",
        provider: "ollama" as const,
      };

      mockLlmProvider.mockResolvedValue(mockLlmResponse);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await extractor.fetch({ name: "TestBrand" });
      consoleSpy.mockRestore();

      expect(result).toEqual([]);
    });

    it("should return empty array for non-array response", async () => {
      const mockLlmResponse: LlmResponse = {
        text: JSON.stringify({ name: "Single object" }),
        provider: "ollama" as const,
      };

      mockLlmProvider.mockResolvedValue(mockLlmResponse);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await extractor.fetch({ name: "TestBrand" });
      consoleSpy.mockRestore();

      expect(result).toEqual([]);
    });

    it("should filter out entries without name", async () => {
      const mockLlmResponse: LlmResponse = {
        text: JSON.stringify([
          { name: "Valid Competitor", url: "https://valid.com" },
          { url: "https://no-name.com" },
          { name: "", url: "https://empty-name.com" },
          { name: "   ", url: "https://whitespace-name.com" },
        ]),
        provider: "ollama" as const,
      };

      mockLlmProvider.mockResolvedValue(mockLlmResponse);

      const result = await extractor.fetch({ name: "TestBrand" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Valid Competitor");
    });

    it("should normalize URLs with missing protocol", async () => {
      const mockLlmResponse: LlmResponse = {
        text: JSON.stringify([
          { name: "Competitor A", url: "competitor-a.com" },
          { name: "Competitor B", url: "https://competitor-b.com" },
          { name: "Competitor C", url: "http://competitor-c.com" },
        ]),
        provider: "ollama" as const,
      };

      mockLlmProvider.mockResolvedValue(mockLlmResponse);

      const result = await extractor.fetch({ name: "TestBrand" });

      expect(result).toHaveLength(3);
      expect(result[0].url).toBe("https://competitor-a.com");
      expect(result[1].url).toBe("https://competitor-b.com");
      expect(result[2].url).toBe("http://competitor-c.com");
    });

    it("should filter out invalid URLs", async () => {
      const mockLlmResponse: LlmResponse = {
        text: JSON.stringify([
          { name: "Valid", url: "https://valid.com" },
          { name: "Invalid URL", url: "not-a-valid-url" },
          { name: "Empty URL", url: "" },
        ]),
        provider: "ollama" as const,
      };

      mockLlmProvider.mockResolvedValue(mockLlmResponse);

      const result = await extractor.fetch({ name: "TestBrand" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Valid");
      expect(result[0].url).toBe("https://valid.com");
    });

    it("should handle missing URL gracefully", async () => {
      const mockLlmResponse: LlmResponse = {
        text: JSON.stringify([
          { name: "Competitor A" },
          { name: "Competitor B", url: "https://competitor-b.com" },
        ]),
        provider: "ollama" as const,
      };

      mockLlmProvider.mockResolvedValue(mockLlmResponse);

      const result = await extractor.fetch({ name: "TestBrand" });

      expect(result).toHaveLength(2);
      expect(result[0].url).toBeUndefined();
      expect(result[1].url).toBe("https://competitor-b.com");
    });

    it("should clean up markdown code blocks from response", async () => {
      const mockLlmResponse: LlmResponse = {
        text: "```json\n[\n  { \"name\": \"Competitor A\", \"url\": \"https://a.com\" }\n]\n```",
        provider: "ollama" as const,
      };

      mockLlmProvider.mockResolvedValue(mockLlmResponse);

      const result = await extractor.fetch({ name: "TestBrand" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Competitor A");
    });

    it("should assign decreasing confidence scores", async () => {
      const mockLlmResponse: LlmResponse = {
        text: JSON.stringify([
          { name: "First" },
          { name: "Second" },
          { name: "Third" },
          { name: "Fourth" },
        ]),
        provider: "ollama" as const,
      };

      mockLlmProvider.mockResolvedValue(mockLlmResponse);

      const result = await extractor.fetch({ name: "TestBrand" });

      expect(result[0].confidence).toBe(0.9);
      expect(result[1].confidence).toBe(0.85);
      expect(result[2].confidence).toBe(0.8);
      expect(result[3].confidence).toBe(0.75);
    });

    it("should use custom configuration", async () => {
      const customExtractor = new LlmCompetitorExtractor({
        model: "custom-model",
        maxTokens: 500,
        temperature: 0.5,
        llmProvider: mockLlmProvider,
      });

      const mockLlmResponse: LlmResponse = {
        text: JSON.stringify([{ name: "Competitor" }]),
        provider: "ollama" as const,
      };

      mockLlmProvider.mockResolvedValue(mockLlmResponse);

      await customExtractor.fetch({ name: "TestBrand" });

      expect(mockLlmProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTokens: 500,
          temperature: 0.5,
        })
      );
    });

    it("should include brand context in prompt", async () => {
      const mockLlmResponse: LlmResponse = {
        text: JSON.stringify([{ name: "Competitor" }]),
        provider: "ollama" as const,
      };

      mockLlmProvider.mockResolvedValue(mockLlmResponse);

      await extractor.fetch({
        name: "TestBrand",
        website: "https://testbrand.com",
        industry: "E-commerce",
      });

      expect(mockLlmProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining("TestBrand"),
        })
      );
      expect(mockLlmProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining("E-commerce"),
        })
      );
      expect(mockLlmProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining("https://testbrand.com"),
        })
      );
    });
  });
});