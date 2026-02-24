/**
 * Configuración de la aplicación
 * Todas las variables de entorno se validan usando Zod para garantizar type safety y valores correctos
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env o .env.test
const envFile = process.env['NODE_ENV'] === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.join(__dirname, '..', '..', envFile) });

/**
 * Schema de validación para las variables de entorno
 * Zod validará que todas las variables requeridas estén presentes y tengan el formato correcto
 */
const configSchema = z.object({
  // Entorno de ejecución
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Servidor
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('5000'),
  HOST: z.string().default('0.0.0.0'),

  // Frontend URL para CORS
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // CORS Origins (múltiples orígenes separados por coma)
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Base de datos PostgreSQL
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL es requerida'),
  REDIS_TTL: z.string().transform(Number).pipe(z.number().positive()).default('3600'), // 1 hora por defecto

  // JWT Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'), // 15 minutos para access token
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'), // 7 días para refresh token

  // Bcrypt
  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(15)).default('12'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'), // 15 minutos
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().positive()).default('10485760'), // 10MB en bytes
  UPLOAD_DIR: z.string().default('./uploads'),

  // Code Executor
  EXECUTOR_SERVICE_URL: z.string().url().default('http://localhost:6000'),
  EXECUTOR_TIMEOUT: z.string().transform(Number).pipe(z.number().positive()).default('30000'), // 30 segundos

  // Email (opcional en desarrollo)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number()).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Certificados
  CERTIFICATE_STORAGE_PATH: z.string().default('./certificates'),
  CERTIFICATE_BASE_URL: z.string().url().default('http://localhost:5000/certificates'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  LOG_DIR: z.string().default('./logs'),

  // Monitoreo (opcional)
  SENTRY_DSN: z.string().optional(),

  // API Keys (opcional)
  API_KEY_HEADER: z.string().default('X-API-Key'),
});

/**
 * Tipo inferido del schema de configuración
 */
export type Config = z.infer<typeof configSchema>;

/**
 * Validar y parsear las variables de entorno
 * Si hay errores de validación, la aplicación no arrancará
 */
let config: Config;

try {
  config = configSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Error de configuración: Variables de entorno inválidas');
    console.error(error.errors);
    process.exit(1);
  }
  throw error;
}

/**
 * Configuración validada de la aplicación
 * Exportada como constante para garantizar inmutabilidad
 */
export { config };

/**
 * Helper: ¿Estamos en producción?
 */
export const isProduction = config.NODE_ENV === 'production';

/**
 * Helper: ¿Estamos en desarrollo?
 */
export const isDevelopment = config.NODE_ENV === 'development';

/**
 * Helper: ¿Estamos en testing?
 */
export const isTest = config.NODE_ENV === 'test';

/**
 * Opciones de CORS
 */
export const corsOptions = {
  origin: config.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: true,
  optionsSuccessStatus: 200,
};

/**
 * Opciones de rate limiting
 */
export const rateLimitOptions = {
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
};
