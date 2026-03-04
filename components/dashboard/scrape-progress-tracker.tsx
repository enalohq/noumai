"use client";

import { useEffect, useState } from "react";
import { PROVIDER_LABELS, type Provider } from "@/components/dashboard/types";

export type ProviderStatus = "pending" | "running" | "done" | "failed";

export type ScrapeProgress = {
  /** Map of provider → current status */
  providers: Record<string, ProviderStatus>;
  /** Total elapsed seconds since scrape started */
  elapsedSeconds: number;
  /** Whether any scrape is currently active */
  active: boolean;
};

interface ScrapeProgressTrackerProps {
  progress: ScrapeProgress;
}

const STATUS_ICON: Record<ProviderStatus, string> = {
  pending: "⏳",
  running: "🔄",
  done: "✅",
  failed: "❌",
};

const STATUS_LABEL: Record<ProviderStatus, string> = {
  pending: "Queued",
  running: "Querying…",
  done: "Complete",
  failed: "Failed",
};

export function ScrapeProgressTracker({ progress }: ScrapeProgressTrackerProps) {
  const { providers, elapsedSeconds, active } = progress;
  const entries = Object.entries(providers);

  if (entries.length === 0 || !active) return null;

  const total = entries.length;
  const done = entries.filter(([, s]) => s === "done" || s === "failed").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-5 mt-3 rounded-xl border border-th-border bg-th-card p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-th-accent animate-pulse" />
          <span className="text-sm font-medium text-th-text">
            Scraping AI models…
          </span>
        </div>
        <span className="text-xs text-th-text-muted tabular-nums">
          {formatElapsed(elapsedSeconds)}
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-th-card-alt">
        <div
          className="h-full rounded-full bg-gradient-to-r from-th-accent to-th-text-accent transition-all duration-500 ease-out"
          style={{ width: `${Math.max(pct, done > 0 ? 5 : 2)}%` }}
        />
      </div>

      {/* Per-provider status */}
      <div className="flex flex-wrap gap-2">
        {entries.map(([provider, status]) => (
          <div
            key={provider}
            className={`
              flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-300
              ${status === "running"
                ? "border-th-accent bg-th-accent-soft text-th-text-accent animate-pulse"
                : status === "done"
                  ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                  : status === "failed"
                    ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                    : "border-th-border bg-th-card-alt text-th-text-muted"
              }
            `}
          >
            <span className={status === "running" ? "animate-spin inline-block" : ""}>
              {STATUS_ICON[status]}
            </span>
            <span>{PROVIDER_LABELS[provider as Provider] ?? provider}</span>
            <span className="opacity-60">·</span>
            <span className="opacity-70">{STATUS_LABEL[status]}</span>
          </div>
        ))}
      </div>

      {/* Helpful context */}
      <p className="mt-2 text-[11px] text-th-text-muted">
        Each AI model takes 15–60s to respond. Models run in parallel.
      </p>
    </div>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Hook to manage the elapsed-time counter while scraping is active.
 * Returns the current elapsed seconds; resets when `active` goes false→true.
 */
export function useScrapeTimer(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }

    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [active]);

  return elapsed;
}
