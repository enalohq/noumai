import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StepKeywords } from '@/components/onboarding/steps/step-keywords';

describe('StepKeywords', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render textarea with label', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      expect(screen.getByLabelText(/Target Keywords/i)).toBeInTheDocument();
    });

    it('should render required indicator', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render help text', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      expect(screen.getByText(/track your AI visibility/i)).toBeInTheDocument();
    });

    it('should render textarea with correct placeholder', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', expect.stringContaining('Enter keywords'));
    });
  });

  describe('Input Handling', () => {
    it('should display existing keywords', () => {
      const existingKeywords = 'skincare, beauty, organic';
      render(
        <StepKeywords data={{ targetKeywords: existingKeywords }} onChange={mockOnChange} />
      );
      expect(screen.getByDisplayValue(existingKeywords)).toBeInTheDocument();
    });

    it('should call onChange when keywords are entered', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'skincare, beauty' } });
      expect(mockOnChange).toHaveBeenCalledWith({ targetKeywords: 'skincare, beauty' });
    });

    it('should call onChange with comma-separated keywords', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'keyword1, keyword2, keyword3' } });
      expect(mockOnChange).toHaveBeenCalledWith({
        targetKeywords: 'keyword1, keyword2, keyword3',
      });
    });

    it('should call onChange with multiline keywords', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      const textarea = screen.getByRole('textbox');
      const multilineKeywords = 'keyword1\nkeyword2\nkeyword3';
      fireEvent.change(textarea, { target: { value: multilineKeywords } });
      expect(mockOnChange).toHaveBeenCalledWith({
        targetKeywords: multilineKeywords,
      });
    });

    it('should handle empty input', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'existing' }} onChange={mockOnChange} />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '' } });
      expect(mockOnChange).toHaveBeenCalledWith({ targetKeywords: '' });
    });

    it('should handle whitespace-only input', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   ' } });
      expect(mockOnChange).toHaveBeenCalledWith({ targetKeywords: '   ' });
    });
  });

  describe('Keyword Count Display', () => {
    it('should display 0 keywords when empty', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('0 keywords entered')).toBeInTheDocument();
    });

    it('should display singular "keyword" for 1 keyword', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'skincare' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('1 keyword entered')).toBeInTheDocument();
    });

    it('should display plural "keywords" for multiple keywords', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'skincare, beauty, organic' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('3 keywords entered')).toBeInTheDocument();
    });

    it('should count comma-separated keywords correctly', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'keyword1, keyword2, keyword3, keyword4' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('4 keywords entered')).toBeInTheDocument();
    });

    it('should count newline-separated keywords correctly', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'keyword1\nkeyword2\nkeyword3' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('3 keywords entered')).toBeInTheDocument();
    });

    it('should count mixed separator keywords correctly', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'keyword1, keyword2\nkeyword3, keyword4' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('4 keywords entered')).toBeInTheDocument();
    });

    it('should not count empty entries', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'keyword1, , keyword2' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('2 keywords entered')).toBeInTheDocument();
    });

    it('should not count whitespace-only entries', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'keyword1,   ,keyword2' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('2 keywords entered')).toBeInTheDocument();
    });
  });

  describe('Duplicate Detection', () => {
    it('should not show duplicate message when no duplicates', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'keyword1, keyword2, keyword3' }} onChange={mockOnChange} />
      );
      expect(screen.queryByText(/duplicate/i)).not.toBeInTheDocument();
    });

    it('should detect exact duplicates', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'skincare, beauty, skincare' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('1 duplicate detected')).toBeInTheDocument();
    });

    it('should detect case-insensitive duplicates', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'Skincare, SKINCARE, skincare' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('2 duplicates detected')).toBeInTheDocument();
    });

    it('should detect duplicates with whitespace variations', () => {
      render(
        <StepKeywords data={{ targetKeywords: '  skincare  , skincare,  SKINCARE  ' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('2 duplicates detected')).toBeInTheDocument();
    });

    it('should use singular "duplicate" for 1 duplicate', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'keyword1, keyword2, keyword1' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('1 duplicate detected')).toBeInTheDocument();
    });

    it('should use plural "duplicates" for multiple duplicates', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'a, b, a, c, b, a' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('3 duplicates detected')).toBeInTheDocument();
    });

    it('should handle multiple duplicate groups', () => {
      render(
        <StepKeywords data={{ targetKeywords: 'skincare, beauty, skincare, organic, beauty' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('2 duplicates detected')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long keyword list', () => {
      const longKeywords = Array(100).fill('keyword').join(', ');
      render(
        <StepKeywords data={{ targetKeywords: longKeywords }} onChange={mockOnChange} />
      );
      expect(screen.getByDisplayValue(longKeywords)).toBeInTheDocument();
    });

    it('should handle special characters in keywords', () => {
      const specialKeywords = 'AI/ML, C++, Node.js, @mention, #hashtag';
      render(
        <StepKeywords data={{ targetKeywords: specialKeywords }} onChange={mockOnChange} />
      );
      expect(screen.getByDisplayValue(specialKeywords)).toBeInTheDocument();
    });

    it('should handle unicode characters', () => {
      const unicodeKeywords = '美容, 护肤, 有机, café, naïve';
      render(
        <StepKeywords data={{ targetKeywords: unicodeKeywords }} onChange={mockOnChange} />
      );
      expect(screen.getByDisplayValue(unicodeKeywords)).toBeInTheDocument();
    });

    it('should maintain textarea rows attribute', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '4');
    });

    it('should update count in real-time as user types', () => {
      const { rerender } = render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('0 keywords entered')).toBeInTheDocument();

      rerender(
        <StepKeywords data={{ targetKeywords: 'keyword1' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('1 keyword entered')).toBeInTheDocument();

      rerender(
        <StepKeywords data={{ targetKeywords: 'keyword1, keyword2' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('2 keywords entered')).toBeInTheDocument();
    });

    it('should update duplicate detection in real-time', () => {
      const { rerender } = render(
        <StepKeywords data={{ targetKeywords: 'keyword1, keyword2' }} onChange={mockOnChange} />
      );
      expect(screen.queryByText(/duplicate/i)).not.toBeInTheDocument();

      rerender(
        <StepKeywords data={{ targetKeywords: 'keyword1, keyword2, keyword1' }} onChange={mockOnChange} />
      );
      expect(screen.getByText('1 duplicate detected')).toBeInTheDocument();
    });
  });

  describe('Suggested Keywords', () => {
    it('should not display suggestions when none provided', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      expect(screen.queryByText(/Suggested keywords/i)).not.toBeInTheDocument();
    });

    it('should display suggestions when provided', () => {
      render(
        <StepKeywords
          data={{ targetKeywords: '' }}
          onChange={mockOnChange}
          suggestedKeywords={['crm', 'sales', 'pipeline']}
        />
      );
      expect(screen.getByText(/Suggested keywords from your competitors/i)).toBeInTheDocument();
      expect(screen.getByText('+ crm')).toBeInTheDocument();
      expect(screen.getByText('+ sales')).toBeInTheDocument();
      expect(screen.getByText('+ pipeline')).toBeInTheDocument();
    });

    it('should add suggestion to keywords when clicked', () => {
      render(
        <StepKeywords
          data={{ targetKeywords: '' }}
          onChange={mockOnChange}
          suggestedKeywords={['crm']}
        />
      );
      const button = screen.getByText('+ crm');
      fireEvent.click(button);
      expect(mockOnChange).toHaveBeenCalledWith({ targetKeywords: 'crm' });
    });

    it('should append suggestion to existing keywords', () => {
      render(
        <StepKeywords
          data={{ targetKeywords: 'invoicing' }}
          onChange={mockOnChange}
          suggestedKeywords={['crm']}
        />
      );
      const button = screen.getByText('+ crm');
      fireEvent.click(button);
      expect(mockOnChange).toHaveBeenCalledWith({ targetKeywords: 'invoicing, crm' });
    });

    it('should filter out already entered suggestions', () => {
      render(
        <StepKeywords
          data={{ targetKeywords: 'crm, sales' }}
          onChange={mockOnChange}
          suggestedKeywords={['crm', 'sales', 'pipeline']}
        />
      );
      expect(screen.queryByText('+ crm')).not.toBeInTheDocument();
      expect(screen.queryByText('+ sales')).not.toBeInTheDocument();
      expect(screen.getByText('+ pipeline')).toBeInTheDocument();
    });

    it('should filter case-insensitively', () => {
      render(
        <StepKeywords
          data={{ targetKeywords: 'CRM, SALES' }}
          onChange={mockOnChange}
          suggestedKeywords={['crm', 'sales', 'pipeline']}
        />
      );
      expect(screen.queryByText('+ crm')).not.toBeInTheDocument();
      expect(screen.queryByText('+ sales')).not.toBeInTheDocument();
      expect(screen.getByText('+ pipeline')).toBeInTheDocument();
    });

    it('should show +N more when more than 10 suggestions', () => {
      const manyKeywords = Array.from({ length: 15 }, (_, i) => `keyword${i}`);
      render(
        <StepKeywords
          data={{ targetKeywords: '' }}
          onChange={mockOnChange}
          suggestedKeywords={manyKeywords}
        />
      );
      expect(screen.getByText('+5 more')).toBeInTheDocument();
    });

    it('should limit display to 10 suggestions', () => {
      const manyKeywords = Array.from({ length: 15 }, (_, i) => `keyword${i}`);
      render(
        <StepKeywords
          data={{ targetKeywords: '' }}
          onChange={mockOnChange}
          suggestedKeywords={manyKeywords}
        />
      );
      // Should show first 10
      expect(screen.getByText('+ keyword0')).toBeInTheDocument();
      expect(screen.getByText('+ keyword9')).toBeInTheDocument();
      // Should not show 11th
      expect(screen.queryByText('+ keyword10')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('id', 'targetKeywords');
    });

    it('should have required attribute', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('required');
    });

    it('should be keyboard accessible', () => {
      render(
        <StepKeywords data={{ targetKeywords: '' }} onChange={mockOnChange} />
      );
      const textarea = screen.getByRole('textbox');
      textarea.focus();
      expect(textarea).toHaveFocus();
    });
  });

  describe('Expandable Suggestions', () => {
    it('should show only first 10 suggestions initially', () => {
      const manyKeywords = Array.from({ length: 25 }, (_, i) => `keyword${i + 1}`);
      render(
        <StepKeywords
          data={{ targetKeywords: '' }}
          onChange={mockOnChange}
          suggestedKeywords={manyKeywords}
        />
      );
      expect(screen.getByText('+ keyword1')).toBeInTheDocument();
      expect(screen.getByText('+ keyword10')).toBeInTheDocument();
      expect(screen.queryByText('+ keyword11')).not.toBeInTheDocument();
    });

    it('should show "+N more" button when suggestions exceed 10', () => {
      const manyKeywords = Array.from({ length: 25 }, (_, i) => `keyword${i + 1}`);
      render(
        <StepKeywords
          data={{ targetKeywords: '' }}
          onChange={mockOnChange}
          suggestedKeywords={manyKeywords}
        />
      );
      expect(screen.getByText('+15 more')).toBeInTheDocument();
    });

    it('should expand all suggestions when "+N more" is clicked', () => {
      const manyKeywords = Array.from({ length: 25 }, (_, i) => `keyword${i + 1}`);
      render(
        <StepKeywords
          data={{ targetKeywords: '' }}
          onChange={mockOnChange}
          suggestedKeywords={manyKeywords}
        />
      );
      const expandButton = screen.getByText('+15 more');
      fireEvent.click(expandButton);
      
      expect(screen.getByText('+ keyword11')).toBeInTheDocument();
      expect(screen.getByText('+ keyword25')).toBeInTheDocument();
      expect(screen.getByText('Show less')).toBeInTheDocument();
    });

    it('should collapse suggestions when "Show less" is clicked', () => {
      const manyKeywords = Array.from({ length: 25 }, (_, i) => `keyword${i + 1}`);
      const { rerender } = render(
        <StepKeywords
          data={{ targetKeywords: '' }}
          onChange={mockOnChange}
          suggestedKeywords={manyKeywords}
        />
      );
      
      const expandButton = screen.getByText('+15 more');
      fireEvent.click(expandButton);
      expect(screen.getByText('+ keyword11')).toBeInTheDocument();
      
      const collapseButton = screen.getByText('Show less');
      fireEvent.click(collapseButton);
      
      expect(screen.queryByText('+ keyword11')).not.toBeInTheDocument();
      expect(screen.getByText('+15 more')).toBeInTheDocument();
    });

    it('should not show expand button when suggestions <= 10', () => {
      const fewKeywords = ['keyword1', 'keyword2', 'keyword3'];
      render(
        <StepKeywords
          data={{ targetKeywords: '' }}
          onChange={mockOnChange}
          suggestedKeywords={fewKeywords}
        />
      );
      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
      expect(screen.queryByText('Show less')).not.toBeInTheDocument();
    });

    it('should add suggestion when clicked in expanded view', () => {
      const manyKeywords = Array.from({ length: 15 }, (_, i) => `keyword${i + 1}`);
      render(
        <StepKeywords
          data={{ targetKeywords: '' }}
          onChange={mockOnChange}
          suggestedKeywords={manyKeywords}
        />
      );
      
      const expandButton = screen.getByText('+5 more');
      fireEvent.click(expandButton);
      
      const keyword12Button = screen.getByText('+ keyword12');
      fireEvent.click(keyword12Button);
      
      expect(mockOnChange).toHaveBeenCalledWith({ targetKeywords: 'keyword12' });
    });

    it('should filter out already entered keywords from suggestions', () => {
      const suggestions = ['crm', 'sales', 'pipeline', 'leads'];
      render(
        <StepKeywords
          data={{ targetKeywords: 'crm, sales' }}
          onChange={mockOnChange}
          suggestedKeywords={suggestions}
        />
      );
      
      expect(screen.queryByText('+ crm')).not.toBeInTheDocument();
      expect(screen.queryByText('+ sales')).not.toBeInTheDocument();
      expect(screen.getByText('+ pipeline')).toBeInTheDocument();
      expect(screen.getByText('+ leads')).toBeInTheDocument();
    });

    it('should show loading indicator when isLoadingSuggestions is true', () => {
      render(
        <StepKeywords
          data={{ targetKeywords: '' }}
          onChange={mockOnChange}
          suggestedKeywords={['keyword1', 'keyword2']}
          isLoadingSuggestions={true}
        />
      );
      expect(screen.getByText('Loading AI suggestions...')).toBeInTheDocument();
    });
  });
});
