import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LMS Ciberseguridad API',
      version: '1.0.0',
      description: 'API completa para plataforma LMS de Ciberseguridad con soporte multi-curso',
      contact: {
        name: 'API Support',
        email: 'support@cybersec-lms.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: 'Development server'
      },
      {
        url: 'https://api.cybersec-lms.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] },
            xp: { type: 'integer' },
            theme: { type: 'string', enum: ['system', 'light', 'dark'] },
            locale: { type: 'string', enum: ['es', 'en'] },
            avatar: { type: 'string', nullable: true },
            trainingProfileId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            thumbnail: { type: 'string', nullable: true },
            duration: { type: 'integer' },
            level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
            tags: { type: 'array', items: { type: 'string' } },
            isPublished: { type: 'boolean' },
            author: { type: 'string' },
            version: { type: 'string' }
          }
        },
        Enrollment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            courseId: { type: 'string' },
            progress: { type: 'integer', minimum: 0, maximum: 100 },
            enrolledAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            lastAccessedAt: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        Analytics: {
          type: 'object',
          properties: {
            totalEnrollments: { type: 'integer' },
            activeStudents: { type: 'integer' },
            completionRate: { type: 'number' },
            averageProgress: { type: 'number' },
            moduleStats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  moduleId: { type: 'string' },
                  moduleName: { type: 'string' },
                  completedCount: { type: 'integer' },
                  averageScore: { type: 'number' }
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'integer' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ForbiddenError: {
          description: 'Access forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/routes/*.js'] // Files containing annotations
};

export const swaggerSpec = swaggerJsdoc(options);