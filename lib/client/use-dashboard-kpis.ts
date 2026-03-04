"use client";

import { useMemo } from "react";
import type { AppState, RunDelta, ScrapeRun } from "@/components/dashboard/types";
import { isCleanUrl } from "@/lib/scoring";

/**
 * Computed KPIs derived from AppState.
 * All values are memoized — recomputed only when the underlying data changes.
 */
export interface DashboardKpis {
  /** Total unique source URLs across all runs */
  totalSources: number;
  /** Count of unique domains cited in runs where brand was NOT mentioned */
  citationOpportunities: number;
  /** Most recent run (by array order) */
  latestRun: ScrapeRun | undefined;
  /** Score deltas for each prompt+provider pair between latest two runs */
  runDeltas: RunDelta[];
  /** Top 5 biggest absolute delta changes */
  movers: RunDelta[];
  /** Avg visibility delta: recent half vs older half of runs */
  kpiVisibilityDelta: number | null;
  /** Count of undismissed drift alerts */
  unreadAlertCount: number;
  /** Daily average visibility trend data for charting */
  visibilityTrend: { day: string; visibility: number }[];
  /** Top cited URLs with prompt context (for partner discovery) */
  partnerLeaderboard: { url: string; count: number; prompts: string[] }[];
  /** Brand context string for AI prompt injection */
  brandCtx: string;
}

export function useDashboardKpis(state: AppState): DashboardKpis {
  const totalSources = useMemo(
    () => state.runs.reduce((acc, run) => acc + run.sources.length, 0),
    [state.runs],
  );

  const citationOpportunities = useMemo(() => {
    const domains = new Set<string>();
    state.runs
      .filter((r) => r.sentiment === "not-mentioned" || (r.brandMentions?.length ?? 0) === 0)
      .forEach((r) => {
        r.sources.forEach((url) => {
          try {
            const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
            domains.add(host);
          } catch { /* skip */ }
        });
      });
    return domains.size;
  }, [state.runs]);

  const latestRun = state.runs[0];

  const runDeltas: RunDelta[] = useMemo(() => {
    const grouped = new Map<string, ScrapeRun[]>();
    state.runs.forEach((run) => {
      const key = `${run.prompt}|||${run.provider}`;
      const list = grouped.get(key) ?? [];
      list.push(run);
      grouped.set(key, list);
    });

    const deltas: RunDelta[] = [];
    grouped.forEach((runs) => {
      const sorted = [...runs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      if (sorted.length < 2) return;
      const curr = sorted[0];
      const prev = sorted[1];
      const d = (curr.visibilityScore ?? 0) - (prev.visibilityScore ?? 0);
      if (d !== 0) {
        deltas.push({
          prompt: curr.prompt,
          provider: curr.provider,
          currentScore: curr.visibilityScore ?? 0,
          previousScore: prev.visibilityScore ?? 0,
          delta: d,
          currentRun: curr,
          previousRun: prev,
        });
      }
    });

    return deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [state.runs]);

  const movers = useMemo(() => runDeltas.slice(0, 5), [runDeltas]);

  const kpiVisibilityDelta = useMemo(() => {
    if (state.runs.length < 2) return null;
    const sorted = [...state.runs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const mid = Math.floor(sorted.length / 2);
    const recentHalf = sorted.slice(0, mid);
    const olderHalf = sorted.slice(mid);
    if (recentHalf.length === 0 || olderHalf.length === 0) return null;
    const recentAvg = recentHalf.reduce((a, r) => a + (r.visibilityScore ?? 0), 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((a, r) => a + (r.visibilityScore ?? 0), 0) / olderHalf.length;
    return Math.round(recentAvg - olderAvg);
  }, [state.runs]);

  const unreadAlertCount = useMemo(
    () => state.driftAlerts.filter((a) => !a.dismissed).length,
    [state.driftAlerts],
  );

  const visibilityTrend = useMemo(() => {
    const byDay = new Map<string, { total: number; sum: number }>();
    state.runs.forEach((run) => {
      const day = run.createdAt.slice(0, 10);
      const row = byDay.get(day) ?? { total: 0, sum: 0 };
      row.total += 1;
      row.sum += run.visibilityScore ?? 0;
      byDay.set(day, row);
    });

    return [...byDay.entries()]
      .map(([day, { total, sum }]) => ({
        day,
        visibility: total > 0 ? Math.round(sum / total) : 0,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [state.runs]);

  const partnerLeaderboard = useMemo(() => {
    const map = new Map<string, { count: number; prompts: Set<string> }>();
    state.runs.forEach((run) => {
      run.sources.filter(isCleanUrl).forEach((source) => {
        const existing = map.get(source) ?? { count: 0, prompts: new Set<string>() };
        existing.count += 1;
        existing.prompts.add(run.prompt);
        map.set(source, existing);
      });
    });

    return [...map.entries()]
      .map(([url, data]) => ({ url, count: data.count, prompts: [...data.prompts] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
  }, [state.runs]);

  const brandCtx = state.brand.brandName
    ? `Context: Brand "${state.brand.brandName}"${state.brand.website ? ` (${state.brand.website})` : ""}${state.brand.industry ? `, industry: ${state.brand.industry}` : ""}${state.brand.keywords ? `, keywords: ${state.brand.keywords}` : ""}. `
    : "";

  return {
    totalSources,
    citationOpportunities,
    latestRun,
    runDeltas,
    movers,
    kpiVisibilityDelta,
    unreadAlertCount,
    visibilityTrend,
    partnerLeaderboard,
    brandCtx,
  };
}
