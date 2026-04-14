/**
 * Login page
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { loginSchema } from '../utils/validators';
import { ROUTES } from '../utils/constants';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, error: authError, clearError } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || ROUTES.DASHBOARD;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear auth errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as string;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Submit form
    setIsLoading(true);
    setErrors({});

    try {
      await login(formData.email, formData.password);
      toast.success('Sesión iniciada correctamente');

      // Redirect will happen through useEffect when isAuthenticated changes
    } catch (error: any) {
      const errorMessage =
        error?.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
          <CardHeader className="border-b border-gray-200">
            <div className="text-center">
              <h2 className="text-3xl font-bold font-heading text-gray-900">
                Iniciar Sesion
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                No tienes una cuenta?{' '}
                <Link
                  to={ROUTES.REGISTER}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Registrate aqui
                </Link>
              </p>
            </div>
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General error */}
              {errors.general && (
                <div className="p-3 bg-red-900/20 border border-red-800 rounded-xl">
                  <p className="text-sm text-red-400">{errors.general}</p>
                </div>
              )}

              {/* Email */}
              <Input
                type="email"
                name="email"
                label="Correo Electrónico"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                autoComplete="email"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                }
              />

              {/* Password */}
              <Input
                type="password"
                name="password"
                label="Contraseña"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                autoComplete="current-password"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
              />

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded bg-white"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Recordarme
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to={ROUTES.FORGOT_PASSWORD}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Olvidaste tu contrasena?
                  </Link>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                Iniciar Sesión
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
