"use client";

import { useState, useCallback, useEffect } from "react";
import { sanitizeCompetitor } from "@/lib/competitors/utils";

export interface CompetitorData {
  name: string;
  url?: string;
  type: "direct" | "indirect" | "substitute";
  isAutoDiscovered?: boolean;
}

interface StepCompetitorsProps {
  competitors: CompetitorData[];
  onChange: (competitors: CompetitorData[]) => void;
  /** Brand context for auto-discovery */
  brandContext?: {
    brandName: string;
    website?: string;
    industry?: string;
    country?: string;
  };
}

export function StepCompetitors({
  competitors,
  onChange,
  brandContext,
}: StepCompetitorsProps) {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [discoveredCompetitors, setDiscoveredCompetitors] = useState<
    Array<{ name: string; url?: string; type: string; confidence: number }>
  >([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({
    name: "",
    url: "",
    type: "direct" as "direct" | "indirect" | "substitute",
  });

  // Auto-discover competitors on mount when brand context is available
  useEffect(() => {
    if (!brandContext?.brandName || discoveredCompetitors.length > 0) {
      return;
    }

    const fetchCompetitors = async () => {
      setIsDiscovering(true);
      setDiscoverError(null);

      try {
        const res = await fetch("/api/competitors/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandName: brandContext.brandName,
            website: brandContext.website,
            industry: brandContext.industry,
            country: brandContext.country,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to discover competitors");
        }

        const { competitors: discovered } = await res.json();
        const sanitized = (discovered || []).map(sanitizeCompetitor);
        setDiscoveredCompetitors(sanitized);
      } catch (error) {
        console.error("[StepCompetitors] Discovery error:", error);
        setDiscoverError(
          error instanceof Error ? error.message : "Failed to discover competitors"
        );
      } finally {
        setIsDiscovering(false);
      }
    };

    fetchCompetitors();
  }, [brandContext?.brandName, brandContext?.website, brandContext?.industry, brandContext?.country, discoveredCompetitors.length]);

  const toggleDiscoveredCompetitor = useCallback(
    (competitor: { name: string; url?: string; type: string }) => {
      const exists = competitors.find((c) => c.name === competitor.name);
      if (exists) {
        onChange(competitors.filter((c) => c.name !== competitor.name));
      } else {
        onChange([
          ...competitors,
          {
            name: competitor.name,
            url: competitor.url,
            type: competitor.type as "direct" | "indirect" | "substitute",
            isAutoDiscovered: true,
          },
        ]);
      }
    },
    [competitors, onChange]
  );

  const addManualCompetitor = useCallback(async () => {
    if (!newCompetitor.name.trim()) return;

    if (!competitors.some((c) => c.name === newCompetitor.name.trim())) {
      setIsAdding(true);
      try {
        onChange([
          ...competitors,
          {
            name: newCompetitor.name.trim(),
            url: newCompetitor.url.trim() || undefined,
            type: newCompetitor.type,
            isAutoDiscovered: false,
          },
        ]);
      } finally {
        setIsAdding(false);
      }
    }

    setNewCompetitor({ name: "", url: "", type: "direct" });
    setShowAddForm(false);
  }, [newCompetitor, competitors, onChange]);

  // Keyboard support for form
  useEffect(() => {
    if (!showAddForm) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isAdding && newCompetitor.name.trim()) {
        e.preventDefault();
        addManualCompetitor();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowAddForm(false);
        setNewCompetitor({ name: "", url: "", type: "direct" });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showAddForm, isAdding, newCompetitor, addManualCompetitor]);

  const removeCompetitor = useCallback(
    (name: string) => {
      onChange(competitors.filter((c) => c.name !== name));
    },
    [competitors, onChange]
  );

  const isSelected = (name: string) =>
    competitors.some((c) => c.name === name);

  return (
    <div className="space-y-5">
      {/* Suggested Competitors Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-th-text">
          Suggested Competitors
        </h3>

        {isDiscovering && (
          <div className="flex items-center gap-2 text-sm text-th-text-muted">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-th-accent border-t-transparent" />
            Discovering competitors...
          </div>
        )}

        {discoverError && (
          <p className="text-xs text-th-danger">{discoverError}</p>
        )}

        {/* Discovered Competitors List */}
        {discoveredCompetitors.length > 0 ? (
          <div className="space-y-1">
            {discoveredCompetitors.map((competitor) => (
              <label
                key={competitor.name}
                className="flex items-center gap-2 rounded-lg border border-th-border bg-th-card/30 px-3 py-2 hover:bg-th-card/50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isSelected(competitor.name)}
                  onChange={() => toggleDiscoveredCompetitor(competitor)}
                  className="h-4 w-4 rounded border-th-border text-th-accent focus:ring-th-accent"
                />
                <span className="flex-1 text-sm text-th-text">
                  {competitor.name}
                </span>
                {competitor.url && (
                  <a
                    href={competitor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-th-accent hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    (website)
                  </a>
                )}
                <span className="text-xs text-th-text-muted">
                  {Math.round(competitor.confidence * 100)}% match
                </span>
              </label>
            ))}
          </div>
        ) : !isDiscovering && !discoverError && brandContext?.brandName ? (
          <p className="text-xs text-th-text-muted">
            No competitors found. Try adding manually below.
          </p>
        ) : null}
      </div>

      {/* Manual Add Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-th-text">
            Manual Competitors ({competitors.length})
          </h3>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="text-xs text-th-accent hover:underline"
          >
            + Add competitor
          </button>
        </div>

        {/* Add Competitor Form */}
        {showAddForm && (
          <div className="space-y-3 rounded-lg border border-th-border bg-th-card/30 p-4">
            <div>
              <label
                htmlFor="competitorName"
                className="mb-1 block text-xs font-medium text-th-text"
              >
                Name *
              </label>
              <input
                id="competitorName"
                type="text"
                value={newCompetitor.name}
                onChange={(e) =>
                  setNewCompetitor({ ...newCompetitor, name: e.target.value })
                }
                className="bd-input w-full rounded-lg px-3 py-2 text-sm"
                placeholder="Competitor name"
              />
            </div>
            <div>
              <label
                htmlFor="competitorUrl"
                className="mb-1 block text-xs font-medium text-th-text"
              >
                Website URL
              </label>
              <input
                id="competitorUrl"
                type="url"
                value={newCompetitor.url}
                onChange={(e) =>
                  setNewCompetitor({ ...newCompetitor, url: e.target.value })
                }
                className="bd-input w-full rounded-lg px-3 py-2 text-sm"
                placeholder="https://competitor.com"
              />
            </div>
            <div>
              <label
                htmlFor="competitorType"
                className="mb-1 block text-xs font-medium text-th-text"
              >
                Type
              </label>
              <select
                id="competitorType"
                value={newCompetitor.type}
                onChange={(e) => {
                  const value = e.target.value as "direct" | "indirect" | "substitute";
                  setNewCompetitor({
                    ...newCompetitor,
                    type: value,
                  });
                }}
                className="bd-input w-full rounded-lg px-3 py-2 text-sm"
              >
                <option value="direct">Direct Competitor</option>
                <option value="indirect">Indirect Competitor</option>
                <option value="substitute">Substitute</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCompetitor({ name: "", url: "", type: "direct" });
                }}
                disabled={isAdding}
                className="rounded-lg px-4 py-2 text-sm font-medium text-th-text-muted hover:text-th-text hover:bg-th-border/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addManualCompetitor}
                disabled={!newCompetitor.name.trim() || isAdding}
                className="rounded-lg bg-th-accent px-4 py-2 text-sm font-medium text-white hover:bg-th-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isAdding ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Adding...
                  </>
                ) : (
                  "Add"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Competitor List */}
        {competitors.length > 0 ? (
          <div className="space-y-1">
            {competitors.map((competitor) => (
              <div
                key={competitor.name}
                className="flex items-center gap-2 rounded-lg border border-th-border bg-th-card/30 px-3 py-2"
              >
                <span className="flex-1 text-sm text-th-text">
                  {competitor.name}
                </span>
                {competitor.url && (
                  <a
                    href={competitor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-th-accent hover:underline"
                  >
                    (website)
                  </a>
                )}
                <span className="text-xs text-th-text-muted">
                  {competitor.type}
                </span>
                {competitor.isAutoDiscovered && (
                  <span className="text-xs bg-th-accent/10 text-th-accent px-1.5 py-0.5 rounded">
                    Auto
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeCompetitor(competitor.name)}
                  className="ml-2 text-th-text-muted hover:text-th-danger"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-th-text-muted">
            No competitors added yet. Add manually.
          </p>
        )}
        <p className="mt-2 text-xs text-th-text-muted">
          You can add or edit competitors later from the Settings tab
        </p>
      </div>
    </div>
  );
}
