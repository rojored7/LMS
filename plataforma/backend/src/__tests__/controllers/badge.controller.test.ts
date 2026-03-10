/**
 * badge Controller Tests
 * Tests exhaustivos para el controlador de badge
 */

import { Request, Response, NextFunction } from 'express';
import { BadgeController } from '../../controllers/badge.controller';
import { BadgeService } from '../../services/badge.service';
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

jest.mock('../../services/badge.service');
jest.mock('../../utils/prisma');
jest.mock('../../utils/redis');

describe('BadgeController', () => {
  let controller: BadgeController;
  let service: jest.Mocked<BadgeService>;
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    service = new BadgeService() as jest.Mocked<BadgeService>;
    controller = new BadgeController();
    (controller as any).badgeService = service;

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
