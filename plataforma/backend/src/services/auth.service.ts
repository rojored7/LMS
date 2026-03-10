/**
 * Servicio de Autenticación
 * Maneja la lógica de negocio relacionada con autenticación y registro
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { ConflictError, AuthenticationError, ValidationError } from '../middleware/errorHandler';
import { RegisterDto } from '../validators/auth.validator';
import { logger } from '../middleware/logger';
import { tokenService } from './token.service';
import { emailService } from './email.service';

/**
 * Interfaz para el usuario retornado (sin password)
 */
interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

/**
 * Interfaz para el payload del token JWT
 */
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Interfaz para la respuesta de login
 */
interface LoginResponse {
  user: UserResponse & { trainingProfile?: any };
  accessToken: string;
  refreshToken: string;
}

/**
 * Servicio de Autenticación
 */
export class AuthService {
  /**
   * Registra un nuevo usuario en la plataforma
   * Implementa AC1-AC8 de HU-001
   *
   * @param data - Datos del usuario a registrar
   * @returns Usuario creado (sin password hash)
   * @throws ConflictError si el email ya está registrado
   */
  async register(data: RegisterDto): Promise<UserResponse> {
    // AC2: Verificar que el email sea único
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('El email ya está registrado');
    }

    // AC4: Hash de contraseña con bcrypt (salt rounds = 12 según especificación)
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Crear usuario con rol STUDENT por defecto
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: 'STUDENT', // Rol por defecto según la especificación
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Log de operación exitosa
    console.log(`✅ Usuario registrado exitosamente: ${user.email}`);

    return user;
  }

  /**
   * Verifica si un email ya está registrado
   * Útil para validación en tiempo real en el frontend
   *
   * @param email - Email a verificar
   * @returns true si el email existe, false si no
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return !!user;
  }

  /**
   * Inicia sesión de un usuario con email y contraseña
   * Implementa AC1-AC8 de HU-002
   *
   * @param email - Email del usuario
   * @param password - Contraseña en texto plano
   * @returns Usuario autenticado con tokens JWT
   * @throws AuthenticationError si las credenciales son inválidas
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // AC2: Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { trainingProfile: true },
    });

    // AC6: Mensaje genérico si el usuario no existe (evitar enumeración de usuarios)
    if (!user) {
      logger.warn(`Intento de login fallido: usuario no encontrado - ${email}`);
      throw new AuthenticationError('Email o contraseña incorrectos');
    }

    // AC2: Verificar contraseña con bcrypt (comparación segura de hash)
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      logger.warn(`Intento de login fallido: contraseña incorrecta - ${email}`);
      throw new AuthenticationError('Email o contraseña incorrectos');
    }

    // AC3: Generar access token JWT con expiración de 15 minutos
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // AC8: Generar refresh token con expiración de 7 días
    const refreshToken = this.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Guardar refresh token en base de datos
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    });

    // Actualizar lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log de login exitoso
    logger.info(`Login exitoso: ${email} (${user.role})`);

    // Retornar usuario sin passwordHash
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        trainingProfile: user.trainingProfile,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Genera un access token JWT
   * AC3: Token con expiración de 15 minutos que incluye userId, email, role
   *
   * @param payload - Datos del usuario a incluir en el token
   * @returns Access token JWT
   */
  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Genera un refresh token JWT
   * AC8: Token con expiración de 7 días
   *
   * @param payload - Datos del usuario a incluir en el token
   * @returns Refresh token JWT
   */
  private generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Renueva un access token usando un refresh token válido
   * Implementa endpoint POST /api/auth/refresh
   *
   * @param refreshToken - Refresh token JWT
   * @returns Nuevo access token
   * @throws AuthenticationError si el refresh token es inválido o expirado
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    // 1. Verificar que el refresh token sea válido
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    } catch (error) {
      logger.warn('Intento de refresh con token inválido o expirado');
      throw new AuthenticationError('Refresh token inválido o expirado');
    }

    // 2. Verificar que el token exista en la base de datos y no haya expirado
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.userId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      logger.warn(`Refresh token no encontrado o expirado - userId: ${payload.userId}`);
      throw new AuthenticationError('Refresh token no encontrado o expirado');
    }

    // 3. Generar nuevo access token
    const newAccessToken = this.generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    logger.info(`Access token renovado exitosamente - userId: ${payload.userId}`);

    return { accessToken: newAccessToken };
  }

  /**
   * Invalida un refresh token y access token (logout)
   * Implementa endpoint POST /api/auth/logout
   * AC6: Agrega access token a blacklist en Redis
   *
   * @param refreshToken - Refresh token a invalidar (opcional)
   * @param accessToken - Access token a agregar a blacklist (opcional)
   */
  async logout(refreshToken?: string, accessToken?: string): Promise<void> {
    // 1. Agregar access token a blacklist en Redis
    if (accessToken) {
      try {
        await tokenService.blacklistToken(accessToken);
        logger.info('Access token agregado a blacklist');
      } catch (error) {
        logger.error('Error al agregar access token a blacklist:', error);
        // No lanzamos error - continuar con el logout
      }
    }

    // 2. Eliminar refresh token de la base de datos
    if (refreshToken) {
      try {
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
        logger.info('Refresh token eliminado de la base de datos');
      } catch (error) {
        logger.error('Error al eliminar refresh token:', error);
        // No lanzamos error - el access token ya está en blacklist
      }
    }

    logger.info('Logout exitoso');
  }

  /**
   * Solicita un reseteo de contraseña
   * HU-005 AC1, AC2, AC3: Genera token y envía email
   * HU-005 AC8: No revelar si el email existe (seguridad)
   *
   * @param email - Email del usuario que solicita el reseteo
   */
  async requestPasswordReset(email: string): Promise<void> {
    // 1. Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    });

    // HU-005: No revelar si el email existe o no (prevenir enumeración)
    if (!user) {
      logger.warn(`Intento de reset para email no registrado: ${email}`);
      // Retornar éxito silenciosamente
      return;
    }

    // 2. AC2: Generar token de reseteo criptográficamente seguro
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash del token para almacenar en BD (mayor seguridad)
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // 3. AC2: Guardar token en BD con expiración de 1 hora
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetTokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
    });

    // 4. AC3: Enviar email con link de recuperación
    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
      logger.info(`Token de reset generado y email enviado a ${email}`);

      // LOG TEMPORAL PARA DESARROLLO: Mostrar URL completa
      if (config.NODE_ENV === 'development') {
        const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;
        logger.info(`[DEV ONLY] Password reset URL: ${resetUrl}`);
      }
    } catch (error) {
      logger.error(`Error enviando email de reset a ${email}:`, error);
      // Eliminar token si el email falló
      await prisma.passwordResetToken.deleteMany({
        where: {
          token: resetTokenHash,
        },
      });
      throw new Error('Error al enviar email de recuperación');
    }
  }

  /**
   * Verifica si un token de reseteo es válido
   * HU-005 AC4: Verificar token válido y no expirado
   *
   * @param token - Token de reseteo (sin hash)
   * @returns true si el token es válido, false si no
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    // Hash del token recibido
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar token en BD
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: tokenHash,
        expiresAt: { gt: new Date() }, // No expirado
        usedAt: null, // No usado
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
      },
    });

    if (!resetToken) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: resetToken.userId
    };
  }

  /**
   * Resetea la contraseña usando un token válido
   * HU-005 AC4, AC5, AC6: Validar token, actualizar contraseña, invalidar token
   *
   * @param token - Token de reseteo (sin hash)
   * @param newPassword - Nueva contraseña
   * @throws ValidationError si el token es inválido o expirado
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // 1. Hash del token recibido
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 2. AC4: Buscar token en BD
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: tokenHash,
        expiresAt: { gt: new Date() }, // AC4: Verificar no expirado
        usedAt: null, // AC6: Verificar no usado
      },
      include: { user: true },
    });

    if (!resetToken) {
      logger.warn('Intento de reset con token inválido o expirado');
      throw new ValidationError('Token inválido o expirado');
    }

    // 3. AC5: Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // 4. Actualizar contraseña
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // 5. AC6: Marcar token como usado
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    // 6. Invalidar todos los refresh tokens del usuario (forzar re-login)
    await prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    logger.info(`Contraseña restablecida exitosamente para usuario ${resetToken.user.email}`);
  }
}

// Exportar instancia singleton del servicio
export const authService = new AuthService();
