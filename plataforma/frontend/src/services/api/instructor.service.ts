import api from '../api';
import { unwrapResponse } from './unwrap';

export interface InstructorDashboardStats {
  totalCourses: number;
  totalStudents: number;
  avgProgress: number;
  pendingSubmissions: number;
}

export interface InstructorCourse {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  enrollmentCount: number;
  avgProgress: number;
  createdAt: string | null;
}

export interface CourseStudent {
  userId: string;
  name: string;
  email: string;
  enrolledAt: string | null;
  progress: number;
  lastLoginAt: string | null;
}

async function getInstructorDashboard(): Promise<InstructorDashboardStats> {
  const response = await api.get('/instructor/dashboard');
  return unwrapResponse(response);
}

async function getInstructorCourses(): Promise<InstructorCourse[]> {
  const response = await api.get('/instructor/courses');
  return unwrapResponse(response);
}

async function getCourseStudents(courseId: string): Promise<CourseStudent[]> {
  const response = await api.get(`/instructor/courses/${courseId}/students`);
  return unwrapResponse(response);
}

export interface GradebookEntry {
  userId: string;
  name: string;
  email: string;
  progress: number;
  quizAvgScore: number | null;
  modulesCompleted: number;
  completedAt: string | null;
}

export interface InstructorAnalytics {
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  courseStats: Array<{
    courseId: string;
    title: string;
    enrollments: number;
    avgProgress: number;
  }>;
}

async function getGradebook(courseId: string): Promise<GradebookEntry[]> {
  const response = await api.get(`/instructor/courses/${courseId}/gradebook`);
  return unwrapResponse(response);
}

async function getInstructorAnalytics(): Promise<InstructorAnalytics> {
  const response = await api.get('/instructor/analytics');
  return unwrapResponse(response);
}

export default {
  getInstructorDashboard,
  getInstructorCourses,
  getCourseStudents,
  getGradebook,
  getInstructorAnalytics,
};
