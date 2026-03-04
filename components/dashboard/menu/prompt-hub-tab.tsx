import { useState } from "react";
import type { TrackedPrompt } from "@/components/dashboard/types";

type PromptHubTabProps = {
  /** Server-backed tracked prompts (Phase 2 primary source) */
  prompts: TrackedPrompt[];
  /** Fallback local prompts for backward compat */
  customPrompts: string[];
  brandName?: string;
  busy: boolean;
  activeProviderCount: number;
  onAddCustomPrompt: (value: string) => void;
  onRemoveCustomPrompt: (idOrText: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onRunPrompt: (prompt: string) => void;
  onBatchRunAll: () => void;
};

export function PromptHubTab({
  prompts,
  customPrompts,
  brandName,
  busy,
  activeProviderCount,
  onAddCustomPrompt,
  onRemoveCustomPrompt,
  onToggleActive,
  onRunPrompt,
  onBatchRunAll,
}: PromptHubTabProps) {
  const [newPrompt, setNewPrompt] = useState("");

  const interpolateBrand = (value: string) => {
    if (!brandName?.trim()) return value;
    return value.replaceAll("{brand}", brandName.trim());
  };

  // Merge server-backed prompts with local fallback (deduplicated)
  const serverTexts = new Set(prompts.map((p) => p.text));
  const localOnly = customPrompts.filter((t) => !serverTexts.has(t));
  const totalCount = prompts.length + localOnly.length;
  const activeCount = prompts.filter((p) => p.isActive).length + localOnly.length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-th-border bg-th-card-alt p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium uppercase tracking-wider text-th-text-muted">
            Tracking Prompt Library
          </div>
          {totalCount > 0 && (
            <button
              disabled={busy}
              onClick={onBatchRunAll}
              className="bd-btn-primary rounded-lg px-3 py-1.5 text-sm disabled:opacity-60"
              title={`Run all ${activeCount} active prompts × ${activeProviderCount} model${activeProviderCount > 1 ? "s" : ""}`}
            >
              ▶ Run All ({activeCount} × {activeProviderCount})
            </button>
          )}
        </div>
        <p className="mb-3 text-sm text-th-text-secondary">
          Add the exact prompts you want to track over time. Use <span className="font-semibold">{"{brand}"}</span> to inject your brand name.
          {activeProviderCount > 1 && (
            <span className="ml-1 text-th-text-accent">· Runs across {activeProviderCount} selected models in parallel.</span>
          )}
        </p>

        <div className="mb-3 flex gap-2">
          <input
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="e.g. Best alternatives to {brand} for B2B SEO analytics"
            className="bd-input w-full rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => {
              onAddCustomPrompt(newPrompt);
              setNewPrompt("");
            }}
            className="bd-btn-primary rounded-lg px-4 py-2 text-sm"
          >
            Add
          </button>
        </div>

        <ul className="max-h-[400px] space-y-2 overflow-auto pr-1 text-sm">
          {totalCount === 0 && (
            <li className="text-th-text-secondary">No custom prompts added yet.</li>
          )}

          {/* Server-backed tracked prompts */}
          {prompts.map((tp) => (
            <li
              key={tp.id}
              className={`rounded-lg border border-th-border bg-th-card p-3 ${!tp.isActive ? "opacity-50" : ""}`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="line-clamp-3 flex-1 text-th-text">{interpolateBrand(tp.text)}</div>
                {tp.label && (
                  <span className="shrink-0 rounded-full bg-th-accent-soft px-2 py-0.5 text-xs font-medium text-th-accent">
                    {tp.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={!tp.isActive}
                  onClick={() => onRunPrompt(interpolateBrand(tp.text))}
                  className="bd-btn-primary rounded-md px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  Run
                </button>
                <button
                  onClick={() => onToggleActive(tp.id, !tp.isActive)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    tp.isActive
                      ? "bd-chip"
                      : "bg-th-warning-soft text-th-warning"
                  }`}
                >
                  {tp.isActive ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => onRemoveCustomPrompt(tp.id)}
                  className="bd-chip rounded-md px-3 py-1.5 text-xs"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}

          {/* Local-only prompts (backward compat fallback) */}
          {localOnly.map((item, index) => (
            <li
              key={`local-${item}-${index}`}
              className="rounded-lg border border-th-border bg-th-card p-3"
            >
              <div className="mb-2 line-clamp-3 text-th-text">{interpolateBrand(item)}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => onRunPrompt(interpolateBrand(item))}
                  className="bd-btn-primary rounded-md px-3 py-1.5 text-xs"
                >
                  Run
                </button>
                <button
                  onClick={() => onRemoveCustomPrompt(item)}
                  className="bd-chip rounded-md px-3 py-1.5 text-xs"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
