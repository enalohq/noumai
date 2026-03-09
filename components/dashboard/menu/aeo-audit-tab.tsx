import { useState, useEffect } from "react";
import { getTimeAgo } from "@/lib/client/utils";
import type { AuditReport, AuditCheck } from "@/components/dashboard/types";

type AeoAuditTabProps = {
  brandWebsite: string;
  auditReport: AuditReport | null;
  history?: AuditReport[];
  onRunAudit: () => void;
  onSelectAudit: (report: AuditReport) => void;
  busy?: boolean;
  demoMode?: boolean;
};

const CATEGORY_META: Record<
  AuditCheck["category"],
  { label: string; icon: string; color: string }
> = {
  discovery: { label: "Discovery", icon: "🔍", color: "var(--th-accent)" },
  structure: { label: "Structure & Schema", icon: "🏗️", color: "#8b5cf6" },
  content: { label: "Content Quality", icon: "📝", color: "var(--th-success)" },
  technical: { label: "Technical", icon: "⚙️", color: "var(--th-warning)" },
  rendering: { label: "Server-Side Rendering", icon: "🖥️", color: "#ec4899" },
};

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color =
    score >= 80 ? "var(--th-success)" : score >= 50 ? "var(--th-warning)" : "var(--th-danger)";
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 110, height: 110 }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--th-score-ring-bg)" strokeWidth="8" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="absolute text-2xl font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function CheckRow({ check }: { check: AuditCheck }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-th-border bg-th-card-alt overflow-hidden border-l-2" style={{ borderLeftColor: check.pass ? 'var(--th-success)' : 'var(--th-danger)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-th-card-hover transition-colors"
      >
        <span className={check.pass ? "text-th-success" : "text-th-danger"}>
          {check.pass ? "✓" : "✗"}
        </span>
        <span className="flex-1 font-medium text-th-text">{check.label}</span>
        <span className="rounded-md bg-th-card-hover px-2 py-0.5 text-xs text-th-text-secondary">
          {check.value}
        </span>
        <span className="text-xs text-th-text-muted opacity-50">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-th-border bg-th-card/40 px-4 py-3 text-sm text-th-text-secondary leading-relaxed">
          {check.detail}
        </div>
      )}
    </div>
  );
}

function MiniTrend({ history }: { history: AuditReport[] }) {
  if (history.length < 2) return null;
  const recent = history.slice(0, 7).reverse(); // Last 7 audits, chronological
  const points = recent.map((h) => h.score);
  const max = 100;
  const width = 120;
  const height = 40;
  const step = width / (points.length - 1);
  
  const pathData = points.map((p, i) => {
    const x = i * step;
    const y = height - (p / max) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="text-[10px] font-medium uppercase tracking-wider text-th-text-muted">7-Scan Trend</div>
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathData}
          fill="none"
          stroke="var(--th-text-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_0_4px_rgba(var(--th-accent-rgb),0.5)]"
        />
        {points.map((p, i) => (
          <circle 
            key={i} 
            cx={i * step} 
            cy={height - (p / max) * height} 
            r="3" 
            className="fill-th-bg stroke-th-text-accent stroke-2"
          />
        ))}
      </svg>
    </div>
  );
}


export function AeoAuditTab({
  brandWebsite,
  auditReport,
  history = [],
  onRunAudit,
  onSelectAudit,
  busy = false,
  demoMode = false,
}: AeoAuditTabProps) {
  const [now, setNow] = useState(new Date());

  /** Tiny internal tick to keep 'time ago' strings fresh */
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const categories: AuditCheck["category"][] = [
    "discovery",
    "structure",
    "content",
    "technical",
    "rendering",
  ];

  const hasWebsite = brandWebsite.trim().length > 0;

  return (
    <div className={`grid grid-cols-1 gap-6 ${demoMode ? "" : "lg:grid-cols-5"}`}>
      {/* ── Main Content Area ────────────────── */}
      <div className={`space-y-6 ${demoMode ? "" : "lg:col-span-4"}`}>
        {/* ── Header / Website Bar ────────────────── */}
        {hasWebsite ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-th-border bg-th-card-alt px-4 py-2.5">
              <span className="text-sm text-th-text-muted">🌐</span>
              <span className="text-sm font-medium text-th-text truncate">{brandWebsite}</span>
              <span className="ml-auto rounded-md bg-th-card-hover px-2 py-0.5 text-[10px] font-bold uppercase text-th-text-muted">
                Target Site
              </span>
            </div>
            <button
              onClick={onRunAudit}
              disabled={busy}
              className="bd-btn-primary whitespace-nowrap rounded-lg px-6 py-2.5 text-sm font-semibold disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Auditing...
                </span>
              ) : auditReport ? "Re-run Audit" : "Run New Audit"}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-base font-semibold text-th-text">
                  Action Required: Add Website URL
                </p>
                <p className="mt-2 text-sm text-th-text-secondary leading-relaxed">
                  To audit your site&apos;s AI search readiness, go to the <strong>Settings</strong> tab and enter your primary brand website URL. 
                  This will enable checks for <code>llms.txt</code>, JSON-LD schema, and SSR content quality.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Results Display ──────────────────────────────── */}
        {auditReport ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Score header */}
            <div className="relative overflow-hidden rounded-2xl border border-th-border bg-th-card p-6 shadow-xl shadow-black/5">
              <div className="absolute top-0 right-0 p-4 opacity-50">
                <MiniTrend history={history} />
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <ScoreRing score={auditReport.score ?? 0} />
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-th-text">
                    AEO Readiness Score
                  </h2>
                  <p className="mt-1 text-th-text-secondary">
                    <span className="font-semibold text-th-text">
                      {(auditReport.checks ?? []).filter((c) => c.pass).length}
                    </span>
                    {" "}of{" "}
                    <span className="font-semibold text-th-text">
                      {(auditReport.checks ?? []).length}
                    </span>
                    {" "}checks passed.
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-th-text-muted">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-th-success animate-pulse" />
                    Last scanned {getTimeAgo(auditReport.createdAt || (history[0]?.createdAt))}
                  </p>
                  
                  {/* Category summary pills */}
                  <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                    {categories.map((cat) => {
                      const meta = CATEGORY_META[cat];
                      const group = (auditReport.checks ?? []).filter((c) => c.category === cat);
                      if (group.length === 0) return null;
                      const passed = group.filter((c) => c.pass).length;
                      return (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1.5 rounded-full border border-th-border bg-th-card-alt px-3 py-1.5 text-xs font-semibold"
                          style={{ color: meta.color }}
                        >
                          {meta.icon} <span className="opacity-80">{meta.label}:</span> {passed}/{group.length}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => {
                const meta = CATEGORY_META[cat];
                const group = (auditReport.checks ?? []).filter((c) => c.category === cat);
                if (group.length === 0) return null;
                return (
                  <div key={cat} className="space-y-3">
                    <h3
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-th-text-muted"
                    >
                      <span className="text-lg">{meta.icon}</span> {meta.label}
                    </h3>
                    <div className="space-y-2">
                      {group.map((check) => (
                        <CheckRow key={check.id} check={check} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : hasWebsite && (
          <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-th-border bg-th-card/30 text-center p-10">
            <div className="mb-4 text-5xl opacity-40">🛸</div>
            <h3 className="text-xl font-bold text-th-text">No Audit Data Found</h3>
            <p className="mt-2 text-sm text-th-text-secondary max-w-sm">
              Launch your first AEO audit to see how well AI models like Perplexity, ChatGPT, and Gemini can index your site.
            </p>
            <button 
              onClick={onRunAudit}
              className="mt-6 rounded-full bg-th-text-accent px-8 py-3 text-sm font-bold text-white shadow-lg shadow-th-text-accent/20 transition-all hover:scale-105"
            >
              Start First Audit
            </button>
          </div>
        )}
      </div>

      {/* ── Sidebar (1 Col) ───────────────────────────── */}
      {!demoMode && (
        <div className="lg:col-span-1 space-y-6">
        <div className="rounded-2xl border border-th-border bg-th-card p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-th-text-muted">
            🕒 Audit History
          </h3>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="py-10 text-center text-xs text-th-text-muted">
                No past scans recorded.
              </p>
            ) : (
              history.map((h, i) => (
                <button
                  key={h.createdAt + i}
                  onClick={() => onSelectAudit(h)}
                  className={`group flex w-full items-center gap-3 rounded-xl border p-2.5 border-transparent transition-all ${
                    auditReport?.createdAt === h.createdAt 
                      ? 'bg-th-text-accent/10 border-th-text-accent/30' 
                      : 'hover:bg-th-card-alt hover:border-th-border'
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold shadow-sm ${
                    h.score >= 80 ? 'bg-th-success/10 text-th-success' : 
                    h.score >= 50 ? 'bg-th-warning/10 text-th-warning' : 
                    'bg-th-danger/10 text-th-danger'
                  }`}>
                    {h.score}
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-[10px] font-bold uppercase tracking-tight text-th-text-muted">
                      {getTimeAgo(h.createdAt)}
                    </span>
                    <span className="text-xs font-medium text-th-text truncate w-full text-left">
                      {new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                    </span>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-th-text-muted">→</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Pro Tip Card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#ec4899]/20 p-4 border border-[#8b5cf6]/10">
          <div className="mb-2 text-sm font-bold text-th-text">🎓 AEO Strategy Tip</div>
          <p className="text-xs text-th-text-secondary leading-relaxed">
            AI models prioritize sites with direct, structured answers (BLUF). Improve your score by ensuring your H1 and first H2 sections lead with 2-3 sentence summaries.
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
