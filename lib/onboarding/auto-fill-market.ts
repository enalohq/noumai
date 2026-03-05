/**
 * Auto-fill market data (industry and description) using LLM
 * Based on brand name and aliases
 */

import { callLlm } from "@/lib/server/llm-provider";

export interface AutoFillMarketRequest {
  brandName: string;
  brandAliases?: string;
}

export interface AutoFillMarketResponse {
  industry: string;
  description: string;
}

import { INDUSTRIES } from "@/lib/constants/industries";

/**
 * Generate combined prompt for industry and description
 */
function generateCombinedPrompt(brandName: string, brandAliases?: string): string {
  const aliases = brandAliases && brandAliases.trim() ? ` (also known as: ${brandAliases.trim()})` : "";
  
  return `Based on the brand name "${brandName}"${aliases}, provide:

1. Industry/Vertical: Choose from these options:
${INDUSTRIES.map(i => `- ${i}`).join('\n')}

2. Brand Description: A concise 1-2 sentence description explaining what the brand does, who it serves, and what makes it unique.

Format your response exactly like this:
INDUSTRY: <industry name>
DESCRIPTION: <1-2 sentence description>`;
}

/**
 * Auto-fill market data using a single LLM call
 * Returns industry and description based on brand name
 */
export async function autoFillMarket(request: AutoFillMarketRequest): Promise<AutoFillMarketResponse> {
  const { brandName, brandAliases } = request;

  let finalIndustry = "Other";
  let finalDescription = "";

  if (brandName) {
    try {
      const result = await callLlm({
        prompt: generateCombinedPrompt(brandName, brandAliases),
        maxTokens: 400,
        temperature: 0.3,
      });

      // Parse the response - use [\s\S] to match newlines in description
      const industryMatch = result.text.match(/INDUSTRY:\s*(.+)/i);
      const descriptionMatch = result.text.match(/DESCRIPTION:\s*([\s\S]+)/i);

      if (industryMatch) {
        let parsedIndustry = industryMatch[1].trim();
        // Validate it's a known industry (case-insensitive match)
        const normalizedIndustry = INDUSTRIES.find(
          i => i.toLowerCase() === parsedIndustry.toLowerCase()
        );
        finalIndustry = normalizedIndustry || parsedIndustry || "Other";
      }

      if (descriptionMatch) {
        // Take only first line of description to avoid over-capturing
        finalDescription = descriptionMatch[1].trim().split('\n')[0];
      }
    } catch (error) {
      console.error('[autoFillMarket] LLM error:', error);
      // Fallbacks if LLM fails
    }
  }

  return { industry: finalIndustry, description: finalDescription };
}
