/**
 * Forgot Password page
 * HU-005 AC1: Formulario de "Olvidé mi contraseña"
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { useToast } from '../hooks/useToast';
import authService from '../services/auth.service';
import { ROUTES } from '../utils/constants';

export const ForgotPassword: React.FC = () => {
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validación básica
    if (!email) {
      setErrors({ email: 'El email es requerido' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Email inválido' });
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setEmailSent(true);
      toast.success('Revisa tu email para continuar');
    } catch (error: any) {
      const errorMessage =
        error?.error?.message || 'Error al enviar email. Intenta de nuevo más tarde.';
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                  <svg
                    className="h-8 w-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Email Enviado
                </h2>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Si el email existe en nuestro sistema, recibirás instrucciones para
                  restablecer tu contraseña.
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  El enlace expirará en 1 hora por seguridad.
                </p>
              </div>
            </CardHeader>

            <CardBody>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    <strong>¿No recibiste el email?</strong>
                    <br />
                    Revisa tu carpeta de spam o correo no deseado.
                  </p>
                </div>

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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Recuperar Contraseña
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.
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

              {/* Email */}
              <Input
                type="email"
                name="email"
                label="Correo Electrónico"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: '' }));
                  }
                }}
                error={errors.email}
                required
                autoComplete="email"
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
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                }
              />

              {/* Submit button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                Enviar Instrucciones
              </Button>

              {/* Back to login */}
              <div className="text-center">
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Volver a Iniciar Sesión
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
