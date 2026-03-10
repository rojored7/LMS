/**
 * useQuizzes Hook
 * Custom hook for managing quizzes with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuiz, submitQuiz, getQuizAttempts, getQuizAttempt, QuizAnswer } from '../services/api/quiz.service';
import { useToast } from './useToast';

/**
 * Hook to fetch a quiz
 * @param quizId - Quiz ID
 */
export const useQuiz = (quizId: string | undefined) => {
  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => getQuiz(quizId!),
    enabled: !!quizId,
  });
};

/**
 * Hook to fetch quiz attempts
 * @param quizId - Quiz ID
 */
export const useQuizAttempts = (quizId: string | undefined) => {
  return useQuery({
    queryKey: ['quizAttempts', quizId],
    queryFn: () => getQuizAttempts(quizId!),
    enabled: !!quizId,
  });
};

/**
 * Hook to fetch a quiz attempt detail
 * @param attemptId - Attempt ID
 */
export const useQuizAttempt = (attemptId: string | undefined) => {
  return useQuery({
    queryKey: ['quizAttempt', attemptId],
    queryFn: () => getQuizAttempt(attemptId!),
    enabled: !!attemptId,
  });
};

/**
 * Hook to submit a quiz
 */
export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ quizId, answers }: { quizId: string; answers: QuizAnswer[] }) =>
      submitQuiz(quizId, answers),
    onSuccess: (data, variables) => {
      // Invalidate quiz and attempts queries
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.quizId] });
      queryClient.invalidateQueries({ queryKey: ['quizAttempts', variables.quizId] });
      // Invalidate module and course progress
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['courseProgress'] });

      if (data.passed) {
        showToast(`¡Felicitaciones! Aprobaste con ${data.score}%`, 'success');
      } else {
        showToast(`Obtuviste ${data.score}%. Necesitas ${data.passingScore}% para aprobar.`, 'warning');
      }
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Error al enviar quiz', 'error');
    },
  });
};
