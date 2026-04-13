import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Loader } from './Loader';

describe('Loader Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Loader {...defaultProps} />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <Loader {...defaultProps}>
          <div>Test Child</div>
        </Loader>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<Loader {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('loader')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Loader {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('loader'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<Loader {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<Loader {...defaultProps} disabled />);
      expect(screen.getByTestId('loader')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Loader {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
