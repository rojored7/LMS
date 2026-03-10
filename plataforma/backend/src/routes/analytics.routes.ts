import { Router } from 'express';
import analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// All analytics routes require authentication and instructor/admin role
router.use(authenticate);
router.use(authorize(['ADMIN', 'INSTRUCTOR']));

/**
 * @route GET /api/analytics/course/:courseId/overview
 * @desc Get course overview analytics
 * @access Admin, Instructor
 */
router.get('/course/:courseId/overview', analyticsController.getCourseOverview);

/**
 * @route GET /api/analytics/course/:courseId/quiz-performance
 * @desc Get quiz performance analytics
 * @access Admin, Instructor
 */
router.get('/course/:courseId/quiz-performance', analyticsController.getQuizPerformance);

/**
 * @route GET /api/analytics/course/:courseId/engagement
 * @desc Get engagement metrics
 * @access Admin, Instructor
 */
router.get('/course/:courseId/engagement', analyticsController.getEngagementMetrics);

/**
 * @route GET /api/analytics/course/:courseId/lab-success
 * @desc Get lab success statistics
 * @access Admin, Instructor
 */
router.get('/course/:courseId/lab-success', analyticsController.getLabSuccess);

/**
 * @route GET /api/analytics/course/:courseId/time-to-complete
 * @desc Get time to complete statistics
 * @access Admin, Instructor
 */
router.get('/course/:courseId/time-to-complete', analyticsController.getTimeToComplete);

export default router;