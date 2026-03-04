"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface BrandData {
  brandName: string;
  brandAliases: string;
  website: string;
  twitterHandle: string;
  linkedinHandle: string;
}

interface StepBrandProps {
  data: BrandData;
  onChange: (data: BrandData) => void;
  /** Pre-filled from OAuth provider (Google account name) */
  oauthName?: string;
}

export function StepBrand({ data, onChange, oauthName }: StepBrandProps) {
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Track last fetched URL to prevent duplicate calls
  const lastFetchedUrl = useRef<string | null>(null);
  // Track if we've already populated from OAuth
  const oauthApplied = useRef(false);

  // Validate URL format
  const validateUrl = useCallback((url: string): string | null => {
    if (!url) return null;
    try {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return "URL must start with http:// or https://";
      }
      new URL(url);
      return null;
    } catch {
      return "Invalid URL format";
    }
  }, []);

  // Fetch website metadata
  const fetchMetadata = useCallback(async (url: string) => {
    if (!url || url === lastFetchedUrl.current) return;
    
    lastFetchedUrl.current = url;
    setIsFetching(true);
    setFetchError(null);

    try {
      const encodedUrl = encodeURIComponent(url);
      const res = await fetch(`/api/scrape-metadata?url=${encodedUrl}`);
      
      if (res.ok) {
        const metadata = await res.json();
        
        // Only update fields that are empty (preserve user edits)
        onChange((prev) => ({
          ...prev,
          brandName: prev.brandName || metadata.brandName || prev.brandName,
          twitterHandle: prev.twitterHandle || metadata.twitterHandle || prev.twitterHandle,
          linkedinHandle: prev.linkedinHandle || metadata.linkedinHandle || prev.linkedinHandle,
        }));
      } else if (res.status !== 400) {
        // 400 means invalid URL, which we handle separately
        setFetchError("Could not fetch website data");
      }
    } catch {
      setFetchError("Failed to connect to website");
    } finally {
      setIsFetching(false);
    }
  }, [onChange]);

  // Handle URL changes with debounced fetch
  useEffect(() => {
    const error = validateUrl(data.website);
    setUrlError(error);

    if (!error && data.website && data.website !== lastFetchedUrl.current) {
      const timer = setTimeout(() => {
        fetchMetadata(data.website);
      }, 1500); // 1.5s debounce
      return () => clearTimeout(timer);
    }
  }, [data.website, validateUrl, fetchMetadata]);

  // Apply OAuth name on mount if brandName is empty
  useEffect(() => {
    if (oauthName && !data.brandName && !oauthApplied.current) {
      oauthApplied.current = true;
      onChange({ ...data, brandName: oauthName });
    }
  }, [oauthName, data.brandName, onChange]);

  const set = (field: keyof BrandData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, [field]: e.target.value });
  };

  return (
    <div className="space-y-5">
      {/* Website URL - First field */}
      <div>
        <label htmlFor="website" className="mb-1.5 block text-sm font-medium text-th-text">
          Website URL <span className="text-th-danger">*</span>
        </label>
        <div className="relative">
          <input
            id="website"
            type="url"
            value={data.website}
            onChange={set("website")}
            className={`bd-input w-full rounded-lg p-2.5 text-sm pr-10 ${
              urlError ? "border-th-danger focus:ring-th-danger" : ""
            }`}
            placeholder="https://example.com"
            required
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-th-accent border-t-transparent" />
            </div>
          )}
        </div>
        {urlError && (
          <p className="mt-1 text-xs text-th-danger">{urlError}</p>
        )}
        {fetchError && !urlError && (
          <p className="mt-1 text-xs text-th-text-muted">{fetchError}</p>
        )}
        <p className="mt-1 text-xs text-th-text-muted">
          We'll auto-fetch your brand name and social handles
        </p>
      </div>

      {/* Brand Name */}
      <div>
        <label htmlFor="brandName" className="mb-1.5 block text-sm font-medium text-th-text">
          Brand / Company Name <span className="text-th-danger">*</span>
          {oauthName && !data.brandName && (
            <span className="ml-2 text-xs font-normal text-th-accent">
              (Pre-filled from Google)
            </span>
          )}
        </label>
        <input
          id="brandName"
          type="text"
          value={data.brandName}
          onChange={set("brandName")}
          className="bd-input w-full rounded-lg p-2.5 text-sm"
          placeholder="e.g. Acme Corp"
          required
        />
      </div>

      {/* Social Handles */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="twitterHandle" className="mb-1.5 block text-sm font-medium text-th-text">
            Twitter / X
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-th-text-muted">@</span>
            <input
              id="twitterHandle"
              type="text"
              value={data.twitterHandle}
              onChange={set("twitterHandle")}
              className="bd-input w-full rounded-lg py-2.5 pl-7 pr-2.5 text-sm"
              placeholder="username"
            />
          </div>
        </div>

        <div>
          <label htmlFor="linkedinHandle" className="mb-1.5 block text-sm font-medium text-th-text">
            LinkedIn
          </label>
          <input
            id="linkedinHandle"
            type="text"
            value={data.linkedinHandle}
            onChange={set("linkedinHandle")}
            className="bd-input w-full rounded-lg p-2.5 text-sm"
            placeholder="company-name"
          />
        </div>
      </div>

      {/* Brand Aliases */}
      <div>
        <label htmlFor="brandAliases" className="mb-1.5 block text-sm font-medium text-th-text">
          Brand Aliases
        </label>
        <input
          id="brandAliases"
          type="text"
          value={data.brandAliases}
          onChange={set("brandAliases")}
          className="bd-input w-full rounded-lg p-2.5 text-sm"
          placeholder="e.g. Acme, ACME Inc (comma-separated)"
        />
        <p className="mt-1 text-xs text-th-text-muted">
          Other names AI models might use to refer to your brand
        </p>
      </div>
    </div>
  );
}
