/**
 * LLM-based Competitor Extractor
 * Uses Ollama (primary) → OpenRouter (fallback) to identify competitors
 */

import { callLlm, LlmRequest, LlmResponse } from "@/lib/server/llm-provider";
import { CompetitorSource, Competitor } from "../types";

interface LlmCompetitorExtractorConfig {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  llmProvider?: (request: LlmRequest) => Promise<LlmResponse>;
}

/**
 * LLM-powered competitor extraction
 * Priority 1 fetcher - most comprehensive and intelligent
 */
export class LlmCompetitorExtractor implements CompetitorSource {
  name = "llm";
  private llmProvider: (request: LlmRequest) => Promise<LlmResponse>;

  constructor(private config: LlmCompetitorExtractorConfig = {}) {
    this.config = {
      model: "qwen3.5",
      maxTokens: 1000,
      temperature: 0.5,
      ...config,
    };
    this.llmProvider = config.llmProvider || callLlm;
  }

  async fetch(brand: {
    name: string;
    website?: string;
    industry?: string;
    country?: string;
  }): Promise<Competitor[]> {
    const prompt = this.buildPrompt(brand);

    try {
      const result = await this.llmProvider({
        prompt,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      return this.parseResponse(result.text, brand.name);
    } catch (error) {
      console.error("[LlmCompetitorExtractor] LLM error:", error);
      return [];
    }
  }

  /**
   * Build the LLM prompt for competitor discovery
   */
  private buildPrompt(brand: {
    name: string;
    website?: string;
    industry?: string;
    country?: string;
  }): string {
    const industryContext = brand.industry
      ? ` in the ${brand.industry} industry`
      : "";
    const countryContext = brand.country
      ? ` operating in ${brand.country}`
      : "";
    const siteContext = brand.website ? ` Website: ${brand.website}` : "";

    return `Identify the top 5-8 DIRECT BUSINESS COMPETITORS of "${brand.name}"${industryContext}${countryContext}.${siteContext}

IMPORTANT: Only include actual competitor brands/companies that:
- Operate in the SAME industry as "${brand.name}"
- Sell similar products or services
- Target the same customer base
- Are direct market competitors

For each competitor, provide:
- Company/Brand name
- Website URL (if known)
- Brief reason why they're a competitor

Format your response as a JSON array:
[
  {
    "name": "Competitor Name",
    "url": "https://competitor.com",
    "reason": "Brief explanation of why they're a competitor"
  }
]

Only include real, active businesses that directly compete in the same industry. Do not include the brand itself. JSON only, no markdown formatting.`;
  }

  /**
   * Parse LLM response and extract competitors
   */
  private parseResponse(text: string, brandName: string): Competitor[] {
    try {
      // Clean up markdown code blocks if present
      const cleaned = text
        .replace(/```json?\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const competitors = JSON.parse(cleaned);

      if (!Array.isArray(competitors)) {
        console.warn("[LlmCompetitorExtractor] Response is not an array");
        return [];
      }

      return competitors
        .filter((c: unknown): c is { name: string; url?: string } => {
          return (
            typeof c === "object" &&
            c !== null &&
            "name" in c &&
            typeof (c as { name: unknown }).name === "string" &&
            (c as { name: string }).name.trim().length > 0
          );
        })
        .map((c, index) => {
          const hasUrlField = "url" in c;
          const normalizedUrl = hasUrlField ? this.normalizeUrl(c.url) : undefined;
          
          return {
            name: c.name.trim(),
            url: normalizedUrl,
            type: "direct" as const,
            confidence: 0.9 - index * 0.05,
            source: "llm",
            _hasUrlField: hasUrlField,
          };
        })
        .filter((c) => c.name.toLowerCase() !== brandName.toLowerCase())
        .filter((c) => {
          // Filter out entries where URL was provided but invalid
          if (c._hasUrlField && c.url === undefined) return false;
          return true;
        })
        .map(({ _hasUrlField, ...c }) => c);
    } catch (error) {
      console.error("[LlmCompetitorExtractor] Parse error:", error);
      return [];
    }
  }

  /**
   * Normalize URL to ensure it has protocol and is a valid domain
   */
  private normalizeUrl(url?: string): string | undefined {
    if (!url || typeof url !== "string") return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;

    try {
      let normalized = trimmed;
      if (
        !normalized.startsWith("http://") &&
        !normalized.startsWith("https://")
      ) {
        normalized = "https://" + normalized;
      }
      const urlObj = new URL(normalized);
      
      // Validate that hostname has at least one dot (basic domain check)
      if (!urlObj.hostname.includes(".")) {
        return undefined;
      }
      
      return normalized;
    } catch {
      return undefined;
    }
  }
}