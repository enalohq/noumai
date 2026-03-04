"use client";

export interface Competitor {
  id?: string;
  name: string;
  url: string;
  type: "direct" | "indirect" | "none";
}

export interface CompetitorsData {
  targetKeywords: string;
  competitors: Competitor[];
}

interface StepCompetitorsProps {
  data: CompetitorsData;
  onChange: (data: CompetitorsData) => void;
}

const EMPTY_COMPETITOR: Competitor = { name: "", url: "", type: "direct" };

const TYPE_LABELS: Record<Competitor["type"], string> = {
  direct: "Direct",
  indirect: "Indirect",
  none: "None",
};

export function StepCompetitors({ data, onChange }: StepCompetitorsProps) {
  const updateCompetitor = (index: number, field: keyof Competitor, value: string) => {
    const updated = data.competitors.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    );
    onChange({ ...data, competitors: updated });
  };

  const addCompetitor = () => {
    onChange({ ...data, competitors: [...data.competitors, { ...EMPTY_COMPETITOR }] });
  };

  const removeCompetitor = (index: number) => {
    onChange({ ...data, competitors: data.competitors.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="targetKeywords" className="mb-1.5 block text-sm font-medium text-th-text">
          Target Keywords
        </label>
        <input
          id="targetKeywords"
          type="text"
          value={data.targetKeywords}
          onChange={(e) => onChange({ ...data, targetKeywords: e.target.value })}
          className="bd-input w-full rounded-lg p-2.5 text-sm"
          placeholder="e.g. project management software, team collaboration tool"
        />
        <p className="mt-1 text-xs text-th-text-muted">
          Comma-separated keywords you want to track across AI responses
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-th-text">Competitors</label>
          <button
            type="button"
            onClick={addCompetitor}
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-th-accent hover:bg-th-accent/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add competitor
          </button>
        </div>

        {data.competitors.length === 0 ? (
          <button
            type="button"
            onClick={addCompetitor}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-th-border p-4 text-sm text-th-text-muted hover:border-th-accent hover:text-th-accent transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add your first competitor
          </button>
        ) : (
          <div className="space-y-2">
            {/* Header row — must use identical grid to input rows */}
            <div className="grid grid-cols-[140px_1fr_84px_32px] gap-2">
              <span className="text-xs text-th-text-muted">Name</span>
              <span className="text-xs text-th-text-muted">Website URL</span>
              <span className="text-xs text-th-text-muted">Type</span>
              <span />
            </div>

            {data.competitors.map((competitor, index) => (
              <div key={index} className="grid grid-cols-[140px_1fr_84px_32px] items-center gap-2">
                <input
                  type="text"
                  value={competitor.name}
                  onChange={(e) => updateCompetitor(index, "name", e.target.value)}
                  className="bd-input rounded-lg p-2 text-sm"
                  placeholder="Competitor name"
                />
                <input
                  type="url"
                  value={competitor.url}
                  onChange={(e) => updateCompetitor(index, "url", e.target.value)}
                  className="bd-input rounded-lg p-2 text-sm"
                  placeholder="https://competitor.com"
                />
                <select
                  value={competitor.type}
                  onChange={(e) => updateCompetitor(index, "type", e.target.value as Competitor["type"])}
                  className="bd-input rounded-lg p-2 text-sm"
                >
                  {(Object.keys(TYPE_LABELS) as Competitor["type"][]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeCompetitor(index)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-th-text-muted hover:bg-th-danger-soft hover:text-th-danger transition-colors"
                  aria-label="Remove competitor"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-th-text-muted">
          You can add or edit competitors later from the Settings tab
        </p>
      </div>
    </div>
  );
}
