"use client";

import { useMemo, useState } from "react";
import type { AppState } from "@/components/dashboard/types";
import {
  generateRecommendations,
  type Recommendation,
  type RecommendationPriority,
} from "@/lib/client/recommendations-engine";

interface ActionInsightsProps {
  state: AppState;
}

const PRIORITY_STYLES: Record<
  RecommendationPriority,
  { bg: string; border: string; badge: string; badgeText: string; icon: string }
> = {
  critical: {
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    badge: "bg-red-500/15",
    badgeText: "text-red-600 dark:text-red-400",
    icon: "🚨",
  },
  high: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    badge: "bg-amber-500/15",
    badgeText: "text-amber-600 dark:text-amber-400",
    icon: "⚠️",
  },
  medium: {
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    badge: "bg-blue-500/15",
    badgeText: "text-blue-600 dark:text-blue-400",
    icon: "💡",
  },
  low: {
    bg: "bg-th-card-alt/50",
    border: "border-th-border",
    badge: "bg-th-card-alt",
    badgeText: "text-th-text-muted",
    icon: "ℹ️",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  visibility: "Visibility",
  content: "Content",
  technical: "Technical",
  competitor: "Competitive",
  coverage: "Coverage",
};

export function ActionInsights({ state }: ActionInsightsProps) {
  const recommendations = useMemo(() => generateRecommendations(state), [state]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = recommendations.filter((r) => !dismissed.has(r.id));

  if (visible.length === 0) return null;

  // Show top 3 by default, expandable
  const criticalCount = visible.filter((r) => r.priority === "critical" || r.priority === "high").length;

  return (
    <section className="mb-4 rounded-xl border border-th-border bg-th-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-th-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h3 className="text-sm font-semibold text-th-text">Action Plan</h3>
          <span className="rounded-full bg-th-accent-soft px-2 py-0.5 text-xs font-medium text-th-text-accent">
            {visible.length} insight{visible.length !== 1 ? "s" : ""}
          </span>
          {criticalCount > 0 && (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
              {criticalCount} urgent
            </span>
          )}
        </div>
        {dismissed.size > 0 && (
          <button
            onClick={() => setDismissed(new Set())}
            className="text-xs text-th-text-muted hover:text-th-text transition-colors"
          >
            Show dismissed ({dismissed.size})
          </button>
        )}
      </div>

      {/* Recommendations list */}
      <div className="divide-y divide-th-border/50">
        {visible.map((rec) => (
          <RecommendationCard
            key={rec.id}
            rec={rec}
            expanded={expandedId === rec.id}
            onToggle={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
            onDismiss={() => {
              setDismissed((prev) => new Set([...prev, rec.id]));
              if (expandedId === rec.id) setExpandedId(null);
            }}
          />
        ))}
      </div>
    </section>
  );
}

function RecommendationCard({
  rec,
  expanded,
  onToggle,
  onDismiss,
}: {
  rec: Recommendation;
  expanded: boolean;
  onToggle: () => void;
  onDismiss: () => void;
}) {
  const style = PRIORITY_STYLES[rec.priority];

  return (
    <div className={`${style.bg} transition-colors`}>
      {/* Summary row — always visible */}
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-th-card-hover/50 transition-colors"
      >
        <span className="mt-0.5 text-base flex-shrink-0">{style.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-th-text">{rec.title}</span>
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.badge} ${style.badgeText}`}>
              {rec.priority}
            </span>
            <span className="rounded-md bg-th-card-alt px-1.5 py-0.5 text-[10px] font-medium text-th-text-muted uppercase tracking-wide">
              {CATEGORY_LABELS[rec.category] ?? rec.category}
            </span>
          </div>
          {!expanded && (
            <p className="mt-0.5 text-xs text-th-text-muted line-clamp-1">{rec.description}</p>
          )}
        </div>
        <span className="mt-1 text-th-text-muted text-xs flex-shrink-0">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pl-11 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-sm text-th-text-secondary mb-3">{rec.description}</p>

          {/* Evidence */}
          {rec.evidence && (
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-th-card-alt/80 px-3 py-2">
              <span className="text-xs mt-0.5">📊</span>
              <span className="text-xs text-th-text-secondary">{rec.evidence}</span>
            </div>
          )}

          {/* Actions checklist */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-th-text mb-1.5">What to do:</div>
            <ul className="space-y-1.5">
              {rec.actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-th-text-secondary">
                  <span className="mt-0.5 flex-shrink-0 h-4 w-4 rounded border border-th-border bg-th-bg flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Impact + dismiss */}
          <div className="flex items-center justify-between">
            {rec.estimatedImpact && (
              <span className="flex items-center gap-1 text-xs text-th-text-accent">
                <span>⚡</span>
                <span>Expected impact: {rec.estimatedImpact}</span>
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="text-xs text-th-text-muted hover:text-th-text transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
