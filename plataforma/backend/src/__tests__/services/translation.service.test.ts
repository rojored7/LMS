/**
 * translation Service Tests
 * Tests exhaustivos para el servicio de translation
 */

import { TranslationService } from '../../services/translation.service';
import { prismaMock, resetPrismaMocks } from '../setup/prisma-mock';
import { UserRole } from '@prisma/client';

jest.mock('../../utils/prisma', () => ({
  prisma: prismaMock
}));

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    service = new TranslationService();
    resetPrismaMocks();
  });

  describe('getAll', () => {
    it('should return all items', async () => {
      const mockData = [
        { id: '1', name: 'Item 1', createdAt: new Date() },
        { id: '2', name: 'Item 2', createdAt: new Date() }
      ];

      prismaMock.translation.findMany.mockResolvedValue(mockData as any);

      const result = await service.getAll();

      expect(result).toEqual(mockData);
      expect(prismaMock.translation.findMany).toHaveBeenCalledTimes(1);
    });

    it('should filter by query parameters', async () => {
      const filters = { status: 'active', userId: 'user-1' };

      await service.getAll(filters);

      expect(prismaMock.translation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(filters)
        })
      );
    });

    it('should include relations when specified', async () => {
      await service.getAll({}, { includeRelations: true });

      expect(prismaMock.translation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.any(Object)
        })
      );
    });

    it('should handle pagination', async () => {
      const page = 2;
      const limit = 10;

      await service.getAll({ page, limit });

      expect(prismaMock.translation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10
        })
      );
    });

    it('should handle sorting', async () => {
      await service.getAll({ sortBy: 'createdAt', order: 'desc' });

      expect(prismaMock.translation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }
        })
      );
    });

    it('should handle empty results', async () => {
      prismaMock.translation.findMany.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      prismaMock.translation.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('should return item by id', async () => {
      const mockItem = { id: 'test-id', name: 'Test Item' };

      prismaMock.translation.findUnique.mockResolvedValue(mockItem as any);

      const result = await service.getById('test-id');

      expect(result).toEqual(mockItem);
      expect(prismaMock.translation.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      });
    });

    it('should throw error if item not found', async () => {
      prismaMock.translation.findUnique.mockResolvedValue(null);

      await expect(service.getById('non-existent')).rejects.toThrow('Not found');
    });

    it('should include relations when specified', async () => {
      const mockItem = { id: 'test-id', name: 'Test', relations: [] };

      prismaMock.translation.findUnique.mockResolvedValue(mockItem as any);

      await service.getById('test-id', { includeRelations: true });

      expect(prismaMock.translation.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: expect.any(Object)
      });
    });
  });

  describe('create', () => {
    it('should create new item', async () => {
      const newData = { name: 'New Item', description: 'Description' };
      const created = { id: 'new-id', ...newData, createdAt: new Date() };

      prismaMock.translation.create.mockResolvedValue(created as any);

      const result = await service.create(newData);

      expect(result).toEqual(created);
      expect(prismaMock.translation.create).toHaveBeenCalledWith({
        data: newData
      });
    });

    it('should validate required fields', async () => {
      await expect(service.create({})).rejects.toThrow('Required fields missing');
    });

    it('should handle unique constraint violations', async () => {
      const newData = { name: 'Duplicate' };

      prismaMock.translation.create.mockRejectedValue({
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

      prismaMock.translation.findUnique.mockResolvedValue({ id: 'test-id' } as any);
      prismaMock.translation.update.mockResolvedValue(updated as any);

      const result = await service.update('test-id', updateData);

      expect(result).toEqual(updated);
      expect(prismaMock.translation.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: updateData
      });
    });

    it('should throw error if item not found', async () => {
      prismaMock.translation.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow('Not found');
    });

    it('should validate update data', async () => {
      prismaMock.translation.findUnique.mockResolvedValue({ id: 'test-id' } as any);

      await expect(service.update('test-id', { name: '' })).rejects.toThrow('Invalid data');
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { description: 'New description' };

      prismaMock.translation.findUnique.mockResolvedValue({ id: 'test-id' } as any);
      prismaMock.translation.update.mockResolvedValue({ id: 'test-id', ...partialUpdate } as any);

      await service.update('test-id', partialUpdate);

      expect(prismaMock.translation.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: partialUpdate
      });
    });
  });

  describe('delete', () => {
    it('should delete item', async () => {
      prismaMock.translation.findUnique.mockResolvedValue({ id: 'test-id' } as any);
      prismaMock.translation.delete.mockResolvedValue({ id: 'test-id' } as any);

      await service.delete('test-id');

      expect(prismaMock.translation.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      });
    });

    it('should throw error if item not found', async () => {
      prismaMock.translation.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow('Not found');
    });

    it('should handle deletion with dependencies', async () => {
      prismaMock.translation.findUnique.mockResolvedValue({ id: 'test-id' } as any);
      prismaMock.translation.delete.mockRejectedValue({
        code: 'P2003',
        meta: { field_name: 'foreign_key' }
      });

      await expect(service.delete('test-id')).rejects.toThrow('Cannot delete');
    });

    it('should soft delete when configured', async () => {
      prismaMock.translation.findUnique.mockResolvedValue({ id: 'test-id' } as any);
      prismaMock.translation.update.mockResolvedValue({
        id: 'test-id',
        deletedAt: new Date()
      } as any);

      await service.softDelete('test-id');

      expect(prismaMock.translation.update).toHaveBeenCalledWith({
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

      prismaMock.translation.findUnique.mockResolvedValue(mockItem as any);

      // First call
      await service.getById('cached-id');
      // Second call should use cache
      await service.getById('cached-id');

      // Should only query database once
      expect(prismaMock.translation.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache on update', async () => {
      const mockItem = { id: 'test-id', name: 'Original' };

      prismaMock.translation.findUnique.mockResolvedValue(mockItem as any);
      prismaMock.translation.update.mockResolvedValue({ ...mockItem, name: 'Updated' } as any);

      await service.getById('test-id');
      await service.update('test-id', { name: 'Updated' });

      // Cache should be invalidated after update
      prismaMock.translation.findUnique.mockResolvedValue({ ...mockItem, name: 'Updated' } as any);
      await service.getById('test-id');

      expect(prismaMock.translation.findUnique).toHaveBeenCalledTimes(3);
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
      prismaMock.translation.findMany.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(service.getAll()).rejects.toThrow('Database connection failed');
    });

    it('should handle timeout errors', async () => {
      prismaMock.translation.findMany.mockRejectedValue(new Error('Query timeout'));

      await expect(service.getAll()).rejects.toThrow('Query timeout');
    });

    it('should retry on transient errors', async () => {
      prismaMock.translation.findUnique
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({ id: 'test-id' } as any);

      const result = await service.getById('test-id');

      expect(result).toBeDefined();
      expect(prismaMock.translation.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
