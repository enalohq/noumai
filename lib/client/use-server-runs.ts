"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScrapeRun } from "@/components/dashboard/types";

/**
 * Custom hook for server-side ScrapeRun persistence.
 *
 * Responsibilities:
 * - Load runs from `/api/runs` on mount
 * - Persist new runs to the server after each scrape
 * - Keep local state in sync (optimistic UI)
 * - Gracefully degrade if the API is unavailable (e.g. demo mode)
 *
 * The dashboard owns the `runs` state; this hook provides
 * `loadRuns` and `persistRun` as pure async functions.
 */

interface UseServerRunsOptions {
  /** When true, all API calls are skipped */
  disabled?: boolean;
}

interface UseServerRunsReturn {
  /** Fetch all runs from the server. Returns the array or null on failure. */
  loadRuns: () => Promise<ScrapeRun[] | null>;
  /** Persist a single run to the server. Returns the saved run or null on failure. */
  persistRun: (run: ScrapeRun) => Promise<ScrapeRun | null>;
  /** Whether the initial load is still in progress */
  loading: boolean;
  /** Last error message, if any */
  error: string | null;
}

export function useServerRuns({ disabled = false }: UseServerRunsOptions = {}): UseServerRunsReturn {
  const [loading, setLoading] = useState(!disabled);
  const [error, setError] = useState<string | null>(null);

  // Track if initial load has been triggered to prevent double-fires in StrictMode
  const loadedRef = useRef(false);

  const loadRuns = useCallback(async (): Promise<ScrapeRun[] | null> => {
    if (disabled) return null;

    try {
      setError(null);
      const res = await fetch("/api/runs");

      if (res.status === 401) return null; // Not authenticated
      if (!res.ok) {
        setError(`Failed to load runs (${res.status})`);
        return null;
      }

      const data = await res.json();
      return (data.runs as ScrapeRun[]) ?? [];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runs");
      return null;
    } finally {
      setLoading(false);
    }
  }, [disabled]);

  const persistRun = useCallback(async (run: ScrapeRun): Promise<ScrapeRun | null> => {
    if (disabled) return run; // In demo mode, just return as-is

    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: run.provider,
          prompt: run.prompt,
          answer: run.answer,
          sources: run.sources,
          visibilityScore: run.visibilityScore,
          sentiment: run.sentiment,
          brandMentions: run.brandMentions,
          competitorMentions: run.competitorMentions,
        }),
      });

      if (!res.ok) {
        console.error("[useServerRuns] Failed to persist run:", res.status);
        return run; // Return the original run — it's already in local state
      }

      const saved = await res.json();
      return saved as ScrapeRun;
    } catch (err) {
      // Non-fatal: the run is already in local state, server save failed silently
      console.error("[useServerRuns] Persist error:", err);
      return run;
    }
  }, [disabled]);

  // Mark loading as false immediately if disabled
  useEffect(() => {
    if (disabled && loading) setLoading(false);
  }, [disabled, loading]);

  return { loadRuns, persistRun, loading, error };
}
