import { Request, Response, NextFunction } from 'express';
import exportService from '../services/export.service';
import { logger } from '../middleware/logger';

export class ExportController {
  /**
   * Export user progress data
   */
  async exportUserProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId || (req as any).user?.id;
      const format = (req.query.format as string) || 'pdf';

      if (!['csv', 'pdf', 'json'].includes(format)) {
        return res.status(400).json({ error: 'Invalid format. Use csv, pdf, or json' });
      }

      const data = await exportService.exportUserProgress(userId, format as any);

      // Set appropriate headers based on format
      const filename = `progress_${userId}_${Date.now()}`;
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      } else if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      }

      res.send(data);
    } catch (error) {
      logger.error('Error exporting user progress:', error);
      next(error);
    }
  }

  /**
   * Export course analytics
   */
  async exportCourseAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.params;
      const format = (req.query.format as string) || 'csv';

      if (!['csv', 'json'].includes(format)) {
        return res.status(400).json({ error: 'Invalid format. Use csv or json' });
      }

      const data = await exportService.exportCourseAnalytics(courseId, format as any);

      // Set appropriate headers
      const filename = `course_${courseId}_${Date.now()}`;
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      }

      res.send(data);
    } catch (error) {
      logger.error('Error exporting course analytics:', error);
      next(error);
    }
  }
}

export default new ExportController();