/**
 * Authentication Middleware
 * Verifica y valida el JWT en las solicitudes entrantes
 *
 * HU-004: Middleware de Autenticación JWT
 * Este middleware extrae y valida el token JWT del header Authorization
 * AC7: Verifica blacklist de tokens revocados en Redis
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticationError } from './errorHandler';
import { JwtPayload, AuthenticatedUser } from '../types/auth';
import { logger } from './logger';
import { tokenService } from '../services/token.service';
import { prisma } from '../utils/prisma';

/**
 * Middleware de autenticación JWT
 * Extrae el token del header Authorization, lo valida y adjunta los datos del usuario al request
 *
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @throws AuthenticationError si el token no existe, es inválido o expiró
 *
 * @example
 * ```typescript
 * // Proteger una ruta
 * router.get('/profile', authenticate, getProfileController);
 *
 * // Después del middleware, req.user estará disponible
 * function getProfileController(req: Request, res: Response) {
 *   const userId = req.user!.userId; // TypeScript sabe que req.user existe
 * }
 * ```
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Extraer el token del header Authorization
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      throw new AuthenticationError('No se proporcionó token de autenticación');
    }

    // El formato esperado es: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AuthenticationError('Formato de token inválido. Use: Bearer <token>');
    }

    const token = parts[1];

    if (!token) {
      throw new AuthenticationError('Token vacío');
    }

    // 2. AC7: Verificar si el token está en la blacklist (tokens revocados)
    const isBlacklisted = await tokenService.isBlacklisted(token);
    if (isBlacklisted) {
      logger.warn('Intento de uso de token en blacklist');
      throw new AuthenticationError('Token ha sido revocado');
    }

    // 3. Verificar y decodificar el token JWT
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Token JWT expirado');
        throw new AuthenticationError('Token expirado. Por favor, inicia sesión nuevamente.');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn(`Token JWT inválido: ${error.message}`);
        throw new AuthenticationError('Token inválido');
      } else {
        throw error;
      }
    }

    // 4. Validar que el payload tenga los campos requeridos
    if (!decoded.userId || !decoded.email || !decoded.role) {
      logger.warn('Token JWT con payload incompleto');
      throw new AuthenticationError('Token con datos incompletos');
    }

    // 5. Verificar invalidación masiva de tokens del usuario
    // Esto detecta si el usuario cambió su contraseña o se invalidaron todos sus tokens
    if (decoded.iat) {
      const areInvalidated = await tokenService.areUserTokensInvalidated(decoded.userId, decoded.iat);
      if (areInvalidated) {
        logger.warn(`Tokens del usuario ${decoded.userId} fueron invalidados masivamente`);
        throw new AuthenticationError('Sesión invalidada. Por favor, inicia sesión nuevamente.');
      }
    }

    // 6. Verificar que el usuario aún existe en la base de datos
    // Esto previene el uso de tokens de usuarios eliminados
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });

    if (!user) {
      logger.warn(`Token con userId inválido: ${decoded.userId}`);
      throw new AuthenticationError('Usuario no encontrado');
    }

    // 7. Adjuntar datos del usuario al request
    const authenticatedUser: AuthenticatedUser = {
      id: user.id, // Para compatibilidad con logger
      userId: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
      trainingProfileId: decoded.trainingProfileId,
    };

    req.user = authenticatedUser;

    // 8. Continuar con el siguiente middleware/controller
    next();
  } catch (error) {
    // Si es un error de autenticación, lo pasamos al error handler
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      // Para cualquier otro error inesperado
      logger.error('Error inesperado en authenticate middleware:', error);
      next(new AuthenticationError('Error de autenticación'));
    }
  }
}

/**
 * Middleware de autenticación opcional
 * Similar a authenticate pero no lanza error si no hay token
 * Útil para rutas que pueden funcionar con o sin autenticación
 *
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 *
 * @example
 * ```typescript
 * // Ruta que muestra contenido diferente si el usuario está autenticado
 * router.get('/courses', authenticateOptional, getCoursesController);
 *
 * function getCoursesController(req: Request, res: Response) {
 *   if (req.user) {
 *     // Usuario autenticado: mostrar cursos personalizados
 *   } else {
 *     // Usuario anónimo: mostrar cursos públicos
 *   }
 * }
 * ```
 */
export async function authenticateOptional(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers['authorization'];

    // Si no hay header de autenticación, continuar sin usuario
    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];

    if (!token) {
      return next();
    }

    // Intentar verificar el token
    try {
      // Verificar blacklist
      const isBlacklisted = await tokenService.isBlacklisted(token);
      if (isBlacklisted) {
        return next(); // Token revocado, continuar sin usuario
      }

      const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

      if (decoded.userId && decoded.email && decoded.role) {
        // Verificar invalidación masiva
        if (decoded.iat) {
          const areInvalidated = await tokenService.areUserTokensInvalidated(decoded.userId, decoded.iat);
          if (areInvalidated) {
            return next(); // Tokens invalidados, continuar sin usuario
          }
        }

        // Verificar que el usuario existe
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, name: true, role: true },
        });

        if (user) {
          req.user = {
            id: user.id, // Para compatibilidad con logger
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name,
            trainingProfileId: decoded.trainingProfileId,
          };
        }
      }
    } catch (error) {
      // Si el token es inválido, simplemente continuar sin usuario
      // No lanzar error en autenticación opcional
    }

    next();
  } catch (error) {
    // En caso de error inesperado, continuar sin usuario
    logger.warn('Error en authenticateOptional, continuando sin usuario:', error);
    next();
  }
}

/**
 * Helper para extraer el token del request
 * Útil para testing y debugging
 *
 * @param req - Express Request
 * @returns Token JWT o null si no existe
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}
