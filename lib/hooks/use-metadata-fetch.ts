/**
 * Metadata Fetch Hook - Single Responsibility
 */

import { useState, useCallback, useRef } from "react";
import { BrandData } from "@/components/onboarding/steps/step-brand";
import { MetadataService } from "../services/onboarding-service";

interface UseMetadataFetchResult {
  isFetching: boolean;
  fetchError: string | null;
  fetchSuccess: string | null;
  fetchMetadata: (url: string, currentData: BrandData) => Promise<BrandData | null>;
  lastFetchedUrl: React.MutableRefObject<string | null>;
}

export function useMetadataFetch(
  onChange: (data: BrandData) => void
): UseMetadataFetchResult {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSuccess, setFetchSuccess] = useState<string | null>(null);
  const lastFetchedUrl = useRef<string | null>(null);

  const fetchMetadata = useCallback(async (
    url: string,
    currentData: BrandData
  ): Promise<BrandData | null> => {
    if (!url || url === lastFetchedUrl.current) return null;

    setIsFetching(true);
    setFetchError(null);
    setFetchSuccess(null);

    try {
      const metadata = await MetadataService.fetchWebsiteMetadata(url);
      const { data: newData, autoFilled } = MetadataService.extractAutoFilledFields(currentData, metadata);
      
      onChange(newData);
      lastFetchedUrl.current = url;
      
      if (autoFilled.length > 0) {
        setFetchSuccess(`Auto-filled ${autoFilled.join(", ")} from website`);
        setTimeout(() => setFetchSuccess(null), 3000);
      } else {
        setFetchSuccess("Website fetched, but no new data found to auto-fill");
        setTimeout(() => setFetchSuccess(null), 2000);
      }
      
      return newData;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch website data";
      setFetchError(message);
      return null;
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
}