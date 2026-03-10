/**
 * Course service
 * Handles course-related operations
 */

import api from './api';
import type {
  Course,
  Module,
  Lesson,
  Quiz,
  QuizAttempt,
  Lab,
  Enrollment,
  EnrollmentWithCourse,
  Certificate,
  CourseProgress,
} from '../types';
import type { ApiResponse, PaginatedResponse, QueryParams } from '../types';

/**
 * Get all courses with optional filters
 */
export async function getCourses(params?: QueryParams): Promise<PaginatedResponse<Course>> {
  const response = await api.get<PaginatedResponse<Course>>('/courses', { params });
  return response;
}

/**
 * Get course by ID
 */
export async function getCourseById(courseId: string): Promise<Course> {
  const response = await api.get<ApiResponse<Course>>(`/courses/${courseId}`);
  return response.data;
}

/**
 * Create a new course (instructor/admin only)
 */
export async function createCourse(data: Partial<Course>): Promise<Course> {
  const response = await api.post<ApiResponse<Course>>('/courses', data);
  return response.data;
}

/**
 * Update course (instructor/admin only)
 */
export async function updateCourse(courseId: string, data: Partial<Course>): Promise<Course> {
  const response = await api.put<ApiResponse<Course>>(`/courses/${courseId}`, data);
  return response.data;
}

/**
 * Delete course (instructor/admin only)
 */
export async function deleteCourse(courseId: string): Promise<void> {
  await api.delete(`/courses/${courseId}`);
}

/**
 * Enroll in a course
 */
export async function enrollCourse(courseId: string): Promise<Enrollment> {
  const response = await api.post<ApiResponse<Enrollment>>(`/courses/${courseId}/enroll`);
  return response.data;
}

/**
 * Unenroll from a course
 */
export async function unenrollCourse(courseId: string): Promise<void> {
  await api.delete(`/courses/${courseId}/enroll`);
}

/**
 * Get user's enrolled courses with individual progress
 * Returns enrollments with nested course data and user-specific progress
 */
export async function getEnrolledCourses(): Promise<EnrollmentWithCourse[]> {
  const response = await api.get<ApiResponse<EnrollmentWithCourse[]>>('/courses/enrolled');
  return response.data;
}

/**
 * Get course modules
 */
export async function getCourseModules(courseId: string): Promise<Module[]> {
  const response = await api.get<ApiResponse<Module[]>>(`/courses/${courseId}/modules`);
  return response.data;
}

/**
 * Get module lessons
 */
export async function getModuleLessons(moduleId: string): Promise<Lesson[]> {
  const response = await api.get<ApiResponse<Lesson[]>>(`/modules/${moduleId}/lessons`);
  return response.data;
}

/**
 * Get lesson by ID
 */
export async function getLessonById(lessonId: string): Promise<Lesson> {
  const response = await api.get<ApiResponse<Lesson>>(`/lessons/${lessonId}`);
  return response.data;
}

/**
 * Mark lesson as completed
 */
export async function completLesson(lessonId: string): Promise<void> {
  await api.post(`/lessons/${lessonId}/complete`);
}

/**
 * Get quiz by lesson ID
 */
export async function getQuizByLessonId(lessonId: string): Promise<Quiz> {
  const response = await api.get<ApiResponse<Quiz>>(`/lessons/${lessonId}/quiz`);
  return response.data;
}

/**
 * Submit quiz attempt
 */
export async function submitQuizAttempt(quizId: string, answers: any[]): Promise<QuizAttempt> {
  const response = await api.post<ApiResponse<QuizAttempt>>(`/quizzes/${quizId}/attempt`, { answers });
  return response.data;
}

/**
 * Get quiz attempts
 */
export async function getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  const response = await api.get<ApiResponse<QuizAttempt[]>>(`/quizzes/${quizId}/attempts`);
  return response.data;
}

/**
 * Get lab by lesson ID
 */
export async function getLabByLessonId(lessonId: string): Promise<Lab> {
  const response = await api.get<ApiResponse<Lab>>(`/lessons/${lessonId}/lab`);
  return response.data;
}

/**
 * Get course progress
 */
export async function getCourseProgress(courseId: string): Promise<CourseProgress> {
  const response = await api.get<ApiResponse<CourseProgress>>(`/courses/${courseId}/progress`);
  return response.data;
}

/**
 * Update course progress
 */
export async function updateCourseProgress(
  courseId: string,
  data: Partial<CourseProgress>
): Promise<CourseProgress> {
  const response = await api.put<ApiResponse<CourseProgress>>(`/courses/${courseId}/progress`, data);
  return response.data;
}

/**
 * Get certificate
 */
export async function getCertificate(courseId: string): Promise<Certificate> {
  const response = await api.get<ApiResponse<Certificate>>(`/courses/${courseId}/certificate`);
  return response.data;
}

/**
 * Search courses
 */
export async function searchCourses(query: string, params?: QueryParams): Promise<PaginatedResponse<Course>> {
  const response = await api.get<PaginatedResponse<Course>>('/courses/search', {
    params: { ...params, query },
  });
  return response;
}

const courseService = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  unenrollCourse,
  getEnrolledCourses,
  getCourseModules,
  getModuleLessons,
  getLessonById,
  completLesson,
  getQuizByLessonId,
  submitQuizAttempt,
  getQuizAttempts,
  getLabByLessonId,
  getCourseProgress,
  updateCourseProgress,
  getCertificate,
  searchCourses,
};

export default courseService;
