import { Router } from 'express';
import exportController from '../controllers/export.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// All export routes require authentication
router.use(authenticate);

/**
 * @route GET /api/export/user/:userId/progress
 * @desc Export user progress data
 * @access Authenticated user (own data) or Admin
 * @query format=csv|pdf|json (default: pdf)
 */
router.get('/user/:userId/progress', exportController.exportUserProgress);

/**
 * @route GET /api/export/my-progress
 * @desc Export current user's progress data
 * @access Authenticated user
 * @query format=csv|pdf|json (default: pdf)
 */
router.get('/my-progress', exportController.exportUserProgress);

/**
 * @route GET /api/export/course/:courseId/analytics
 * @desc Export course analytics
 * @access Admin, Instructor
 * @query format=csv|json (default: csv)
 */
router.get(
  '/course/:courseId/analytics',
  authorize(['ADMIN', 'INSTRUCTOR']),
  exportController.exportCourseAnalytics
);

export default router;