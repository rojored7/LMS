/**
 * Cliente Prisma Singleton
 * Garantiza que solo existe una instancia del cliente Prisma en toda la aplicación
 * Esto es importante para evitar abrir múltiples conexiones a la base de datos
 */

import { PrismaClient } from '@prisma/client';
import { isDevelopment } from '../config';

/**
 * Opciones de configuración del cliente Prisma
 */
const prismaOptions = {
  log: isDevelopment
    ? ['query', 'error', 'warn']
    : ['error'],
} as any;

/**
 * Tipo para almacenar el cliente Prisma en el objeto global
 * Esto es necesario para mantener la instancia entre hot-reloads en desarrollo
 */
interface CustomNodeJsGlobal {
  prisma?: PrismaClient;
}

declare const global: CustomNodeJsGlobal;

/**
 * Cliente Prisma Singleton
 * En desarrollo, reutiliza la instancia existente para evitar múltiples conexiones
 * En producción, crea una nueva instancia
 */
let prisma: PrismaClient;

if (isDevelopment) {
  // En desarrollo, usar una variable global para preservar el cliente entre hot-reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaOptions);
  }
  prisma = global.prisma;
} else {
  // En producción, crear una nueva instancia
  prisma = new PrismaClient(prismaOptions);
}

/**
 * Middleware de Prisma para logging de queries en desarrollo
 * (El logging ya está habilitado con la opción 'query' en prismaOptions)
 */

/**
 * Función helper para conectar a la base de datos
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Conectado a PostgreSQL');
  } catch (error) {
    console.error('❌ Error al conectar a PostgreSQL:', error);
    throw error;
  }
}

/**
 * Función helper para desconectar de la base de datos
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ Desconectado de PostgreSQL');
  } catch (error) {
    console.error('❌ Error al desconectar de PostgreSQL:', error);
    throw error;
  }
}

/**
 * Función helper para verificar la conexión a la base de datos
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Error en health check de PostgreSQL:', error);
    return false;
  }
}

// Exportar el cliente Prisma
export { prisma };

/**
 * Manejo de señales de terminación para cerrar la conexión limpiamente
 */
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
