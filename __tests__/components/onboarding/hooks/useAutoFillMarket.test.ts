/**
 * useAutoFillMarket Hook Tests
 * Comprehensive coverage of auto-fill logic including happy path and error scenarios
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useAutoFillMarket, AutoFillMarketParams } from '@/components/onboarding/hooks/useAutoFillMarket';

describe('useAutoFillMarket', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const validParams: AutoFillMarketParams = {
    brandName: 'Test Brand',
    brandAliases: 'TB',
    website: 'https://test.com',
    country: 'US',
  };

  describe('Happy Path - Auto-fill Success', () => {
    it('should successfully auto-fill market data', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              workspace: {
                industry: 'SaaS / Software',
                brandDescription: 'A software company',
              },
            }),
        });

      const { result } = renderHook(() => useAutoFillMarket());
      let autoFillResult;

      await waitFor(async () => {
        autoFillResult = await result.current.autoFillMarket(validParams);
      });

      expect(autoFillResult).toEqual({
        industry: 'SaaS / Software',
        brandDescription: 'A software company',
      });
    });

    it('should call PATCH endpoint with correct parameters', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              workspace: {
                industry: 'SaaS / Software',
                brandDescription: 'A software company',
              },
            }),
        });

      const { result } = renderHook(() => useAutoFillMarket());

      await waitFor(async () => {
        await result.current.autoFillMarket(validParams);
      });

      // Verify first call (PATCH)
      expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 2,
          industry: undefined,
          brandDescription: undefined,
          ...validParams,
        }),
      });

      // Verify second call (GET)
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/onboarding');
    });

    it('should handle all brand parameters correctly', async () => {
      const customParams: AutoFillMarketParams = {
        brandName: 'Custom Brand & Co.',
        brandAliases: 'CBC, Custom',
        website: 'https://custom-brand.io',
        country: 'CA',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              workspace: {
                industry: 'E-commerce',
                brandDescription: 'Custom brand description',
              },
            }),
        });

      const { result } = renderHook(() => useAutoFillMarket());

      await waitFor(async () => {
        await result.current.autoFillMarket(customParams);
      });

      const callBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as any).body
      );
      expect(callBody).toEqual({
        step: 2,
        industry: undefined,
        brandDescription: undefined,
        ...customParams,
      });
    });
  });

  describe('Error Scenarios - PATCH Failure', () => {
    it('should return null when PATCH request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useAutoFillMarket());
      let autoFillResult;

      await waitFor(async () => {
        autoFillResult = await result.current.autoFillMarket(validParams);
      });

      expect(autoFillResult).toBeNull();
    });

    it('should return null when PATCH throws error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAutoFillMarket());
      let autoFillResult;

      await waitFor(async () => {
        autoFillResult = await result.current.autoFillMarket(validParams);
      });

      expect(autoFillResult).toBeNull();
    });

    it('should log error when PATCH fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const { result } = renderHook(() => useAutoFillMarket());

      await waitFor(async () => {
        await result.current.autoFillMarket(validParams);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Auto-fill save failed:',
        400
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error Scenarios - GET Failure', () => {
    it('should return null when GET request fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      const { result } = renderHook(() => useAutoFillMarket());
      let autoFillResult;

      await waitFor(async () => {
        autoFillResult = await result.current.autoFillMarket(validParams);
      });

      expect(autoFillResult).toBeNull();
    });

    it('should return null when GET throws error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAutoFillMarket());
      let autoFillResult;

      await waitFor(async () => {
        autoFillResult = await result.current.autoFillMarket(validParams);
      });

      expect(autoFillResult).toBeNull();
    });

    it('should log error when GET fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const { result } = renderHook(() => useAutoFillMarket());

      await waitFor(async () => {
        await result.current.autoFillMarket(validParams);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Auto-fill fetch failed:',
        404
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases - Incomplete Data', () => {
    it('should return null when workspace data is missing', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

      const { result } = renderHook(() => useAutoFillMarket());
      let autoFillResult;

      await waitFor(async () => {
        autoFillResult = await result.current.autoFillMarket(validParams);
      });

      expect(autoFillResult).toBeNull();
    });

    it('should return null when industry is missing', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              workspace: {
                brandDescription: 'A software company',
              },
            }),
        });

      const { result } = renderHook(() => useAutoFillMarket());
      let autoFillResult;

      await waitFor(async () => {
        autoFillResult = await result.current.autoFillMarket(validParams);
      });

      expect(autoFillResult).toBeNull();
    });

    it('should return null when description is missing', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              workspace: {
                industry: 'SaaS / Software',
              },
            }),
        });

      const { result } = renderHook(() => useAutoFillMarket());
      let autoFillResult;

      await waitFor(async () => {
        autoFillResult = await result.current.autoFillMarket(validParams);
      });

      expect(autoFillResult).toBeNull();
    });

    it('should return null when both industry and description are empty strings', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              workspace: {
                industry: '',
                brandDescription: '',
              },
            }),
        });

      const { result } = renderHook(() => useAutoFillMarket());
      let autoFillResult;

      await waitFor(async () => {
        autoFillResult = await result.current.autoFillMarket(validParams);
      });

      expect(autoFillResult).toBeNull();
    });
  });

  describe('Hook Behavior', () => {
    it('should return a stable autoFillMarket function', () => {
      const { result, rerender } = renderHook(() => useAutoFillMarket());
      const firstFunction = result.current.autoFillMarket;

      rerender();

      const secondFunction = result.current.autoFillMarket;
      expect(firstFunction).toBe(secondFunction);
    });

    it('should handle multiple sequential calls', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              workspace: {
                industry: 'SaaS / Software',
                brandDescription: 'First brand',
              },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              workspace: {
                industry: 'E-commerce',
                brandDescription: 'Second brand',
              },
            }),
        });

      const { result } = renderHook(() => useAutoFillMarket());

      let firstResult, secondResult;

      await waitFor(async () => {
        firstResult = await result.current.autoFillMarket(validParams);
      });

      await waitFor(async () => {
        secondResult = await result.current.autoFillMarket({
          ...validParams,
          brandName: 'Another Brand',
        });
      });

      expect(firstResult).toEqual({
        industry: 'SaaS / Software',
        brandDescription: 'First brand',
      });

      expect(secondResult).toEqual({
        industry: 'E-commerce',
        brandDescription: 'Second brand',
      });
    });
  });
});
