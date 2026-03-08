import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { StepMarket, type MarketData } from '@/components/onboarding/steps/step-market';
import { INDUSTRIES } from '@/lib/constants/industries';

describe('StepMarket', () => {
  const mockOnChange = jest.fn();
  const defaultData: MarketData = {
    industry: '',
    brandDescription: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render industry label', () => {
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByLabelText(/Industry \/ Vertical/i)).toBeInTheDocument();
    });

    it('should render brand description label', () => {
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByLabelText(/Brand Description/i)).toBeInTheDocument();
    });

    it('should render required indicators', () => {
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThanOrEqual(2);
    });

    it('should render industry dropdown with placeholder', () => {
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByDisplayValue('Select your industry…')).toBeInTheDocument();
    });

    it('should render all industries in dropdown', () => {
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      INDUSTRIES.forEach((industry) => {
        expect(screen.getByText(industry)).toBeInTheDocument();
      });
    });

    it('should render description textarea with placeholder', () => {
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      const textarea = screen.getByPlaceholderText(/Describe what your brand does/i);
      expect(textarea).toBeInTheDocument();
    });

    it('should render help text for industry', () => {
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      expect(screen.getByText(/auto-detect this from your brand name/i)).toBeInTheDocument();
    });
  });

  describe('Industry Selection', () => {
    it('should display selected industry', () => {
      render(
        <StepMarket
          data={{ ...defaultData, industry: 'Beauty / Personal Care' }}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByDisplayValue('Beauty / Personal Care')).toBeInTheDocument();
    });

    it('should call onChange when industry is selected', async () => {
      const user = userEvent.setup();
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);

      const select = screen.getByDisplayValue('Select your industry…');
      await user.selectOptions(select, 'Beauty / Personal Care');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ industry: 'Beauty / Personal Care' })
      );
    });

    it('should preserve brand description when changing industry', async () => {
      const user = userEvent.setup();
      const data: MarketData = {
        industry: '',
        brandDescription: 'Existing description',
      };
      render(<StepMarket data={data} onChange={mockOnChange} />);

      const select = screen.getByDisplayValue('Select your industry…');
      await user.selectOptions(select, 'SaaS / Software');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          industry: 'SaaS / Software',
          brandDescription: 'Existing description',
        })
      );
    });

    it('should handle multiple industry changes', async () => {
      const user = userEvent.setup();
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);

      const select = screen.getByDisplayValue('Select your industry…');
      await user.selectOptions(select, 'Beauty / Personal Care');
      await user.selectOptions(select, 'SaaS / Software');

      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ industry: 'SaaS / Software' })
      );
    });
  });

  describe('Brand Description Input', () => {
    it('should display existing brand description', () => {
      const description = 'A luxury skincare brand focused on natural ingredients';
      render(
        <StepMarket
          data={{ ...defaultData, brandDescription: description }}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByDisplayValue(description)).toBeInTheDocument();
    });

    it('should call onChange when description is entered', () => {
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      const textarea = screen.getByPlaceholderText(/Describe what your brand does/i);
      fireEvent.change(textarea, {
        target: { value: 'We make premium skincare products' },
      });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          brandDescription: 'We make premium skincare products',
        })
      );
    });

    it('should preserve industry when changing description', () => {
      const data: MarketData = {
        industry: 'Beauty / Personal Care',
        brandDescription: '',
      };
      render(<StepMarket data={data} onChange={mockOnChange} />);
      const textarea = screen.getByPlaceholderText(/Describe what your brand does/i);
      fireEvent.change(textarea, { target: { value: 'New description' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          industry: 'Beauty / Personal Care',
          brandDescription: 'New description',
        })
      );
    });

    it('should handle multiline descriptions', () => {
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      const textarea = screen.getByPlaceholderText(/Describe what your brand does/i);
      const multilineDescription = 'Line 1\nLine 2\nLine 3';
      fireEvent.change(textarea, { target: { value: multilineDescription } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ brandDescription: multilineDescription })
      );
    });

    it('should handle empty description', () => {
      render(
        <StepMarket
          data={{ ...defaultData, brandDescription: 'Existing' }}
          onChange={mockOnChange}
        />
      );
      const textarea = screen.getByDisplayValue('Existing');
      fireEvent.change(textarea, { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ brandDescription: '' })
      );
    });

    it('should maintain textarea rows attribute', () => {
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      const textarea = screen.getByPlaceholderText(/Describe what your brand does/i);
      expect(textarea).toHaveAttribute('rows', '4');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long descriptions', () => {
      const longDescription = 'A'.repeat(1000);
      render(
        <StepMarket
          data={{ ...defaultData, brandDescription: longDescription }}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByDisplayValue(longDescription)).toBeInTheDocument();
    });

    it('should handle special characters in description', () => {
      const specialDescription = 'Brand with @mentions, #hashtags, & symbols, 50% off!';
      render(
        <StepMarket
          data={{ ...defaultData, brandDescription: specialDescription }}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByDisplayValue(specialDescription)).toBeInTheDocument();
    });

    it('should handle unicode characters in description', () => {
      const unicodeDescription = '美容品牌 - Beauté - Belleza - 美しさ';
      render(
        <StepMarket
          data={{ ...defaultData, brandDescription: unicodeDescription }}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByDisplayValue(unicodeDescription)).toBeInTheDocument();
    });

    it('should handle whitespace-only description', () => {
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      const textarea = screen.getByPlaceholderText(/Describe what your brand does/i);
      fireEvent.change(textarea, { target: { value: '   \n  \t  ' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ brandDescription: '   \n  \t  ' })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      const select = screen.getByLabelText(/Industry \/ Vertical/i);
      const textarea = screen.getByLabelText(/Brand Description/i);
      expect(select).toHaveAttribute('id', 'industry');
      expect(textarea).toHaveAttribute('id', 'brandDescription');
    });

    it('should have required attributes', () => {
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      const select = screen.getByDisplayValue('Select your industry…');
      const textarea = screen.getByPlaceholderText(/Describe what your brand does/i);
      expect(select).toHaveAttribute('required');
      expect(textarea).toHaveAttribute('required');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<StepMarket data={defaultData} onChange={mockOnChange} />);
      const select = screen.getByDisplayValue('Select your industry…');
      const textarea = screen.getByPlaceholderText(/Describe what your brand does/i);

      await user.tab();
      expect(select).toHaveFocus();
      await user.tab();
      expect(textarea).toHaveFocus();
    });
  });

  describe('Form State Management', () => {
    it('should handle complete form data', () => {
      const completeData: MarketData = {
        industry: 'Beauty / Personal Care',
        brandDescription: 'Premium organic skincare brand',
      };
      render(<StepMarket data={completeData} onChange={mockOnChange} />);
      expect(screen.getByDisplayValue('Beauty / Personal Care')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Premium organic skincare brand')).toBeInTheDocument();
    });

    it('should handle partial form data', () => {
      const partialData: MarketData = {
        industry: 'SaaS / Software',
        brandDescription: '',
      };
      render(<StepMarket data={partialData} onChange={mockOnChange} />);
      expect(screen.getByDisplayValue('SaaS / Software')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Describe what your brand does/i)).toHaveValue('');
    });
  });
});
