/**
 * useModules Hook
 * Custom hook for managing modules with TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { getModules, getModule, getModuleProgress, getModuleLessons } from '../services/api/module.service';

/**
 * Hook to fetch modules for a course
 * @param courseId - Course ID
 */
export const useModules = (courseId: string) => {
  return useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => getModules(courseId),
    enabled: !!courseId,
  });
};

/**
 * Hook to fetch a single module
 * @param moduleId - Module ID
 */
export const useModule = (moduleId: string | undefined) => {
  return useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => getModule(moduleId!),
    enabled: !!moduleId,
  });
};

/**
 * Hook to fetch module progress
 * @param moduleId - Module ID
 */
export const useModuleProgress = (moduleId: string | undefined) => {
  return useQuery({
    queryKey: ['moduleProgress', moduleId],
    queryFn: () => getModuleProgress(moduleId!),
    enabled: !!moduleId,
  });
};

/**
 * Hook to fetch lessons for a module
 * @param moduleId - Module ID
 */
export const useModuleLessons = (moduleId: string | undefined) => {
  return useQuery({
    queryKey: ['moduleLessons', moduleId],
    queryFn: () => getModuleLessons(moduleId!),
    enabled: !!moduleId,
  });
};
