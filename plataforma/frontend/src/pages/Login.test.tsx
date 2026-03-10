import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from './Login';
import { renderWithProviders } from '../tests/utils/test-utils';
import { server } from '../tests/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock the hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: mockIsAuthenticated,
    error: mockAuthError,
    clearError: vi.fn(),
  }),
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: { from: { pathname: '/dashboard' } },
      pathname: '/login',
    }),
  };
});

let mockLogin = vi.fn();
let mockIsAuthenticated = false;
let mockAuthError = null;

describe('Login Page', () => {
  beforeEach(() => {
    mockLogin = vi.fn();
    mockIsAuthenticated = false;
    mockAuthError = null;
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('should render login form with all elements', () => {
      renderWithProviders(<Login />);

      // Check title
      expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();

      // Check form fields
      expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();

      // Check buttons and links
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /regístrate aquí/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /¿olvidaste tu contraseña?/i })).toBeInTheDocument();

      // Check remember me checkbox
      expect(screen.getByRole('checkbox', { name: /recordarme/i })).toBeInTheDocument();
    });

    it('should have correct initial form values', () => {
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/correo electrónico/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;

      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });

    it('should redirect to dashboard if already authenticated', () => {
      mockIsAuthenticated = true;
      renderWithProviders(<Login />);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('should redirect to previous page after login if location state provided', () => {
      mockIsAuthenticated = true;
      renderWithProviders(<Login />, {
        initialEntries: [{ pathname: '/login', state: { from: { pathname: '/courses' } } }],
      });

      expect(mockNavigate).toHaveBeenCalledWith('/courses', { replace: true });
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid email format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for short password', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123');

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/la contraseña debe tener al menos 6 caracteres/i)).toBeInTheDocument();
      });
    });

    it('should clear field error when user starts typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
      });

      // Start typing in email field
      const emailInput = screen.getByLabelText(/correo electrónico/i);
      await user.type(emailInput, 't');

      // Error should be cleared
      expect(screen.queryByText(/el email es requerido/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update form values when typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/correo electrónico/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
    });

    it('should toggle remember me checkbox', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const checkbox = screen.getByRole('checkbox', { name: /recordarme/i }) as HTMLInputElement;

      expect(checkbox.checked).toBe(false);
      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Button should show loading state
      expect(submitButton).toHaveAttribute('disabled');
      expect(screen.getByText(/cargando/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call login with correct credentials on valid submit', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({});

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should show success toast on successful login', async () => {
      const user = userEvent.setup();
      const mockToast = vi.fn();
      vi.mocked(useToast).mockReturnValue({
        success: mockToast,
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
      });

      mockLogin.mockResolvedValue({});

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('Sesión iniciada correctamente');
      });
    });

    it('should show error message on login failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Credenciales inválidas';
      mockLogin.mockRejectedValue({ error: { message: errorMessage } });

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should show generic error message when no specific error provided', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error());

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error al iniciar sesión/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to register page when clicking register link', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const registerLink = screen.getByRole('link', { name: /regístrate aquí/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should navigate to forgot password page when clicking forgot password link', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const forgotLink = screen.getByRole('link', { name: /¿olvidaste tu contraseña?/i });
      expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      // Tab through form
      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('checkbox', { name: /recordarme/i })).toHaveFocus();

      // Can submit with Enter key
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue({
        error: { message: 'Error de red. Por favor, intenta de nuevo.' }
      });

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error de red/i)).toBeInTheDocument();
      });
    });

    it('should clear errors when component unmounts', () => {
      const mockClearError = vi.fn();
      vi.mocked(useAuth).mockReturnValue({
        login: mockLogin,
        isAuthenticated: false,
        error: null,
        clearError: mockClearError,
      });

      const { unmount } = renderWithProviders(<Login />);
      unmount();

      expect(mockClearError).toHaveBeenCalled();
    });
  });
});