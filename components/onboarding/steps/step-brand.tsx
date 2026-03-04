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
  const [fetchSuccess, setFetchSuccess] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Track last fetched URL to prevent duplicate calls
  const lastFetchedUrl = useRef<string | null>(null);
  // Track if brandName was set by OAuth (allows metadata to overwrite)
  const oauthApplied = useRef(false);
  // Track if user has manually edited fields (prevents overwriting)
  const userEditedBrandName = useRef(false);
  const userEditedTwitterHandle = useRef(false);
  const userEditedLinkedinHandle = useRef(false);
  // Keep latest data in a ref to avoid stale closures in fetchMetadata
  const dataRef = useRef(data);
  dataRef.current = data;

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

    setIsFetching(true);
    setFetchError(null);
    setFetchSuccess(null);

    try {
      const encodedUrl = encodeURIComponent(url);
      const res = await fetch(`/api/scrape-metadata?url=${encodedUrl}`);
      
      if (res.ok) {
        const metadata = await res.json();
        
        // Track what was auto-filled
        const autoFilled: string[] = [];
        
        // Only update fields that are empty (preserve user edits)
        // Exception: brandName from URL has higher priority than OAuth name
        const current = dataRef.current;
        const newData = { ...current };
        
        // Always replace values from API response unless user has manually edited the field
        // Brand name from URL takes priority over OAuth name, but not over user edits
        if (metadata.brandName && !userEditedBrandName.current) {
          newData.brandName = metadata.brandName;
          autoFilled.push("brand name");
        }
        
        // Always replace social handles from API response unless user has manually edited them
        if (!userEditedTwitterHandle.current) {
          newData.twitterHandle = metadata.twitterHandle;
          if (metadata.twitterHandle) {
            autoFilled.push("Twitter handle");
          }
        }
        
        if (!userEditedLinkedinHandle.current) {
          newData.linkedinHandle = metadata.linkedinHandle;
          if (metadata.linkedinHandle) {
            autoFilled.push("LinkedIn URL");
          }
        }
        
        onChange(newData);
        
        // Mark this URL as successfully fetched
        lastFetchedUrl.current = url;
        
        // Set success message
        if (autoFilled.length > 0) {
          setFetchSuccess(`Auto-filled ${autoFilled.join(", ")} from website`);
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setFetchSuccess(null);
          }, 3000);
        } else {
          setFetchSuccess("Website fetched, but no new data found to auto-fill");
          setTimeout(() => setFetchSuccess(null), 2000);
        }
      } else if (res.status !== 400) {
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
      }, 1000); // 1s debounce
      return () => clearTimeout(timer);
    }
  }, [data.website, validateUrl, fetchMetadata]);

  // Apply OAuth name on mount if brandName is empty
  useEffect(() => {
    if (oauthName && !data.brandName && !oauthApplied.current) {
      oauthApplied.current = true;
      onChange({ ...data, brandName: oauthName });
    }
  }, [oauthName, data.brandName, onChange, data]);

  const set = (field: keyof BrandData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (field === "brandName") {
      userEditedBrandName.current = true;
    } else if (field === "twitterHandle") {
      userEditedTwitterHandle.current = true;
    } else if (field === "linkedinHandle") {
      userEditedLinkedinHandle.current = true;
    }
    onChange({ ...data, [field]: e.target.value });
  };

  // Helper to generate alias examples
  const generateAliasExamples = (name: string): string => {
    if (!name.trim()) return "";
    
    const examples: string[] = [];
    
    // Remove common suffixes
    const baseName = name
      .replace(/\s+(Inc|Corp|Corporation|LLC|Ltd|Co|Company)[.]?$/i, "")
      .trim();
    
    if (baseName !== name && baseName.length > 0) {
      examples.push(baseName);
    }
    
    // Add common variations
    if (name.includes(" ")) {
      const initials = name
        .split(" ")
        .map(word => word.charAt(0))
        .join("");
      if (initials.length > 1) {
        examples.push(initials);
      }
      
      const firstWord = name.split(" ")[0];
      if (firstWord && firstWord.length > 2) {
        examples.push(firstWord);
      }
    }
    
    // Add with common suffixes
    if (!name.match(/\b(Inc|Corp|Corporation|LLC|Ltd|Co|Company)[.]?$/i)) {
      examples.push(`${name} Inc`, `${name} Corp`);
    }
    
    // Return first 3 examples
    return examples.slice(0, 3).join(", ") + (examples.length > 3 ? ", ..." : "");
  };

  return (
    <div className="space-y-5">
      {/* Section 1: Core Brand Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-th-text">Brand Info</h3>
        
        {/* Website URL */}
        <div>
          <label htmlFor="website" className="mb-1.5 block text-sm font-semibold text-th-text">
            Website URL <span className="text-th-danger">*</span>
            <span className="ml-1 text-xs font-normal text-th-text-muted">(required)</span>
          </label>
          <div className="relative">
            <input
              id="website"
              type="url"
              value={data.website}
              onChange={set("website")}
              className={`bd-input w-full rounded-lg p-2.5 text-sm ${urlError ? "border-th-danger focus:ring-th-danger" : ""}`}
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
          {fetchSuccess && (
            <div className="mt-1 flex items-center gap-2 text-sm text-green-600 animate-fadeIn">
              <svg className="h-4 w-4 animate-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{fetchSuccess}</span>
            </div>
          )}
          <p className="mt-1 text-xs text-th-text-muted">
            We will auto-fetch your brand info from your website
          </p>
        </div>

        {/* Brand Name */}
        <div>
          <label htmlFor="brandName" className="mb-1.5 block text-sm font-semibold text-th-text">
            Brand / Company Name <span className="text-th-danger">*</span>
            <span className="ml-1 text-xs font-normal text-th-text-muted">(required)</span>
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
          <p className="mt-1 text-xs text-th-text-muted">
            {oauthName && !data.brandName ? 
              "Pre-filled from your Google account" : 
              "The official name of your brand or company"
            }
          </p>
        </div>
      </div>

      {/* Section 2: Brand Social Link */}
      <div className="mt-4 rounded-lg border border-th-border bg-th-card/30">
        {/* Collapsible Header */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-th-text hover:bg-th-card/50 transition-colors"
        >
          <span>Brand Social Link</span>
          <svg
            className={`h-4 w-4 transform transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Collapsible Content */}
        {showAdvanced && (
          <div className="border-t border-th-border px-4 pb-4 pt-4 space-y-4">
            {/* Twitter */}
            <div>
              <label htmlFor="twitterHandle" className="mb-1.5 block text-sm font-medium text-th-text">
                Twitter / X
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-th-text">@</span>
                <input
                  id="twitterHandle"
                  type="text"
                  value={data.twitterHandle}
                  onChange={set("twitterHandle")}
                  className="bd-input w-full rounded-lg py-2.5 pl-7 pr-2.5 text-sm"
                  placeholder="username"
                />
              </div>
              <p className="mt-1 text-xs text-th-text-muted">
                Your Twitter handle (without @)
              </p>
              {data.twitterHandle && !/^[a-z0-9_]{1,15}$/.test(data.twitterHandle) && (
                <p className="mt-1 text-xs text-amber-600">
                  Twitter handles can only contain letters, numbers, and underscores (1-15 characters)
                </p>
              )}
            </div>

            {/* LinkedIn */}
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
                placeholder="https://linkedin.com/company/..."
              />
              <p className="mt-1 text-xs text-th-text-muted">
                Full LinkedIn company or profile URL
              </p>
            </div>

            {/* Brand Aliases */}
            <div>
              <div className="mb-1.5 flex items-center gap-1">
                <label htmlFor="brandAliases" className="text-sm font-medium text-th-text">
                  Brand Aliases
                </label>
                <button
                  type="button"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-th-border text-xs text-th-text-muted hover:bg-th-border-dark"
                  aria-label="More information"
                  title="Enter other names AI models might use for your brand. Separate multiple aliases with commas."
                >
                  ?
                </button>
              </div>
              <input
                id="brandAliases"
                type="text"
                value={data.brandAliases}
                onChange={set("brandAliases")}
                className="bd-input w-full rounded-lg p-2.5 text-sm"
                placeholder="e.g. Acme, ACME Inc, Acme Corporation"
              />
              <p className="mt-1 text-xs text-th-text-muted">
                Other names AI models might use to refer to your brand
              </p>
              
              {/* Dynamic Example */}
              {data.brandName && (
                <p className="mt-2 text-xs italic text-th-text-muted">
                  Example for &quot;{data.brandName}&quot;: {generateAliasExamples(data.brandName)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}