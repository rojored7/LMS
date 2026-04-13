/**
 * Progress Service
 * API client for progress tracking operations
 */

import api from '../api';

export interface ModuleProgressDetail {
  moduleId: string;
  moduleTitle: string;
  progress: number;
  lessons: {
    total: number;
    completed: number;
  };
  quizzes: {
    total: number;
    passed: number;
  };
  labs: {
    total: number;
    passed: number;
  };
}

export interface CourseProgressDetail {
  overallProgress: number;
  modules: ModuleProgressDetail[];
}

/**
 * Get detailed course progress for current user
 * @param courseId - Course ID
 */
export const getCourseProgress = async (courseId: string): Promise<CourseProgressDetail> => {
  const response = await api.get(`/progress/course/${courseId}`);
  const data = (response as any).data || response;
  return {
    overallProgress: data.progress ?? data.overallProgress ?? 0,
    modules: data.modules || [],
  };
};

export default {
  getCourseProgress,
};
