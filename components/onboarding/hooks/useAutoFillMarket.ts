/**
 * useAutoFillMarket Hook
 * Handles auto-filling market details after brand step completion
 * Follows SRP: Single responsibility for auto-fill logic
 */

import { useCallback } from 'react';

export interface AutoFillMarketParams {
  brandName: string;
  brandAliases: string;
  website: string;
  country: string;
}

export interface AutoFillMarketResult {
  industry: string;
  brandDescription: string;
}

export function useAutoFillMarket() {
  const autoFillMarket = useCallback(
    async (params: AutoFillMarketParams): Promise<AutoFillMarketResult | null> => {
      try {
        // Step 1: Save brand data with auto-fill request
        const saveRes = await fetch('/api/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: 2,
            industry: undefined,
            brandDescription: undefined,
            ...params,
          }),
        });

        if (!saveRes.ok) {
          console.error('Auto-fill save failed:', saveRes.status);
          return null;
        }

        // Step 2: Fetch updated data
        const fetchRes = await fetch('/api/onboarding');
        if (!fetchRes.ok) {
          console.error('Auto-fill fetch failed:', fetchRes.status);
          return null;
        }

        const data = await fetchRes.json();
        if (data.workspace?.industry && data.workspace?.brandDescription) {
          return {
            industry: data.workspace.industry,
            brandDescription: data.workspace.brandDescription,
          };
        }

        return null;
      } catch (error) {
        console.error('Auto-fill error:', error);
        return null;
      }
    },
    []
  );

  return { autoFillMarket };
}
