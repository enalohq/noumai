"use client";

import { useMemo, useState } from "react";
import { normalizeKeywords } from "@/lib/onboarding/keyword-normalizer";

export interface KeywordsData {
  targetKeywords: string;
}

interface StepKeywordsProps {
  data: KeywordsData;
  onChange: (data: KeywordsData) => void;
  suggestedKeywords?: string[];
  isLoadingSuggestions?: boolean;
}

export function StepKeywords({ data, onChange, suggestedKeywords = [], isLoadingSuggestions = false }: StepKeywordsProps) {
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  // Calculate keyword statistics
  const stats = useMemo(() => {
    const normalized = normalizeKeywords(data.targetKeywords);
    const raw = data.targetKeywords
      .split(/[,\n]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    return {
      normalizedCount: normalized.length,
      rawCount: raw.length,
      duplicateCount: raw.length - normalized.length,
      hasDuplicates: raw.length > normalized.length,
    };
  }, [data.targetKeywords]);

  // Filter suggestions to only show ones not already entered
  const availableSuggestions = useMemo(() => {
    const entered = normalizeKeywords(data.targetKeywords);
    return suggestedKeywords.filter(
      (keyword) => !entered.includes(keyword.toLowerCase())
    );
  }, [data.targetKeywords, suggestedKeywords]);

  const handleAddSuggestion = (keyword: string) => {
    const current = data.targetKeywords.trim();
    const newKeywords = current ? `${current}, ${keyword}` : keyword;
    onChange({ targetKeywords: newKeywords });
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="targetKeywords" className="mb-1.5 block text-sm font-medium text-th-text">
          Target Keywords <span className="text-th-danger">*</span>
        </label>
        <textarea
          id="targetKeywords"
          value={data.targetKeywords}
          onChange={(e) => onChange({ targetKeywords: e.target.value })}
          className="bd-input w-full rounded-lg p-2.5 text-sm"
          rows={4}
          placeholder="Enter keywords to track (comma or newline separated)&#10;e.g., project management, invoicing, team collaboration"
          required
        />
        <p className="mt-1 text-xs text-th-text-muted">
          These keywords will be used to track your AI visibility across search engines.
          Enter keywords relevant to your business and products.
        </p>

        {/* Keyword count and duplicate feedback */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-th-text-muted">
            {stats.normalizedCount} keyword{stats.normalizedCount !== 1 ? "s" : ""} entered
          </p>
          {stats.hasDuplicates && (
            <p className="text-xs text-th-warning">
              {stats.duplicateCount} duplicate{stats.duplicateCount !== 1 ? "s" : ""} detected
            </p>
          )}
        </div>
      </div>

      {/* Suggested keywords from competitors */}
      {availableSuggestions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-th-text">
              Suggested keywords from your competitors:
            </p>
            {isLoadingSuggestions && (
              <span className="text-xs text-th-text-muted">Loading AI suggestions...</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(showAllSuggestions ? availableSuggestions : availableSuggestions.slice(0, 10)).map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => handleAddSuggestion(keyword)}
                className="rounded-full border border-th-accent/30 bg-th-accent/5 px-3 py-1 text-xs text-th-accent hover:bg-th-accent/10 transition-colors"
              >
                + {keyword}
              </button>
            ))}
            {availableSuggestions.length > 10 && !showAllSuggestions && (
              <button
                type="button"
                onClick={() => setShowAllSuggestions(true)}
                className="rounded-full border border-th-accent/30 bg-th-accent/5 px-3 py-1 text-xs text-th-accent hover:bg-th-accent/10 transition-colors font-medium"
              >
                +{availableSuggestions.length - 10} more
              </button>
            )}
            {showAllSuggestions && availableSuggestions.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllSuggestions(false)}
                className="rounded-full border border-th-accent/30 bg-th-accent/5 px-3 py-1 text-xs text-th-accent hover:bg-th-accent/10 transition-colors font-medium"
              >
                Show less
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
