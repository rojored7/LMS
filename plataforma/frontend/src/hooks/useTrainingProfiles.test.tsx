import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import trainingProfileService from '../services/api/trainingProfile.service';
import {
  useProfiles,
  useCreateProfile,
  useUpdateProfile,
  useDeleteProfile,
  useAddCourseToProfile,
  useRemoveCourseFromProfile,
  useUpdateCourseInProfile,
  useReorderCourses,
} from './useTrainingProfiles';

vi.mock('../services/api/trainingProfile.service', () => ({
  default: {
    getAllProfiles: vi.fn(),
    getProfileById: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteProfile: vi.fn(),
    addCourseToProfile: vi.fn(),
    removeCourseFromProfile: vi.fn(),
    updateCourseInProfile: vi.fn(),
    reorderCourses: vi.fn(),
  },
}));

vi.mock('./useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const createWrapper = (qc?: QueryClient) => {
  const client = qc ?? new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const mockProfile = {
  id: 'p1',
  name: 'Test',
  slug: 'test',
  description: 'Desc',
  createdAt: '2026-01-01T00:00:00Z',
  courses: [],
};

describe('useProfiles', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna lista de perfiles', async () => {
    vi.mocked(trainingProfileService.getAllProfiles).mockResolvedValue([mockProfile]);
    const { result } = renderHook(() => useProfiles(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockProfile]);
  });

  it('isLoading es true mientras carga', () => {
    vi.mocked(trainingProfileService.getAllProfiles).mockResolvedValue([]);
    const { result } = renderHook(() => useProfiles(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });
});

describe('useCreateProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama createProfile y invalida la cache', async () => {
    vi.mocked(trainingProfileService.getAllProfiles).mockResolvedValue([]);
    vi.mocked(trainingProfileService.createProfile).mockResolvedValue(mockProfile);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useCreateProfile(), { wrapper: createWrapper(qc) });
    await act(() => result.current.mutateAsync({ name: 'T', slug: 't', description: 'd' }));
    expect(trainingProfileService.createProfile).toHaveBeenCalledWith({ name: 'T', slug: 't', description: 'd' });
  });
});

describe('useUpdateProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama updateProfile con profileId y datos', async () => {
    vi.mocked(trainingProfileService.updateProfile).mockResolvedValue(mockProfile);
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    await act(() => result.current.mutateAsync({ profileId: 'p1', data: { name: 'Nuevo' } }));
    expect(trainingProfileService.updateProfile).toHaveBeenCalledWith('p1', { name: 'Nuevo' });
  });
});

describe('useDeleteProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama deleteProfile con el profileId', async () => {
    vi.mocked(trainingProfileService.deleteProfile).mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteProfile(), { wrapper: createWrapper() });
    await act(() => result.current.mutateAsync('p1'));
    expect(trainingProfileService.deleteProfile).toHaveBeenCalledWith('p1');
  });
});

describe('useAddCourseToProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama addCourseToProfile con profileId, courseId y order', async () => {
    vi.mocked(trainingProfileService.addCourseToProfile).mockResolvedValue(mockProfile);
    const { result } = renderHook(() => useAddCourseToProfile(), { wrapper: createWrapper() });
    await act(() => result.current.mutateAsync({ profileId: 'p1', courseId: 'c1', order: 2 }));
    expect(trainingProfileService.addCourseToProfile).toHaveBeenCalledWith('p1', 'c1', 2);
  });
});

describe('useRemoveCourseFromProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama removeCourseFromProfile', async () => {
    vi.mocked(trainingProfileService.removeCourseFromProfile).mockResolvedValue(undefined);
    const { result } = renderHook(() => useRemoveCourseFromProfile(), { wrapper: createWrapper() });
    await act(() => result.current.mutateAsync({ profileId: 'p1', courseId: 'c1' }));
    expect(trainingProfileService.removeCourseFromProfile).toHaveBeenCalledWith('p1', 'c1');
  });
});

describe('useUpdateCourseInProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama updateCourseInProfile con profileId, courseId y data', async () => {
    vi.mocked(trainingProfileService.updateCourseInProfile).mockResolvedValue(undefined);
    const { result } = renderHook(() => useUpdateCourseInProfile(), { wrapper: createWrapper() });
    await act(() => result.current.mutateAsync({ profileId: 'p1', courseId: 'c1', data: { required: true } }));
    expect(trainingProfileService.updateCourseInProfile).toHaveBeenCalledWith('p1', 'c1', { required: true });
  });
});

describe('useReorderCourses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama reorderCourses con profileId y array de courses', async () => {
    vi.mocked(trainingProfileService.reorderCourses).mockResolvedValue(undefined);
    const { result } = renderHook(() => useReorderCourses(), { wrapper: createWrapper() });
    const courses = [{ courseId: 'c1', order: 0 }, { courseId: 'c2', order: 1 }];
    await act(() => result.current.mutateAsync({ profileId: 'p1', courses }));
    expect(trainingProfileService.reorderCourses).toHaveBeenCalledWith('p1', courses);
  });
});
