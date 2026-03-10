/**
 * Module Routes
 */

import { Router } from 'express';
import * as moduleController from '../controllers/module.controller';
import * as lessonController from '../controllers/lesson.controller';
import { progressController } from '../controllers/progress.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * GET /api/modules/:moduleId/lessons
 * Get all lessons for a module
 * Requires authentication
 */
router.get(
  '/:moduleId/lessons',
  authenticate,
  lessonController.getModuleLessons
);

/**
 * GET /api/modules/:moduleId/progress
 * Get module progress for current user
 * Requires authentication
 */
router.get('/:moduleId/progress', authenticate, (req, res, next) => {
  progressController.getModuleProgress(req, res).catch(next);
});

/**
 * GET /api/modules/:moduleId
 * Get a single module by ID
 * Requires authentication
 */
router.get('/:moduleId', authenticate, moduleController.getModule);

export default router;
