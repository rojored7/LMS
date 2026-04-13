import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersTable } from './UsersTable';

describe('UsersTable Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<UsersTable {...defaultProps} />);
      expect(screen.getByTestId('userstable')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <UsersTable {...defaultProps}>
          <div>Test Child</div>
        </UsersTable>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<UsersTable {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('userstable')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<UsersTable {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('userstable'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<UsersTable {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<UsersTable {...defaultProps} disabled />);
      expect(screen.getByTestId('userstable')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<UsersTable {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
