import { describe, it, expect, vi, beforeEach } from 'vitest';
import { user.serviceService } from './user.service';
import { api } from '../services/api';

vi.mock('../services/api');

describe('user.service Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Calls', () => {
    it('should make correct API calls', async () => {
      const mockData = { id: '1', name: 'Test' };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

      const result = await user.serviceService.getAll();

      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/'));
      expect(result).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'));

      await expect(user.serviceService.getAll()).rejects.toThrow('API Error');
    });
  });
});
