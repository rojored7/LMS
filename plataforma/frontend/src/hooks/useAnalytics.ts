/**
 * Analytics Hook
 * Consume los endpoints reales del backend via analyticsService
 */

import { useQuery } from '@tanstack/react-query';
import analyticsService from '../services/api/analytics.service';


export function useAnalytics(days = 30) {
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['analytics', 'stats'],
    queryFn: () => analyticsService.getStats(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: enrollmentTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics', 'enrollment-trends', days],
    queryFn: () => analyticsService.getEnrollmentTrends(days),
    staleTime: 5 * 60 * 1000,
  });

  const { data: courseStats, isLoading: courseStatsLoading } = useQuery({
    queryKey: ['analytics', 'courses'],
    queryFn: () => analyticsService.getCourseStats(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: userActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['analytics', 'user-activity', days],
    queryFn: () => analyticsService.getUserActivity(days),
    staleTime: 5 * 60 * 1000,
  });

  const { data: userDistribution, isLoading: distributionLoading } = useQuery({
    queryKey: ['analytics', 'user-distribution'],
    queryFn: () => analyticsService.getUserDistribution(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentActivity, isLoading: recentLoading } = useQuery({
    queryKey: ['analytics', 'recent-activity'],
    queryFn: () => analyticsService.getRecentActivity(20),
    staleTime: 2 * 60 * 1000,
  });

  const { data: comparativeStats, isLoading: comparativeLoading } = useQuery({
    queryKey: ['analytics', 'comparative-stats', days],
    queryFn: () => analyticsService.getComparativeStats(days),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading =
    statsLoading ||
    trendsLoading ||
    courseStatsLoading ||
    activityLoading ||
    distributionLoading ||
    recentLoading ||
    comparativeLoading;

  return {
    stats,
    enrollmentTrends,
    courseStats,
    userActivity,
    userDistribution,
    recentActivity,
    comparativeStats,
    isLoading,
    refetch: refetchStats,
  };
}

export function useTimeTracking(params?: { courseId?: string; limit?: number }) {
  const { data: usersTime, isLoading, refetch } = useQuery({
    queryKey: ['analytics', 'time-tracking', 'users', params],
    queryFn: () => analyticsService.getUsersTimeSummary(params),
    staleTime: 2 * 60 * 1000,
  });
  return { usersTime: usersTime ?? [], isLoading, refetch };
}

export function useLessonTimeStats(courseId: string | undefined) {
  return useQuery({
    queryKey: ['analytics', 'time-tracking', 'course', courseId],
    queryFn: () => analyticsService.getCourseTimeStat(courseId!),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUserCourseLessonTimes(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['analytics', 'time-tracking', 'user-course', userId, courseId],
    queryFn: () => analyticsService.getUserCourseLessonTimes(userId!, courseId!),
    enabled: !!userId && !!courseId,
    staleTime: 2 * 60 * 1000,
  });
}

export default useAnalytics;
