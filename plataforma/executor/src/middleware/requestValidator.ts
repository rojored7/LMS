import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logger } from '../utils/logger';

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Zod schema
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    try {
      // Validate request body
      const validatedData = schema.parse(req.body);

      // Replace request body with validated data
      req.body = validatedData;

      logger.debug('Request validation passed', {
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Request validation failed', {
          path: req.path,
          method: req.method,
          errors: error.errors,
        });

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }

      // Unexpected error
      logger.error('Unexpected validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return res.status(500).json({
        success: false,
        error: 'Validation error',
      });
    }
  };
};

/**
 * Request size limiter
 * Ensures request payload is not too large
 */
export const limitRequestSize = (maxSizeBytes: number) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > maxSizeBytes) {
      logger.warn('Request too large', {
        contentLength,
        maxSize: maxSizeBytes,
        path: req.path,
      });

      return res.status(413).json({
        success: false,
        error: 'Request too large',
        details: {
          maxSize: maxSizeBytes,
          received: contentLength,
        },
      });
    }

    next();
  };
};
