import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from './Badge';

describe('Badge Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Badge {...defaultProps} />);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <Badge {...defaultProps}>
          <div>Test Child</div>
        </Badge>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<Badge {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('badge')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Badge {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('badge'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<Badge {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<Badge {...defaultProps} disabled />);
      expect(screen.getByTestId('badge')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Badge {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
