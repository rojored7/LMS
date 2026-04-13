import { describe, it, expect, vi, beforeEach } from 'vitest';
import { badge.serviceService } from './badge.service';
import { api } from '../services/api';

vi.mock('../services/api');

describe('badge.service Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Calls', () => {
    it('should make correct API calls', async () => {
      const mockData = { id: '1', name: 'Test' };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

      const result = await badge.serviceService.getAll();

      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/'));
      expect(result).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'));

      await expect(badge.serviceService.getAll()).rejects.toThrow('API Error');
    });
  });
});
