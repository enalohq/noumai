"use client";

import { useEffect, useState } from "react";
import type { GeneratedPrompt } from "@/lib/onboarding/generate-prompts";

export interface PromptsData {
  selectedPrompts: string[];
}

interface StepPromptsProps {
  brandName: string;
  data: PromptsData;
  onChange: (data: PromptsData) => void;
}

const CATEGORY_LABELS: Record<GeneratedPrompt["category"], string> = {
  visibility: "Visibility",
  comparison: "Comparison",
  sentiment: "Sentiment",
  "use-case": "Use Case",
  trust: "Trust",
  competitor: "Competitor",
};

const CATEGORY_COLORS: Record<GeneratedPrompt["category"], string> = {
  visibility: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  comparison: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  sentiment: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "use-case": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  trust: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  competitor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export function StepPrompts({ brandName, data, onChange }: StepPromptsProps) {
  const [suggestions, setSuggestions] = useState<GeneratedPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [customInput, setCustomInput] = useState("");

  useEffect(() => {
    setLoadingPrompts(true);
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res.suggestedPrompts)) {
          setSuggestions(res.suggestedPrompts);
          // Auto-select all suggestions on first load if nothing selected yet
          if (data.selectedPrompts.length === 0 && res.suggestedPrompts.length > 0) {
            onChange({
              selectedPrompts: res.suggestedPrompts.map((p: GeneratedPrompt) => p.text),
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPrompts(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const interpolate = (text: string) =>
    brandName?.trim() ? text.replaceAll("{brand}", brandName.trim()) : text;

  const toggle = (text: string) => {
    const has = data.selectedPrompts.includes(text);
    onChange({
      selectedPrompts: has
        ? data.selectedPrompts.filter((p) => p !== text)
        : [...data.selectedPrompts, text],
    });
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed || data.selectedPrompts.includes(trimmed)) return;
    onChange({ selectedPrompts: [...data.selectedPrompts, trimmed] });
    setCustomInput("");
  };

  const removeCustom = (text: string) => {
    onChange({ selectedPrompts: data.selectedPrompts.filter((p) => p !== text) });
  };

  // Prompts that were manually added (not in suggestions list)
  const suggestionTexts = new Set(suggestions.map((s) => s.text));
  const customPrompts = data.selectedPrompts.filter((p) => !suggestionTexts.has(p));

  return (
    <div className="space-y-4">
      <p className="text-sm text-th-text-muted">
        These prompts are auto-generated from your brand details. Select the ones you want to track, or add your own. You can always edit them later in the Prompts tab.
      </p>

      {/* Custom prompt input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder={`e.g. What is the best alternative to ${brandName || "{brand}"}?`}
          className="bd-input flex-1 rounded-lg p-2.5 text-sm"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="rounded-lg bg-th-accent px-4 py-2 text-sm font-medium text-white hover:bg-th-accent/90 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Custom prompts added by user */}
      {customPrompts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-th-text-muted">Your prompts</p>
          {customPrompts.map((text) => (
            <div
              key={text}
              className="flex items-start gap-2 rounded-lg border border-th-accent/30 bg-th-accent/5 p-2.5"
            >
              <span className="mt-0.5 flex-1 text-sm text-th-text">{interpolate(text)}</span>
              <button
                type="button"
                onClick={() => removeCustom(text)}
                className="shrink-0 text-th-text-muted hover:text-th-danger transition-colors"
                aria-label="Remove prompt"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Suggested prompts */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-th-text-muted">
            Suggested prompts
            {!loadingPrompts && ` (${suggestions.length})`}
          </p>
          {!loadingPrompts && suggestions.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange({ selectedPrompts: [...customPrompts, ...suggestions.map((s) => s.text)] })}
                className="text-xs text-th-accent hover:underline"
              >
                Select all
              </button>
              <span className="text-th-border">·</span>
              <button
                type="button"
                onClick={() => onChange({ selectedPrompts: customPrompts })}
                className="text-xs text-th-text-muted hover:text-th-text hover:underline"
              >
                Deselect all
              </button>
            </div>
          )}
        </div>

        {loadingPrompts ? (
          <div className="flex items-center gap-2 py-4 text-sm text-th-text-muted">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-th-accent border-t-transparent" />
            Generating prompts…
          </div>
        ) : (
          <div className="max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
            {suggestions.map((suggestion) => {
              const selected = data.selectedPrompts.includes(suggestion.text);
              return (
                <button
                  key={suggestion.text}
                  type="button"
                  onClick={() => toggle(suggestion.text)}
                  className={`flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                    selected
                      ? "border-th-accent/40 bg-th-accent/8"
                      : "border-th-border bg-th-bg hover:border-th-accent/30 hover:bg-th-accent/5"
                  }`}
                >
                  {/* Checkbox */}
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      selected ? "border-th-accent bg-th-accent" : "border-th-border bg-transparent"
                    }`}
                  >
                    {selected && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>

                  <span className="flex-1 text-sm text-th-text leading-snug">
                    {interpolate(suggestion.text)}
                  </span>

                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium ${
                      CATEGORY_COLORS[suggestion.category]
                    }`}
                  >
                    {CATEGORY_LABELS[suggestion.category]}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-th-text-muted">
        {data.selectedPrompts.length} prompt{data.selectedPrompts.length !== 1 ? "s" : ""} selected
      </p>
    </div>
  );
}
