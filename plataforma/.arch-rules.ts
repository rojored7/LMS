/**
 * Architecture Rules - CAS (Compliance Architecture System)
 * Plataforma Multi-Curso de Ciberseguridad
 *
 * Este archivo define las reglas de arquitectura específicas del proyecto.
 * Se validan en modo ADVISORY (no bloquea, solo advierte).
 *
 * Basado en la arquitectura detectada:
 * - Backend: Express + Prisma + TypeScript (Three-tier layered architecture)
 * - Frontend: React + TypeScript + Zustand
 * - Pattern: Routes → Controllers → Services → Prisma ORM
 *
 * Última actualización: 2026-03-09
 */

export const architectureRules = {
  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * REGLAS DE LAYERING (CRÍTICAS)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  layering: {
    controllers: {
      canImport: [
        'services',           // ✅ Controllers llaman Services
        'types',              // ✅ Types compartidos
        'middleware',         // ✅ Para request/response helpers
        'utils/logger',       // ✅ Logging permitido
        'utils/validation',   // ✅ Helpers de validación
        'validators'          // ✅ Schemas de Zod
      ],
      cannotImport: [
        'utils/prisma',       // ❌ NO acceso directo a Prisma
        'utils/redis',        // ❌ NO acceso directo a Redis
        '@prisma/client'      // ❌ NO import directo de Prisma
      ],
      description: 'Controllers manejan HTTP requests y delegan lógica a Services',
      severity: 'error'
    },

    services: {
      canImport: [
        'types',              // ✅ Types compartidos
        'utils/prisma',       // ✅ Acceso a Prisma singleton
        'utils/redis',        // ✅ Acceso a Redis singleton
        'utils/logger',       // ✅ Logging permitido
        'utils/cache',        // ✅ Cache helpers
        'utils/decorators',   // ✅ Decorators personalizados
        '@prisma/client'      // ✅ Prisma types permitidos
      ],
      cannotImport: [
        'controllers',        // ❌ NO circular dependency con controllers
        'routes',             // ❌ Services no deben conocer routes
        'middleware',         // ❌ Middleware es capa de HTTP
        'express'             // ❌ NO dependencia directa de Express
      ],
      description: 'Services contienen lógica de negocio y acceden a DB',
      severity: 'error'
    },

    routes: {
      canImport: [
        'controllers',        // ✅ Routes llaman Controllers
        'middleware',         // ✅ Middleware de autenticación/autorización
        'validators',         // ✅ Validators de Zod
        'types',              // ✅ Types para typing
        'express'             // ✅ Express Router
      ],
      cannotImport: [
        'services',           // ❌ Routes NO deben llamar Services directamente
        'utils/prisma',       // ❌ NO acceso a DB desde routes
        'utils/redis'         // ❌ NO acceso a cache desde routes
      ],
      description: 'Routes definen endpoints y aplican middleware',
      severity: 'error'
    },

    middleware: {
      canImport: [
        'types',              // ✅ Types compartidos
        'utils/logger',       // ✅ Logging
        'utils/redis',        // ✅ Para auth (blacklist en Redis)
        'utils/prisma',       // ✅ Para verificar usuario existe
        'services/token.service', // ✅ Para validación de tokens
        'services/user.service',  // ✅ Para verificar usuario
        'express'             // ✅ Request/Response types
      ],
      cannotImport: [
        'controllers',        // ❌ NO conocer controllers
        'routes'              // ❌ NO conocer routes
      ],
      description: 'Middleware intercepta requests antes de controllers',
      severity: 'warning'
    },

    validators: {
      canImport: [
        'zod',                // ✅ Zod para schemas
        'types'               // ✅ Types compartidos
      ],
      cannotImport: [
        'services',           // ❌ Validators son solo schemas
        'controllers',        // ❌ NO lógica de negocio
        'utils/prisma',       // ❌ NO acceso a DB
        'express'             // ❌ NO dependencia de HTTP
      ],
      description: 'Validators son solo schemas de Zod (sin lógica)',
      severity: 'error'
    }
  },

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * CONVENCIONES DE NOMBRADO
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  naming: {
    files: {
      pattern: 'kebab-case',
      suffix: {
        controllers: '.controller.ts',
        services: '.service.ts',
        routes: '.routes.ts',
        middleware: '.ts',
        validators: '.validator.ts',
        types: '.ts or .d.ts',
        tests: '.test.ts or .spec.ts'
      },
      examples: [
        'auth.controller.ts',
        'course.service.ts',
        'user.routes.ts',
        'authenticate.ts',
        'auth.validator.ts'
      ],
      violations: [
        'AuthController.ts',     // ❌ PascalCase
        'auth_controller.ts',    // ❌ snake_case
        'authController.ts'      // ❌ camelCase
      ],
      severity: 'warning'
    },

    classes: {
      pattern: 'PascalCase',
      examples: [
        'AuthService',
        'CourseController',
        'AuthenticationError',
        'JwtPayload'
      ],
      violations: [
        'authService',           // ❌ camelCase
        'auth_service'           // ❌ snake_case
      ],
      severity: 'warning'
    },

    functions: {
      pattern: 'camelCase',
      prefixes: {
        booleans: ['is', 'has', 'should', 'can', 'will'],
        getters: ['get', 'fetch', 'find', 'load'],
        setters: ['set', 'update', 'create', 'delete'],
        handlers: ['handle', 'on'],
        validators: ['validate', 'check', 'verify']
      },
      examples: [
        'getUserEnrollments',
        'isBlacklisted',
        'handleUncaughtException',
        'validateToken'
      ],
      violations: [
        'GetUserEnrollments',    // ❌ PascalCase
        'get_user_enrollments'   // ❌ snake_case
      ],
      severity: 'warning'
    },

    constants: {
      pattern: 'UPPER_SNAKE_CASE',
      examples: [
        'JWT_EXPIRES_IN',
        'MAX_LOGIN_ATTEMPTS',
        'DEFAULT_PAGE_SIZE'
      ],
      violations: [
        'jwtExpiresIn',          // ❌ camelCase
        'JwtExpiresIn'           // ❌ PascalCase
      ],
      severity: 'info'
    },

    interfaces: {
      pattern: 'PascalCase',
      noPrefix: true,           // ⚠️ NO usar "I" prefix
      examples: [
        'User',
        'Course',
        'JwtPayload',
        'AuthResponse'
      ],
      violations: [
        'IUser',                 // ❌ Prefix "I"
        'user',                  // ❌ camelCase
        'USER'                   // ❌ UPPER_CASE
      ],
      severity: 'info'
    },

    types: {
      pattern: 'PascalCase',
      examples: [
        'UserRole',
        'CourseLevel',
        'AuthTokens',
        'PaginatedResponse'
      ],
      severity: 'info'
    },

    enums: {
      pattern: 'PascalCase',
      enumMembers: 'UPPER_SNAKE_CASE',
      examples: [
        'UserRole { ADMIN, INSTRUCTOR, STUDENT }',
        'CourseLevel { BEGINNER, INTERMEDIATE, ADVANCED }'
      ],
      severity: 'info'
    }
  },

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * ORGANIZACIÓN DE ARCHIVOS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  fileOrganization: {
    backend: {
      'controllers/': 'HTTP request handlers (thin layer)',
      'services/': 'Business logic (core functionality)',
      'routes/': 'Express route definitions',
      'middleware/': 'Request interceptors (auth, logging, errors)',
      'validators/': 'Zod validation schemas',
      'types/': 'TypeScript type definitions',
      'utils/': 'Helper functions and utilities',
      'config/': 'Configuration and environment variables',
      '__tests__/': 'Test files (mirrors src/ structure)',
      'sockets/': 'Socket.IO event handlers',
      'prisma/': 'Database schema and migrations'
    },

    frontend: {
      'pages/': 'Top-level route components',
      'components/': 'Reusable UI components',
      'hooks/': 'Custom React hooks',
      'services/': 'API client functions',
      'store/': 'Zustand state management',
      'types/': 'TypeScript types',
      'utils/': 'Helper functions',
      'styles/': 'CSS/styling files'
    },

    violations: [
      {
        pattern: 'src/*Helper.ts',
        message: 'Helper files should be in utils/ directory',
        autoFix: 'Move to utils/'
      },
      {
        pattern: 'src/*Util.ts',
        message: 'Util files should be in utils/ directory',
        autoFix: 'Move to utils/'
      },
      {
        pattern: 'src/controllers/*Service.ts',
        message: 'Service files must be in services/ directory',
        autoFix: 'Move to services/'
      },
      {
        pattern: 'src/services/*Controller.ts',
        message: 'Controller files must be in controllers/ directory',
        autoFix: 'Move to controllers/'
      }
    ]
  },

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * ORDEN DE IMPORTS (ESLint compatible)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  importOrder: {
    groups: [
      'node:*',               // 1. Node built-ins (node:fs, node:path)
      'express',              // 2. Express framework
      '@prisma/client',       // 3. Prisma client
      'zod',                  // 4. Zod validation
      '*',                    // 5. Other external packages
      '@/*',                  // 6. Internal path aliases
      './*', '../*'           // 7. Relative imports
    ],
    description: 'Imports ordenados: builtins → framework → libs → internals → relative',
    autoFixable: true,
    severity: 'warning'
  },

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * MÉTRICAS DE CALIDAD
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  metrics: {
    maxFileSize: {
      value: 400,
      unit: 'lines',
      description: 'Archivos >400 líneas deben ser divididos',
      exceptions: [
        'server.ts',          // Entry point
        'seed-ciberseguridad.ts' // Data seeding
      ],
      severity: 'warning'
    },

    maxFunctionComplexity: {
      value: 15,
      description: 'Complejidad ciclomática máxima',
      tool: 'ESLint complexity rule',
      severity: 'warning'
    },

    maxFunctionLength: {
      value: 60,
      unit: 'lines',
      description: 'Funciones >60 líneas deben refactorizarse',
      exceptions: [
        'Test setup/teardown functions',
        'Data seeding functions'
      ],
      severity: 'info'
    },

    maxParameterCount: {
      value: 5,
      description: 'Funciones con >5 parámetros deben usar objetos',
      remedy: 'Use destructuring or options object pattern',
      severity: 'warning'
    },

    minTestCoverage: {
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70,
      description: 'Coverage mínimo requerido',
      severity: 'error'
    }
  },

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * ANTI-PATTERNS A DETECTAR
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  antiPatterns: {
    noCircularDependencies: {
      enabled: true,
      severity: 'error',
      description: 'Circular dependencies causan initialization issues',
      tool: 'madge --circular src/'
    },

    noPrismaInControllers: {
      enabled: true,
      severity: 'error',
      description: 'Controllers NO deben importar Prisma directamente',
      pattern: /import.*from.*[@\/]prisma\/client/,
      locations: ['controllers/'],
      remedy: 'Use services layer instead'
    },

    noDirectDatabaseAccess: {
      enabled: true,
      severity: 'error',
      description: 'Solo Services pueden usar utils/prisma',
      pattern: /import.*from.*utils\/prisma/,
      allowedLocations: ['services/', 'middleware/authenticate.ts', 'middleware/authorize.ts'],
      severity: 'error'
    },

    noMultiplePrismaClients: {
      enabled: true,
      severity: 'error',
      description: 'SIEMPRE usar singleton de utils/prisma',
      pattern: /new PrismaClient\(\)/,
      remedy: 'Import { prisma } from utils/prisma instead'
    },

    noDefaultExports: {
      enabled: true,
      exceptions: [
        'pages/',             // React pages
        'App.tsx',            // App component
        'main.tsx',           // Entry point
        'server.ts',          // Server entry
        '*.routes.ts'         // Express routers
      ],
      severity: 'info',
      description: 'Named exports preferred for better refactoring'
    },

    noAnyType: {
      enabled: true,
      exceptions: [
        'utils/prisma.ts',    // Prisma types are complex
        '__tests__/',         // Test mocks may use any
        'express.d.ts'        // Type augmentation
      ],
      severity: 'warning',
      description: 'Use proper types or "unknown" instead of "any"'
    },

    noConsoleLogs: {
      enabled: true,
      exceptions: [
        'server.ts',          // Startup logs OK
        'utils/logger.ts',    // Logger implementation
        '__tests__/',         // Test debugging
        'seed*.ts'            // Seeding scripts
      ],
      severity: 'warning',
      description: 'Use winston logger instead of console.log',
      remedy: 'Import { logger } from utils/logger'
    },

    noDuplicateCode: {
      enabled: true,
      threshold: 15,          // lines
      severity: 'info',
      description: 'Extract duplicate code into shared functions',
      tool: 'jscpd'
    },

    noMagicNumbers: {
      enabled: true,
      exceptions: [0, 1, -1, 100, 1000],
      severity: 'info',
      description: 'Define constants for magic numbers',
      remedy: 'Create named constant in config or at file top'
    }
  },

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * REGLAS ESPECÍFICAS DEL PROYECTO
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  projectSpecific: {
    middlewareOrder: {
      description: 'Middleware execution order is CRITICAL',
      required: [
        'handleUncaughtException',
        'handleUnhandledRejection',
        'helmet',
        'cors',
        'express.json',
        'express.urlencoded',
        'cookieParser',
        'compression',
        'requestLogger',
        'rateLimit',
        '// routes here',
        'notFoundHandler',
        'errorHandler'
      ],
      severity: 'error',
      location: 'server.ts',
      violation: 'Incorrect middleware order breaks security/logging'
    },

    routeOrderMatters: {
      description: 'Specific routes BEFORE parameterized routes',
      examples: [
        {
          correct: 'router.get("/enrolled", ...) BEFORE router.get("/:idOrSlug", ...)',
          incorrect: 'router.get("/:idOrSlug", ...) BEFORE router.get("/enrolled", ...)',
          location: 'course.routes.ts'
        }
      ],
      severity: 'error',
      bug: 'Express matches first route, literal path treated as param'
    },

    authMiddlewareConsistency: {
      description: 'Use consistent authentication middleware',
      middlewares: {
        'authenticate': 'Required auth, throws 401 if missing',
        'optionalAuth': 'Validates if present, continues if missing'
      },
      warning: 'TWO implementations exist (authenticate.ts + optionalAuth.ts)',
      inconsistency: 'Different req.user field naming',
      remedy: 'Consolidate to single implementation',
      severity: 'warning'
    },

    enrollmentIdempotency: {
      description: 'Course enrollment is idempotent',
      behavior: 'Duplicate enrollment returns existing with 200, not 500',
      location: 'course.service.ts:233-256',
      dbConstraint: '@@unique([userId, courseId])',
      severity: 'info'
    },

    tokenValidationFlow: {
      description: '5-step token validation required',
      steps: [
        '1. Check Redis blacklist',
        '2. Verify JWT signature',
        '3. Validate payload fields',
        '4. Check mass invalidation timestamp',
        '5. Verify user exists in DB'
      ],
      location: 'middleware/authenticate.ts',
      severity: 'error',
      security: 'Skipping any step creates vulnerability'
    },

    prismaClientSingleton: {
      description: 'ALWAYS use Prisma singleton',
      correct: "import { prisma } from 'utils/prisma'",
      incorrect: "new PrismaClient()",
      reason: 'Prevents connection pool exhaustion',
      location: 'utils/prisma.ts',
      severity: 'error'
    },

    redisFailClosed: {
      description: 'All Redis operations fail-closed for security',
      behavior: 'Errors return null or true (reject)',
      examples: [
        'Cache miss → return null (treat as not cached)',
        'Blacklist check fails → return true (treat as blacklisted)'
      ],
      severity: 'error',
      security: 'Never allow bypass on Redis failure'
    }
  },

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * TESTING REQUIREMENTS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  testing: {
    framework: {
      backend: 'Jest',
      frontend: 'Vitest + React Testing Library',
      e2e: 'Playwright'
    },

    structure: {
      backend: '__tests__/ mirrors src/ structure',
      frontend: 'Co-located .test.tsx files',
      naming: '*.test.ts or *.spec.ts'
    },

    coverage: {
      minimum: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      },
      critical: {
        auth: 90,
        payment: 95,
        security: 95
      }
    },

    required: {
      controllers: 'Test success + error cases for each endpoint',
      services: 'Test business logic with mocked Prisma',
      middleware: 'Test auth, errors, validation',
      utilities: 'Unit test all helper functions'
    },

    bestPractices: [
      'Use fixtures for test data (fixtures/)',
      'Mock Prisma with prisma-mock',
      'Use auth.helper for authenticated requests',
      'Test error paths, not just happy path',
      'Avoid testing implementation details'
    ]
  },

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * DOCUMENTATION REQUIREMENTS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  documentation: {
    jsdoc: {
      required: [
        'Public API functions',
        'Service methods',
        'Complex utility functions',
        'Middleware functions'
      ],
      optional: [
        'Controllers (already documented by routes)',
        'Simple getters/setters',
        'Test files'
      ],
      severity: 'info'
    },

    inline: {
      when: [
        'Complex business logic',
        'Security-critical code',
        'Performance optimizations',
        'Workarounds for bugs',
        'TODO/FIXME items'
      ],
      severity: 'info'
    },

    files: {
      'README.md': 'Required in project root',
      'CLAUDE.md': 'Architecture documentation for AI',
      'API.md': 'Endpoint documentation (or Swagger)',
      'DEPLOYMENT.md': 'Deployment instructions'
    }
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * VALIDATION FUNCTIONS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export const validators = {
  /**
   * Validate file name follows naming convention
   */
  validateFileName(fileName: string, expectedPattern: string): boolean {
    const patterns = {
      'kebab-case': /^[a-z0-9]+(-[a-z0-9]+)*\.(ts|tsx|js|jsx|md)$/,
      'PascalCase': /^[A-Z][a-zA-Z0-9]*\.(ts|tsx|js|jsx)$/,
      'camelCase': /^[a-z][a-zA-Z0-9]*\.(ts|tsx|js|jsx)$/
    };

    return patterns[expectedPattern]?.test(fileName) ?? false;
  },

  /**
   * Check if imports respect layering rules
   */
  validateLayering(
    currentFile: string,
    importPath: string,
    rules: typeof architectureRules.layering
  ): { valid: boolean; reason?: string; severity?: string } {
    // Determine layer from file path
    const layer = this.determineLayer(currentFile);
    if (!layer) {
      return { valid: true }; // Unknown layer, skip validation
    }

    const layerRules = rules[layer];
    if (!layerRules) {
      return { valid: true };
    }

    // Check forbidden imports
    for (const forbidden of layerRules.cannotImport) {
      if (importPath.includes(forbidden)) {
        return {
          valid: false,
          reason: `${layer} cannot import from ${forbidden}`,
          severity: layerRules.severity
        };
      }
    }

    return { valid: true };
  },

  /**
   * Determine layer from file path
   */
  determineLayer(filePath: string): string | null {
    if (filePath.includes('/controllers/')) return 'controllers';
    if (filePath.includes('/services/')) return 'services';
    if (filePath.includes('/routes/')) return 'routes';
    if (filePath.includes('/middleware/')) return 'middleware';
    if (filePath.includes('/validators/')) return 'validators';
    return null;
  },

  /**
   * Detect Prisma imports in controllers
   */
  detectPrismaInControllers(fileContent: string, filePath: string): boolean {
    if (!filePath.includes('/controllers/')) return false;

    const prismaImports = [
      /@prisma\/client/,
      /from ['"]\.\.\/utils\/prisma['"]/,
      /from ['"]@\/utils\/prisma['"]/
    ];

    return prismaImports.some(pattern => pattern.test(fileContent));
  },

  /**
   * Detect new PrismaClient() instantiation
   */
  detectMultiplePrismaClients(fileContent: string): boolean {
    return /new\s+PrismaClient\s*\(/.test(fileContent);
  },

  /**
   * Check route order (specific before parameterized)
   */
  validateRouteOrder(fileContent: string): {
    valid: boolean;
    violations: Array<{ line: number; issue: string }>;
  } {
    const violations: Array<{ line: number; issue: string }> = [];
    const lines = fileContent.split('\n');

    let seenParameterizedRoute = false;
    let paramLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect parameterized route (/:param)
      if (/router\.(get|post|put|patch|delete)\s*\(\s*['"]\/:[a-zA-Z]/.test(line)) {
        seenParameterizedRoute = true;
        paramLine = i + 1;
      }

      // Detect literal route after parameterized
      if (
        seenParameterizedRoute &&
        /router\.(get|post|put|patch|delete)\s*\(\s*['"]\/[a-z]/.test(line) &&
        !/:[a-zA-Z]/.test(line)
      ) {
        violations.push({
          line: i + 1,
          issue: `Literal route after parameterized route (line ${paramLine}). Move literal routes before parameterized.`
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  },

  /**
   * Check middleware order in server.ts
   */
  validateMiddlewareOrder(fileContent: string): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const requiredOrder = [
      'handleUncaughtException',
      'handleUnhandledRejection',
      'helmet',
      'cors',
      'express.json',
      'cookieParser',
      'compression',
      'requestLogger',
      'rateLimit',
      'notFoundHandler',
      'errorHandler'
    ];

    const positions = requiredOrder.map(item => {
      const regex = new RegExp(item);
      const match = fileContent.search(regex);
      return { name: item, position: match };
    });

    // Check order
    for (let i = 0; i < positions.length - 1; i++) {
      const current = positions[i];
      const next = positions[i + 1];

      if (current.position > next.position && current.position !== -1 && next.position !== -1) {
        issues.push(`${current.name} should come before ${next.name}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
};

export default architectureRules;
