import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLab,
  submitLab,
  submitDeliverableLab,
  gradeSubmission,
  getLabSubmissions,
  checkExecutorHealth,
  completeLabManual,
} from '../services/api/lab.service';
import type { GradeSubmissionPayload } from '../types/lab';
import { useToast } from './useToast';

export const useLab = (labId: string | undefined) => {
  return useQuery({
    queryKey: ['lab', labId],
    queryFn: () => getLab(labId!),
    enabled: !!labId,
  });
};

export const useLabSubmissions = (labId: string | undefined) => {
  return useQuery({
    queryKey: ['labSubmissions', labId],
    queryFn: () => getLabSubmissions(labId!),
    enabled: !!labId,
  });
};

export const useExecutorHealth = () => {
  return useQuery({
    queryKey: ['executorHealth'],
    queryFn: () => checkExecutorHealth(),
    refetchInterval: 30000,
    staleTime: 15000,
  });
};

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
        showToast('El ejecutor no esta disponible. Intenta mas tarde.', 'error');
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

export const useSubmitDeliverable = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ labId, responseText }: { labId: string; responseText: string }) =>
      submitDeliverableLab(labId, responseText),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['labSubmissions', variables.labId] });
      showToast('Entrega enviada. El instructor revisara tu respuesta.', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Error al enviar la entrega', 'error');
    },
  });
};

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      submissionId,
      payload,
    }: {
      submissionId: string;
      payload: GradeSubmissionPayload;
    }) => gradeSubmission(submissionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labSubmissions'] });
      showToast('Submission calificada correctamente', 'success');
    },
    onError: () => {
      showToast('Error al calificar la submission', 'error');
    },
  });
};

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
