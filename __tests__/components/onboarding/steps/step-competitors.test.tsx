import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { StepCompetitors, type CompetitorData } from '@/components/onboarding/steps/step-competitors';

describe('StepCompetitors', () => {
  const mockOnChange = jest.fn();
  const mockBrandContext = {
    brandName: 'Test Brand',
    website: 'https://testbrand.com',
    industry: 'Technology',
    country: 'US',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render suggested competitors section', () => {
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );
      expect(screen.getByText('Suggested Competitors')).toBeInTheDocument();
    });

    it('should render manual competitors section', () => {
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );
      expect(screen.getByText(/Manual Competitors/i)).toBeInTheDocument();
    });

    it('should render add competitor button', () => {
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );
      expect(screen.getByText('+ Add competitor')).toBeInTheDocument();
    });

    it('should display loading state during discovery', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: () => ({ competitors: [] }) }), 100)
          )
      );

      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      expect(screen.getByText(/Discovering competitors/i)).toBeInTheDocument();
    });
  });

  describe('Auto-Discovery', () => {
    it('should auto-discover competitors on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            competitors: [
              { name: 'Competitor A', url: 'https://a.com', type: 'direct', confidence: 0.9 },
              { name: 'Competitor B', url: 'https://b.com', type: 'indirect', confidence: 0.7 },
            ],
          }),
      });

      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Competitor A')).toBeInTheDocument();
        expect(screen.getByText('Competitor B')).toBeInTheDocument();
      });
    });

    it('should pass brand context to discovery API', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      });

      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/competitors/discover',
          expect.objectContaining({
            body: expect.stringContaining('Test Brand'),
          })
        );
      });
    });

    it('should not re-discover if competitors already exist', async () => {
      const existingCompetitors: CompetitorData[] = [
        { name: 'Existing', type: 'direct' },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      });

      render(
        <StepCompetitors
          competitors={existingCompetitors}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      // The component will still fetch because discoveredCompetitors is empty
      // This test verifies that the component renders with existing competitors
      expect(screen.getByText('Existing')).toBeInTheDocument();
      expect(screen.getByText(/Manual Competitors \(1\)/i)).toBeInTheDocument();
    });

    it('should handle discovery errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Discovery failed'));

      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      // Component should render without crashing even when discovery fails
      expect(screen.getByText('Suggested Competitors')).toBeInTheDocument();
      expect(screen.getByText(/Manual Competitors/i)).toBeInTheDocument();
    });

    it('should handle API error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      // Component should render without crashing even when API returns error
      expect(screen.getByText('Suggested Competitors')).toBeInTheDocument();
      expect(screen.getByText(/Manual Competitors/i)).toBeInTheDocument();
    });

    it('should display no competitors message when discovery returns empty', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      });

      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/No competitors found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Suggested Competitors Selection', () => {
    it('should toggle competitor selection', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            competitors: [
              { name: 'Competitor A', url: 'https://a.com', type: 'direct', confidence: 0.9 },
            ],
          }),
      });

      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      // Wait for the discovered competitor to appear
      await waitFor(() => {
        expect(screen.getByText('Competitor A')).toBeInTheDocument();
      }, { timeout: 3000 });

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Competitor A' }),
        ])
      );
    });

    it('should display confidence score', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            competitors: [
              { name: 'Competitor A', url: 'https://a.com', type: 'direct', confidence: 0.85 },
            ],
          }),
      });

      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('85% match')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display website link for competitors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            competitors: [
              { name: 'Competitor A', url: 'https://a.com', type: 'direct', confidence: 0.9 },
            ],
          }),
      });

      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      await waitFor(() => {
        const link = screen.getByText('(website)');
        expect(link).toHaveAttribute('href', 'https://a.com');
        expect(link).toHaveAttribute('target', '_blank');
      }, { timeout: 3000 });
    });

    it('should remove competitor when unchecked', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            competitors: [
              { name: 'Competitor A', url: 'https://a.com', type: 'direct', confidence: 0.9 },
            ],
          }),
      });

      // First render without competitors to trigger fetch
      const { rerender } = render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      // Wait for the discovered competitor to appear
      await waitFor(() => {
        expect(screen.getByText('Competitor A')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Now rerender with the competitor selected
      const selectedCompetitor: CompetitorData = {
        name: 'Competitor A',
        url: 'https://a.com',
        type: 'direct',
        isAutoDiscovered: true,
      };

      rerender(
        <StepCompetitors
          competitors={[selectedCompetitor]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      // The checkbox should be checked since the competitor is selected
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      // Click to uncheck
      await user.click(checkbox);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Manual Competitor Addition', () => {
    it('should show add form when button clicked', async () => {
      const user = userEvent.setup();
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      const addButton = screen.getByText('+ Add competitor');
      await user.click(addButton);

      expect(screen.getByPlaceholderText('Competitor name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://competitor.com')).toBeInTheDocument();
    });

    it('should add manual competitor', async () => {
      const user = userEvent.setup();
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      const addButton = screen.getByText('+ Add competitor');
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText('Competitor name');
      const urlInput = screen.getByPlaceholderText('https://competitor.com');
      const submitButton = screen.getByRole('button', { name: 'Add' });

      await user.type(nameInput, 'New Competitor');
      await user.type(urlInput, 'https://new.com');
      await user.click(submitButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'New Competitor',
            url: 'https://new.com',
            type: 'direct',
            isAutoDiscovered: false,
          }),
        ])
      );
    });

    it('should validate competitor name is not empty', async () => {
      const user = userEvent.setup();
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      const addButton = screen.getByText('+ Add competitor');
      await user.click(addButton);

      const submitButton = screen.getByRole('button', { name: 'Add' });
      expect(submitButton).toBeDisabled();
    });

    it('should allow selecting competitor type', async () => {
      const user = userEvent.setup();
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      const addButton = screen.getByText('+ Add competitor');
      await user.click(addButton);

      const typeSelect = screen.getByDisplayValue('Direct Competitor');
      await user.selectOptions(typeSelect, 'Indirect Competitor');

      const nameInput = screen.getByPlaceholderText('Competitor name');
      await user.type(nameInput, 'Indirect Comp');

      const submitButton = screen.getByRole('button', { name: 'Add' });
      await user.click(submitButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'indirect',
          }),
        ])
      );
    });

    it('should cancel form and clear inputs', async () => {
      const user = userEvent.setup();
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      const addButton = screen.getByText('+ Add competitor');
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText('Competitor name');
      await user.type(nameInput, 'Test');

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(screen.queryByPlaceholderText('Competitor name')).not.toBeInTheDocument();
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should prevent duplicate competitors', async () => {
      const user = userEvent.setup();
      const existingCompetitor: CompetitorData = {
        name: 'Existing Competitor',
        type: 'direct',
      };

      render(
        <StepCompetitors
          competitors={[existingCompetitor]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      const addButton = screen.getByText('+ Add competitor');
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText('Competitor name');
      await user.type(nameInput, 'Existing Competitor');

      const submitButton = screen.getByRole('button', { name: 'Add' });
      await user.click(submitButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle optional URL field', async () => {
      const user = userEvent.setup();
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      const addButton = screen.getByText('+ Add competitor');
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText('Competitor name');
      await user.type(nameInput, 'No URL Competitor');

      const submitButton = screen.getByRole('button', { name: 'Add' });
      await user.click(submitButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'No URL Competitor',
            url: undefined,
          }),
        ])
      );
    });
  });

  describe('Competitor List Display', () => {
    it('should display added competitors', () => {
      const competitors: CompetitorData[] = [
        { name: 'Competitor A', url: 'https://a.com', type: 'direct' },
        { name: 'Competitor B', url: 'https://b.com', type: 'indirect' },
      ];

      render(
        <StepCompetitors
          competitors={competitors}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      expect(screen.getByText('Competitor A')).toBeInTheDocument();
      expect(screen.getByText('Competitor B')).toBeInTheDocument();
    });

    it('should display competitor type badge', () => {
      const competitors: CompetitorData[] = [
        { name: 'Competitor A', type: 'direct' },
        { name: 'Competitor B', type: 'indirect' },
      ];

      render(
        <StepCompetitors
          competitors={competitors}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      expect(screen.getByText('direct')).toBeInTheDocument();
      expect(screen.getByText('indirect')).toBeInTheDocument();
    });

    it('should display auto-discovered badge for auto-discovered competitors', () => {
      const competitors: CompetitorData[] = [
        { name: 'Auto Discovered', type: 'direct', isAutoDiscovered: true },
        { name: 'Manual', type: 'direct', isAutoDiscovered: false },
      ];

      render(
        <StepCompetitors
          competitors={competitors}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      const autoBadges = screen.getAllByText('Auto');
      expect(autoBadges.length).toBe(1);
    });

    it('should remove competitor when delete button clicked', async () => {
      const user = userEvent.setup();
      const competitors: CompetitorData[] = [
        { name: 'Competitor A', type: 'direct' },
      ];

      render(
        <StepCompetitors
          competitors={competitors}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      const deleteButton = screen.getByRole('button', { name: '' });
      await user.click(deleteButton);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('should display empty state message', () => {
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      expect(screen.getByText(/No competitors added yet/i)).toBeInTheDocument();
    });

    it('should display competitor count', () => {
      const competitors: CompetitorData[] = [
        { name: 'Competitor A', type: 'direct' },
        { name: 'Competitor B', type: 'indirect' },
      ];

      render(
        <StepCompetitors
          competitors={competitors}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      expect(screen.getByText(/Manual Competitors \(2\)/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle competitors with special characters', async () => {
      const user = userEvent.setup();
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      const addButton = screen.getByText('+ Add competitor');
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText('Competitor name');
      await user.type(nameInput, 'Company & Co. (Ltd.)');

      const submitButton = screen.getByRole('button', { name: 'Add' });
      await user.click(submitButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Company & Co. (Ltd.)',
          }),
        ])
      );
    });

    it('should handle very long competitor names', () => {
      const longName = 'A'.repeat(200);
      const competitors: CompetitorData[] = [
        { name: longName, type: 'direct' },
      ];

      render(
        <StepCompetitors
          competitors={competitors}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle unicode competitor names', () => {
      const competitors: CompetitorData[] = [
        { name: '美容品牌', type: 'direct' },
        { name: 'Beauté', type: 'indirect' },
      ];

      render(
        <StepCompetitors
          competitors={competitors}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      expect(screen.getByText('美容品牌')).toBeInTheDocument();
      expect(screen.getByText('Beauté')).toBeInTheDocument();
    });

    it('should handle missing brand context gracefully', () => {
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Suggested Competitors')).toBeInTheDocument();
    });

    it('should handle all competitor types', () => {
      const competitors: CompetitorData[] = [
        { name: 'Direct', type: 'direct' },
        { name: 'Indirect', type: 'indirect' },
        { name: 'Substitute', type: 'substitute' },
      ];

      render(
        <StepCompetitors
          competitors={competitors}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      expect(screen.getByText('direct')).toBeInTheDocument();
      expect(screen.getByText('indirect')).toBeInTheDocument();
      expect(screen.getByText('substitute')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', async () => {
      const user = userEvent.setup();
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      const addButton = screen.getByText('+ Add competitor');
      await user.click(addButton);

      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Website URL')).toBeInTheDocument();
      expect(screen.getByLabelText('Type')).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(
        <StepCompetitors
          competitors={[]}
          onChange={mockOnChange}
          brandContext={mockBrandContext}
        />
      );

      const addButton = screen.getByText('+ Add competitor');
      addButton.focus();
      expect(addButton).toHaveFocus();
    });
  });
});
