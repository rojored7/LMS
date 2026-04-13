import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecentActivity } from './RecentActivity';

describe('RecentActivity Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<RecentActivity {...defaultProps} />);
      expect(screen.getByTestId('recentactivity')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <RecentActivity {...defaultProps}>
          <div>Test Child</div>
        </RecentActivity>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<RecentActivity {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('recentactivity')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<RecentActivity {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('recentactivity'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<RecentActivity {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<RecentActivity {...defaultProps} disabled />);
      expect(screen.getByTestId('recentactivity')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<RecentActivity {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
