/**
 * Reset Password page
 * HU-005 AC4, AC5, AC6, AC7: Reseteo de contraseña con token
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { useToast } from '../hooks/useToast';
import authService from '../services/auth.service';
import { ROUTES } from '../utils/constants';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // HU-005 AC4: Verificar token al cargar la página
  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const result = await authService.verifyResetToken(token);
        setTokenValid(result.valid);
      } catch (error) {
        setTokenValid(false);
        toast.error('Error al verificar el token');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Al menos una letra mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Al menos una letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Al menos un número');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Al menos un carácter especial');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validaciones
    const passwordErrors = validatePassword(formData.newPassword);
    if (passwordErrors.length > 0) {
      setErrors({ newPassword: passwordErrors.join(', ') });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return;
    }

    if (!token) {
      setErrors({ general: 'Token no encontrado' });
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, formData.newPassword);
      toast.success('Contraseña restablecida exitosamente');
      navigate(ROUTES.LOGIN);
    } catch (error: any) {
      const errorMessage =
        error?.error?.message || 'Error al restablecer contraseña. Intenta de nuevo.';
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Verificando token...
          </p>
        </div>
      </div>
    );
  }

  // Invalid or missing token
  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                  <svg
                    className="h-8 w-8 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Token Inválido o Expirado
                </h2>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  El enlace de recuperación no es válido o ha expirado.
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Los enlaces de recuperación expiran después de 1 hora por seguridad.
                </p>
              </div>
            </CardHeader>

            <CardBody>
              <div className="space-y-3">
                <Link to={ROUTES.FORGOT_PASSWORD}>
                  <Button variant="primary" className="w-full">
                    Solicitar Nuevo Enlace
                  </Button>
                </Link>
                <Link to={ROUTES.LOGIN}>
                  <Button variant="outline" className="w-full">
                    Volver a Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // Valid token - show reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                <svg
                  className="h-8 w-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Nueva Contraseña
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Ingresa tu nueva contraseña. Debe ser segura y fácil de recordar.
              </p>
            </div>
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General error */}
              {errors.general && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
                </div>
              )}

              {/* New Password */}
              <Input
                type="password"
                name="newPassword"
                label="Nueva Contraseña"
                placeholder="••••••••"
                value={formData.newPassword}
                onChange={handleChange}
                error={errors.newPassword}
                required
                autoComplete="new-password"
                leftIcon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
              />

              {/* Confirm Password */}
              <Input
                type="password"
                name="confirmPassword"
                label="Confirmar Contraseña"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
                leftIcon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />

              {/* Password requirements */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  La contraseña debe contener:
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Mínimo 8 caracteres
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Al menos una letra mayúscula
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Al menos una letra minúscula
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Al menos un número
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Al menos un carácter especial (!@#$%^&*)
                  </li>
                </ul>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                Restablecer Contraseña
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
