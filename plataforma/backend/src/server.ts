/**
 * Servidor Express - Plataforma Multi-Curso de Ciberseguridad
 * Punto de entrada principal de la aplicación backend
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

// Configuración
import { config, corsOptions, rateLimitOptions } from './config';

// Utilidades
import { connectDatabase, checkDatabaseConnection } from './utils/prisma';
import { connectRedis, checkRedisConnection } from './utils/redis';

// Middleware
import { requestLogger, logAppStart, logAppShutdown } from './middleware/logger';
import {
  errorHandler,
  notFoundHandler,
  handleUncaughtException,
  handleUnhandledRejection,
} from './middleware/errorHandler';

// Rutas
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';

/**
 * Inicialización de la aplicación Express
 */
const app: Application = express();

/**
 * Configuración de manejadores de errores globales
 * Deben configurarse ANTES de cualquier otra cosa
 */
handleUncaughtException();
handleUnhandledRejection();

/**
 * Middleware de seguridad
 */
// Helmet: Configura headers de seguridad HTTP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS: Permite solicitudes desde el frontend
app.use(cors(corsOptions));

/**
 * Middleware de parsing
 */
// JSON body parser
app.use(express.json({ limit: '10mb' }));

// URL-encoded body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

/**
 * Middleware de compresión
 * Comprime las respuestas HTTP para reducir el tamaño
 */
app.use(compression());

/**
 * Middleware de logging
 * Registra todas las solicitudes HTTP
 */
app.use(requestLogger);

/**
 * Rate limiting
 * Limita el número de solicitudes por IP
 */
const limiter = rateLimit(rateLimitOptions);
app.use('/api/', limiter);

/**
 * Rutas de Health Check
 */
app.get('/health', async (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  const dbHealthy = await checkDatabaseConnection();
  const redisHealthy = await checkRedisConnection();

  const isReady = dbHealthy && redisHealthy;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    checks: {
      database: dbHealthy ? 'ok' : 'error',
      redis: redisHealthy ? 'ok' : 'error',
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/live', async (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Ruta raíz
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Plataforma Multi-Curso de Ciberseguridad API',
    version: '1.0.0',
    environment: config.NODE_ENV,
    documentation: '/api/docs',
  });
});

/**
 * Rutas de la API
 */
// import courseRoutes from './routes/courses';
// import moduleRoutes from './routes/modules';
// import lessonRoutes from './routes/lessons';
// import quizRoutes from './routes/quizzes';
// import labRoutes from './routes/labs';
// import projectRoutes from './routes/projects';
// import userRoutes from './routes/users';
// import enrollmentRoutes from './routes/enrollments';
// import certificateRoutes from './routes/certificates';
// import profileRoutes from './routes/profiles';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // HU-003: Sistema de Roles (RBAC)
app.use('/api/courses', courseRoutes);
// app.use('/api/modules', moduleRoutes);
// app.use('/api/lessons', lessonRoutes);
// app.use('/api/quizzes', quizRoutes);
// app.use('/api/labs', labRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/enrollments', enrollmentRoutes);
// app.use('/api/certificates', certificateRoutes);
// app.use('/api/profiles', profileRoutes);

/**
 * Placeholder para rutas API
 * Remover cuando se implementen las rutas reales
 */
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'API de Plataforma Multi-Curso',
    endpoints: {
      auth: '/api/auth',
      courses: '/api/courses',
      modules: '/api/modules',
      lessons: '/api/lessons',
      quizzes: '/api/quizzes',
      labs: '/api/labs',
      projects: '/api/projects',
      users: '/api/users',
      enrollments: '/api/enrollments',
      certificates: '/api/certificates',
      profiles: '/api/profiles',
    },
  });
});

/**
 * Middleware de manejo de rutas no encontradas (404)
 * Debe estar DESPUÉS de todas las rutas
 */
app.use(notFoundHandler);

/**
 * Middleware de manejo de errores
 * Debe ser el ÚLTIMO middleware
 */
app.use(errorHandler);

/**
 * Función para inicializar conexiones a servicios externos
 */
async function initializeServices(): Promise<void> {
  try {
    console.log('🔄 Inicializando servicios...');

    // Conectar a PostgreSQL
    await connectDatabase();

    // Conectar a Redis
    await connectRedis();

    console.log('✅ Todos los servicios inicializados correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar servicios:', error);
    throw error;
  }
}

/**
 * Función para iniciar el servidor
 */
async function startServer(): Promise<void> {
  try {
    // Inicializar servicios
    await initializeServices();

    // Iniciar servidor HTTP
    const server = app.listen(config.PORT, config.HOST, () => {
      logAppStart(config.PORT);
      console.log(`🌍 Servidor escuchando en http://${config.HOST}:${config.PORT}`);
      console.log(`📦 Entorno: ${config.NODE_ENV}`);
      console.log(`🎯 Frontend URL: ${config.FRONTEND_URL}`);
    });

    /**
     * Graceful Shutdown
     * Maneja señales de terminación para cerrar el servidor limpiamente
     */
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n⚠️  Señal ${signal} recibida. Cerrando servidor...`);
      logAppShutdown(signal);

      server.close(async () => {
        console.log('🛑 Servidor HTTP cerrado');

        try {
          // Cerrar conexiones a servicios externos
          // Las conexiones se cerrarán automáticamente por los listeners de proceso
          console.log('✅ Cierre limpio completado');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error durante el cierre:', error);
          process.exit(1);
        }
      });

      // Si el servidor no se cierra en 10 segundos, forzar cierre
      setTimeout(() => {
        console.error('⚠️  Cierre forzado después de timeout');
        process.exit(1);
      }, 10000);
    };

    // Registrar handlers de señales de terminación
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

/**
 * Iniciar el servidor si este archivo se ejecuta directamente
 * Esto permite importar 'app' en tests sin iniciar el servidor
 */
if (require.main === module) {
  startServer();
}

// Exportar la aplicación para testing
export default app;
