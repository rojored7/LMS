import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProgressCard } from './UserProgressCard';

describe('UserProgressCard Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<UserProgressCard {...defaultProps} />);
      expect(screen.getByTestId('userprogresscard')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <UserProgressCard {...defaultProps}>
          <div>Test Child</div>
        </UserProgressCard>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<UserProgressCard {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('userprogresscard')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<UserProgressCard {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('userprogresscard'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<UserProgressCard {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<UserProgressCard {...defaultProps} disabled />);
      expect(screen.getByTestId('userprogresscard')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<UserProgressCard {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
