import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import trainingProfileService from '../services/api/trainingProfile.service';
import type { TrainingProfile, CreateTrainingProfileRequest, UpdateTrainingProfileRequest, CourseOrderItem } from '../services/api/trainingProfile.service';
import { useToast } from './useToast';

const profileKeys = {
  all: ['training-profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  detail: (id: string) => [...profileKeys.all, 'detail', id] as const,
};

export function useProfiles() {
  return useQuery({
    queryKey: profileKeys.lists(),
    queryFn: () => trainingProfileService.getAllProfiles(),
  });
}

export function useProfile(profileId: string) {
  return useQuery({
    queryKey: profileKeys.detail(profileId),
    queryFn: () => trainingProfileService.getProfileById(profileId),
    enabled: !!profileId,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreateTrainingProfileRequest) => trainingProfileService.createProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      toast.success('Perfil de formacion creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al crear el perfil');
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: UpdateTrainingProfileRequest }) =>
      trainingProfileService.updateProfile(profileId, data),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(profileId) });
      toast.success('Perfil de formacion actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al actualizar el perfil');
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (profileId: string) => trainingProfileService.deleteProfile(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      toast.success('Perfil de formacion eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al eliminar el perfil');
    },
  });
}

export function useAddCourseToProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ profileId, courseId, order }: { profileId: string; courseId: string; order: number }) =>
      trainingProfileService.addCourseToProfile(profileId, courseId, order),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(profileId) });
      toast.success('Curso agregado al perfil exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al agregar el curso al perfil');
    },
  });
}

export function useRemoveCourseFromProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ profileId, courseId }: { profileId: string; courseId: string }) =>
      trainingProfileService.removeCourseFromProfile(profileId, courseId),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(profileId) });
      toast.success('Curso removido del perfil exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al remover el curso del perfil');
    },
  });
}

export function useUpdateCourseInProfile() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      profileId,
      courseId,
      data,
    }: {
      profileId: string;
      courseId: string;
      data: { order?: number; required?: boolean };
    }) => trainingProfileService.updateCourseInProfile(profileId, courseId, data),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(profileId) });
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al actualizar el curso en el perfil');
    },
  });
}

export function useReorderCourses() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ profileId, courses }: { profileId: string; courses: CourseOrderItem[] }) =>
      trainingProfileService.reorderCourses(profileId, courses),
    onMutate: async ({ profileId, courses }) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.lists() });
      const snapshot = queryClient.getQueryData<TrainingProfile[]>(profileKeys.lists());

      queryClient.setQueryData<TrainingProfile[]>(profileKeys.lists(), (old) => {
        if (!old) return old;
        return old.map((p) => {
          if (p.id !== profileId) return p;
          const reordered = courses
            .map((item) => {
              const existing = p.courses?.find((c) => c.id === item.courseId);
              return existing ? { ...existing, order: item.order } : null;
            })
            .filter(Boolean) as NonNullable<TrainingProfile['courses']>;
          return { ...p, courses: reordered };
        });
      });

      return { snapshot };
    },
    onError: (_error: any, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(profileKeys.lists(), context.snapshot);
      }
      toast.error('Error al reordenar los cursos');
    },
    onSettled: (_data, _error, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(profileId) });
    },
  });
}
