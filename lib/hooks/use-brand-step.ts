/**
 * Brand Step Hook - Coordinates multiple services
 * Follows Dependency Inversion Principle
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { BrandData } from "@/components/onboarding/steps/step-brand";
import { ValidationService, OAuthService } from "../services/onboarding-service";
import { useDebounce } from "./use-debounce";
import { useMetadataFetch } from "./use-metadata-fetch";

interface UseBrandStepProps {
  data: BrandData;
  onChange: (data: BrandData) => void;
  oauthName?: string;
}

interface UseBrandStepResult {
  urlError: string | null;
  isFetching: boolean;
  fetchError: string | null;
  fetchSuccess: string | null;
  handleFieldChange: (field: keyof BrandData) => (value: string) => void;
  handleWebsiteChange: (value: string) => void;
}

export function useBrandStep({
  data,
  onChange,
  oauthName
}: UseBrandStepProps): UseBrandStepResult {
  // State
  const [urlError, setUrlError] = useState<string | null>(null);
  const oauthApplied = useRef(false);
  
  // Services
  const {
    isFetching,
    fetchError,
    fetchSuccess,
    fetchMetadata,
    lastFetchedUrl
  } = useMetadataFetch(onChange);
  
  // OAuth Integration
  useEffect(() => {
    if (OAuthService.shouldApplyOAuth(oauthName, data.brandName, oauthApplied.current)) {
      oauthApplied.current = true;
      onChange(OAuthService.applyOAuth(data, oauthName!));
    }
  }, [oauthName, data.brandName, onChange, data]);
  
  // Field change handler
  const handleFieldChange = useCallback((field: keyof BrandData) => 
    (value: string) => {
      onChange({ ...data, [field]: value });
    }, [data, onChange]);
  
  // Website change handler with debounced fetch
  const debouncedFetch = useDebounce(async (url: string) => {
    if (!urlError && url && url !== lastFetchedUrl.current) {
      await fetchMetadata(url, data);
    }
  }, 1000);
  
  const handleWebsiteChange = useCallback((value: string) => {
    const error = ValidationService.validateUrl(value);
    setUrlError(error);
    onChange({ ...data, website: value });
    
    if (!error && value && value !== lastFetchedUrl.current) {
      debouncedFetch(value);
    }
  }, [data, onChange, debouncedFetch, lastFetchedUrl]);
  
  return {
    urlError,
    isFetching,
    fetchError,
    fetchSuccess,
    handleFieldChange,
    handleWebsiteChange
  };
}