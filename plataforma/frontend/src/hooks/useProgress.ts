/**
 * useProgress Hook
 * Custom hook for managing course progress with TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { getCourseProgress } from '../services/api/progress.service';

/**
 * Hook to fetch detailed course progress
 * @param courseId - Course ID
 */
export const useCourseProgress = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['courseProgress', courseId],
    queryFn: () => getCourseProgress(courseId!),
    enabled: !!courseId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};
