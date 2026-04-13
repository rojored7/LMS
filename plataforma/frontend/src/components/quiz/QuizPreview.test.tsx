import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizPreview } from './QuizPreview';

describe('QuizPreview Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<QuizPreview {...defaultProps} />);
      expect(screen.getByTestId('quizpreview')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <QuizPreview {...defaultProps}>
          <div>Test Child</div>
        </QuizPreview>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<QuizPreview {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('quizpreview')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<QuizPreview {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('quizpreview'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<QuizPreview {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<QuizPreview {...defaultProps} disabled />);
      expect(screen.getByTestId('quizpreview')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<QuizPreview {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
