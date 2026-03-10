/**
 * Module Service
 * API client for module-related operations
 */

import api from '../api';

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedTime: number;
  isPublished: boolean;
  courseId: string;
  lessons: Lesson[];
  quizzes: Quiz[];
  labs: Lab[];
  userProgress?: number;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  type: 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'CODE_LAB';
  estimatedTime: number;
  order: number;
}

export interface Quiz {
  id: string;
  title: string;
  passingScore: number;
  timeLimit?: number;
}

export interface Lab {
  id: string;
  title: string;
  language: string;
}

/**
 * Get all modules for a course with user progress
 * @param courseId - Course ID
 */
export const getModules = async (courseId: string): Promise<Module[]> => {
  const response = await api.get(`/courses/${courseId}/modules`);
  return response.data;
};

/**
 * Get a single module by ID
 * @param moduleId - Module ID
 */
export const getModule = async (moduleId: string): Promise<Module> => {
  const response = await api.get(`/modules/${moduleId}`);
  return response.data;
};

/**
 * Get module progress for current user
 * @param moduleId - Module ID
 */
export const getModuleProgress = async (moduleId: string): Promise<{ progress: number }> => {
  const response = await api.get(`/modules/${moduleId}/progress`);
  return response.data;
};

/**
 * Get lessons for a module
 * @param moduleId - Module ID
 */
export const getModuleLessons = async (moduleId: string): Promise<Lesson[]> => {
  const response = await api.get(`/modules/${moduleId}/lessons`);
  return response.data;
};

export default {
  getModules,
  getModule,
  getModuleProgress,
  getModuleLessons,
};
