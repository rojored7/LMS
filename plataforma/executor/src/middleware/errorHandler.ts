import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Zod validation error handler
 */
export const handleZodError = (error: ZodError): {
  statusCode: number;
  message: string;
  errors: any[];
} => {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    statusCode: 400,
    message: 'Validation failed',
    errors,
  };
};

/**
 * Docker error handler
 */
export const handleDockerError = (error: any): {
  statusCode: number;
  message: string;
} => {
  logger.error('Docker error', { error: error.message });

  if (error.statusCode === 404) {
    return {
      statusCode: 500,
      message: 'Docker image not found. Please build the sandbox image.',
    };
  }

  if (error.message?.includes('Cannot connect to the Docker daemon')) {
    return {
      statusCode: 503,
      message: 'Docker service is not available',
    };
  }

  return {
    statusCode: 500,
    message: 'Docker execution failed',
  };
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log all errors
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    const { statusCode, message, errors } = handleZodError(err);
    return res.status(statusCode).json({
      success: false,
      error: message,
      errors,
    });
  }

  // Application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Docker errors
  if (err.message?.includes('Docker') || err.message?.includes('container')) {
    const { statusCode, message } = handleDockerError(err);
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  // Default error
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
