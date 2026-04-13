import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth.serviceService } from './auth.service';
import { api } from '../services/api';

vi.mock('../services/api');

describe('auth.service Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Calls', () => {
    it('should make correct API calls', async () => {
      const mockData = { id: '1', name: 'Test' };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

      const result = await auth.serviceService.getAll();

      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/'));
      expect(result).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'));

      await expect(auth.serviceService.getAll()).rejects.toThrow('API Error');
    });
  });
});
