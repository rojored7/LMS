import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home } from './Home';
import { renderWithProviders } from '../tests/utils/test-utils';

const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });
  });

  describe('Hero Section', () => {
    it('should render hero section with title and subtitle', () => {
      renderWithProviders(<Home />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/plataforma de aprendizaje/i)).toBeInTheDocument();
    });

    it('should show CTA buttons for non-authenticated users', () => {
      renderWithProviders(<Home />);

      expect(screen.getByRole('button', { name: /comenzar ahora/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /explorar cursos/i })).toBeInTheDocument();
    });

    it('should navigate to register on CTA click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      const ctaButton = screen.getByRole('button', { name: /comenzar ahora/i });
      await user.click(ctaButton);

      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('should show dashboard link for authenticated users', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com' },
      });

      renderWithProviders(<Home />);

      expect(screen.getByRole('link', { name: /ir al dashboard/i })).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    it('should display key features', () => {
      renderWithProviders(<Home />);

      expect(screen.getByText(/aprendizaje interactivo/i)).toBeInTheDocument();
      expect(screen.getByText(/certificados/i)).toBeInTheDocument();
      expect(screen.getByText(/seguimiento de progreso/i)).toBeInTheDocument();
    });

    it('should display feature icons', () => {
      renderWithProviders(<Home />);

      const icons = screen.getAllByTestId(/feature-icon/i);
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics Section', () => {
    it('should display platform statistics', () => {
      renderWithProviders(<Home />);

      expect(screen.getByText(/estudiantes activos/i)).toBeInTheDocument();
      expect(screen.getByText(/cursos disponibles/i)).toBeInTheDocument();
      expect(screen.getByText(/tasa de completado/i)).toBeInTheDocument();
    });
  });

  describe('Course Preview Section', () => {
    it('should display featured courses', () => {
      renderWithProviders(<Home />);

      expect(screen.getByText(/cursos destacados/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /ver todos los cursos/i })).toBeInTheDocument();
    });
  });

  describe('Testimonials Section', () => {
    it('should display user testimonials', () => {
      renderWithProviders(<Home />);

      expect(screen.getByText(/testimonios/i)).toBeInTheDocument();
    });
  });

  describe('Newsletter Section', () => {
    it('should display newsletter subscription form', () => {
      renderWithProviders(<Home />);

      expect(screen.getByPlaceholderText(/tu correo electrónico/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /suscribirse/i })).toBeInTheDocument();
    });

    it('should handle newsletter subscription', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      const emailInput = screen.getByPlaceholderText(/tu correo electrónico/i);
      const subscribeButton = screen.getByRole('button', { name: /suscribirse/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(subscribeButton);

      // Should show success message
      await screen.findByText(/suscripción exitosa/i);
    });
  });

  describe('Footer Links', () => {
    it('should display footer with navigation links', () => {
      renderWithProviders(<Home />);

      expect(screen.getByRole('link', { name: /sobre nosotros/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /contacto/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /términos/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /privacidad/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile devices', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      renderWithProviders(<Home />);

      expect(screen.getByTestId('mobile-menu-button')).toBeVisible();
    });

    it('should show desktop navigation on large screens', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));

      renderWithProviders(<Home />);

      expect(screen.queryByTestId('mobile-menu-button')).not.toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<Home />);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });

      expect(h1).toBeInTheDocument();
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA labels', () => {
      renderWithProviders(<Home />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Home />);

      await user.tab();
      expect(document.activeElement).toHaveAttribute('href');
    });
  });
});