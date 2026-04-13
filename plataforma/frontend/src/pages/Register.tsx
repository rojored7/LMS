/**
 * Register page
 * HU-001: Registro de Usuario
 */

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { useToast } from '../hooks/useToast';
import { registerSchema, RegisterFormData } from '../utils/validators';
import { ROUTES } from '../utils/constants';
import { useAuthStore } from '../store/authStore';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const authRegister = useAuthStore((s) => s.register);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  // Submit handler
  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword: _, ...registerData } = data;
      await authRegister(registerData);

      toast.success('Usuario registrado exitosamente');
      navigate(ROUTES.DASHBOARD);
    } catch (error: any) {
      const errorMessage =
        error?.error?.message ||
        error?.message ||
        'Error en el registro. Por favor, intenta nuevamente.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Crear Cuenta</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                ¿Ya tienes una cuenta?{' '}
                <Link to={ROUTES.LOGIN} className="font-medium text-blue-600 hover:text-blue-500">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* AC1: Campo nombre completo */}
              <Input
                type="text"
                label="Nombre Completo"
                placeholder="Juan Pérez"
                error={errors.name?.message}
                disabled={isSubmitting}
                autoComplete="name"
                {...register('name')}
              />

              {/* AC1: Campo email */}
              <Input
                type="email"
                label="Correo Electrónico"
                placeholder="tu@email.com"
                error={errors.email?.message}
                disabled={isSubmitting}
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
                {...register('email')}
              />

              {/* AC1, AC3: Campo password con requisitos */}
              <Input
                type="password"
                label="Contraseña"
                placeholder="••••••••"
                error={errors.password?.message}
                disabled={isSubmitting}
                autoComplete="new-password"
                helperText="Mínimo 8 caracteres: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial"
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
                {...register('password')}
              />

              {/* AC1, AC8: Campo confirmación de password */}
              <Input
                type="password"
                label="Confirmar Contraseña"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                disabled={isSubmitting}
                autoComplete="new-password"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                {...register('confirmPassword')}
              />

              {/* Terms acceptance */}
              <div className="flex items-start">
                <input
                  id="accept-terms"
                  name="accept-terms"
                  type="checkbox"
                  required
                  disabled={isSubmitting}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <label
                  htmlFor="accept-terms"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Acepto los{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    términos y condiciones
                  </a>{' '}
                  y la{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    política de privacidad
                  </a>
                </label>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full"
              >
                Registrarse
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
