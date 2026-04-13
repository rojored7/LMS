import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BadgesShowcase } from './BadgesShowcase';

describe('BadgesShowcase Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<BadgesShowcase {...defaultProps} />);
      expect(screen.getByTestId('badgesshowcase')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <BadgesShowcase {...defaultProps}>
          <div>Test Child</div>
        </BadgesShowcase>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<BadgesShowcase {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('badgesshowcase')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<BadgesShowcase {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('badgesshowcase'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<BadgesShowcase {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<BadgesShowcase {...defaultProps} disabled />);
      expect(screen.getByTestId('badgesshowcase')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<BadgesShowcase {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
