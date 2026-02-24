/**
 * Rutas de Autenticación
 * Define los endpoints relacionados con autenticación y registro
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 * HU-001: Registro de Usuario
 */
router.post('/register', asyncHandler(authController.register.bind(authController)));

/**
 * GET /api/auth/check-email/:email
 * Verifica disponibilidad de email
 * Útil para validación en tiempo real
 */
router.get('/check-email/:email', asyncHandler(authController.checkEmail.bind(authController)));

/**
 * POST /api/auth/login
 * Inicia sesión con credenciales
 * HU-002: Login con Credenciales
 */
router.post('/login', asyncHandler(authController.login.bind(authController)));

/**
 * POST /api/auth/refresh
 * Renueva el access token usando refresh token
 * HU-002: Renovación de tokens
 */
router.post('/refresh', asyncHandler(authController.refresh.bind(authController)));

/**
 * POST /api/auth/logout
 * Cierra sesión invalidando el refresh token
 * HU-002: Cierre de sesión
 */
router.post('/logout', asyncHandler(authController.logout.bind(authController)));

/**
 * POST /api/auth/forgot-password
 * Solicita reseteo de contraseña
 * HU-005: Recuperación de Contraseña
 */
router.post('/forgot-password', asyncHandler(authController.forgotPassword.bind(authController)));

/**
 * GET /api/auth/verify-reset-token/:token
 * Verifica validez de token de reseteo
 * HU-005: Recuperación de Contraseña
 */
router.get('/verify-reset-token/:token', asyncHandler(authController.verifyResetToken.bind(authController)));

/**
 * POST /api/auth/reset-password
 * Resetea contraseña con token válido
 * HU-005: Recuperación de Contraseña
 */
router.post('/reset-password', asyncHandler(authController.resetPassword.bind(authController)));

export default router;
