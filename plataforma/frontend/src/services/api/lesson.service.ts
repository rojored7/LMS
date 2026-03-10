/**
 * Lesson Service
 * API client for lesson-related operations
 */

import api from '../api';

export interface LessonDetail {
  id: string;
  title: string;
  description?: string;
  type: 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'CODE_LAB';
  content: string;
  estimatedTime: number;
  order: number;
  moduleId: string;
  module: {
    id: string;
    title: string;
    courseId: string;
    course: {
      id: string;
      title: string;
    };
  };
  userProgress?: {
    completed: boolean;
    completedAt: Date | null;
    timeSpent: number;
  };
}

export interface LessonProgress {
  completed: boolean;
  completedAt: Date | null;
  timeSpent: number;
}

/**
 * Get a single lesson by ID with full content
 * @param lessonId - Lesson ID
 */
export const getLesson = async (lessonId: string): Promise<LessonDetail> => {
  const response = await api.get(`/lessons/${lessonId}`);
  return response.data;
};

/**
 * Mark a lesson as complete
 * @param lessonId - Lesson ID
 * @param timeSpent - Time spent on lesson in seconds (optional)
 */
export const completeLesson = async (
  lessonId: string,
  timeSpent?: number
): Promise<LessonProgress> => {
  const response = await api.post(`/lessons/${lessonId}/complete`, { timeSpent });
  return response.data;
};

/**
 * Get lesson progress for current user
 * @param lessonId - Lesson ID
 */
export const getLessonProgress = async (lessonId: string): Promise<LessonProgress> => {
  const response = await api.get(`/lessons/${lessonId}/progress`);
  return response.data;
};

export default {
  getLesson,
  completeLesson,
  getLessonProgress,
};
