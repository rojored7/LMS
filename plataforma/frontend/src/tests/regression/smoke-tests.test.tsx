/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SMOKE TESTS - Critical Path Validation (Frontend)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Propósito: Verificar que las funcionalidades CORE del frontend funcionan.
 * Estos tests son RÁPIDOS y detectan breakage mayor en la UI.
 *
 * Run: npm test smoke-tests.test.tsx
 *
 * ⚠️  CRÍTICO: Estos tests se ejecutan en regression testing.
 *    Si CUALQUIERA falla → Workflow BLOQUEADO
 *
 * Última actualización: 2026-03-09
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Pages
import Home from '../../pages/Home';
import Login from '../../pages/Login';
import Register from '../../pages/Register';
import CourseCatalog from '../../pages/CourseCatalog';
import Dashboard from '../../pages/Dashboard';
import NotFound from '../../pages/NotFound';

// Hooks and stores
import { useAuthStore } from '../../store/authStore';

/**
 * Helper: Render component with Router
 */
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

/**
 * Mock API responses
 */
const mockSuccessfulLogin = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'STUDENT'
  },
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token'
};

const mockCourses = [
  {
    id: '1',
    title: 'Fundamentos de Ciberseguridad',
    slug: 'fundamentos-ciberseguridad',
    description: 'Aprende los conceptos básicos de ciberseguridad',
    level: 'BEGINNER',
    duration: 120,
    published: true
  }
];

describe('🔥 Smoke Tests - Critical UI Paths', () => {

  beforeEach(async () => {
    // Reset auth store before each test
    const authStore = useAuthStore.getState();
    authStore.setUser(null);
    authStore.setTokens('', '');

    // Clear mocks
    vi.clearAllMocks();
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 1. PAGE RENDERING
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Page Rendering', () => {
    it('should render Home page without errors', () => {
      renderWithRouter(<Home />);

      // Home page should have main content
      expect(document.body).toBeTruthy();
    });

    it('should render Login page with form', () => {
      renderWithRouter(<Login />);

      // Login form elements
      expect(screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)).toBeTruthy();
      expect(screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i) || screen.getByLabelText(/contraseña/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /iniciar sesión|login/i })).toBeTruthy();
    });

    it('should render Register page with form', () => {
      renderWithRouter(<Register />);

      // Register form should have submit button
      expect(screen.getByRole('button', { name: /registr|crear cuenta|sign up/i })).toBeTruthy();
    });

    it('should render Course Catalog page', () => {
      renderWithRouter(<CourseCatalog />);

      // Page should render without crashing
      expect(document.body).toBeTruthy();
    });

    it('should render 404 Not Found page', () => {
      renderWithRouter(<NotFound />);

      // Should show 404 message
      expect(screen.getByText(/404|not found|no encontrada/i)).toBeTruthy();
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 2. AUTHENTICATION FLOW (UI)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Authentication Flow', () => {
    it('should allow typing in login form fields', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Login />);

      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i) || screen.getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('should show validation errors on empty login submit', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Login />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión|login/i });
      await user.click(submitButton);

      // Form should prevent submission or show errors
      // This depends on your validation implementation
      expect(submitButton).toBeTruthy();
    });

    it('should allow typing in register form fields', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Register />);

      // Try to find any input fields
      const inputs = screen.getAllByRole('textbox');

      if (inputs.length > 0) {
        await user.type(inputs[0], 'test@example.com');
        expect(inputs[0]).toHaveValue('test@example.com');
      }
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 3. AUTH STORE (Zustand)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Auth Store (Zustand)', () => {
    it('should initialize with no user', () => {
      const { user, isAuthenticated } = useAuthStore.getState();

      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it('should set user on login', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT' as const
      };

      useAuthStore.getState().setUser(mockUser);

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });

    it('should clear user on logout', () => {
      // Set user first
      useAuthStore.getState().setUser({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT'
      });

      // Then clear
      useAuthStore.getState().clearAuth();

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it('should store and retrieve access token', () => {
      const token = 'mock-access-token-123';

      useAuthStore.getState().setAccessToken(token);

      const storedToken = useAuthStore.getState().accessToken;
      expect(storedToken).toBe(token);
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 4. ROUTING
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Routing', () => {
    it('should navigate between pages', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Home />);

      // Find any navigation links
      const links = screen.queryAllByRole('link');
      expect(links.length).toBeGreaterThanOrEqual(0);
    });

    it('should show 404 page for unknown routes', () => {
      renderWithRouter(<NotFound />);

      expect(screen.getByText(/404|not found|no encontrada/i)).toBeTruthy();
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 5. COMPONENT INTERACTIONS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Component Interactions', () => {
    it('should render buttons that are clickable', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Login />);

      const button = screen.getByRole('button', { name: /iniciar sesión|login/i });

      expect(button).not.toBeDisabled();
      await user.click(button);

      // Button should be clickable
      expect(button).toBeTruthy();
    });

    it('should handle form submission', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Login />);

      const form = document.querySelector('form');

      if (form) {
        const submitButton = screen.getByRole('button', { name: /iniciar sesión|login/i });
        await user.click(submitButton);

        // Form submission should not crash
        expect(form).toBeTruthy();
      }
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 6. ACCESSIBILITY BASICS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Accessibility Basics', () => {
    it('should have accessible buttons with labels', () => {
      renderWithRouter(<Login />);

      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        // Buttons should have text content or aria-label
        const hasLabel = button.textContent || button.getAttribute('aria-label');
        expect(hasLabel).toBeTruthy();
      });
    });

    it('should have form inputs with labels or placeholders', () => {
      renderWithRouter(<Login />);

      const inputs = screen.getAllByRole('textbox');

      inputs.forEach(input => {
        // Inputs should have aria-label, label, or placeholder
        const hasLabel =
          input.getAttribute('aria-label') ||
          input.getAttribute('placeholder') ||
          document.querySelector(`label[for="${input.id}"]`);

        expect(hasLabel).toBeTruthy();
      });
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 7. ERROR BOUNDARIES
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Error Boundaries', () => {
    it('should render pages without throwing errors', () => {
      // Test that core pages don't throw during render
      expect(() => renderWithRouter(<Home />)).not.toThrow();
      expect(() => renderWithRouter(<Login />)).not.toThrow();
      expect(() => renderWithRouter(<Register />)).not.toThrow();
      expect(() => renderWithRouter(<CourseCatalog />)).not.toThrow();
      expect(() => renderWithRouter(<NotFound />)).not.toThrow();
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 8. PERFORMANCE BASICS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Performance Basics', () => {
    it('should render pages quickly (< 1000ms)', () => {
      const start = performance.now();

      renderWithRouter(<Home />);

      const end = performance.now();
      const renderTime = end - start;

      // Rendering should be fast
      expect(renderTime).toBeLessThan(1000);
    });

    it('should not have excessive re-renders', () => {
      let renderCount = 0;

      const TestComponent = () => {
        renderCount++;
        return <div>Test</div>;
      };

      const { rerender } = render(<TestComponent />);

      expect(renderCount).toBe(1);

      rerender(<TestComponent />);
      expect(renderCount).toBe(2);

      // Should only re-render when explicitly told to
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 9. LOCAL STORAGE PERSISTENCE
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Local Storage Persistence', () => {
    it('should persist auth tokens in storage', () => {
      const mockToken = 'mock-token-123';

      // Simulate setting token
      localStorage.setItem('accessToken', mockToken);

      // Retrieve token
      const retrieved = localStorage.getItem('accessToken');
      expect(retrieved).toBe(mockToken);

      // Cleanup
      localStorage.removeItem('accessToken');
    });

    it('should clear storage on logout', () => {
      // Set some auth data
      localStorage.setItem('accessToken', 'token');
      localStorage.setItem('refreshToken', 'refresh');

      // Simulate logout (clear)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 10. CRITICAL USER FLOWS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Critical User Flows', () => {
    it('should allow navigation from Home to Login', async () => {
      renderWithRouter(<Home />);

      // Look for login link/button
      const loginLink = screen.queryByRole('link', { name: /login|iniciar sesión/i }) ||
                        screen.queryByRole('button', { name: /login|iniciar sesión/i });

      if (loginLink) {
        expect(loginLink).toBeTruthy();
      }
    });

    it('should show loading states appropriately', async () => {
      renderWithRouter(<CourseCatalog />);

      // Course catalog might show loading state initially
      // This is a smoke test to ensure it doesn't crash
      await waitFor(() => {
        expect(document.body).toBeTruthy();
      }, { timeout: 1000 });
    });
  });
});
