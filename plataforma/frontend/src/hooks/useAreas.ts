import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import areaService from '../services/api/area.service';
import type { CreateAreaRequest, UpdateAreaRequest } from '../services/api/area.service';
import { useToast } from './useToast';

const areaKeys = {
  all: ['areas'] as const,
  lists: () => [...areaKeys.all, 'list'] as const,
};

export function useAreas() {
  return useQuery({
    queryKey: areaKeys.lists(),
    queryFn: () => areaService.getAreas(),
  });
}

export function useCreateArea() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreateAreaRequest) => areaService.createArea(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
      toast.success('Area creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al crear el area');
    },
  });
}

export function useUpdateArea() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ areaId, data }: { areaId: string; data: UpdateAreaRequest }) =>
      areaService.updateArea(areaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
      toast.success('Area actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al actualizar el area');
    },
  });
}

export function useDeleteArea() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (areaId: string) => areaService.deleteArea(areaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
      toast.success('Area eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al eliminar el area');
    },
  });
}

export function useAssignUserArea() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ userId, areaId }: { userId: string; areaId: string | null }) =>
      areaService.assignUserArea(userId, areaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al asignar el area');
    },
  });
}
