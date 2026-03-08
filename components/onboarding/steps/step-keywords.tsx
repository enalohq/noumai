"use client";

export interface KeywordsData {
  targetKeywords: string;
}

interface StepKeywordsProps {
  data: KeywordsData;
  onChange: (data: KeywordsData) => void;
}

export function StepKeywords({ data, onChange }: StepKeywordsProps) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="targetKeywords" className="mb-1.5 block text-sm font-medium text-th-text">
          Target Keywords <span className="text-th-danger">*</span>
        </label>
        <textarea
          id="targetKeywords"
          value={data.targetKeywords}
          onChange={(e) => onChange({ targetKeywords: e.target.value })}
          className="bd-input w-full rounded-lg p-2.5 text-sm"
          rows={4}
          placeholder="Enter keywords to track (comma-separated)&#10;e.g., project management software, invoicing software, team collaboration tool, skincare.."
          required
        />
        <p className="mt-1 text-xs text-th-text-muted">
          These keywords will be used to track your AI visibility across search engines.
          Enter keywords relevant to your business and products.
        </p>
      </div>
    </div>
  );
}
