/**
 * Controlador de Autenticación
 * Maneja las solicitudes HTTP relacionadas con autenticación
 */

import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/auth.validator';

/**
 * Controlador de Autenticación
 */
export class AuthController {
  /**
   * POST /api/auth/register
   * Registra un nuevo usuario en la plataforma
   * Implementa HU-001: Registro de Usuario
   *
   * @param req - Request con datos del usuario en body
   * @param res - Response con usuario creado
   */
  async register(req: Request, res: Response): Promise<void> {
    // AC5: Validar datos con Zod (validación en backend)
    const validated = registerSchema.parse(req.body);

    // Crear usuario mediante el servicio
    const user = await authService.register(validated);

    // AC6, AC7: Responder con mensaje de éxito
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: { user },
    });
  }

  /**
   * GET /api/auth/check-email/:email
   * Verifica si un email ya está registrado
   * Útil para validación en tiempo real
   *
   * @param req - Request con email en params
   * @param res - Response con disponibilidad del email
   */
  async checkEmail(req: Request, res: Response): Promise<void> {
    const email = req.params['email'];

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email es requerido',
      });
      return;
    }

    const exists = await authService.emailExists(email);

    res.status(200).json({
      success: true,
      data: {
        available: !exists,
        message: exists ? 'Email ya registrado' : 'Email disponible',
      },
    });
  }

  /**
   * POST /api/auth/login
   * Inicia sesión de un usuario con credenciales
   * Implementa HU-002: Login con Credenciales
   *
   * @param req - Request con email y password en body
   * @param res - Response con usuario y tokens JWT
   */
  async login(req: Request, res: Response): Promise<void> {
    // AC1: Validar datos del formulario de login
    const validated = loginSchema.parse(req.body);

    // Ejecutar login mediante el servicio
    const result = await authService.login(validated.email, validated.password);

    // AC4, AC5: Retornar usuario y tokens
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: result,
    });
  }

  /**
   * POST /api/auth/refresh
   * Renueva el access token usando un refresh token válido
   * Implementa HU-002: Renovación de tokens
   *
   * @param req - Request con refreshToken en body
   * @param res - Response con nuevo access token
   */
  async refresh(req: Request, res: Response): Promise<void> {
    // Validar que el refresh token esté presente
    const validated = refreshTokenSchema.parse(req.body);

    // Generar nuevo access token
    const result = await authService.refreshAccessToken(validated.refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token renovado exitosamente',
      data: result,
    });
  }

  /**
   * POST /api/auth/logout
   * Cierra sesión invalidando el refresh token y agregando access token a blacklist
   * Implementa HU-002: Cierre de sesión
   * Implementa HU-004 AC6: Logout agrega token a blacklist
   *
   * @param req - Request con refreshToken en body (opcional) y Authorization header (opcional)
   * @param res - Response de confirmación
   */
  async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    // Extraer access token del header Authorization si está presente
    let accessToken: string | undefined;
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.split(' ')[1];
    }

    // Invalidar refresh token y agregar access token a blacklist
    await authService.logout(refreshToken, accessToken);

    res.status(200).json({
      success: true,
      message: 'Logout exitoso',
    });
  }

  /**
   * POST /api/auth/forgot-password
   * Solicita un reseteo de contraseña
   * Implementa HU-005: Recuperación de Contraseña (AC1, AC2, AC3)
   *
   * @param req - Request con email en body
   * @param res - Response de confirmación genérica
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    // Validar datos
    const validated = forgotPasswordSchema.parse(req.body);

    // Solicitar reseteo
    await authService.requestPasswordReset(validated.email);

    // AC1: Respuesta genérica (no revelar si el email existe)
    res.status(200).json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña',
    });
  }

  /**
   * GET /api/auth/verify-reset-token/:token
   * Verifica si un token de reseteo es válido
   * Implementa HU-005 AC4: Verificar token válido
   *
   * @param req - Request con token en params
   * @param res - Response con validez del token
   */
  async verifyResetToken(req: Request, res: Response): Promise<void> {
    const token = req.params['token'];

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token es requerido',
      });
      return;
    }

    const result = await authService.verifyResetToken(token);

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  /**
   * POST /api/auth/reset-password
   * Resetea la contraseña usando un token válido
   * Implementa HU-005: Recuperación de Contraseña (AC4, AC5, AC6, AC7)
   *
   * @param req - Request con token y newPassword en body
   * @param res - Response de confirmación
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    // AC5: Validar datos con schema (incluye validación de contraseña)
    const validated = resetPasswordSchema.parse(req.body);

    // Resetear contraseña
    await authService.resetPassword(validated.token, validated.newPassword);

    // AC7: Mensaje de confirmación
    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
    });
  }
}

// Exportar instancia singleton del controlador
export const authController = new AuthController();
