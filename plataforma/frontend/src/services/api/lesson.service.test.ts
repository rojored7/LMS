/**
 * Tests unitarios para lesson.service.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../api';
import {
  uploadLessonImage,
  getLesson,
  completeLesson,
  getLessonProgress,
  getAttachments,
} from './lesson.service';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('lesson.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadLessonImage', () => {
    it('sube el archivo y devuelve downloadUrl', async () => {
      const mockFile = new File([new Uint8Array(8)], 'imagen.png', { type: 'image/png' });
      const expectedUrl = '/api/uploads/lessons/lesson-123/abcdef.png';

      vi.mocked(api.post).mockResolvedValueOnce({
        data: { downloadUrl: expectedUrl, mimeType: 'image/png' },
      });

      const result = await uploadLessonImage('lesson-123', mockFile);

      expect(api.post).toHaveBeenCalledWith('/attachments/lesson/lesson-123', expect.any(FormData));
      expect(result).toBe(expectedUrl);
    });

    it('lanza error si el servidor no devuelve downloadUrl', async () => {
      const mockFile = new File([new Uint8Array(8)], 'imagen.png', { type: 'image/png' });
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await expect(uploadLessonImage('lesson-123', mockFile)).rejects.toThrow(
        'El servidor no devolvio downloadUrl'
      );
    });

    it('propaga errores de red', async () => {
      const mockFile = new File([new Uint8Array(8)], 'imagen.png', { type: 'image/png' });
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network Error'));

      await expect(uploadLessonImage('lesson-123', mockFile)).rejects.toThrow('Network Error');
    });
  });

  describe('getAttachments', () => {
    it('devuelve lista de adjuntos de una leccion', async () => {
      const mockAttachments = [
        {
          id: 'a-1',
          lessonId: 'l-1',
          originalFilename: 'imagen.png',
          fileSize: 1024,
          mimeType: 'image/png',
          description: null,
          downloadUrl: '/api/uploads/lessons/l-1/abc.png',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockAttachments });

      const result = await getAttachments('l-1');

      expect(api.get).toHaveBeenCalledWith('/attachments/lesson/l-1');
      expect(result).toEqual(mockAttachments);
    });

    it('devuelve array vacio si data es null', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: null });
      const result = await getAttachments('l-1');
      expect(result).toEqual([]);
    });
  });

  describe('getLesson', () => {
    it('obtiene los detalles de una leccion', async () => {
      const mockLesson = { id: 'l-1', title: 'Leccion', content: '# Test' };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockLesson });

      const result = await getLesson('l-1');

      expect(api.get).toHaveBeenCalledWith('/lessons/l-1');
      expect(result).toEqual(mockLesson);
    });
  });

  describe('completeLesson', () => {
    it('marca una leccion como completada', async () => {
      const mockProgress = { completed: true, completedAt: new Date(), timeSpent: 300 };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockProgress });

      const result = await completeLesson('l-1', 300);

      expect(api.post).toHaveBeenCalledWith('/lessons/l-1/complete', { timeSpent: 300 });
      expect(result).toEqual(mockProgress);
    });
  });

  describe('getLessonProgress', () => {
    it('obtiene el progreso de una leccion', async () => {
      const mockProgress = { completed: false, completedAt: null, timeSpent: 120 };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockProgress });

      const result = await getLessonProgress('l-1');

      expect(api.get).toHaveBeenCalledWith('/lessons/l-1/progress');
      expect(result).toEqual(mockProgress);
    });
  });
});
