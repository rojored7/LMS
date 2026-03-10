import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Register } from './Register';
import { renderWithProviders } from '../tests/utils/test-utils';

// Mock the hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    register: mockRegister,
    isAuthenticated: mockIsAuthenticated,
    error: mockAuthError,
    clearError: vi.fn(),
  }),
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
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
  };
});

let mockRegister = vi.fn();
let mockIsAuthenticated = false;
let mockAuthError = null;
let mockToastSuccess = vi.fn();
let mockToastError = vi.fn();

describe('Register Page', () => {
  beforeEach(() => {
    mockRegister = vi.fn();
    mockIsAuthenticated = false;
    mockAuthError = null;
    mockToastSuccess = vi.fn();
    mockToastError = vi.fn();
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('should render registration form with all fields', () => {
      renderWithProviders(<Register />);

      // Check title
      expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument();

      // Check form fields
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();

      // Check buttons and links
      expect(screen.getByRole('button', { name: /registrarse/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /iniciar sesión/i })).toBeInTheDocument();

      // Check terms checkbox
      expect(screen.getByRole('checkbox', { name: /acepto los términos/i })).toBeInTheDocument();
    });

    it('should redirect to dashboard if already authenticated', () => {
      mockIsAuthenticated = true;
      renderWithProviders(<Register />);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('should have empty initial values', () => {
      renderWithProviders(<Register />);

      const firstNameInput = screen.getByLabelText(/nombre/i) as HTMLInputElement;
      const lastNameInput = screen.getByLabelText(/apellido/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/correo electrónico/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^contraseña$/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i) as HTMLInputElement;

      expect(firstNameInput.value).toBe('');
      expect(lastNameInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
      expect(confirmPasswordInput.value).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
        expect(screen.getByText(/el apellido es requerido/i)).toBeInTheDocument();
        expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
      });
    });

    it('should validate password strength', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const passwordInput = screen.getByLabelText(/^contraseña$/i);
      await user.type(passwordInput, '12345');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
      });
    });

    it('should validate password match', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const passwordInput = screen.getByLabelText(/^contraseña$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password456!');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
      });
    });

    it('should require accepting terms and conditions', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      // Fill all fields correctly but don't check terms
      await user.type(screen.getByLabelText(/nombre/i), 'John');
      await user.type(screen.getByLabelText(/apellido/i), 'Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/debes aceptar los términos/i)).toBeInTheDocument();
      });
    });

    it('should show password strength indicator', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const passwordInput = screen.getByLabelText(/^contraseña$/i);

      // Weak password
      await user.type(passwordInput, '12345');
      expect(screen.getByText(/débil/i)).toBeInTheDocument();

      // Medium password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'Password1');
      expect(screen.getByText(/media/i)).toBeInTheDocument();

      // Strong password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'Password123!@#');
      expect(screen.getByText(/fuerte/i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update form values when typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const firstNameInput = screen.getByLabelText(/nombre/i) as HTMLInputElement;
      const lastNameInput = screen.getByLabelText(/apellido/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/correo electrónico/i) as HTMLInputElement;

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john@example.com');

      expect(firstNameInput.value).toBe('John');
      expect(lastNameInput.value).toBe('Doe');
      expect(emailInput.value).toBe('john@example.com');
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const passwordInput = screen.getByLabelText(/^contraseña$/i) as HTMLInputElement;
      const toggleButton = screen.getByRole('button', { name: /mostrar contraseña/i });

      // Initially password type
      expect(passwordInput.type).toBe('password');

      // Click to show
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      // Click to hide
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });

    it('should clear field errors when user starts typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      // Trigger validation errors
      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
      });

      // Start typing in the field
      const firstNameInput = screen.getByLabelText(/nombre/i);
      await user.type(firstNameInput, 'J');

      // Error should be cleared
      expect(screen.queryByText(/el nombre es requerido/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call register with correct data on valid submit', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({});

      renderWithProviders(<Register />);

      // Fill form
      await user.type(screen.getByLabelText(/nombre/i), 'John');
      await user.type(screen.getByLabelText(/apellido/i), 'Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');
      await user.click(screen.getByRole('checkbox', { name: /acepto los términos/i }));

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Password123!',
        });
      });
    });

    it('should show success message and redirect on successful registration', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({});

      renderWithProviders(<Register />);

      // Fill form
      await user.type(screen.getByLabelText(/nombre/i), 'John');
      await user.type(screen.getByLabelText(/apellido/i), 'Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');
      await user.click(screen.getByRole('checkbox', { name: /acepto los términos/i }));

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Cuenta creada exitosamente');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show error message on registration failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'El email ya está registrado';
      mockRegister.mockRejectedValue({ error: { message: errorMessage } });

      renderWithProviders(<Register />);

      // Fill form
      await user.type(screen.getByLabelText(/nombre/i), 'John');
      await user.type(screen.getByLabelText(/apellido/i), 'Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');
      await user.click(screen.getByRole('checkbox', { name: /acepto los términos/i }));

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(errorMessage);
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();
      mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      renderWithProviders(<Register />);

      // Fill form
      await user.type(screen.getByLabelText(/nombre/i), 'John');
      await user.type(screen.getByLabelText(/apellido/i), 'Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');
      await user.click(screen.getByRole('checkbox', { name: /acepto los términos/i }));

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/cargando/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to login page when clicking login link', () => {
      renderWithProviders(<Register />);

      const loginLink = screen.getByRole('link', { name: /iniciar sesión/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should open terms modal when clicking terms link', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const termsLink = screen.getByRole('button', { name: /términos y condiciones/i });
      await user.click(termsLink);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/términos de servicio/i)).toBeInTheDocument();
      });
    });

    it('should open privacy policy modal when clicking privacy link', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const privacyLink = screen.getByRole('button', { name: /política de privacidad/i });
      await user.click(privacyLink);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/política de privacidad/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and attributes', () => {
      renderWithProviders(<Register />);

      const firstNameInput = screen.getByLabelText(/nombre/i);
      const emailInput = screen.getByLabelText(/correo electrónico/i);
      const passwordInput = screen.getByLabelText(/^contraseña$/i);

      expect(firstNameInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      // Tab through form fields
      await user.tab();
      expect(screen.getByLabelText(/nombre/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/apellido/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/correo electrónico/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/^contraseña$/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/confirmar contraseña/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('checkbox', { name: /acepto los términos/i })).toHaveFocus();
    });

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });
});