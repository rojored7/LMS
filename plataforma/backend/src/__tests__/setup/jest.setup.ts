/**
 * Jest Global Setup
 * Configuración global para todos los tests
 */

import dotenv from 'dotenv';
import { prisma } from '../../utils/prisma';

// Cargar variables de entorno para tests
dotenv.config({ path: '.env.test' });

// Mock de Redis para evitar conexión real en tests
jest.mock('../../utils/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(),
    flushdb: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  }
}));

// Mock de nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn((options, callback) => {
      if (callback) callback(null, { messageId: 'test-message-id' });
      return Promise.resolve({ messageId: 'test-message-id' });
    }),
    verify: jest.fn((callback) => {
      if (callback) callback(null, true);
      return Promise.resolve(true);
    }),
  })),
}));

// Mock de winston logger
jest.mock('winston', () => {
  const actualWinston = jest.requireActual('winston');
  return {
    ...actualWinston,
    createLogger: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      silly: jest.fn(),
      log: jest.fn(),
    })),
  };
});

// Configuración global de timeouts
jest.setTimeout(10000);

// Limpiar todas las instancias de mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

// Cerrar conexiones después de todos los tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Suprimir logs durante tests (opcional, útil para tests más limpios)
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-very-long-string-for-testing-purposes';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-very-long-string-for-testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.BCRYPT_ROUNDS = '10';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.PORT = '4000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';