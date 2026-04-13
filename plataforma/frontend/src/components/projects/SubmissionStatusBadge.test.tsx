import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubmissionStatusBadge } from './SubmissionStatusBadge';

describe('SubmissionStatusBadge Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<SubmissionStatusBadge {...defaultProps} />);
      expect(screen.getByTestId('submissionstatusbadge')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <SubmissionStatusBadge {...defaultProps}>
          <div>Test Child</div>
        </SubmissionStatusBadge>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<SubmissionStatusBadge {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('submissionstatusbadge')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<SubmissionStatusBadge {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('submissionstatusbadge'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<SubmissionStatusBadge {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<SubmissionStatusBadge {...defaultProps} disabled />);
      expect(screen.getByTestId('submissionstatusbadge')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SubmissionStatusBadge {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
