/**
 * Analytics Service
 * HU-038: API calls for analytics data
 */

import api from '../api';
import { AnalyticsFilter } from '../../hooks/useAnalytics';

class AnalyticsService {
  private baseUrl = '/analytics';

  /**
   * Get overview metrics
   */
  async getMetrics(filter?: AnalyticsFilter) {
    const response = await api.get(`${this.baseUrl}/metrics`, { params: filter });
    return response.data;
  }

  /**
   * Get user growth data
   */
  async getUserGrowth(filter?: AnalyticsFilter) {
    const response = await api.get(`${this.baseUrl}/user-growth`, { params: filter });
    return response.data;
  }

  /**
   * Get course statistics
   */
  async getCourseStats(filter?: AnalyticsFilter) {
    const response = await api.get(`${this.baseUrl}/course-stats`, { params: filter });
    return response.data;
  }

  /**
   * Get engagement data
   */
  async getEngagement(filter?: AnalyticsFilter) {
    const response = await api.get(`${this.baseUrl}/engagement`, { params: filter });
    return response.data;
  }

  /**
   * Get completion rates
   */
  async getCompletionRates(filter?: AnalyticsFilter) {
    const response = await api.get(`${this.baseUrl}/completion-rates`, { params: filter });
    return response.data;
  }

  /**
   * Get skill distribution
   */
  async getSkillDistribution(filter?: AnalyticsFilter) {
    const response = await api.get(`${this.baseUrl}/skills`, { params: filter });
    return response.data;
  }

  /**
   * Get device usage statistics
   */
  async getDeviceUsage(filter?: AnalyticsFilter) {
    const response = await api.get(`${this.baseUrl}/device-usage`, { params: filter });
    return response.data;
  }

  /**
   * Get real-time activity
   */
  async getRealTimeActivity(limit = 10) {
    const response = await api.get(`${this.baseUrl}/activity`, { params: { limit } });
    return response.data;
  }

  /**
   * Export analytics data
   */
  async exportData(format: string, data: any) {
    const response = await api.post(
      `${this.baseUrl}/export`,
      { data },
      {
        params: { format },
        responseType: 'blob'
      }
    );
    return response.data;
  }

  /**
   * Get custom report
   */
  async getCustomReport(config: {
    metrics: string[];
    dimensions: string[];
    filters: AnalyticsFilter;
  }) {
    const response = await api.post(`${this.baseUrl}/custom-report`, config);
    return response.data;
  }

  /**
   * Get learning path analytics
   */
  async getLearningPathAnalytics(pathId: string, filter?: AnalyticsFilter) {
    const response = await api.get(`${this.baseUrl}/learning-paths/${pathId}`, {
      params: filter
    });
    return response.data;
  }

  /**
   * Get instructor analytics
   */
  async getInstructorAnalytics(instructorId: string, filter?: AnalyticsFilter) {
    const response = await api.get(`${this.baseUrl}/instructors/${instructorId}`, {
      params: filter
    });
    return response.data;
  }

  /**
   * Get quiz performance analytics
   */
  async getQuizPerformance(filter?: AnalyticsFilter) {
    const response = await api.get(`${this.baseUrl}/quiz-performance`, { params: filter });
    return response.data;
  }

  /**
   * Get revenue analytics (for paid courses)
   */
  async getRevenueAnalytics(filter?: AnalyticsFilter) {
    const response = await api.get(`${this.baseUrl}/revenue`, { params: filter });
    return response.data;
  }
}

export default new AnalyticsService();