/**
 * Onboarding Service - Business logic layer
 * Follows Single Responsibility Principle
 */

import { BrandData } from "@/components/onboarding/steps/step-brand";
import { MarketData } from "@/components/onboarding/steps/step-market";
import { CompetitorData } from "@/components/onboarding/steps/step-competitors";
import { PromptsData } from "@/components/onboarding/steps/step-prompts";

export interface OnboardingState {
  brand: BrandData;
  market: MarketData;
  competitors: CompetitorData[];
  prompts: PromptsData;
}

export interface SaveProgressRequest {
  step: number;
  data: Partial<OnboardingState>;
}

export interface SaveProgressResponse {
  success: boolean;
  message?: string;
  currentStep?: number;
}

/**
 * Validation Service - Single Responsibility
 */
export class ValidationService {
  static validateUrl(url: string): string | null {
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
  }

  static validateBrandData(data: BrandData): string | null {
    if (!data.brandName?.trim()) return "Brand name is required";
    if (!data.website?.trim()) return "Website URL is required";
    return ValidationService.validateUrl(data.website);
  }

  static validateMarketData(data: MarketData): string | null {
    if (!data.industry) return "Industry is required";
    if (!data.brandDescription?.trim()) return "Brand description is required";
    return null;
  }

  static isValidTwitterHandle(handle: string | undefined): boolean {
    if (!handle) return false;
    return /^[a-z0-9_]{1,15}$/.test(handle);
  }
}

/**
 * Metadata Service - Single Responsibility
 */
export class MetadataService {
  static async fetchWebsiteMetadata(url: string): Promise<{
    brandName?: string;
    twitterHandle?: string;
    linkedinHandle?: string;
    url: string;
  }> {
    try {
      const encodedUrl = encodeURIComponent(url);
      const res = await fetch(`/api/scrape-metadata?url=${encodedUrl}`);
      
      if (!res.ok) {
        if (res.status === 400) {
          throw new Error("Invalid URL format");
        }
        throw new Error("Could not fetch website data");
      }
      
      return await res.json();
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid URL format") {
        throw error;
      }
      throw new Error("Failed to connect to website");
    }
  }

  static extractAutoFilledFields(
    currentData: BrandData,
    metadata: any
  ): { data: BrandData; autoFilled: string[] } {
    const autoFilled: string[] = [];
    const newData = { ...currentData };
    
    // Always replace values from API response (not just empty fields)
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
    
    return { data: newData, autoFilled };
  }
}

/**
 * Onboarding API Service - Single Responsibility
 */
export class OnboardingApiService {
  static async loadProgress(): Promise<{
    workspace?: any;
    savedStarterPrompts?: any[];
    currentStep?: number;
  }> {
    const res = await fetch("/api/onboarding");
    
    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    
    if (!res.ok) {
      throw new Error("Failed to load progress");
    }
    
    return await res.json();
  }

  static async saveProgress(step: number, data: any): Promise<SaveProgressResponse> {
    const res = await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step, ...data }),
    });
    
    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    
    if (!res.ok) {
      throw new Error("Failed to save progress");
    }
    
    return { success: true, message: "Progress saved" };
  }

  static async skipOnboarding(): Promise<void> {
    const res = await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skip: true }),
    });
    
    if (!res.ok) {
      throw new Error("Failed to skip onboarding");
    }
  }
}

/**
 * OAuth Service - Single Responsibility
 */
export class OAuthService {
  static shouldApplyOAuth(
    oauthName: string | undefined,
    currentBrandName: string,
    oauthApplied: boolean
  ): boolean {
    return !!(oauthName && !currentBrandName && !oauthApplied);
  }

  static applyOAuth(
    currentData: BrandData,
    oauthName: string
  ): BrandData {
    return { ...currentData, brandName: oauthName };
  }
}