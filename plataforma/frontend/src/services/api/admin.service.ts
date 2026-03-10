/**
 * Admin Service
 * Handles admin operations for enrollment management, user progress, and system statistics
 */

import api from '../api';
import type { ApiResponse } from '../../types';

/**
 * Enrollment with progress and full course/user info
 */
export interface EnrollmentWithProgress {
  id: string;
  enrolledAt: string;
  completedAt: string | null;
  progress: number;
  course: {
    id: string;
    slug: string;
    title: string;
    thumbnail: string | null;
    level: string;
    duration: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * User with enrollments and progress
 */
export interface UserWithEnrollments {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  createdAt: string;
  enrollments: Array<{
    id: string;
    enrolledAt: string;
    completedAt: string | null;
    progress: number;
    course: {
      id: string;
      slug: string;
      title: string;
      thumbnail: string | null;
      level: string;
      duration: number;
    };
  }>;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  users: {
    total: number;
    byRole: {
      ADMIN: number;
      INSTRUCTOR: number;
      STUDENT: number;
    };
  };
  courses: {
    total: number;
    published: number;
  };
  enrollments: {
    total: number;
    active: number;
    completed: number;
  };
  systemHealth: {
    averageProgress: number;
    activeUsers: number;
  };
}

/**
 * Detailed course progress
 */
export interface UserCourseProgress {
  enrollment: {
    id: string;
    enrolledAt: string;
    completedAt: string | null;
  };
  user: {
    name: string;
    email: string;
  };
  course: {
    title: string;
  };
  progress: {
    overallProgress: number;
    modules: Array<{
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
    }>;
  };
}

/**
 * Pagination response
 */
interface PaginatedResponse<T> {
  enrollments: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Get user with enrollments and progress
 */
export async function getUserEnrollments(userId: string): Promise<UserWithEnrollments> {
  const response = await api.get<ApiResponse<UserWithEnrollments>>(
    `/admin/users/${userId}/enrollments`
  );
  return response.data;
}

/**
 * Assign course to user (as admin)
 */
export async function assignCourseToUser(
  userId: string,
  courseId: string
): Promise<EnrollmentWithProgress> {
  const response = await api.post<ApiResponse<{ enrollment: EnrollmentWithProgress }>>(
    '/admin/enrollments',
    { userId, courseId }
  );
  return response.data.enrollment;
}

/**
 * Remove enrollment (remove course from user)
 */
export async function removeEnrollment(enrollmentId: string): Promise<void> {
  await api.delete(`/admin/enrollments/${enrollmentId}`);
}

/**
 * Get all enrollments with pagination
 */
export async function getAllEnrollments(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<EnrollmentWithProgress>> {
  const response = await api.get<ApiResponse<PaginatedResponse<EnrollmentWithProgress>>>(
    '/admin/enrollments',
    {
      params: { page, limit },
    }
  );
  return response.data;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<ApiResponse<DashboardStats>>('/admin/stats');
  return response.data;
}

/**
 * Get detailed progress of a user in a specific course
 */
export async function getUserCourseProgress(
  userId: string,
  courseId: string
): Promise<UserCourseProgress> {
  const response = await api.get<ApiResponse<UserCourseProgress>>(
    `/admin/users/${userId}/courses/${courseId}/progress`
  );
  return response.data;
}

const adminService = {
  getUserEnrollments,
  assignCourseToUser,
  removeEnrollment,
  getAllEnrollments,
  getDashboardStats,
  getUserCourseProgress,
};

export default adminService;
