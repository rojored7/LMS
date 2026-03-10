/**
 * Lesson Routes
 */

import { Router } from 'express';
import * as lessonController from '../controllers/lesson.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * GET /api/lessons/:lessonId
 * Get a single lesson by ID with full content
 * Requires authentication
 */
router.get('/:lessonId', authenticate, lessonController.getLesson);

/**
 * POST /api/lessons/:lessonId/complete
 * Mark a lesson as complete
 * Requires authentication
 */
router.post(
  '/:lessonId/complete',
  authenticate,
  lessonController.completeLesson
);

/**
 * GET /api/lessons/:lessonId/progress
 * Get lesson progress for current user
 * Requires authentication
 */
router.get(
  '/:lessonId/progress',
  authenticate,
  lessonController.getLessonProgress
);

export default router;
