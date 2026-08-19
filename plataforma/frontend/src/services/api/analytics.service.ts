/**
 * Analytics Service
 * Mapea exactamente los endpoints reales del backend /api/analytics/*
 */

import api from '../api';

export interface AnalyticsStats {
  total_users: number;
  total_courses: number;
  total_enrollments: number;
  active_enrollments: number;
  completion_rate: number;
  avg_progress: number;
}

export interface EnrollmentTrendPoint {
  date: string;
  count: number;
}

export interface CourseStatItem {
  id: string;
  title: string;
  slug: string;
  enrollments: number;
  completions: number;
  avg_progress: number;
  completion_rate: number;
}

export interface UserActivityPoint {
  date: string;
  active_users: number;
  new_users: number;
}

export interface UserDistributionItem {
  role: string;
  count: number;
}

export interface RecentActivityItem {
  user_id: string;
  user_name: string;
  course_id: string;
  course_title: string;
  action: string;
  created_at: string;
}

export interface ComparativeStats {
  current_period: {
    enrollments: number;
    completions: number;
    new_users: number;
  };
  previous_period: {
    enrollments: number;
    completions: number;
    new_users: number;
  };
  changes: {
    enrollments_pct: number;
    completions_pct: number;
    new_users_pct: number;
  };
}

export interface UserTimeCourseBreakdown {
  courseId: string;
  courseTitle: string;
  timeSeconds: number;
  lessonsCompleted: number;
  avgTimePerLessonSeconds: number;
}

export interface UserTimeSummary {
  userId: string;
  userName: string;
  userEmail: string;
  totalTimeSeconds: number;
  courseBreakdown: UserTimeCourseBreakdown[];
}

export interface LessonTimeStat {
  lessonId: string;
  lessonTitle: string;
  estimatedTimeSeconds: number;
  avgRealTimeSeconds: number;
  completions: number;
  ratio: number;
  classification: 'skimming' | 'on_track' | 'deep_read';
}

export interface UserCourseLessonTime {
  lessonId: string;
  lessonTitle: string;
  estimatedTimeSeconds: number;
  realTimeSeconds: number;
  ratio: number;
  classification: 'skimming' | 'on_track' | 'deep_read';
  completedAt: string | null;
}

class AnalyticsService {
  async getStats(areaId?: string): Promise<AnalyticsStats> {
    const envelope = await api.get('/analytics/stats', {
      params: areaId ? { area_id: areaId } : undefined,
    });
    return (envelope as any).data;
  }

  async getEnrollmentTrends(days = 30, areaId?: string): Promise<EnrollmentTrendPoint[]> {
    const envelope = await api.get('/analytics/enrollment-trends', {
      params: { days, ...(areaId ? { area_id: areaId } : {}) },
    });
    return (envelope as any).data;
  }

  async getCourseStats(areaId?: string): Promise<CourseStatItem[]> {
    const envelope = await api.get('/analytics/courses', {
      params: areaId ? { area_id: areaId } : undefined,
    });
    return (envelope as any).data;
  }

  async getUserActivity(days = 30, areaId?: string): Promise<UserActivityPoint[]> {
    const envelope = await api.get('/analytics/user-activity', {
      params: { days, ...(areaId ? { area_id: areaId } : {}) },
    });
    return (envelope as any).data;
  }

  async getUserDistribution(areaId?: string): Promise<UserDistributionItem[]> {
    const envelope = await api.get('/analytics/user-distribution', {
      params: areaId ? { area_id: areaId } : undefined,
    });
    return (envelope as any).data;
  }

  async getRecentActivity(limit = 20, areaId?: string): Promise<RecentActivityItem[]> {
    const envelope = await api.get('/analytics/recent-activity', {
      params: { limit, ...(areaId ? { area_id: areaId } : {}) },
    });
    return (envelope as any).data;
  }

  async getComparativeStats(days = 30, areaId?: string): Promise<ComparativeStats> {
    const envelope = await api.get('/analytics/comparative-stats', {
      params: { days, ...(areaId ? { area_id: areaId } : {}) },
    });
    return (envelope as any).data;
  }

  async getUsersTimeSummary(params?: {
    courseId?: string;
    areaId?: string;
    limit?: number;
    offset?: number;
  }): Promise<UserTimeSummary[]> {
    const { courseId, areaId, ...rest } = params ?? {};
    const envelope = await api.get('/analytics/time-tracking/users', {
      params: {
        ...rest,
        ...(courseId ? { course_id: courseId } : {}),
        ...(areaId ? { area_id: areaId } : {}),
      },
    });
    return (envelope as any).data;
  }

  async getCourseTimeStat(courseId: string): Promise<LessonTimeStat[]> {
    const envelope = await api.get(`/analytics/time-tracking/courses/${courseId}`);
    return (envelope as any).data;
  }

  async getUserCourseLessonTimes(
    userId: string,
    courseId: string
  ): Promise<UserCourseLessonTime[]> {
    const envelope = await api.get(`/analytics/time-tracking/users/${userId}/courses/${courseId}`);
    return (envelope as any).data;
  }
}

export default new AnalyticsService();
