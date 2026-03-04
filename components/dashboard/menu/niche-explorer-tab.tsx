import { useState } from "react";

type NicheExplorerTabProps = {
  niche: string;
  nicheQueries: string[];
  trackedPrompts: string[];
  busy?: boolean;
  onNicheChange: (value: string) => void;
  onGenerateQueries: () => void;
  onAddToTracking: (query: string) => void;
};

export function NicheExplorerTab({
  niche,
  nicheQueries,
  trackedPrompts,
  busy = false,
  onNicheChange,
  onGenerateQueries,
  onAddToTracking,
}: NicheExplorerTabProps) {
  const [addedSet, setAddedSet] = useState<Set<string>>(new Set());

  function handleAdd(query: string) {
    onAddToTracking(query);
    setAddedSet((prev) => new Set(prev).add(query));
  }

  function handleAddAll() {
    nicheQueries.forEach((q) => handleAdd(q));
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium uppercase tracking-wider text-th-text-muted">Target Niche</label>
      <div className="flex items-center gap-2">
        <input
          value={niche}
          onChange={(e) => onNicheChange(e.target.value)}
          className="bd-input flex-1 rounded-lg p-2.5 text-sm"
          placeholder="e.g. AI marketing tools for SaaS"
          disabled={busy}
        />
        <button
          onClick={onGenerateQueries}
          disabled={busy || !niche.trim()}
          className="bd-btn-primary shrink-0 rounded-lg px-4 py-2.5 text-sm disabled:opacity-50 flex items-center gap-2"
        >
          {busy && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {busy ? "Generating…" : "Generate Prompts"}
        </button>
      </div>
      <div className="rounded-xl border border-th-border bg-th-card-alt p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium uppercase tracking-wider text-th-text-muted">
            High-Intent Prompts
          </div>
          {nicheQueries.length > 0 && (
            <button
              onClick={handleAddAll}
              className="bd-btn-primary rounded-lg px-3 py-1.5 text-xs"
            >
              + Track All
            </button>
          )}
        </div>
        {nicheQueries.length === 0 && (
          <p className="text-sm text-th-text-secondary">No generated prompts yet.</p>
        )}
        <ul className="grid gap-2 text-sm md:grid-cols-2">
          {nicheQueries.map((query) => {
            const alreadyTracked =
              addedSet.has(query) || trackedPrompts.includes(query);
            return (
              <li
                key={query}
                className="flex items-start gap-2 rounded-lg border border-th-border bg-th-card p-3"
              >
                <span className="flex-1 text-th-text-secondary">{query}</span>
                <button
                  onClick={() => handleAdd(query)}
                  disabled={alreadyTracked}
                  className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    alreadyTracked
                      ? "bg-th-success-soft text-th-success cursor-default"
                      : "bd-btn-primary"
                  }`}
                  title={alreadyTracked ? "Already in tracking library" : "Add to Prompts tracking library"}
                >
                  {alreadyTracked ? "✓ Tracked" : "+ Track"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
