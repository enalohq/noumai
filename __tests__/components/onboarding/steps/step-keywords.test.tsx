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
});
