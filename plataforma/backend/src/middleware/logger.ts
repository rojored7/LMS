/**
 * Middleware de logging con Winston
 * Registra todas las solicitudes HTTP y errores de la aplicación
 */

import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import { config, isProduction, isDevelopment } from '../config';
import path from 'path';
import fs from 'fs';

// Crear directorio de logs si no existe
if (!fs.existsSync(config.LOG_DIR)) {
  fs.mkdirSync(config.LOG_DIR, { recursive: true });
}

/**
 * Formato personalizado para logs
 */
const customFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
  let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

  // Agregar metadata si existe
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }

  return log;
});

/**
 * Configuración de transports
 */
const transports: winston.transport[] = [];

// Transport para consola (siempre activo)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      customFormat
    ),
  })
);

// Transports para archivos (solo en producción o si está configurado)
if (isProduction || process.env['LOG_TO_FILE'] === 'true') {
  // Logs de error (error.log)
  transports.push(
    new winston.transports.File({
      filename: path.join(config.LOG_DIR, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Logs combinados (combined.log)
  transports.push(
    new winston.transports.File({
      filename: path.join(config.LOG_DIR, 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Logs de HTTP requests (http.log)
  transports.push(
    new winston.transports.File({
      filename: path.join(config.LOG_DIR, 'http.log'),
      level: 'http',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

/**
 * Logger principal de la aplicación
 */
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  transports,
  // No salir en caso de error de logging
  exitOnError: false,
});

/**
 * Stream para Morgan HTTP logger
 */
export const stream = {
  write: (message: string) => {
    // Remover el salto de línea final que Morgan agrega
    logger.http(message.trim());
  },
};

/**
 * Middleware para logging de requests HTTP
 * Registra método, URL, status code y tiempo de respuesta
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Capturar el evento de finalización de la respuesta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    // Determinar el nivel de log según el status code
    let logLevel: 'info' | 'warn' | 'error' = 'info';
    if (statusCode >= 400 && statusCode < 500) {
      logLevel = 'warn';
    } else if (statusCode >= 500) {
      logLevel = 'error';
    }

    // Crear mensaje de log
    const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;

    // Metadata adicional
    const meta = {
      method,
      url: originalUrl,
      statusCode,
      duration,
      ip,
      userAgent: req.get('user-agent') || 'unknown',
      ...(req.user ? { userId: req.user.id } : {}),
    };

    // Log según nivel
    logger.log(logLevel, message, meta);
  });

  next();
}

/**
 * Helper: Log de autenticación exitosa
 */
export function logAuthSuccess(userId: string, email: string, ip: string): void {
  logger.info('Autenticación exitosa', {
    userId,
    email,
    ip,
    event: 'auth:success',
  });
}

/**
 * Helper: Log de intento de autenticación fallido
 */
export function logAuthFailure(email: string, ip: string, reason: string): void {
  logger.warn('Intento de autenticación fallido', {
    email,
    ip,
    reason,
    event: 'auth:failure',
  });
}

/**
 * Helper: Log de operación de base de datos
 */
export function logDatabaseOperation(
  operation: string,
  model: string,
  userId?: string,
  duration?: number
): void {
  if (isDevelopment) {
    logger.debug('Operación de base de datos', {
      operation,
      model,
      userId,
      duration,
      event: 'db:operation',
    });
  }
}

/**
 * Helper: Log de error de negocio
 */
export function logBusinessError(
  error: Error,
  context: Record<string, any> = {}
): void {
  logger.error('Error de negocio', {
    message: error.message,
    stack: error.stack,
    ...context,
    event: 'business:error',
  });
}

/**
 * Helper: Log de error de sistema
 */
export function logSystemError(
  error: Error,
  context: Record<string, any> = {}
): void {
  logger.error('Error de sistema', {
    message: error.message,
    stack: error.stack,
    ...context,
    event: 'system:error',
  });
}

/**
 * Helper: Log de inicio de aplicación
 */
export function logAppStart(port: number): void {
  logger.info('🚀 Servidor iniciado', {
    port,
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    event: 'app:start',
  });
}

/**
 * Helper: Log de cierre de aplicación
 */
export function logAppShutdown(reason?: string): void {
  logger.info('🛑 Servidor detenido', {
    reason: reason || 'unknown',
    timestamp: new Date().toISOString(),
    event: 'app:shutdown',
  });
}

/**
 * Helper: Log de cache hit/miss
 */
export function logCacheOperation(
  operation: 'hit' | 'miss' | 'set' | 'delete',
  key: string
): void {
  if (isDevelopment) {
    logger.debug(`Cache ${operation}`, {
      key,
      event: `cache:${operation}`,
    });
  }
}

/**
 * Helper: Log de ejecución de código en sandbox
 */
export function logCodeExecution(
  userId: string,
  labId: string,
  language: string,
  success: boolean,
  duration: number
): void {
  logger.info('Ejecución de código', {
    userId,
    labId,
    language,
    success,
    duration,
    event: 'code:execution',
  });
}

export default logger;
