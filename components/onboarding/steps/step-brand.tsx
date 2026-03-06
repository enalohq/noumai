"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { searchCountries, findCountry, type CountryOption } from "@/lib/constants/countries";
import { generateAliasExamples } from "./brand-utils";
import * as Flags from "country-flag-icons/react/3x2";

// Helper component to render country flag dynamically
interface FlagProps {
  countryCode: string;
  className?: string;
}

function CountryFlag({ countryCode, className = "" }: FlagProps) {
  // Convert country code to the format used in the package (e.g., "US" -> "US", "GB" -> "GB")
  // Some codes might need transformation (e.g., "GB-ENG" -> "GB_ENG")
  const normalizedCode = countryCode.toUpperCase().replace(/-/g, "_");
  
  // Try to get the flag component dynamically
  // Type assertion to access dynamic property
  type FlagComponentType = React.ComponentType<{ className?: string }>;
  const FlagComponent = (Flags as Record<string, FlagComponentType>)[normalizedCode];
  
  if (!FlagComponent) {
    // Fallback: return a placeholder
    return (
      <div className={`flex h-5 w-7 items-center justify-center rounded border border-gray-200 bg-gray-100 ${className}`}>
        <span className="text-xs text-gray-500">{countryCode}</span>
      </div>
    );
  }

  return <FlagComponent className={`h-4 w-6 object-cover ${className}`} />;
}

export interface BrandData {
  brandName: string;
  brandAliases: string;
  website: string;
  twitterHandle: string;
  linkedinHandle: string;
  country: string;
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
  const [countryDisplay, setCountryDisplay] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [isCountryAutoDetected, setIsCountryAutoDetected] = useState(false);
  const countryInputRef = useRef<HTMLInputElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  
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

        // Auto-fill country if available
        if (metadata.country && !current.country) {
          const foundCountry = findCountry(metadata.country);
          if (foundCountry) {
            newData.country = foundCountry.name;
            setCountryDisplay(foundCountry.name);
            setIsCountryAutoDetected(true);
            autoFilled.push("country");
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
    } else if (field === "country") {
      // Handle country input for search
      const value = e.target.value;
      setCountryDisplay(value);
      setIsCountryAutoDetected(false);
      
      // Show dropdown if there's text
      if (value.trim()) {
        setShowCountryDropdown(true);
      } else {
        setShowCountryDropdown(false);
      }
      
      // If it matches a country exactly, select it
      const foundCountry = findCountry(value);
      if (foundCountry) {
        onChange({ ...data, country: foundCountry.name });
        setCountryDisplay(foundCountry.name);
        setShowCountryDropdown(false);
      } else {
        onChange({ ...data, country: value });
      }
      return;
    }
    onChange({ ...data, [field]: e.target.value });
  };

  // Handle country selection from dropdown
  const handleCountrySelect = (country: CountryOption) => {
    onChange({ ...data, country: country.name });
    setCountryDisplay(country.name);
    setShowCountryDropdown(false);
    setIsCountryAutoDetected(false);
  };



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current && 
        !countryDropdownRef.current.contains(event.target as Node) &&
        countryInputRef.current && 
        !countryInputRef.current.contains(event.target as Node)
      ) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize country display with current country value
  useEffect(() => {
    if (data.country) {
      const foundCountry = findCountry(data.country);
      if (foundCountry) {
        setCountryDisplay(foundCountry.name);
      } else {
        setCountryDisplay(data.country);
      }
    }
  }, [data.country]);

  // Get filtered countries for dropdown
  const getSearchText = (display: string): string => {
    if (!display.trim()) return "";
    
    // We're not showing flag emojis in the input, so just return the text
    return display.trim();
  };
  
  const filteredCountries = searchCountries(getSearchText(countryDisplay));



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

        {/* Country */}
        <div className="relative">
          <div className="mb-1.5 flex items-center gap-1">
            <label htmlFor="country" className="text-sm font-semibold text-th-text">
              Country <span className="text-th-danger">*</span>
            </label>
            <button
              type="button"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-th-border text-xs text-th-text-muted hover:bg-th-border-dark"
              aria-label="Why do we need country?"
              // title="Helps us find local competitors and market trends"
              title="Your coutry of operation"
            >
              ?
            </button>
            {/* {isCountryAutoDetected && (
              <span className="ml-2 text-xs font-normal text-green-600">
                ✓ Auto-detected
              </span>
            )} */}
          </div>
          <div className="relative" ref={countryDropdownRef}>
            <div className="relative">
            <input
              ref={countryInputRef}
              id="country"
              type="text"
              value={countryDisplay}
              onChange={set("country")}
              onFocus={() => setShowCountryDropdown(true)}
                className="bd-input w-full rounded-lg py-2.5 pl-10 pr-2.5 text-sm"
              placeholder="Type to search countries..."
              required
            />
              {data.country && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <CountryFlag 
                    countryCode={findCountry(data.country)?.code || data.country.slice(0, 2).toUpperCase()} 
                    className="h-4 w-6"
                  />
                </div>
              )}
            </div>
            {showCountryDropdown && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-th-border bg-white shadow-lg">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100"
                      onClick={() => handleCountrySelect(country)}
                    >
                      <div className="flex h-5 w-7 items-center justify-center overflow-hidden rounded border border-gray-200">
                        <CountryFlag countryCode={country.code} className="h-4 w-6 object-cover" />
                      </div>
                      <span className="flex-1">{country.name}</span>
                      {country.aliases.length > 0 && country.aliases[0] !== country.code && (
                        <span className="text-xs text-gray-500">
                          {country.aliases[0]}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No countries found
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-th-text-muted">
            Helps us find your competitors and market trends
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