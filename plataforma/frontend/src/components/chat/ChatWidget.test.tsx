import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatWidget } from './ChatWidget';

describe('ChatWidget Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ChatWidget {...defaultProps} />);
      expect(screen.getByTestId('chatwidget')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <ChatWidget {...defaultProps}>
          <div>Test Child</div>
        </ChatWidget>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<ChatWidget {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('chatwidget')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<ChatWidget {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('chatwidget'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<ChatWidget {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<ChatWidget {...defaultProps} disabled />);
      expect(screen.getByTestId('chatwidget')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ChatWidget {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
