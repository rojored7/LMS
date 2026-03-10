/**
 * useLessons Hook
 * Custom hook for managing lessons with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLesson, completeLesson, getLessonProgress } from '../services/api/lesson.service';
import { useToast } from './useToast';

/**
 * Hook to fetch a lesson with full content
 * @param lessonId - Lesson ID
 */
export const useLesson = (lessonId: string | undefined) => {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId!),
    enabled: !!lessonId,
  });
};

/**
 * Hook to fetch lesson progress
 * @param lessonId - Lesson ID
 */
export const useLessonProgress = (lessonId: string | undefined) => {
  return useQuery({
    queryKey: ['lessonProgress', lessonId],
    queryFn: () => getLessonProgress(lessonId!),
    enabled: !!lessonId,
  });
};

/**
 * Hook to complete a lesson
 */
export const useCompleteLesson = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ lessonId, timeSpent }: { lessonId: string; timeSpent?: number }) =>
      completeLesson(lessonId, timeSpent),
    onSuccess: (data, variables) => {
      // Invalidate lesson query to refresh progress
      queryClient.invalidateQueries({ queryKey: ['lesson', variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['lessonProgress', variables.lessonId] });
      // Invalidate module and course progress
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['courseProgress'] });

      showToast('Lección completada exitosamente', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Error al completar lección', 'error');
    },
  });
};
