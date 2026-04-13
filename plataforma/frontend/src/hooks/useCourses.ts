/**
 * useCourses hook
 * Provides course-related functionality with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import courseService from '../services/course.service';
import type { Course, QueryParams } from '../types';
import { useToast } from './useToast';

/**
 * Query key factory
 */
const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params?: QueryParams) => [...courseKeys.lists(), params] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  enrolled: () => [...courseKeys.all, 'enrolled'] as const,
  modules: (courseId: string) => [...courseKeys.all, 'modules', courseId] as const,
};

/**
 * Fetch courses with pagination and filters
 */
export function useCourses(params?: QueryParams) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: () => courseService.getCourses(params),
  });
}

/**
 * Fetch course by ID
 */
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: courseKeys.detail(courseId),
    queryFn: () => courseService.getCourseById(courseId),
    enabled: !!courseId,
  });
}

/**
 * Fetch course modules
 */
export function useCourseModules(courseId: string) {
  return useQuery({
    queryKey: courseKeys.modules(courseId),
    queryFn: () => courseService.getCourseModules(courseId),
    enabled: !!courseId,
  });
}

/**
 * Fetch enrolled courses
 */
export function useEnrolledCourses() {
  return useQuery({
    queryKey: courseKeys.enrolled(),
    queryFn: () => courseService.getEnrolledCourses(),
  });
}

/**
 * Enroll in course mutation
 */
export function useEnrollCourse() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (courseId: string) => courseService.enrollCourse(courseId),
    onSuccess: (_, courseId) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: courseKeys.enrolled() });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });

      toast.success('Te has inscrito exitosamente en el curso');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al inscribirse en el curso');
    },
  });
}

/**
 * Unenroll from course mutation
 */
export function useUnenrollCourse() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (courseId: string) => courseService.unenrollCourse(courseId),
    onSuccess: (_, courseId) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: courseKeys.enrolled() });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });

      toast.success('Te has desinscrito exitosamente del curso');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al desinscribirse del curso');
    },
  });
}

/**
 * Create course mutation
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: Partial<Course>) => courseService.createCourse(data),
    onSuccess: () => {
      // Invalidate courses list
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });

      toast.success('Curso creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al crear el curso');
    },
  });
}

/**
 * Update course mutation
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: Partial<Course> }) =>
      courseService.updateCourse(courseId, data),
    onSuccess: (_, { courseId }) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });

      toast.success('Curso actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al actualizar el curso');
    },
  });
}

/**
 * Delete course mutation
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (courseId: string) => courseService.deleteCourse(courseId),
    onSuccess: () => {
      // Invalidate courses list
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });

      toast.success('Curso eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Error al eliminar el curso');
    },
  });
}
