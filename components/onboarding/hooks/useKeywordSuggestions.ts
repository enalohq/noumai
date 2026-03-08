import { useState, useEffect, useCallback, useMemo } from "react";
import { extractCompetitorKeywords } from "@/lib/onboarding/extract-competitor-keywords";

interface UseKeywordSuggestionsParams {
  brandName: string;
  industry: string;
  description: string;
  competitorNames: string[];
}

/**
 * useKeywordSuggestions Hook
 * Handles fetching keyword suggestions using both rule-based (sync) 
 * and AI-based (async) strategies.
 * 
 * Returns suggestions array, loading state, error state, and fetch function.
 */
export function useKeywordSuggestions(params: UseKeywordSuggestionsParams) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable reference for competitor names to prevent unnecessary re-renders
  const competitorKey = useMemo(
    () => params.competitorNames.join(","),
    [params.competitorNames]
  );

  const fetchSuggestions = useCallback(async () => {
    setError(null);
    
    // 1. Immediate Rule-based suggestions
    const ruleBased = extractCompetitorKeywords(params.competitorNames);
    if (params.brandName) {
      ruleBased.push(params.brandName.toLowerCase());
    }
    const INITIAL_SUGGESTIONS = Array.from(new Set(ruleBased)).sort();
    setSuggestions(INITIAL_SUGGESTIONS);

    // 2. Async AI suggestions
    if (!params.brandName || !params.industry) return;

    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/suggest-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data.suggestions)) {
        // Merge and deduplicate
        setSuggestions(prev => {
          const combined = [...prev, ...data.suggestions];
          return Array.from(new Set(combined)).sort();
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch suggestions";
      console.error("[useKeywordSuggestions] Error:", err);
      setError(errorMessage);
      // Don't throw - let rule-based suggestions stand alone
    } finally {
      setLoading(false);
    }
  }, [params.brandName, params.industry, params.description, competitorKey]);

  return { suggestions, loading, error, fetchSuggestions };
}
