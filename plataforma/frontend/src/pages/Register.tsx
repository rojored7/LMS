/**
 * Register page
 * HU-001: Registro de Usuario
 */

import React, { useEffect, useState } from 'react';
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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
          <CardHeader className="border-b border-gray-200">
            <div className="text-center">
              <h2 className="text-3xl font-bold font-heading text-gray-900">Crear Cuenta</h2>
              <p className="mt-2 text-sm text-gray-600">
                Ya tienes una cuenta?{' '}
                <Link to={ROUTES.LOGIN} className="font-medium text-blue-600 hover:text-blue-700">
                  Inicia sesion aqui
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
                type={showPassword ? 'text' : 'password'}
                label="Contraseña"
                placeholder="••••••••"
                error={errors.password?.message}
                disabled={isSubmitting}
                autoComplete="new-password"
                helperText="Mínimo 8 caracteres: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                }
                {...register('password')}
              />

              {/* AC1, AC8: Campo confirmacion de password */}
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Confirmar Contraseña"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                disabled={isSubmitting}
                autoComplete="new-password"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
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
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded mt-1 bg-white"
                />
                <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-700">
                  Acepto los{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    terminos y condiciones
                  </a>{' '}
                  y la{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    politica de privacidad
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
