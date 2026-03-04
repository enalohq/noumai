/* ── Compact KPI Card ─────────────────────────────────────────── */
export function KpiCard({
  label,
  value,
  small,
  delta,
  onInfoClick,
}: {
  label: string;
  value: string | number;
  small?: boolean;
  delta?: number | null;
  onInfoClick?: () => void;
}) {
  return (
    <div className="rounded-xl border border-th-border bg-th-card px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1">
        <div className="text-xs font-medium uppercase tracking-wider text-th-text-muted">{label}</div>
        {onInfoClick && (
          <button onClick={onInfoClick} className="text-th-text-muted hover:text-th-text-accent text-xs" title="How is this calculated?">ⓘ</button>
        )}
      </div>
      <div className={`mt-1 flex items-center gap-1.5 font-semibold text-th-text ${small ? "text-base" : "text-xl"}`}>
        {value}
        {delta != null && delta !== 0 && (
          <span className={`text-xs font-bold ${delta > 0 ? "text-th-success" : "text-th-danger"}`}>
            {delta > 0 ? "↑" : "↓"}{Math.abs(delta)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Score Factor Card ────────────────────────────────────────── */
export function ScoreFactorCard({
  emoji,
  label,
  points,
  desc,
}: {
  emoji: string;
  label: string;
  points: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-th-border bg-th-card-alt px-3 py-2.5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{emoji}</span>
        <span className="text-sm font-medium text-th-text">{label}</span>
        <span className="ml-auto text-sm font-semibold text-th-accent">{points}</span>
      </div>
      <p className="text-xs text-th-text-muted leading-relaxed">{desc}</p>
    </div>
  );
}
