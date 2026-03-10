/**
 * Analytics Hook
 * HU-038: Fetch and manage analytics data
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import analyticsService from '../services/api/analytics.service';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number | string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  period: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  metric?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
  courseId?: string;
  userId?: string;
}

export function useAnalytics(filter?: AnalyticsFilter) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['all']);

  // Fetch overview metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['analytics', 'metrics', filter],
    queryFn: () => analyticsService.getMetrics(filter),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch user growth data
  const { data: userGrowth, isLoading: userGrowthLoading } = useQuery({
    queryKey: ['analytics', 'userGrowth', filter],
    queryFn: () => analyticsService.getUserGrowth(filter),
    staleTime: 5 * 60 * 1000
  });

  // Fetch course statistics
  const { data: courseStats, isLoading: courseStatsLoading } = useQuery({
    queryKey: ['analytics', 'courseStats', filter],
    queryFn: () => analyticsService.getCourseStats(filter),
    staleTime: 5 * 60 * 1000
  });

  // Fetch engagement data
  const { data: engagement, isLoading: engagementLoading } = useQuery({
    queryKey: ['analytics', 'engagement', filter],
    queryFn: () => analyticsService.getEngagement(filter),
    staleTime: 5 * 60 * 1000
  });

  // Export analytics data
  const exportMutation = useMutation({
    mutationFn: ({ format, data }: { format: string; data: any }) =>
      analyticsService.exportData(format, data),
    onSuccess: (blob, { format }) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  });

  const isLoading = metricsLoading || userGrowthLoading || courseStatsLoading || engagementLoading;

  return {
    metrics,
    userGrowth,
    courseStats,
    engagement,
    isLoading,
    selectedMetrics,
    setSelectedMetrics,
    exportData: exportMutation.mutate,
    isExporting: exportMutation.isPending
  };
}

export default useAnalytics;