/**
 * Lesson Service
 * API client for lesson-related operations
 */

import api from '../api';

export interface LessonAttachment {
  id: string;
  lessonId: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  description: string | null;
  downloadUrl: string;
  createdAt: string;
}

export interface LessonDetail {
  id: string;
  title: string;
  description?: string;
  type: 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'CODE_LAB';
  content: string;
  estimatedTime: number;
  order: number;
  moduleId: string;
  videoUrl?: string | null;
  videoProvider?: string | null;
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

export const getAttachments = async (lessonId: string): Promise<LessonAttachment[]> => {
  const response = await api.get(`/attachments/lesson/${lessonId}`);
  return (response as any).data || [];
};

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
  // Axios interceptor returns response.data (the API envelope {success, data})
  // .data accesses the inner payload
  return (response as any).data || response;
};

/**
 * Mark a lesson as complete
 */
export const completeLesson = async (
  lessonId: string,
  timeSpent?: number
): Promise<LessonProgress> => {
  const response = await api.post(`/lessons/${lessonId}/complete`, { timeSpent });
  return (response as any).data || response;
};

/**
 * Get lesson progress for current user
 */
export const getLessonProgress = async (lessonId: string): Promise<LessonProgress> => {
  const response = await api.get(`/lessons/${lessonId}/progress`);
  return (response as any).data || response;
};

export default {
  getLesson,
  completeLesson,
  getLessonProgress,
};
