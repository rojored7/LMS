/**
 * Validadores de Autenticación
 * Schemas de validación con Zod para endpoints de autenticación
 */

import { z } from 'zod';

/**
 * Schema de validación para registro de usuario
 * Criterios según HU-001:
 * - Email válido
 * - Password: mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
 * - Nombre: 2-100 caracteres
 * - confirmPassword debe coincidir con password
 */
export const registerSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener mínimo 8 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
    name: z
      .string()
      .min(2, 'El nombre debe tener mínimo 2 caracteres')
      .max(100, 'El nombre debe tener máximo 100 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

/**
 * Tipo inferido del schema de registro
 */
export type RegisterDto = z.infer<typeof registerSchema>;

/**
 * Schema de validación para login
 */
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

/**
 * Tipo inferido del schema de login
 */
export type LoginDto = z.infer<typeof loginSchema>;

/**
 * Schema de validación para refresh token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'El refresh token es requerido'),
});

/**
 * Tipo inferido del schema de refresh token
 */
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

/**
 * Schema de validación para solicitud de reseteo de contraseña
 * HU-005 AC1: Formulario de "Olvidé mi contraseña"
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

/**
 * Tipo inferido del schema de forgot password
 */
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema de validación para reseteo de contraseña
 * HU-005 AC5: Validación de nueva contraseña con mismos requisitos de registro
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token es requerido'),
    newPassword: z
      .string()
      .min(8, 'La contraseña debe tener mínimo 8 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

/**
 * Tipo inferido del schema de reset password
 */
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
