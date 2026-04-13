/**
 * useQuizzes Hook
 * Custom hook for managing quizzes with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuiz, submitQuiz } from '../services/api/quiz.service';
import { useToast } from './useToast';

/**
 * Hook to fetch a quiz
 */
export const useQuiz = (quizId: string | undefined) => {
  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => getQuiz(quizId!),
    enabled: !!quizId,
  });
};

/**
 * Hook to submit a quiz
 */
export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ quizId, answers }: { quizId: string; answers: Record<string, string> }) =>
      submitQuiz(quizId, answers),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.quizId] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['courseProgress'] });

      if (data.passed) {
        showToast(`Aprobaste con ${data.score}%`, 'success');
      } else {
        showToast(`Obtuviste ${data.score}%. Sigue intentando.`, 'warning');
      }
    },
    onError: () => {
      showToast('Error al enviar quiz', 'error');
    },
  });
};
