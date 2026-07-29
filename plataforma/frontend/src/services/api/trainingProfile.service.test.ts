import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import {
  getAllProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  addCourseToProfile,
  removeCourseFromProfile,
  updateCourseInProfile,
  reorderCourses,
} from './trainingProfile.service';

describe('trainingProfile service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllProfiles', () => {
    it('llama GET /training-profiles y retorna data', async () => {
      const mockProfiles = [{ id: 'p1', name: 'Test', slug: 'test', description: 'desc' }];
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockProfiles });

      const result = await getAllProfiles();
      expect(api.get).toHaveBeenCalledWith('/training-profiles');
      expect(result).toEqual(mockProfiles);
    });
  });

  describe('getProfileById', () => {
    it('llama GET /training-profiles/{id}', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { id: 'p1' } });
      await getProfileById('p1');
      expect(api.get).toHaveBeenCalledWith('/training-profiles/p1');
    });
  });

  describe('createProfile', () => {
    it('llama POST /training-profiles con icon y color', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'p1' } });
      await createProfile({ name: 'T', slug: 't', description: 'd', icon: 'shield', color: '#ff0' });
      expect(api.post).toHaveBeenCalledWith(
        '/training-profiles',
        expect.objectContaining({ icon: 'shield', color: '#ff0' })
      );
    });
  });

  describe('addCourseToProfile', () => {
    it('envia course_id en snake_case (no courseId)', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'cp1' } });
      await addCourseToProfile('p1', 'c1', 2);
      expect(api.post).toHaveBeenCalledWith('/training-profiles/p1/courses', {
        course_id: 'c1',
        order: 2,
      });
    });

    it('usa order 0 por defecto', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });
      await addCourseToProfile('p1', 'c1');
      expect(api.post).toHaveBeenCalledWith('/training-profiles/p1/courses', {
        course_id: 'c1',
        order: 0,
      });
    });
  });

  describe('removeCourseFromProfile', () => {
    it('llama DELETE /training-profiles/{id}/courses/{courseId}', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });
      await removeCourseFromProfile('p1', 'c1');
      expect(api.delete).toHaveBeenCalledWith('/training-profiles/p1/courses/c1');
    });
  });

  describe('updateCourseInProfile', () => {
    it('llama PATCH /training-profiles/{id}/courses/{courseId} con order y required', async () => {
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });
      await updateCourseInProfile('p1', 'c1', { order: 3, required: true });
      expect(api.patch).toHaveBeenCalledWith('/training-profiles/p1/courses/c1', {
        order: 3,
        required: true,
      });
    });

    it('funciona con solo order', async () => {
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });
      await updateCourseInProfile('p1', 'c1', { order: 5 });
      expect(api.patch).toHaveBeenCalledWith('/training-profiles/p1/courses/c1', { order: 5 });
    });
  });

  describe('reorderCourses', () => {
    it('llama PATCH /training-profiles/{id}/courses/reorder con array courses en snake_case', async () => {
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });
      await reorderCourses('p1', [
        { courseId: 'c1', order: 0 },
        { courseId: 'c2', order: 1 },
      ]);
      expect(api.patch).toHaveBeenCalledWith('/training-profiles/p1/courses/reorder', {
        courses: [
          { course_id: 'c1', order: 0 },
          { course_id: 'c2', order: 1 },
        ],
      });
    });
  });

  describe('tipos enriquecidos — icon, color, order, required en cursos', () => {
    it('retorna perfil con icon, color y cursos con order/required', async () => {
      const mockProfile = {
        id: 'p1',
        name: 'Hacking Etico',
        slug: 'hacking-etico',
        description: 'Ruta para pentesters',
        icon: 'shield',
        color: '#3b82f6',
        courses: [
          { id: 'c1', title: 'Curso 1', slug: 'c1', level: 'BEGINNER', order: 0, required: false },
        ],
        _count: { users: 5, courses: 1 },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockProfile });
      const result = await getProfileById('p1');
      expect(result.icon).toBe('shield');
      expect(result.color).toBe('#3b82f6');
      expect(result.courses?.[0].order).toBe(0);
      expect(result.courses?.[0].required).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('llama PUT con icon y color', async () => {
      vi.mocked(api.put).mockResolvedValueOnce({ data: { id: 'p1' } });
      await updateProfile('p1', { name: 'Nuevo', icon: 'lock', color: '#000' });
      expect(api.put).toHaveBeenCalledWith(
        '/training-profiles/p1',
        expect.objectContaining({ icon: 'lock' })
      );
    });
  });

  describe('deleteProfile', () => {
    it('llama DELETE /training-profiles/{id}', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });
      await deleteProfile('p1');
      expect(api.delete).toHaveBeenCalledWith('/training-profiles/p1');
    });
  });
});
