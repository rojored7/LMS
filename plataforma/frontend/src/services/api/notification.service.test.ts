import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notification.serviceService } from './notification.service';
import { api } from '../services/api';

vi.mock('../services/api');

describe('notification.service Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Calls', () => {
    it('should make correct API calls', async () => {
      const mockData = { id: '1', name: 'Test' };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

      const result = await notification.serviceService.getAll();

      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/'));
      expect(result).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'));

      await expect(notification.serviceService.getAll()).rejects.toThrow('API Error');
    });
  });
});
