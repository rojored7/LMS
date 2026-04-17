import api from '../api';
import { unwrapResponse } from './unwrap';

export interface PlatformStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalCertificates: number;
  totalBadgesAwarded: number;
  averageProgress: number;
  completionRate: number;
  completedEnrollments: number;
}

export interface EnrollmentTrend {
  date: string;
  count: number;
}

export interface CourseStat {
  courseId: string;
  courseTitle: string;
  score: number;
  enrollmentCount: number;
  averageProgress: number;
  completedCount: number;
  completionRate: number;
}

export interface UserDistribution {
  role: string;
  count: number;
}

export interface ComparativePeriod {
  current: number;
  previous: number;
  changePercent: number;
}

export interface ComparativeStats {
  users: ComparativePeriod;
  enrollments: ComparativePeriod;
  completions: ComparativePeriod;
  activeStudents: ComparativePeriod;
}

export interface RecentActivity {
  type: string;
  userName: string;
  userEmail: string;
  courseTitle: string;
  timestamp: string;
}

async function getPlatformStats(): Promise<PlatformStats> {
  const response = await api.get('/analytics/stats');
  return unwrapResponse(response);
}

async function getEnrollmentTrends(days: number = 30): Promise<EnrollmentTrend[]> {
  const response = await api.get(`/analytics/enrollment-trends?days=${days}`);
  return unwrapResponse(response);
}

async function getCourseStats(): Promise<CourseStat[]> {
  const response = await api.get('/analytics/courses');
  return unwrapResponse(response);
}

async function getUserDistribution(): Promise<UserDistribution[]> {
  const response = await api.get('/analytics/user-distribution');
  return unwrapResponse(response);
}

async function getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
  const response = await api.get(`/analytics/recent-activity?limit=${limit}`);
  return unwrapResponse(response);
}

async function getComparativeStats(): Promise<ComparativeStats> {
  const response = await api.get('/analytics/comparative-stats');
  return unwrapResponse(response);
}

export default {
  getPlatformStats,
  getEnrollmentTrends,
  getCourseStats,
  getUserDistribution,
  getRecentActivity,
  getComparativeStats,
};
