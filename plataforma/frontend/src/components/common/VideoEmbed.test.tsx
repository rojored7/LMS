import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoEmbed } from './VideoEmbed';

describe('VideoEmbed Component', () => {
  const defaultProps = {
    // Add default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<VideoEmbed {...defaultProps} />);
      expect(screen.getByTestId('videoembed')).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <VideoEmbed {...defaultProps}>
          <div>Test Child</div>
        </VideoEmbed>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle className prop', () => {
      render(<VideoEmbed {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('videoembed')).toHaveClass('custom-class');
    });

    it('should handle onClick prop', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<VideoEmbed {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByTestId('videoembed'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      render(<VideoEmbed {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(<VideoEmbed {...defaultProps} disabled />);
      expect(screen.getByTestId('videoembed')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<VideoEmbed {...defaultProps} aria-label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });
});
