import { Request, Response, NextFunction } from 'express';
import analyticsService from '../services/analytics.service';
import { logger } from '../middleware/logger';

export class AnalyticsController {
  /**
   * Get course overview analytics
   */
  async getCourseOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.params;
      const analytics = await analyticsService.getCourseOverview(courseId);
      res.json(analytics);
    } catch (error) {
      logger.error('Error fetching course overview:', error);
      next(error);
    }
  }

  /**
   * Get quiz performance analytics
   */
  async getQuizPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.params;
      const performance = await analyticsService.getQuizPerformance(courseId);
      res.json(performance);
    } catch (error) {
      logger.error('Error fetching quiz performance:', error);
      next(error);
    }
  }

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.params;
      const metrics = await analyticsService.getEngagementMetrics(courseId);
      res.json(metrics);
    } catch (error) {
      logger.error('Error fetching engagement metrics:', error);
      next(error);
    }
  }

  /**
   * Get lab success statistics
   */
  async getLabSuccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.params;
      const labStats = await analyticsService.getLabSuccess(courseId);
      res.json(labStats);
    } catch (error) {
      logger.error('Error fetching lab success stats:', error);
      next(error);
    }
  }

  /**
   * Get time to complete statistics
   */
  async getTimeToComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.params;
      const timeStats = await analyticsService.getTimeToComplete(courseId);
      res.json(timeStats);
    } catch (error) {
      logger.error('Error fetching time to complete stats:', error);
      next(error);
    }
  }
}

export default new AnalyticsController();