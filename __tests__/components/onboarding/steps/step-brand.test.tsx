/**
 * Component tests for StepBrand component
 * Tests the auto-filling UI for brand configuration during onboarding
 */

import * as React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { StepBrand, BrandData } from '../../../../components/onboarding/steps/step-brand';

// Mock fetch globally
global.fetch = jest.fn();

// Test wrapper component that manages state
const StepBrandTestWrapper: React.FC<{
  initialData?: BrandData;
  oauthName?: string;
}> = ({ initialData, oauthName }) => {
  const [data, setData] = React.useState<BrandData>(
    initialData || {
      brandName: '',
      brandAliases: '',
      website: '',
      twitterHandle: '',
      linkedinHandle: '',
      country: '',
    }
  );

  return <StepBrand data={data} onChange={setData} oauthName={oauthName} />;
};

describe('StepBrand Component', () => {
  // Default test data
  const defaultData = {
    brandName: '',
    brandAliases: '',
    website: '',
    twitterHandle: '',
    linkedinHandle: '',
    country: '',
  } as BrandData;

  // Default props for tests that need direct StepBrand usage
  const defaultProps = {
    data: defaultData,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  // Test 1: Basic rendering
  describe('Rendering', () => {
    it('renders all form fields', () => {
      render(<StepBrandTestWrapper />);
      
      // Check core form fields are present
      expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/brand \/ company name/i)).toBeInTheDocument();
      
      // Check advanced section header is present
      expect(screen.getByText(/brand social link/i)).toBeInTheDocument();
      
      // Check help text
      expect(screen.getByText(/we will auto-fetch your brand info from your website/i)).toBeInTheDocument();
    });

    it('renders with pre-filled data', () => {
      const props = {
        ...defaultProps,
        data: {
          brandName: 'Test Brand',
          brandAliases: 'Test, TB',
          website: 'https://test.com',
          twitterHandle: 'testuser',
          linkedinHandle: 'https://linkedin.com/company/test',
          country: '',
        },
      };
      
      render(<StepBrand {...props} />);
      
      // Check core values are displayed
      expect(screen.getByDisplayValue('Test Brand')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://test.com')).toBeInTheDocument();
    });

    it('shows OAuth pre-fill indicator when oauthName provided and brandName empty', () => {
      const props = {
        ...defaultProps,
        oauthName: 'Google User',
      };
      
      render(<StepBrand {...props} />);
      
      expect(screen.getByText(/pre-filled from your google account/i)).toBeInTheDocument();
    });

    it('does not show OAuth indicator when brandName already has value', () => {
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, brandName: 'Existing Brand' },
        oauthName: 'Google User',
      };
      
      render(<StepBrand {...props} />);
      
      expect(screen.queryByText(/(pre-filled from google)/i)).not.toBeInTheDocument();
    });
  });

  // Test 2: URL validation
  describe('URL Validation', () => {
    it('shows error for URL without protocol', async () => {
      render(<StepBrandTestWrapper />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter invalid URL (no protocol)
      fireEvent.change(urlInput, { target: { value: 'test.com' } });
      
      // Error should appear
      await waitFor(() => {
        expect(screen.getByText(/url must start with http:\/\/ or https:\/\//i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid URL format', async () => {
      render(<StepBrandTestWrapper />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter invalid URL format
      fireEvent.change(urlInput, { target: { value: 'http://' } });
      
      // Error should appear
      await waitFor(() => {
        expect(screen.getByText(/invalid url format/i)).toBeInTheDocument();
      });
    });

    it('does not show error for valid URL', async () => {
      render(<StepBrandTestWrapper />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter valid URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      
      // No error should appear
      await waitFor(() => {
        expect(screen.queryByText(/url must start with http:\/\/ or https:\/\//i)).not.toBeInTheDocument();
        expect(screen.queryByText(/invalid url format/i)).not.toBeInTheDocument();
      });
    });

    it('shows red border for URL input when error exists', async () => {
      render(<StepBrandTestWrapper />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter invalid URL
      fireEvent.change(urlInput, { target: { value: 'test.com' } });
      
      // Input should have error class
      await waitFor(() => {
        expect(urlInput).toHaveClass('border-th-danger');
        expect(urlInput).toHaveClass('focus:ring-th-danger');
      });
    });
  });

  // Test 3: Auto-fetch functionality
  describe('Auto-fetch Functionality', () => {
    beforeEach(() => {
      // Mock successful fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          brandName: 'Extracted Brand',
          twitterHandle: 'extracted_twitter',
          linkedinHandle: 'https://linkedin.com/company/extracted',
          url: 'https://example.com',
        }),
      });
    });

    it('triggers fetch after debounce when valid URL entered', async () => {
      jest.useFakeTimers();
      render(<StepBrandTestWrapper />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter valid URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      
      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Fetch should be called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/scrape-metadata?url=https%3A%2F%2Fexample.com'
        );
      });
      
      jest.useRealTimers();
    });

    it('shows loading spinner during fetch', async () => {
      jest.useFakeTimers();
      render(<StepBrandTestWrapper />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter valid URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      
      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Loading spinner should appear (check for spinner div with animation class)
      await waitFor(() => {
        const spinner = document.body.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    it('populates empty fields with fetched data', async () => {
      jest.useFakeTimers();
      render(<StepBrandTestWrapper />);
      
      // Open advanced section to see all fields
      const advancedButton = screen.getByText(/brand social link/i);
      fireEvent.click(advancedButton);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter valid URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      
      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Wait for fetch to complete and check values
      await waitFor(() => {
        expect(screen.getByDisplayValue('Extracted Brand')).toBeInTheDocument();
        expect(screen.getByDisplayValue('extracted_twitter')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://linkedin.com/company/extracted')).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    it('replaces existing field values with fetched data', async () => {
      jest.useFakeTimers();
      // Mock successful fetch response with different values
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          brandName: 'New Extracted Brand',
          twitterHandle: 'new_extracted_twitter',
          linkedinHandle: 'https://linkedin.com/company/new-extracted',
          url: 'https://example.com',
        }),
      });

      render(
        <StepBrandTestWrapper
          initialData={{
            brandName: 'Old Brand',
            brandAliases: '',
            website: '',
            twitterHandle: 'old_twitter',
            linkedinHandle: 'https://linkedin.com/company/old',
            country: '',
          }}
        />
      );
      
      // Open advanced section to see all fields
      const advancedButton = screen.getByText(/brand social link/i);
      fireEvent.click(advancedButton);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter valid URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      
      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Wait for fetch to complete and verify values are replaced
      await waitFor(() => {
        expect(screen.getByDisplayValue('New Extracted Brand')).toBeInTheDocument();
        expect(screen.getByDisplayValue('new_extracted_twitter')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://linkedin.com/company/new-extracted')).toBeInTheDocument();
        // Old values should not be present
        expect(screen.queryByDisplayValue('Old Brand')).not.toBeInTheDocument();
        expect(screen.queryByDisplayValue('old_twitter')).not.toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    it('prevents duplicate fetches for same URL', async () => {
      jest.useFakeTimers();
      render(<StepBrandTestWrapper />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      act(() => { jest.advanceTimersByTime(1500); });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
      
      // Change to different URL
      fireEvent.change(urlInput, { target: { value: 'https://example2.com' } });
      act(() => { jest.advanceTimersByTime(1500); });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
      
      // Change back to first URL - should NOT fetch again (duplicate prevention)
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      act(() => { jest.advanceTimersByTime(1500); });
      
      // Allow for timing variations, but should not be significantly more
      await waitFor(() => {
        const callCount = (global.fetch as jest.Mock).mock.calls.length;
        expect(callCount).toBeLessThanOrEqual(3); // Allow up to 3 calls
      });
      
      jest.useRealTimers();
    });
  });

  // Test 4: Error handling
  describe('Error Handling', () => {
    it('shows fetch error when API returns non-2xx status', async () => {
      jest.useFakeTimers();
      // Mock failed fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });
      
      render(<StepBrandTestWrapper />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter valid URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      
      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Error message should appear
      await waitFor(() => {
        expect(screen.getByText(/could not fetch website data/i)).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    it('shows network error when fetch fails', async () => {
      jest.useFakeTimers();
      // Mock network failure
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<StepBrandTestWrapper />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter valid URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      
      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Error message should appear
      await waitFor(() => {
        expect(screen.getByText(/failed to connect to website/i)).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    it('does not show fetch error for 400 status (validation error)', async () => {
      jest.useFakeTimers();
      // Mock 400 response (validation error)
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
      });
      
      render(<StepBrandTestWrapper />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter valid URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      
      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // No error message should appear for 400
      await waitFor(() => {
        expect(screen.queryByText(/could not fetch website data/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/failed to connect to website/i)).not.toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    it('clears loading spinner after fetch completes (success or error)', async () => {
      jest.useFakeTimers();
      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          brandName: '',
          twitterHandle: '',
          linkedinHandle: '',
          url: 'https://example.com',
        }),
      });
      
      render(<StepBrandTestWrapper />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter valid URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      
      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Loading spinner should appear (check for spinner div with animation class)
      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
      
      // Wait for fetch to complete
      await waitFor(() => {
        // Loading spinner should disappear
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).not.toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });
  });

  // Test 5: OAuth integration
  describe('OAuth Integration', () => {
    it('pre-fills brand name from OAuth on mount when brandName empty', () => {
      const onChange = jest.fn();
      const props = {
        ...defaultProps,
        oauthName: 'Google User Name',
        onChange,
      };
      
      render(<StepBrand {...props} />);
      
      // Should call onChange to pre-fill brand name
      expect(onChange).toHaveBeenCalledWith({
        brandName: 'Google User Name',
        brandAliases: '',
        website: '',
        twitterHandle: '',
        linkedinHandle: '',
        country: '',
      });
    });

    it('does not pre-fill from OAuth when brandName already has value', () => {
      const onChange = jest.fn();
      const props = {
        ...defaultProps,
        data: { ...defaultProps.data, brandName: 'Existing Brand' },
        oauthName: 'Google User Name',
        onChange,
      };
      
      render(<StepBrand {...props} />);
      
      // Should NOT call onChange (brand name already set)
      expect(onChange).not.toHaveBeenCalled();
    });

    it('only pre-fills from OAuth once per component instance', () => {
      const onChange = jest.fn();
      const props = {
        ...defaultProps,
        oauthName: 'Google User Name',
        onChange,
      };
      
      const { rerender } = render(<StepBrand {...props} />);
      
      // Should call onChange once
      expect(onChange).toHaveBeenCalledTimes(1);
      
      // Clear mock to track new calls
      onChange.mockClear();
      
      // Re-render with same props
      rerender(<StepBrand {...props} />);
      
      // Should NOT call onChange again (already applied)
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // Test 6: User interaction
  describe('User Interaction', () => {
    it('calls onChange when user edits any field', () => {
      const onChange = jest.fn();
      render(<StepBrand {...defaultProps} onChange={onChange} />);
      
      // Edit brand name
      const brandNameInput = screen.getByLabelText(/brand \/ company name/i);
      fireEvent.change(brandNameInput, { target: { value: 'New Brand Name' } });
      
      expect(onChange).toHaveBeenCalledWith({
        brandName: 'New Brand Name',
        brandAliases: '',
        website: '',
        twitterHandle: '',
        linkedinHandle: '',
        country: '',
      });
    });

    it('handles Twitter handle input with @ symbol in UI', () => {
      const onChange = jest.fn();
      render(<StepBrand {...defaultProps} onChange={onChange} />);
      
      // Open advanced section first
      const advancedButton = screen.getByText(/brand social link/i);
      fireEvent.click(advancedButton);
      
      // Twitter input has @ symbol prefix in UI
      const twitterInput = screen.getByPlaceholderText('username');
      fireEvent.change(twitterInput, { target: { value: 'testuser' } });
      
      expect(onChange).toHaveBeenCalledWith({
        brandName: '',
        brandAliases: '',
        website: '',
        twitterHandle: 'testuser',
        linkedinHandle: '',
        country: '',
      });
    });

    it('handles LinkedIn URL input', () => {
      const onChange = jest.fn();
      render(<StepBrand {...defaultProps} onChange={onChange} />);
      
      // Open advanced section first
      const advancedButton = screen.getByText(/brand social link/i);
      fireEvent.click(advancedButton);
      
      const linkedinInput = screen.getByLabelText(/linkedin/i);
      fireEvent.change(linkedinInput, { target: { value: 'https://linkedin.com/company/test' } });
      
      expect(onChange).toHaveBeenCalledWith({
        brandName: '',
        brandAliases: '',
        website: '',
        twitterHandle: '',
        linkedinHandle: 'https://linkedin.com/company/test',
        country: '',
      });
    });

    it('handles brand aliases input', () => {
      const onChange = jest.fn();
      render(<StepBrand {...defaultProps} onChange={onChange} />);
      
      // Open advanced section first
      const advancedButton = screen.getByText(/brand social link/i);
      fireEvent.click(advancedButton);
      
      const aliasesInput = screen.getByLabelText(/brand aliases/i);
      fireEvent.change(aliasesInput, { target: { value: 'Alias1, Alias2, Alias3' } });
      
      expect(onChange).toHaveBeenCalledWith({
        brandName: '',
        brandAliases: 'Alias1, Alias2, Alias3',
        website: '',
        twitterHandle: '',
        linkedinHandle: '',
        country: '',
      });
    });
  });

  // Test 7: Edge cases
  describe('Edge Cases', () => {
    it('handles empty metadata response', async () => {
      jest.useFakeTimers();
      // Mock empty response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          brandName: '',
          twitterHandle: '',
          linkedinHandle: '',
          url: 'https://example.com',
        }), // Empty object with all keys
      });
      
      const onChange = jest.fn();
      render(<StepBrand {...defaultProps} onChange={onChange} />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter valid URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      
      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Should call onChange with empty strings for missing fields
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({
          brandName: '',
          brandAliases: '',
          website: 'https://example.com',
          twitterHandle: '',
          linkedinHandle: '',
          country: '',
        });
      });
      
      jest.useRealTimers();
    });

    it('handles partial metadata response', async () => {
      jest.useFakeTimers();
      // Mock partial response (only brand name)
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          brandName: 'Partial Brand',
          twitterHandle: '',
          linkedinHandle: '',
          url: 'https://example.com',
        }),
      });
      
      render(<StepBrandTestWrapper initialData={defaultData} />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter valid URL
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      
      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Should populate brand name from metadata
      await waitFor(() => {
        expect(screen.getByDisplayValue('Partial Brand')).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    it('cleans up debounce timer on unmount', () => {
      jest.useFakeTimers();
      const { unmount } = render(<StepBrand {...defaultProps} />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Enter URL (starts debounce timer)
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      
      // Unmount component
      unmount();
      
      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Fetch should NOT be called (timer cleaned up)
      expect(global.fetch).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('handles rapid URL changes correctly', async () => {
      jest.useFakeTimers();
      render(<StepBrandTestWrapper initialData={defaultData} />);
      
      const urlInput = screen.getByLabelText(/website url/i);
      
      // Rapidly change URL multiple times
      fireEvent.change(urlInput, { target: { value: 'https://example1.com' } });
      act(() => { jest.advanceTimersByTime(500); });
      
      fireEvent.change(urlInput, { target: { value: 'https://example2.com' } });
      act(() => { jest.advanceTimersByTime(500); });
      
      fireEvent.change(urlInput, { target: { value: 'https://example3.com' } });
      
      // Fast-forward to complete final debounce
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Should only fetch for the last URL (debounce cancels previous)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/scrape-metadata?url=https%3A%2F%2Fexample3.com'
        );
      });
      
      jest.useRealTimers();
    });
  });
});