/**
 * Middleware de manejo centralizado de errores
 * Captura todos los errores de la aplicación y los formatea consistentemente
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { isProduction } from '../config';

/**
 * Clase base para errores personalizados de la aplicación
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de validación (400)
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Error de validación') {
    super(400, message);
  }
}

/**
 * Error de autenticación (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'No autenticado') {
    super(401, message);
  }
}

/**
 * Error de autorización (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(403, message);
  }
}

/**
 * Error de recurso no encontrado (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super(404, message);
  }
}

/**
 * Error de conflicto (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflicto con el estado actual del recurso') {
    super(409, message);
  }
}

/**
 * Error de rate limiting (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Demasiadas solicitudes') {
    super(429, message);
  }
}

/**
 * Error interno del servidor (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Error interno del servidor') {
    super(500, message, false);
  }
}

/**
 * Interfaz para la respuesta de error
 */
interface ErrorResponse {
  status: 'error';
  statusCode: number;
  message: string;
  errors?: any[];
  stack?: string;
}

/**
 * Manejo de errores de validación de Zod
 */
function handleZodError(error: ZodError): ErrorResponse {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    status: 'error',
    statusCode: 400,
    message: 'Error de validación de datos',
    errors,
  };
}

/**
 * Manejo de errores de Prisma
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): ErrorResponse {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      return {
        status: 'error',
        statusCode: 409,
        message: 'Ya existe un registro con estos datos únicos',
        errors: [
          {
            field: (error.meta?.['target'] as string[])?.join(', '),
            message: 'Este valor ya está en uso',
          },
        ],
      };

    case 'P2025':
      // Record not found
      return {
        status: 'error',
        statusCode: 404,
        message: 'Registro no encontrado',
      };

    case 'P2003':
      // Foreign key constraint violation
      return {
        status: 'error',
        statusCode: 400,
        message: 'La operación viola una restricción de relación',
      };

    case 'P2014':
      // Required relation violation
      return {
        status: 'error',
        statusCode: 400,
        message: 'La operación viola una relación requerida',
      };

    default:
      return {
        status: 'error',
        statusCode: 500,
        message: 'Error de base de datos',
      };
  }
}

/**
 * Middleware principal de manejo de errores
 * DEBE ser el último middleware registrado en Express
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log del error
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Errores personalizados de la aplicación
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
      ...(isProduction ? {} : { stack: err.stack }),
    } as ErrorResponse);
    return;
  }

  // Errores de validación de Zod
  if (err instanceof ZodError) {
    const errorResponse = handleZodError(err);
    res.status(errorResponse.statusCode).json({
      ...errorResponse,
      ...(isProduction ? {} : { stack: err.stack }),
    });
    return;
  }

  // Errores de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const errorResponse = handlePrismaError(err);
    res.status(errorResponse.statusCode).json({
      ...errorResponse,
      ...(isProduction ? {} : { stack: err.stack }),
    });
    return;
  }

  // Error de Prisma de validación
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Datos inválidos para la operación de base de datos',
      ...(isProduction ? {} : { stack: err.stack }),
    } as ErrorResponse);
    return;
  }

  // Error genérico (500)
  res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: isProduction ? 'Error interno del servidor' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  } as ErrorResponse);
}

/**
 * Middleware para capturar rutas no encontradas (404)
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Ruta no encontrada: ${req.method} ${req.path}`);
  next(error);
}

/**
 * Wrapper para async route handlers
 * Captura errores asíncronos y los pasa al middleware de error
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Manejador de errores no capturados
 */
export function handleUncaughtException(): void {
  process.on('uncaughtException', (error: Error) => {
    console.error('💥 Uncaught Exception:', error);
    // En producción, deberíamos enviar esto a un servicio de monitoreo (Sentry, etc.)
    process.exit(1);
  });
}

/**
 * Manejador de promesas rechazadas no manejadas
 */
export function handleUnhandledRejection(): void {
  process.on('unhandledRejection', (reason: any) => {
    console.error('💥 Unhandled Rejection:', reason);
    // En producción, deberíamos enviar esto a un servicio de monitoreo (Sentry, etc.)
    process.exit(1);
  });
}
