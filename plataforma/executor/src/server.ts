import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { timingSafeEqual, createHash } from 'crypto';
import { z } from 'zod';
import { config, SUPPORTED_LANGUAGES } from './config';
import { dockerExecutor } from './services/dockerExecutor';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { logger } from './utils/logger';
import { ExecuteRequest } from './types';

// Create Express app
const app = express();

// Middleware - CORS restringido a origenes permitidos
app.use(
  cors({
    origin: config.ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: false,
  })
);
app.use(express.json({ limit: '1mb' }));

// Shared secret authentication - protege /execute de acceso no autorizado
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health' || req.path === '/languages') {
    return next();
  }
  const secret = String(req.headers['x-executor-secret'] || '');
  const expected = config.EXECUTOR_SECRET;
  const isValid = timingSafeEqual(
    createHash('sha256').update(secret).digest(),
    createHash('sha256').update(expected).digest()
  );
  if (!isValid) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: invalid or missing executor secret',
    });
    return;
  }
  next();
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
    });
  });
  next();
});

// Validation schema for execute request
const executeRequestSchema = z.object({
  code: z.string().min(1).max(50000), // Max 50KB of code
  language: z.enum(['python', 'javascript', 'bash']),
  tests: z
    .array(
      z.object({
        input: z.string().optional(),
        expectedOutput: z.string(),
        type: z.enum(['exact', 'contains', 'regex']),
        description: z.string().optional(),
      })
    )
    .optional(),
  timeout: z.number().min(1000).max(60000).optional(), // 1s to 60s
  userId: z.string().optional(),
});

/**
 * POST /execute
 * Executes user code in a secure sandbox
 */
app.post('/execute', rateLimitMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Received execution request', {
      language: req.body.language,
      codeLength: req.body.code?.length || 0,
    });

    // Validate request body
    const validationResult = executeRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn('Invalid request body', {
        errors: validationResult.error.errors,
      });
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validationResult.error.errors,
      });
      return;
    }

    const params: ExecuteRequest = validationResult.data;

    // Execute code
    const result = await dockerExecutor.executeCode(params);

    logger.info('Execution completed', {
      language: params.language,
      passed: result.passed,
      exitCode: result.exitCode,
      executionTime: result.executionTime,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Execution endpoint error', { error: errorMessage });

    res.status(500).json({
      success: false,
      error: 'Execution failed',
      details: errorMessage,
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const dockerHealthy = await dockerExecutor.healthCheck();

    const health = {
      status: dockerHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    };

    const statusCode = dockerHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
    });
  }
});

/**
 * GET /languages
 * Returns supported programming languages
 */
app.get('/languages', (_req: Request, res: Response) => {
  res.json({
    success: true,
    languages: SUPPORTED_LANGUAGES,
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path,
  });
});

/**
 * Error handler
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: config.NODE_ENV === 'development' ? err.message : undefined,
  });
});

/**
 * Start server
 */
const server = app.listen(config.PORT, () => {
  logger.info(`Executor service started`, {
    port: config.PORT,
    environment: config.NODE_ENV,
    sandboxTimeout: config.SANDBOX_TIMEOUT,
    sandboxMemoryLimit: config.SANDBOX_MEMORY_LIMIT,
    supportedLanguages: SUPPORTED_LANGUAGES,
  });
});

/**
 * Graceful shutdown
 */
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 30s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
