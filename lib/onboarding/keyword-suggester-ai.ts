import { callLlm } from "@/lib/server/llm-provider";
import { KeywordSuggester, KeywordSuggestContext, KeywordFilter } from "./keyword-suggester";

/**
 * Strategy 2: AI-powered semantic keyword generation
 * Uses LLM to identify high-intent keywords based on market context
 */
export class AiSuggester implements KeywordSuggester {
  name = "ai-semantic";

  async suggest(ctx: KeywordSuggestContext): Promise<string[]> {
    const { brandName, industry, description, competitorNames } = ctx;
    
    if (!brandName || !industry) return [];

    const prompt = this.buildPrompt(brandName, industry, description, competitorNames);

    try {
      const result = await callLlm({
        prompt,
        maxTokens: 500,
        temperature: 0.7,
      });

      const extracted = this.parseResponse(result.text);
      return KeywordFilter.clean(extracted);
    } catch (error) {
      console.error("[AiSuggester] LLM error:", error);
      return [];
    }
  }

  private buildPrompt(brand: string, industry: string, desc?: string, competitors?: string[]): string {
    const competitorContext = competitors?.length 
      ? `\nKey Competitors: ${competitors.join(", ")}` 
      : "";
    const descriptionContext = desc ? `\nBrand Description: ${desc}` : "";

    return `You are an AEO (AI Engine Optimization) specialist.
Brand: ${brand}
Industry: ${industry}${descriptionContext}${competitorContext}

Task: Generate 10-15 high-intent keywords or short phrases (2-3 words) that users would use in an AI chat engine (like ChatGPT or Perplexity) to discover products or services provided by this brand.

Focus on:
1. Category-level queries (e.g., "best project management software")
2. Feature-specific queries
3. High-intent problem-solving phrases

Output Format: A simple JSON array of strings only. No explanation.`;
  }

  private parseResponse(text: string): string[] {
    try {
      // Clean up markdown code blocks if present
      const cleaned = text
        .replace(/```json?\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      // Fallback: simple line split if JSON fails
      return text
        .split("\n")
        .map(line => line.replace(/^[\d\-\.\s*]+/, "").trim())
        .filter(line => line.length > 2);
    }
  }
}
