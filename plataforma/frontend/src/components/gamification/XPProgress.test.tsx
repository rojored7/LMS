import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { XPProgress } from './XPProgress';

describe('XPProgress Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<XPProgress {...defaultProps} />);
      expect(screen.getByTestId('xpprogress')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <XPProgress {...defaultProps}>
          <div>Test Child</div>
        </XPProgress>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<XPProgress {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('xpprogress')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<XPProgress {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('xpprogress'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<XPProgress {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<XPProgress {...defaultProps} disabled />);
      expect(screen.getByTestId('xpprogress')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<XPProgress {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
