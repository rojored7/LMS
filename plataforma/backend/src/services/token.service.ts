/**
 * Token Service
 * Maneja el ciclo de vida de los tokens JWT incluyendo blacklist en Redis
 *
 * HU-004: Middleware de Autenticación JWT
 * AC6: Endpoint /auth/logout que invalida refresh token agregándolo a blacklist en Redis
 * AC7: Sistema de blacklist de tokens revocados almacenado en Redis con TTL automático
 */

import jwt from 'jsonwebtoken';
import { redis } from '../utils/redis';
import { logger } from '../middleware/logger';

/**
 * Servicio de gestión de tokens
 * Provee métodos para blacklist, verificación y revocación de tokens JWT
 */
export class TokenService {
  /**
   * Agregar token a la blacklist en Redis
   * El token se almacena con TTL igual al tiempo restante hasta su expiración
   *
   * @param token - Access token JWT a invalidar
   * @throws Error si el token no puede ser decodificado
   *
   * @example
   * ```typescript
   * await tokenService.blacklistToken(accessToken);
   * // Token ahora está en blacklist y no será aceptado
   * ```
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      // Decodificar token para obtener la fecha de expiración
      // No verificamos la firma aquí porque queremos blacklistear incluso tokens inválidos
      const decoded = jwt.decode(token) as any;

      if (!decoded || !decoded.exp) {
        logger.warn('Intento de blacklistear token sin fecha de expiración');
        throw new Error('Token inválido para blacklist: sin fecha de expiración');
      }

      // Calcular TTL: tiempo restante hasta la expiración del token
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;

      // Solo agregar a blacklist si el token aún no ha expirado
      if (ttl > 0) {
        // Guardar en Redis con TTL
        // Usamos el token completo como clave para evitar colisiones
        await redis.setex(`blacklist:${token}`, ttl, '1');
        logger.info(`Token agregado a blacklist (TTL: ${ttl}s, userId: ${decoded.userId || 'unknown'})`);
      } else {
        logger.info('Token ya expirado, no se agrega a blacklist');
      }
    } catch (error) {
      logger.error('Error al agregar token a blacklist:', error);
      throw error;
    }
  }

  /**
   * Verificar si un token está en la blacklist
   *
   * @param token - Access token JWT a verificar
   * @returns true si el token está en la blacklist, false si no
   *
   * @example
   * ```typescript
   * const isBlacklisted = await tokenService.isBlacklisted(token);
   * if (isBlacklisted) {
   *   throw new AuthenticationError('Token ha sido revocado');
   * }
   * ```
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const exists = await redis.exists(`blacklist:${token}`);
      return exists === 1;
    } catch (error) {
      logger.error('Error al verificar blacklist:', error);
      // En caso de error con Redis, fallamos cerrado (rechazamos el token por seguridad)
      return true;
    }
  }

  /**
   * Blacklist masivo: Invalidar todos los tokens de un usuario
   * Útil cuando un usuario cambia su contraseña o cuando se detecta actividad sospechosa
   *
   * @param userId - ID del usuario cuyos tokens se deben invalidar
   *
   * @example
   * ```typescript
   * // Después de cambiar contraseña
   * await tokenService.blacklistUserTokens(userId);
   * // Todos los tokens anteriores ya no serán válidos
   * ```
   */
  async blacklistUserTokens(userId: string): Promise<void> {
    try {
      // Marcar en Redis que todos los tokens emitidos antes de este momento son inválidos
      // Usamos un timestamp para verificar contra iat (issued at) del token
      const timestamp = Date.now().toString();
      await redis.set(`user:${userId}:tokens_invalidated`, timestamp);

      // No establecer TTL - esto es permanente hasta que el usuario inicie sesión de nuevo
      logger.info(`Todos los tokens del usuario ${userId} han sido invalidados`);
    } catch (error) {
      logger.error(`Error al invalidar tokens del usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Verificar si los tokens de un usuario fueron invalidados masivamente
   * Se compara el timestamp de emisión del token contra el timestamp de invalidación
   *
   * @param userId - ID del usuario
   * @param tokenIssuedAt - Timestamp (en segundos) de cuando se emitió el token (campo iat del JWT)
   * @returns true si los tokens fueron invalidados después de la emisión de este token
   */
  async areUserTokensInvalidated(userId: string, tokenIssuedAt: number): Promise<boolean> {
    try {
      const invalidatedAt = await redis.get(`user:${userId}:tokens_invalidated`);

      if (!invalidatedAt) {
        return false; // No hay invalidación masiva
      }

      // Convertir timestamp de milisegundos a segundos para comparar con iat
      const invalidatedTimestamp = parseInt(invalidatedAt, 10) / 1000;

      // Si el token fue emitido antes de la invalidación, es inválido
      return tokenIssuedAt < invalidatedTimestamp;
    } catch (error) {
      logger.error('Error al verificar invalidación masiva de tokens:', error);
      // En caso de error, fallamos cerrado (asumimos que están invalidados)
      return true;
    }
  }

  /**
   * Limpiar la marca de invalidación masiva de tokens de un usuario
   * Se debe llamar después de que el usuario inicie sesión exitosamente
   *
   * @param userId - ID del usuario
   */
  async clearUserTokensInvalidation(userId: string): Promise<void> {
    try {
      await redis.del(`user:${userId}:tokens_invalidated`);
      logger.info(`Marca de invalidación de tokens eliminada para usuario ${userId}`);
    } catch (error) {
      logger.error(`Error al eliminar marca de invalidación para usuario ${userId}:`, error);
      // No lanzamos error - esto no es crítico
    }
  }

  /**
   * Obtener el tiempo restante (TTL) de un token en la blacklist
   * Útil para debugging y monitoreo
   *
   * @param token - Token a consultar
   * @returns Segundos restantes, -1 si no tiene TTL, -2 si no existe
   */
  async getBlacklistTTL(token: string): Promise<number> {
    try {
      return await redis.ttl(`blacklist:${token}`);
    } catch (error) {
      logger.error('Error al obtener TTL de blacklist:', error);
      return -2;
    }
  }

  /**
   * Estadísticas de la blacklist
   * Útil para monitoreo y debugging
   *
   * @returns Objeto con estadísticas de la blacklist
   */
  async getBlacklistStats(): Promise<{ total: number; pattern: string }> {
    try {
      let cursor = '0';
      let count = 0;

      // Contar todas las claves que empiecen con "blacklist:"
      do {
        const [newCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          'blacklist:*',
          'COUNT',
          '100'
        );
        cursor = newCursor;
        count += keys.length;
      } while (cursor !== '0');

      return {
        total: count,
        pattern: 'blacklist:*',
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de blacklist:', error);
      return { total: 0, pattern: 'blacklist:*' };
    }
  }
}

// Exportar instancia singleton del servicio
export const tokenService = new TokenService();
