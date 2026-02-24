/**
 * Cliente Redis Singleton
 * Maneja la conexión y operaciones con Redis para caché y sesiones
 */

import Redis from 'ioredis';
import { config, isDevelopment } from '../config';

/**
 * Cliente Redis Singleton
 */
let redis: Redis;

/**
 * Tipo para almacenar el cliente Redis en el objeto global
 */
interface CustomNodeJsGlobal {
  redis?: Redis;
}

declare const global: CustomNodeJsGlobal;

/**
 * Inicializar el cliente Redis
 */
function createRedisClient(): Redis {
  const client = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 10,
    retryStrategy: (times: number) => {
      if (times > 10) {
        console.error('❌ Redis: Demasiados intentos de reconexión');
        return null; // Stop retrying
      }
      // Reconectar después de un delay exponencial: 50ms, 100ms, 200ms, 400ms...
      const delay = Math.min(times * 50, 2000);
      console.log(`🔄 Redis: Reintentando conexión en ${delay}ms...`);
      return delay;
    },
    lazyConnect: true, // Don't connect automatically
  });

  // Event handlers
  client.on('error', (err: Error) => {
    console.error('❌ Redis Error:', err);
  });

  client.on('connect', () => {
    console.log('🔄 Redis: Conectando...');
  });

  client.on('ready', () => {
    console.log('✅ Redis: Conexión lista');
  });

  client.on('reconnecting', () => {
    console.log('🔄 Redis: Reconectando...');
  });

  client.on('end', () => {
    console.log('❌ Redis: Conexión cerrada');
  });

  return client;
}

/**
 * Obtener el cliente Redis
 * Reutiliza la instancia en desarrollo, crea nueva en producción
 */
if (isDevelopment) {
  if (!global.redis) {
    global.redis = createRedisClient();
  }
  redis = global.redis;
} else {
  redis = createRedisClient();
}

/**
 * Conectar al servidor Redis
 */
export async function connectRedis(): Promise<void> {
  try {
    if (redis.status !== 'ready') {
      await redis.connect();
      console.log('✅ Conectado a Redis');
    }
  } catch (error) {
    console.error('❌ Error al conectar a Redis:', error);
    throw error;
  }
}

/**
 * Desconectar del servidor Redis
 */
export async function disconnectRedis(): Promise<void> {
  try {
    if (redis.status === 'ready') {
      await redis.quit();
      console.log('✅ Desconectado de Redis');
    }
  } catch (error) {
    console.error('❌ Error al desconectar de Redis:', error);
    throw error;
  }
}

/**
 * Verificar la conexión a Redis
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    if (redis.status !== 'ready') {
      return false;
    }
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('❌ Error en health check de Redis:', error);
    return false;
  }
}

/**
 * Helper: Obtener valor del caché
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`❌ Error al obtener caché (${key}):`, error);
    return null;
  }
}

/**
 * Helper: Guardar valor en caché
 * @param key - Clave del caché
 * @param value - Valor a almacenar (será serializado a JSON)
 * @param ttl - Tiempo de vida en segundos (opcional, usa config.REDIS_TTL por defecto)
 */
export async function setCache(
  key: string,
  value: any,
  ttl: number = config.REDIS_TTL
): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    await redis.setex(key, ttl, serialized);
    return true;
  } catch (error) {
    console.error(`❌ Error al guardar caché (${key}):`, error);
    return false;
  }
}

/**
 * Helper: Eliminar valor del caché
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`❌ Error al eliminar caché (${key}):`, error);
    return false;
  }
}

/**
 * Helper: Invalidar múltiples claves por patrón
 * CUIDADO: Usa SCAN para evitar bloquear Redis
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  try {
    let cursor = '0';
    let deletedCount = 0;

    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
      cursor = newCursor;

      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');

    if (deletedCount > 0) {
      console.log(`🗑️ Redis: Invalidadas ${deletedCount} claves con patrón "${pattern}"`);
    }

    return deletedCount;
  } catch (error) {
    console.error(`❌ Error al invalidar caché con patrón (${pattern}):`, error);
    return 0;
  }
}

/**
 * Helper: Verificar si una clave existe
 */
export async function existsCache(key: string): Promise<boolean> {
  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    console.error(`❌ Error al verificar existencia de caché (${key}):`, error);
    return false;
  }
}

/**
 * Helper: Obtener TTL restante de una clave
 * @returns Segundos restantes, -1 si no tiene expiración, -2 si no existe
 */
export async function getTTL(key: string): Promise<number> {
  try {
    return await redis.ttl(key);
  } catch (error) {
    console.error(`❌ Error al obtener TTL de caché (${key}):`, error);
    return -2;
  }
}

// Exportar el cliente Redis
export { redis };

/**
 * Manejo de señales de terminación para cerrar la conexión limpiamente
 */
process.on('beforeExit', async () => {
  await disconnectRedis();
});

process.on('SIGINT', async () => {
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectRedis();
  process.exit(0);
});
