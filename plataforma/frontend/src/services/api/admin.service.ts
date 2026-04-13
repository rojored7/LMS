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
  const response = await api.get(`/admin/users/${userId}/enrollments`);
  return (response as any).data || response;
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
  return (response as any).data || response;
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
  const response = await api.get('/admin/enrollments', {
    params: { page, limit },
  });
  return (response as any).data || response;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get('/admin/dashboard');
  const raw = (response as any).data || response;

  // Backend retorna flat: {totalUsers, totalStudents, ...}
  // Frontend espera nested: {users: {total, byRole}, courses: {...}, ...}
  if (raw.totalUsers !== undefined) {
    return {
      users: {
        total: raw.totalUsers ?? 0,
        byRole: {
          ADMIN: (raw.totalUsers ?? 0) - (raw.totalStudents ?? 0) - (raw.totalInstructors ?? 0),
          INSTRUCTOR: raw.totalInstructors ?? 0,
          STUDENT: raw.totalStudents ?? 0,
        },
      },
      courses: {
        total: raw.totalCourses ?? 0,
        published: raw.publishedCourses ?? 0,
      },
      enrollments: {
        total: raw.totalEnrollments ?? 0,
        active: (raw.totalEnrollments ?? 0) - (raw.totalCertificates ?? 0),
        completed: raw.totalCertificates ?? 0,
      },
      systemHealth: {
        averageProgress: raw.averageProgress ?? 0,
        activeUsers: raw.totalStudents ?? 0,
      },
    };
  }

  return raw;
}

/**
 * Get detailed progress of a user in a specific course
 */
export async function getUserCourseProgress(
  userId: string,
  courseId: string
): Promise<UserCourseProgress> {
  const response = await api.get(`/admin/users/${userId}/courses/${courseId}/progress`);
  return (response as any).data || response;
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
