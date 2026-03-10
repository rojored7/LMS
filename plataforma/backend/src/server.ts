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
import moduleRoutes from './routes/module.routes';
import lessonRoutes from './routes/lesson.routes';
import quizRoutes from './routes/quiz.routes';
import labRoutes from './routes/lab.routes';
import adminRoutes from './routes/admin.routes';
import progressRoutes from './routes/progress.routes';
import projectRoutes from './routes/project.routes';
import certificateRoutes from './routes/certificate.routes';
import notificationRoutes from './routes/notification.routes';
import badgeRoutes from './routes/badge.routes';
// import analyticsRoutes from './routes/analytics.routes';
// import exportRoutes from './routes/export.routes';
import courseImportRoutes from './routes/courseImport.routes';
import courseManagementRoutes from './routes/courseManagement.routes';

// Swagger
// import swaggerUi from 'swagger-ui-express';
// import { swaggerSpec } from './swagger';

// Socket.IO
import { createServer } from 'http';
// import { Server } from 'socket.io';
// import { setupChatSocket } from './sockets/chat.socket';

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
// Rutas de autenticación y usuarios
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // HU-003: Sistema de Roles (RBAC)
app.use('/api/admin', adminRoutes); // Rutas administrativas (solo ADMIN)

// Rutas de contenido del curso
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/labs', labRoutes);

// Rutas de progreso y completitud (HU-015)
app.use('/api/progress', progressRoutes);

// Rutas de proyectos finales (HU-027, HU-028)
app.use('/api/projects', projectRoutes);

// Rutas de certificados (HU-030, HU-031)
app.use('/api/certificates', certificateRoutes);

// Rutas de notificaciones (HU-035)
app.use('/api/notifications', notificationRoutes);

// Rutas de badges y gamificación (HU-029)
app.use('/api/badges', badgeRoutes);

// Rutas de gestión de cursos (import/export/management)
app.use('/api/admin/courses', courseImportRoutes);
app.use('/api/admin/courses', courseManagementRoutes);

// Rutas de analytics (nuevas) - Temporalmente deshabilitadas
// app.use('/api/analytics', analyticsRoutes);

// Rutas de exportación de datos (nuevas) - Temporalmente deshabilitadas
// app.use('/api/export', exportRoutes);

// Swagger UI documentation
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
//   customCss: '.swagger-ui .topbar { display: none }',
//   customSiteTitle: 'LMS Ciberseguridad API Docs',
//   customfavIcon: '/favicon.ico'
// }));

/**
 * Información de endpoints disponibles
 */
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'API de Plataforma Multi-Curso de Ciberseguridad',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      admin: '/api/admin',
      courses: '/api/courses',
      modules: '/api/modules',
      lessons: '/api/lessons',
      quizzes: '/api/quizzes',
      labs: '/api/labs',
      progress: '/api/progress',
      projects: '/api/projects',
      certificates: '/api/certificates',
      notifications: '/api/notifications',
      badges: '/api/badges',
      analytics: '/api/analytics',
      export: '/api/export',
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

    // Crear servidor HTTP
    const httpServer = createServer(app);

    // Configurar Socket.IO - Temporarily disabled
    // const io = new Server(httpServer, {
    //   cors: {
    //     origin: config.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    //     methods: ['GET', 'POST'],
    //     credentials: true
    //   }
    // });

    // Setup chat socket handlers
    // setupChatSocket(io);

    // Make io accessible in routes (optional)
    // app.set('io', io);

    // Iniciar servidor HTTP con Socket.IO
    const server = httpServer.listen(config.PORT, config.HOST, () => {
      logAppStart(config.PORT);
      console.log(`🌍 Servidor escuchando en http://${config.HOST}:${config.PORT}`);
      console.log(`📦 Entorno: ${config.NODE_ENV}`);
      console.log(`🎯 Frontend URL: ${config.FRONTEND_URL}`);
      console.log(`💬 WebSocket habilitado para chat en tiempo real`);
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
