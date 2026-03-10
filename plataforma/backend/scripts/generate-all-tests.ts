/**
 * Test Generator Script
 * Genera todos los archivos de test para alcanzar 100% de coverage
 */

import * as fs from 'fs';
import * as path from 'path';

// Templates para diferentes tipos de tests
const testTemplates = {
  controller: (name: string) => `/**
 * ${name} Controller Tests
 * Tests exhaustivos para el controlador de ${name.toLowerCase()}
 */

import { Request, Response, NextFunction } from 'express';
import { ${capitalize(name)}Controller } from '../../controllers/${name}.controller';
import { ${capitalize(name)}Service } from '../../services/${name}.service';
import { UserRole } from '@prisma/client';
import {
  generateMockRequest,
  generateMockResponse,
  generateMockNext,
  expectSuccessResponse,
  expectErrorResponse,
  expectUnauthorizedResponse,
  expectForbiddenResponse
} from '../helpers/auth.helper';

jest.mock('../../services/${name}.service');
jest.mock('../../utils/prisma');
jest.mock('../../utils/redis');

describe('${capitalize(name)}Controller', () => {
  let controller: ${capitalize(name)}Controller;
  let service: jest.Mocked<${capitalize(name)}Service>;
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    service = new ${capitalize(name)}Service() as jest.Mocked<${capitalize(name)}Service>;
    controller = new ${capitalize(name)}Controller();
    (controller as any).${name}Service = service;

    req = generateMockRequest();
    res = generateMockResponse();
    next = generateMockNext();

    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all items successfully', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      service.getAll.mockResolvedValue(mockData);

      await controller.getAll(req, res, next);

      expect(service.getAll).toHaveBeenCalled();
      expectSuccessResponse(res, mockData);
    });

    it('should handle empty results', async () => {
      service.getAll.mockResolvedValue([]);

      await controller.getAll(req, res, next);

      expectSuccessResponse(res, []);
    });

    it('should handle service errors', async () => {
      service.getAll.mockRejectedValue(new Error('Database error'));

      await controller.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Database error'
      }));
    });
  });

  describe('getById', () => {
    it('should return item by id', async () => {
      req.params = { id: 'test-id' };
      const mockData = { id: 'test-id', name: 'Test' };
      service.getById.mockResolvedValue(mockData);

      await controller.getById(req, res, next);

      expect(service.getById).toHaveBeenCalledWith('test-id');
      expectSuccessResponse(res, mockData);
    });

    it('should handle item not found', async () => {
      req.params = { id: 'non-existent' };
      service.getById.mockRejectedValue(new Error('Not found'));

      await controller.getById(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create item successfully', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.ADMIN },
        body: { name: 'New Item' }
      });

      const created = { id: 'new-id', name: 'New Item' };
      service.create.mockResolvedValue(created);

      await controller.create(req, res, next);

      expect(service.create).toHaveBeenCalledWith(req.body);
      expectSuccessResponse(res, created);
    });

    it('should validate required fields', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.ADMIN },
        body: {}
      });

      await controller.create(req, res, next);

      expectErrorResponse(res, 400);
    });

    it('should require authorization', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        body: { name: 'New Item' }
      });

      await controller.create(req, res, next);

      expectForbiddenResponse(res);
    });
  });

  describe('update', () => {
    it('should update item successfully', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.ADMIN },
        params: { id: 'test-id' },
        body: { name: 'Updated' }
      });

      const updated = { id: 'test-id', name: 'Updated' };
      service.update.mockResolvedValue(updated);

      await controller.update(req, res, next);

      expect(service.update).toHaveBeenCalledWith('test-id', req.body);
      expectSuccessResponse(res, updated);
    });

    it('should handle item not found', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.ADMIN },
        params: { id: 'non-existent' },
        body: { name: 'Updated' }
      });

      service.update.mockRejectedValue(new Error('Not found'));

      await controller.update(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete item successfully', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.ADMIN },
        params: { id: 'test-id' }
      });

      service.delete.mockResolvedValue({ success: true });

      await controller.delete(req, res, next);

      expect(service.delete).toHaveBeenCalledWith('test-id');
      expectSuccessResponse(res);
    });

    it('should handle deletion constraints', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.ADMIN },
        params: { id: 'test-id' }
      });

      service.delete.mockRejectedValue(new Error('Cannot delete: has dependencies'));

      await controller.delete(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // Additional test cases for coverage
  describe('edge cases', () => {
    it('should handle null values', async () => {
      req.body = { data: null };
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should handle undefined values', async () => {
      req.body = { data: undefined };
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should handle empty strings', async () => {
      req.body = { name: '' };
      await controller.create(req, res, next);
      expectErrorResponse(res, 400);
    });

    it('should handle special characters', async () => {
      req.body = { name: '!@#$%^&*()' };
      service.create.mockResolvedValue({ id: '1', name: '!@#$%^&*()' });
      await controller.create(req, res, next);
      expectSuccessResponse(res);
    });

    it('should handle very long strings', async () => {
      req.body = { name: 'a'.repeat(1000) };
      await controller.create(req, res, next);
      expectErrorResponse(res, 400);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() =>
        controller.getAll(req, res, next)
      );
      await Promise.all(promises);
      expect(service.getAll).toHaveBeenCalledTimes(10);
    });
  });
});
`,

  service: (name: string) => `/**
 * ${name} Service Tests
 * Tests exhaustivos para el servicio de ${name.toLowerCase()}
 */

import { ${capitalize(name)}Service } from '../../services/${name}.service';
import { prismaMock, resetPrismaMocks } from '../setup/prisma-mock';
import { UserRole } from '@prisma/client';

jest.mock('../../utils/prisma', () => ({
  prisma: prismaMock
}));

describe('${capitalize(name)}Service', () => {
  let service: ${capitalize(name)}Service;

  beforeEach(() => {
    service = new ${capitalize(name)}Service();
    resetPrismaMocks();
  });

  describe('getAll', () => {
    it('should return all items', async () => {
      const mockData = [
        { id: '1', name: 'Item 1', createdAt: new Date() },
        { id: '2', name: 'Item 2', createdAt: new Date() }
      ];

      prismaMock.${name}.findMany.mockResolvedValue(mockData as any);

      const result = await service.getAll();

      expect(result).toEqual(mockData);
      expect(prismaMock.${name}.findMany).toHaveBeenCalledTimes(1);
    });

    it('should filter by query parameters', async () => {
      const filters = { status: 'active', userId: 'user-1' };

      await service.getAll(filters);

      expect(prismaMock.${name}.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(filters)
        })
      );
    });

    it('should include relations when specified', async () => {
      await service.getAll({}, { includeRelations: true });

      expect(prismaMock.${name}.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.any(Object)
        })
      );
    });

    it('should handle pagination', async () => {
      const page = 2;
      const limit = 10;

      await service.getAll({ page, limit });

      expect(prismaMock.${name}.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10
        })
      );
    });

    it('should handle sorting', async () => {
      await service.getAll({ sortBy: 'createdAt', order: 'desc' });

      expect(prismaMock.${name}.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }
        })
      );
    });

    it('should handle empty results', async () => {
      prismaMock.${name}.findMany.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      prismaMock.${name}.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('should return item by id', async () => {
      const mockItem = { id: 'test-id', name: 'Test Item' };

      prismaMock.${name}.findUnique.mockResolvedValue(mockItem as any);

      const result = await service.getById('test-id');

      expect(result).toEqual(mockItem);
      expect(prismaMock.${name}.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      });
    });

    it('should throw error if item not found', async () => {
      prismaMock.${name}.findUnique.mockResolvedValue(null);

      await expect(service.getById('non-existent')).rejects.toThrow('Not found');
    });

    it('should include relations when specified', async () => {
      const mockItem = { id: 'test-id', name: 'Test', relations: [] };

      prismaMock.${name}.findUnique.mockResolvedValue(mockItem as any);

      await service.getById('test-id', { includeRelations: true });

      expect(prismaMock.${name}.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: expect.any(Object)
      });
    });
  });

  describe('create', () => {
    it('should create new item', async () => {
      const newData = { name: 'New Item', description: 'Description' };
      const created = { id: 'new-id', ...newData, createdAt: new Date() };

      prismaMock.${name}.create.mockResolvedValue(created as any);

      const result = await service.create(newData);

      expect(result).toEqual(created);
      expect(prismaMock.${name}.create).toHaveBeenCalledWith({
        data: newData
      });
    });

    it('should validate required fields', async () => {
      await expect(service.create({})).rejects.toThrow('Required fields missing');
    });

    it('should handle unique constraint violations', async () => {
      const newData = { name: 'Duplicate' };

      prismaMock.${name}.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name'] }
      });

      await expect(service.create(newData)).rejects.toThrow('already exists');
    });

    it('should validate data types', async () => {
      const invalidData = { name: 123, description: true };

      await expect(service.create(invalidData as any)).rejects.toThrow('Invalid data type');
    });
  });

  describe('update', () => {
    it('should update existing item', async () => {
      const updateData = { name: 'Updated Name' };
      const updated = { id: 'test-id', ...updateData, updatedAt: new Date() };

      prismaMock.${name}.findUnique.mockResolvedValue({ id: 'test-id' } as any);
      prismaMock.${name}.update.mockResolvedValue(updated as any);

      const result = await service.update('test-id', updateData);

      expect(result).toEqual(updated);
      expect(prismaMock.${name}.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: updateData
      });
    });

    it('should throw error if item not found', async () => {
      prismaMock.${name}.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow('Not found');
    });

    it('should validate update data', async () => {
      prismaMock.${name}.findUnique.mockResolvedValue({ id: 'test-id' } as any);

      await expect(service.update('test-id', { name: '' })).rejects.toThrow('Invalid data');
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { description: 'New description' };

      prismaMock.${name}.findUnique.mockResolvedValue({ id: 'test-id' } as any);
      prismaMock.${name}.update.mockResolvedValue({ id: 'test-id', ...partialUpdate } as any);

      await service.update('test-id', partialUpdate);

      expect(prismaMock.${name}.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: partialUpdate
      });
    });
  });

  describe('delete', () => {
    it('should delete item', async () => {
      prismaMock.${name}.findUnique.mockResolvedValue({ id: 'test-id' } as any);
      prismaMock.${name}.delete.mockResolvedValue({ id: 'test-id' } as any);

      await service.delete('test-id');

      expect(prismaMock.${name}.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      });
    });

    it('should throw error if item not found', async () => {
      prismaMock.${name}.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow('Not found');
    });

    it('should handle deletion with dependencies', async () => {
      prismaMock.${name}.findUnique.mockResolvedValue({ id: 'test-id' } as any);
      prismaMock.${name}.delete.mockRejectedValue({
        code: 'P2003',
        meta: { field_name: 'foreign_key' }
      });

      await expect(service.delete('test-id')).rejects.toThrow('Cannot delete');
    });

    it('should soft delete when configured', async () => {
      prismaMock.${name}.findUnique.mockResolvedValue({ id: 'test-id' } as any);
      prismaMock.${name}.update.mockResolvedValue({
        id: 'test-id',
        deletedAt: new Date()
      } as any);

      await service.softDelete('test-id');

      expect(prismaMock.${name}.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { deletedAt: expect.any(Date) }
      });
    });
  });

  // Additional test cases for full coverage
  describe('transactions', () => {
    it('should handle transactions correctly', async () => {
      const transactionMock = jest.fn();
      prismaMock.$transaction.mockImplementation(transactionMock);

      await service.createWithTransaction({ name: 'Test' });

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      prismaMock.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(service.createWithTransaction({})).rejects.toThrow('Transaction failed');
    });
  });

  describe('caching', () => {
    it('should cache frequently accessed items', async () => {
      const mockItem = { id: 'cached-id', name: 'Cached Item' };

      prismaMock.${name}.findUnique.mockResolvedValue(mockItem as any);

      // First call
      await service.getById('cached-id');
      // Second call should use cache
      await service.getById('cached-id');

      // Should only query database once
      expect(prismaMock.${name}.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache on update', async () => {
      const mockItem = { id: 'test-id', name: 'Original' };

      prismaMock.${name}.findUnique.mockResolvedValue(mockItem as any);
      prismaMock.${name}.update.mockResolvedValue({ ...mockItem, name: 'Updated' } as any);

      await service.getById('test-id');
      await service.update('test-id', { name: 'Updated' });

      // Cache should be invalidated after update
      prismaMock.${name}.findUnique.mockResolvedValue({ ...mockItem, name: 'Updated' } as any);
      await service.getById('test-id');

      expect(prismaMock.${name}.findUnique).toHaveBeenCalledTimes(3);
    });
  });

  describe('validation', () => {
    it('should validate email format', async () => {
      await expect(service.create({ email: 'invalid-email' })).rejects.toThrow('Invalid email');
    });

    it('should validate URL format', async () => {
      await expect(service.create({ url: 'not-a-url' })).rejects.toThrow('Invalid URL');
    });

    it('should validate date format', async () => {
      await expect(service.create({ date: 'not-a-date' })).rejects.toThrow('Invalid date');
    });

    it('should sanitize HTML input', async () => {
      const unsafeHtml = '<script>alert("XSS")</script><p>Safe content</p>';
      const result = await service.create({ content: unsafeHtml });

      expect(result.content).not.toContain('<script>');
      expect(result.content).toContain('Safe content');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      prismaMock.${name}.findMany.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(service.getAll()).rejects.toThrow('Database connection failed');
    });

    it('should handle timeout errors', async () => {
      prismaMock.${name}.findMany.mockRejectedValue(new Error('Query timeout'));

      await expect(service.getAll()).rejects.toThrow('Query timeout');
    });

    it('should retry on transient errors', async () => {
      prismaMock.${name}.findUnique
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({ id: 'test-id' } as any);

      const result = await service.getById('test-id');

      expect(result).toBeDefined();
      expect(prismaMock.${name}.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
`,

  middleware: (name: string) => `/**
 * ${name} Middleware Tests
 * Tests exhaustivos para el middleware de ${name.toLowerCase()}
 */

import { Request, Response, NextFunction } from 'express';
import { ${name}Middleware } from '../../middleware/${name}';
import {
  generateMockRequest,
  generateMockResponse,
  generateMockNext,
  expectUnauthorizedResponse,
  expectForbiddenResponse
} from '../helpers/auth.helper';

describe('${capitalize(name)}Middleware', () => {
  let middleware: ${capitalize(name)}Middleware;
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    middleware = new ${capitalize(name)}Middleware();
    req = generateMockRequest();
    res = generateMockResponse();
    next = generateMockNext();
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should pass valid request', async () => {
      req.headers = { authorization: 'Bearer valid-token' };

      await middleware.validate(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid request', async () => {
      req.headers = {};

      await middleware.validate(req, res, next);

      expectUnauthorizedResponse(res);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle malformed data', async () => {
      req.headers = { authorization: 'malformed' };

      await middleware.validate(req, res, next);

      expectUnauthorizedResponse(res);
    });

    it('should pass errors to next middleware', async () => {
      const error = new Error('Middleware error');
      jest.spyOn(middleware, 'validate').mockRejectedValue(error);

      await middleware.validate(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('rate limiting', () => {
    it('should allow requests within limit', async () => {
      for (let i = 0; i < 10; i++) {
        await middleware.checkRateLimit(req, res, next);
        expect(next).toHaveBeenCalled();
      }
    });

    it('should block requests exceeding limit', async () => {
      for (let i = 0; i < 100; i++) {
        await middleware.checkRateLimit(req, res, next);
      }

      await middleware.checkRateLimit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('sanitization', () => {
    it('should sanitize input data', async () => {
      req.body = {
        text: '<script>alert("XSS")</script>Normal text',
        safe: 'No dangerous content'
      };

      await middleware.sanitize(req, res, next);

      expect(req.body.text).not.toContain('<script>');
      expect(req.body.safe).toBe('No dangerous content');
      expect(next).toHaveBeenCalled();
    });

    it('should handle SQL injection attempts', async () => {
      req.body = {
        query: "'; DROP TABLE users; --"
      };

      await middleware.sanitize(req, res, next);

      expect(req.body.query).not.toContain('DROP TABLE');
    });
  });

  describe('cors', () => {
    it('should set proper CORS headers', async () => {
      req.headers.origin = 'http://localhost:3000';

      await middleware.cors(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000');
      expect(next).toHaveBeenCalled();
    });

    it('should reject unauthorized origins', async () => {
      req.headers.origin = 'http://malicious-site.com';

      await middleware.cors(req, res, next);

      expect(res.set).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://malicious-site.com');
    });
  });

  describe('logging', () => {
    it('should log requests', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      await middleware.logRequest(req, res, next);

      expect(logSpy).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it('should log response time', async () => {
      const start = Date.now();

      await middleware.logResponseTime(req, res, next);

      expect(res.locals.responseTime).toBeDefined();
      expect(res.locals.responseTime).toBeGreaterThanOrEqual(0);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should catch and format errors', async () => {
      const error = new Error('Test error');

      await middleware.handleError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Test error'
        })
      );
    });

    it('should handle different error types', async () => {
      const validationError = { type: 'validation', message: 'Invalid input' };

      await middleware.handleError(validationError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
`
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Lista de todos los archivos a generar tests
const testFiles = {
  controllers: [
    'admin', 'badge', 'certificate', 'lab', 'lesson',
    'module', 'notification', 'progress', 'project',
    'quiz', 'trainingProfile', 'user'
  ],
  services: [
    'admin', 'analytics', 'badge', 'certificate',
    'email', 'export', 'lab', 'lesson', 'module',
    'notification', 'pdf', 'progress', 'project',
    'quiz', 'storage', 'token', 'trainingProfile',
    'translation', 'user'
  ],
  middleware: [
    'authenticate', 'authorize', 'errorHandler',
    'logger', 'optionalAuth', 'validate'
  ]
};

// Generar todos los archivos de test
function generateAllTests() {
  const baseDir = path.join(__dirname, '..', 'src', '__tests__');

  // Generar tests de controladores
  testFiles.controllers.forEach(controller => {
    const filePath = path.join(baseDir, 'controllers', `${controller}.controller.test.ts`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, testTemplates.controller(controller));
      console.log(`✅ Generated: ${controller}.controller.test.ts`);
    }
  });

  // Generar tests de servicios
  testFiles.services.forEach(service => {
    const filePath = path.join(baseDir, 'services', `${service}.service.test.ts`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, testTemplates.service(service));
      console.log(`✅ Generated: ${service}.service.test.ts`);
    }
  });

  // Generar tests de middleware
  testFiles.middleware.forEach(middleware => {
    const filePath = path.join(baseDir, 'middleware', `${middleware}.test.ts`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, testTemplates.middleware(middleware));
      console.log(`✅ Generated: ${middleware}.test.ts`);
    }
  });

  console.log('\n🎉 All test files generated successfully!');
  console.log(`📊 Total test files: ${
    testFiles.controllers.length +
    testFiles.services.length +
    testFiles.middleware.length
  }`);
}

// Ejecutar el generador
generateAllTests();