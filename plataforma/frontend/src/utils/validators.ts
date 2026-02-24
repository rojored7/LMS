/**
 * Validation utilities using Zod
 */

import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from './constants';

// Email validation
export const emailSchema = z
  .string()
  .min(1, 'El email es requerido')
  .email('Email inválido');

// Password validation - HU-001: Requisitos de contraseña
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial');

// Login form validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Register form validation - HU-001: Registro de Usuario
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Profile update validation
export const profileUpdateSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
  bio: z.string().max(500, 'La biografía no puede exceder 500 caracteres').optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Número de teléfono inválido').optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// Change password validation
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, 'Confirma tu nueva contraseña'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'La nueva contraseña debe ser diferente a la actual',
  path: ['newPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Course creation validation
export const courseSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres').max(1000),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  duration: z.number().min(1, 'La duración debe ser al menos 1 minuto'),
  tags: z.array(z.string()).optional(),
});

export type CourseFormData = z.infer<typeof courseSchema>;

// Utility function to validate data against a schema
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });

  return { success: false, errors };
}

// Email validator function
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

// Password validator function
export function isValidPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

// URL validator
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
