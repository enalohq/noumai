"use client";

import { useCallback, useEffect, useState } from "react";
import type { ScrapeRun } from "@/components/dashboard/types";

/**
 * Custom hook for server-side ScrapeRun persistence.
 *
 * Responsibilities:
 * - Load runs from `/api/runs` on mount
 * - Persist new runs to the server after each scrape
 * - Send X-Workspace-Id when workspaceId is provided (Phase 1)
 * - Gracefully degrade if the API is unavailable (e.g. demo mode)
 */

interface UseServerRunsOptions {
  /** When true, all API calls are skipped (e.g. demo mode) */
  disabled?: boolean;
  /** Workspace id to send as X-Workspace-Id. When null/undefined, server uses primary. */
  workspaceId?: string | null;
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

export function useServerRuns({
  disabled = false,
  workspaceId = null,
}: UseServerRunsOptions = {}): UseServerRunsReturn {
  const [loading, setLoading] = useState(!disabled);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(async (): Promise<ScrapeRun[] | null> => {
    if (disabled) return null;

    try {
      setError(null);
      const headers: HeadersInit = {};
      if (workspaceId) (headers as Record<string, string>)["X-Workspace-Id"] = workspaceId;
      const res = await fetch("/api/runs", { headers });

      if (res.status === 401) return null; // Not authenticated
      if (res.status === 403) {
        setError("Forbidden");
        return null;
      }
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
  }, [disabled, workspaceId]);

  const persistRun = useCallback(async (run: ScrapeRun): Promise<ScrapeRun | null> => {
    if (disabled) return run; // In demo mode, just return as-is

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (workspaceId) (headers as Record<string, string>)["X-Workspace-Id"] = workspaceId;
      const res = await fetch("/api/runs", {
        method: "POST",
        headers,
        body: JSON.stringify({
          provider: run.provider,
          prompt: run.prompt,
          promptId: run.promptId ?? null,
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
  }, [disabled, workspaceId]);

  // Mark loading as false immediately if disabled
  useEffect(() => {
    if (disabled && loading) setLoading(false);
  }, [disabled, loading]);

  return { loadRuns, persistRun, loading, error };
}
