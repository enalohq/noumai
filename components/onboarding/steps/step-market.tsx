"use client";

import { INDUSTRIES } from "@/lib/constants/industries";

export interface MarketData {
  industry: string;
  brandDescription: string;
}

interface StepMarketProps {
  data: MarketData;
  onChange: (data: MarketData) => void;
}

export function StepMarket({ data, onChange }: StepMarketProps) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="industry" className="mb-1.5 block text-sm font-medium text-th-text">
          Industry / Vertical <span className="text-th-danger">*</span>
        </label>
        <select
          id="industry"
          value={data.industry}
          onChange={(e) => onChange({ ...data, industry: e.target.value })}
          className="bd-input w-full rounded-lg p-2.5 text-sm"
          required
        >
          <option value="">Select your industry…</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-th-text-muted">
          We can auto-detect this from your brand name
        </p>
      </div>

      <div>
        <label htmlFor="brandDescription" className="mb-1.5 block text-sm font-medium text-th-text">
          Brand Description <span className="text-th-danger">*</span>
        </label>
        <textarea
          id="brandDescription"
          value={data.brandDescription}
          onChange={(e) => onChange({ ...data, brandDescription: e.target.value })}
          className="bd-input w-full rounded-lg p-2.5 text-sm"
          rows={4}
          placeholder="Describe what your brand does, who it serves, and what makes it unique…"
          required
        />
        {/* <p className="mt-1 text-xs text-th-text-muted">
          This helps AI models understand your brand context when generating prompts
        </p> */}
      </div>
    </div>
  );
}
