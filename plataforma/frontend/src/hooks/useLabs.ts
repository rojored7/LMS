/**
 * useLabs Hook
 * Custom hook for managing labs with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLab, submitLab, getLabSubmissions, getLabSubmission } from '../services/api/lab.service';
import { useToast } from './useToast';

/**
 * Hook to fetch a lab
 * @param labId - Lab ID
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
 * @param labId - Lab ID
 */
export const useLabSubmissions = (labId: string | undefined) => {
  return useQuery({
    queryKey: ['labSubmissions', labId],
    queryFn: () => getLabSubmissions(labId!),
    enabled: !!labId,
  });
};

/**
 * Hook to fetch a lab submission detail
 * @param submissionId - Submission ID
 */
export const useLabSubmission = (submissionId: string | undefined) => {
  return useQuery({
    queryKey: ['labSubmission', submissionId],
    queryFn: () => getLabSubmission(submissionId!),
    enabled: !!submissionId,
  });
};

/**
 * Hook to submit a lab solution
 */
export const useSubmitLab = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ labId, code }: { labId: string; code: string }) =>
      submitLab(labId, code),
    onSuccess: (data, variables) => {
      // Invalidate lab and submissions queries
      queryClient.invalidateQueries({ queryKey: ['lab', variables.labId] });
      queryClient.invalidateQueries({ queryKey: ['labSubmissions', variables.labId] });
      // Invalidate module and course progress
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['courseProgress'] });

      if (data.passed) {
        showToast(`¡Excelente! Pasaste ${data.passedTests}/${data.totalTests} tests con ${data.score}%`, 'success');
      } else {
        showToast(`Pasaste ${data.passedTests}/${data.totalTests} tests. Necesitas ${data.passingScore}% para aprobar.`, 'warning');
      }
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Error al enviar código', 'error');
    },
  });
};
