import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationBell } from './NotificationBell';

describe('NotificationBell Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<NotificationBell {...defaultProps} />);
      expect(screen.getByTestId('notificationbell')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <NotificationBell {...defaultProps}>
          <div>Test Child</div>
        </NotificationBell>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<NotificationBell {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('notificationbell')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<NotificationBell {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('notificationbell'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<NotificationBell {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<NotificationBell {...defaultProps} disabled />);
      expect(screen.getByTestId('notificationbell')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<NotificationBell {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
