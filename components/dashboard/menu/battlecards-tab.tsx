import { useState, useCallback } from "react";
import type { Battlecard, CompetitorData } from "@/components/dashboard/types";
import { sanitizeCompetitor, formatDisplayUrl } from "@/lib/competitors/utils";

type BattlecardsTabProps = {
  competitors: CompetitorData[];
  battlecards: Battlecard[];
  onCompetitorsChange: (competitors: CompetitorData[]) => void;
  onBuildBattlecards: () => void;
  brandContext?: {
    brandName: string;
    website?: string;
    industry?: string;
  };
};

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const styles: Record<string, string> = {
    positive: "bg-th-success-soft text-th-success",
    neutral: "bg-th-accent-soft text-th-text-accent",
    negative: "bg-th-danger-soft text-th-danger",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[sentiment] ?? styles.neutral}`}>
      {sentiment}
    </span>
  );
}

export function BattlecardsTab({
  competitors,
  battlecards,
  onCompetitorsChange,
  onBuildBattlecards,
  brandContext,
}: BattlecardsTabProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredCompetitors, setDiscoveredCompetitors] = useState<CompetitorData[]>([]);
  const [newComp, setNewComp] = useState<Omit<CompetitorData, "isAutoDiscovered">>({
    name: "",
    url: "",
    type: "direct",
  });

  const runDiscovery = useCallback(async () => {
    if (!brandContext?.brandName) return;
    setIsDiscovering(true);
    try {
      const res = await fetch("/api/competitors/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandContext),
      });
      if (res.ok) {
        const { competitors: discovered } = await res.json();
        const sanitized = (discovered || []).map(sanitizeCompetitor);
        setDiscoveredCompetitors(sanitized);
      }
    } catch {
      // fail silently
    } finally {
      setIsDiscovering(false);
    }
  }, [brandContext]);

  const addCompetitor = (comp: CompetitorData) => {
    if (competitors.some((c) => c.name.toLowerCase() === comp.name.toLowerCase())) return;
    onCompetitorsChange([...competitors, comp]);
  };

  const removeCompetitor = (name: string) => {
    onCompetitorsChange(competitors.filter((c) => c.name !== name));
  };

  return (
    <div className="space-y-6">
      {/* Competitor Management Section */}
      <div className="rounded-xl border border-th-border bg-th-card-alt p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-th-text">Tracked Competitors</h3>
            <p className="text-xs text-th-text-muted">Manage the companies AI models compare you against.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="rounded-lg border border-th-border bg-th-card px-3 py-1.5 text-xs font-medium text-th-text hover:bg-th-card-hover transition-colors"
            >
              {showAddForm ? "Cancel" : "+ Add Manual"}
            </button>
            <button
              onClick={runDiscovery}
              disabled={isDiscovering || !brandContext?.brandName}
              className="rounded-lg bg-th-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-th-accent/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {isDiscovering ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : "🔍"}
              Auto-Discover
            </button>
          </div>
        </div>

        {/* Discovery Results */}
        {discoveredCompetitors.length > 0 && (
          <div className="mb-4 space-y-2 border-b border-th-border pb-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-th-text-muted">Suggestions</div>
            <div className="flex flex-wrap gap-2">
              {discoveredCompetitors.map((c) => {
                const isTracked = competitors.some(tc => tc.name === c.name);
                return (
                  <button
                    key={c.name}
                    onClick={() => isTracked ? removeCompetitor(c.name) : addCompetitor(c)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      isTracked 
                        ? "bg-th-accent border-th-accent text-white" 
                        : "bg-th-card border-th-border text-th-text hover:border-th-accent"
                    }`}
                  >
                    {c.name} {isTracked ? "✓" : "+"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Manual Add Form */}
        {showAddForm && (
          <div className="mb-4 grid gap-3 rounded-lg border border-th-border bg-th-card p-3 sm:grid-cols-6">
            <input
              placeholder="Competitor Name"
              value={newComp.name}
              onChange={(e) => setNewComp({ ...newComp, name: e.target.value })}
              className="bd-input rounded-md px-3 py-1.5 text-sm sm:col-span-2"
            />
            <input
              placeholder="Website URL (e.g. acme.com)"
              value={newComp.url}
              onChange={(e) => setNewComp({ ...newComp, url: e.target.value })}
              className="bd-input rounded-md px-3 py-1.5 text-sm sm:col-span-2"
            />
            <select
              value={newComp.type}
              onChange={(e) => setNewComp({ ...newComp, type: e.target.value as any })}
              className="bd-input rounded-md px-3 py-1.5 text-sm sm:col-span-1"
            >
              <option value="direct">Direct</option>
              <option value="indirect">Indirect</option>
              <option value="substitute">Substitute</option>
            </select>
            <button
              onClick={() => {
                if (newComp.name) {
                  addCompetitor(sanitizeCompetitor(newComp));
                  setNewComp({ name: "", url: "", type: "direct" });
                  setShowAddForm(false);
                }
              }}
              className="rounded-md bg-th-accent text-xs font-medium text-white hover:bg-th-accent/90 sm:col-span-1"
            >
              Add
            </button>
          </div>
        )}

        {/* Competitor Chips */}
        <div className="flex flex-wrap gap-2">
          {!Array.isArray(competitors) || competitors.length === 0 ? (
            <div className="text-xs italic text-th-text-muted py-2">No competitors tracked yet.</div>
          ) : (
            competitors.map((c) => (
              <div
                key={c.name}
                className="group flex items-center gap-2 rounded-md border border-th-border/60 bg-th-card px-2 py-1 transition-all hover:border-th-accent-soft shadow-sm"
              >
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-th-accent-soft text-[9px] font-bold text-th-text-accent uppercase">
                  {c.name.slice(0, 1)}
                </div>
                <div className="text-xs font-semibold text-th-text whitespace-nowrap">{c.name}</div>
                {c.url && (
                  <div className="text-[10px] font-medium text-th-text-accent truncate max-w-[80px]" title={c.url}>
                    {formatDisplayUrl(c.url)}
                  </div>
                )}
                <div className="text-[10px] font-medium text-th-text-muted capitalize bg-th-card-alt px-1 rounded border border-th-border/50">
                  {c.type}
                </div>
                <button
                  onClick={() => removeCompetitor(c.name)}
                  className="ml-0.5 text-th-text-muted hover:text-th-danger transition-colors"
                >
                  <span className="text-[10px]">✕</span>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 border-t border-th-border pt-4">
          <button
            onClick={onBuildBattlecards}
            disabled={competitors.length === 0}
            className="bd-btn-primary w-full rounded-lg py-2 text-sm font-semibold shadow-sm disabled:opacity-50"
          >
            Generate Battlecards
          </button>
        </div>
      </div>

      {battlecards.length === 0 && (
        <div className="rounded-lg border border-th-border bg-th-card-alt p-8 text-center text-sm text-th-text-muted">
          No battlecards yet. Add competitors and click Generate Battlecards.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {battlecards.map((card) => {
          const isExpanded = expandedCard === card.competitor;
          return (
            <div
              key={card.competitor}
              className="rounded-xl border border-th-border bg-th-card shadow-sm overflow-hidden"
            >
              {/* Card header */}
              <button
                onClick={() => setExpandedCard(isExpanded ? null : card.competitor)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-th-card-hover transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-th-accent-soft">
                  <span className="text-sm font-bold text-th-text-accent">
                    {card.competitor.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-th-text truncate">{card.competitor}</div>
                </div>
                <SentimentBadge sentiment={card.sentiment} />
                <span className="text-xs text-th-text-muted">{isExpanded ? "▲" : "▼"}</span>
              </button>

              {/* Summary - always visible */}
              <div className="border-t border-th-border px-4 py-3">
                <p className="text-sm leading-relaxed text-th-text-secondary">{card.summary}</p>
              </div>

              {/* Structured sections - expandable */}
              {isExpanded && card.sections && card.sections.length > 0 && (
                <div className="border-t border-th-border px-4 py-3 space-y-3">
                  {card.sections.map((section) => (
                    <div key={section.heading}>
                      <h4 className="text-sm font-semibold text-th-text mb-1.5">{section.heading}</h4>
                      <ul className="space-y-1">
                        {section.points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-th-text-secondary">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-th-accent shrink-0" />
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Expand hint when sections exist but collapsed */}
              {!isExpanded && card.sections && card.sections.length > 0 && (
                <div className="border-t border-th-border-subtle px-4 py-2">
                  <span className="text-xs text-th-text-muted">
                    {card.sections.length} detailed section{card.sections.length > 1 ? "s" : ""} — click to expand
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
