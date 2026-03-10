/**
 * Jest Configuration
 * Configuración para testing con Jest y TypeScript
 */

module.exports = {
  // Preset para TypeScript
  preset: 'ts-jest',

  // Entorno de testing (Node.js)
  testEnvironment: 'node',

  // Rutas de archivos de test
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],

  // Patrones de archivos de test
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],

  // Transformación de archivos TypeScript
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        // Opciones específicas para tests
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },

  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/types/**',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],

  // Directorio de reportes de cobertura
  coverageDirectory: 'coverage',

  // Reportes de cobertura
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],

  // Umbrales mínimos de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Module name mapper para imports con alias
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@validators/(.*)$': '<rootDir>/src/validators/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
  },

  // Paths a ignorar
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],

  // Setup files (ejecutados antes de cada test suite)
  // setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // Variables de entorno para tests
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },

  // Timeout global para tests (10 segundos)
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Limpiar mocks automáticamente entre tests
  clearMocks: true,

  // Restaurar mocks automáticamente entre tests
  restoreMocks: true,

  // Forzar salida después de que todos los tests terminen
  forceExit: true,

  // Detectar memory leaks
  detectOpenHandles: true,

  // Max workers (útil para CI/CD)
  maxWorkers: '50%',
};
