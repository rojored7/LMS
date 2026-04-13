import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizQuestion } from './QuizQuestion';

describe('QuizQuestion Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<QuizQuestion {...defaultProps} />);
      expect(screen.getByTestId('quizquestion')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <QuizQuestion {...defaultProps}>
          <div>Test Child</div>
        </QuizQuestion>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<QuizQuestion {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('quizquestion')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<QuizQuestion {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('quizquestion'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<QuizQuestion {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<QuizQuestion {...defaultProps} disabled />);
      expect(screen.getByTestId('quizquestion')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<QuizQuestion {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
