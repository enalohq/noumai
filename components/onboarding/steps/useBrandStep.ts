"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrandData } from "./step-brand";

// Custom hook for URL validation (Single Responsibility)
export const useUrlValidation = () => {
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

  return { validateUrl };
};

// Custom hook for metadata fetching (Single Responsibility)
export const useMetadataFetch = (
  data: BrandData,
  onChange: (data: BrandData) => void
) => {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSuccess, setFetchSuccess] = useState<string | null>(null);
  const lastFetchedUrl = useRef<string | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

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
        
        // Always replace values from API response (not just empty fields)
        const current = dataRef.current;
        const newData = { ...current };
        
        if (metadata.brandName) {
          newData.brandName = metadata.brandName;
          autoFilled.push("brand name");
        }
        
        // Always replace social handles from API response
        newData.twitterHandle = metadata.twitterHandle;
        if (metadata.twitterHandle) {
          autoFilled.push("Twitter handle");
        }
        
        newData.linkedinHandle = metadata.linkedinHandle;
        if (metadata.linkedinHandle) {
          autoFilled.push("LinkedIn URL");
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

  return {
    isFetching,
    fetchError,
    fetchSuccess,
    fetchMetadata,
    lastFetchedUrl
  };
};

// Custom hook for debounced auto-fetch (Single Responsibility)
export const useDebouncedAutoFetch = (
  website: string,
  validateUrl: (url: string) => string | null,
  fetchMetadata: (url: string) => Promise<void>,
  lastFetchedUrl: React.MutableRefObject<string | null>,
  debounceTime: number = 1000 // Default 1s debounce
) => {
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    const error = validateUrl(website);
    setUrlError(error);

    if (!error && website && website !== lastFetchedUrl.current) {
      const timer = setTimeout(() => {
        fetchMetadata(website);
      }, debounceTime);
      return () => clearTimeout(timer);
    }
  }, [website, validateUrl, fetchMetadata, lastFetchedUrl, debounceTime]);

  return { urlError };
};

// Custom hook for OAuth integration (Single Responsibility)
export const useOAuthIntegration = (
  oauthName: string | undefined,
  brandName: string,
  onChange: (data: BrandData) => void,
  data: BrandData
) => {
  const oauthApplied = useRef(false);

  useEffect(() => {
    if (oauthName && !brandName && !oauthApplied.current) {
      oauthApplied.current = true;
      onChange({ ...data, brandName: oauthName });
    }
  }, [oauthName, brandName, onChange, data]);

  return { oauthApplied };
};