import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportButton } from './ExportButton';

describe('ExportButton Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ExportButton {...defaultProps} />);
      expect(screen.getByTestId('exportbutton')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <ExportButton {...defaultProps}>
          <div>Test Child</div>
        </ExportButton>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<ExportButton {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('exportbutton')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<ExportButton {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('exportbutton'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<ExportButton {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<ExportButton {...defaultProps} disabled />);
      expect(screen.getByTestId('exportbutton')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ExportButton {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
