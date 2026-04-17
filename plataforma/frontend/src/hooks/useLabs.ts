/**
 * useLabs Hook
 * Custom hook for managing labs with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLab,
  submitLab,
  getLabSubmissions,
  checkExecutorHealth,
  completeLabManual,
} from '../services/api/lab.service';
import { useToast } from './useToast';

/**
 * Hook to fetch a lab
 */
export const useLab = (labId: string | undefined) => {
  return useQuery({
    queryKey: ['lab', labId],
    queryFn: () => getLab(labId!),
    enabled: !!labId,
  });
};

/**
 * Hook to fetch lab submissions
 */
export const useLabSubmissions = (labId: string | undefined) => {
  return useQuery({
    queryKey: ['labSubmissions', labId],
    queryFn: () => getLabSubmissions(labId!),
    enabled: !!labId,
  });
};

/**
 * Hook to check executor service health
 */
export const useExecutorHealth = () => {
  return useQuery({
    queryKey: ['executorHealth'],
    queryFn: () => checkExecutorHealth(),
    refetchInterval: 30000,
    staleTime: 15000,
  });
};

/**
 * Hook to submit a lab solution
 */
export const useSubmitLab = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ labId, code }: { labId: string; code: string }) => submitLab(labId, code),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lab', variables.labId] });
      queryClient.invalidateQueries({ queryKey: ['labSubmissions', variables.labId] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['courseProgress'] });

      if (data.executorError) {
        showToast(
          'El ejecutor no esta disponible. Intenta mas tarde o marca como completado.',
          'error',
        );
      } else if (data.passed) {
        showToast('Laboratorio completado exitosamente', 'success');
      } else {
        showToast('Codigo ejecutado. Revisa los resultados.', 'warning');
      }
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Error al enviar codigo', 'error');
    },
  });
};

/**
 * Hook to manually mark a lab as completed
 */
export const useCompleteLabManual = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ labId }: { labId: string }) => completeLabManual(labId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lab', variables.labId] });
      queryClient.invalidateQueries({ queryKey: ['labSubmissions', variables.labId] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['courseProgress'] });
      showToast('Laboratorio marcado como completado', 'success');
    },
    onError: () => {
      showToast('Error al marcar como completado', 'error');
    },
  });
};
