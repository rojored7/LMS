import { Router } from 'express';
import * as courseController from '../controllers/course.controller';
import * as moduleController from '../controllers/module.controller';
import { progressController } from '../controllers/progress.controller';
import { authenticate } from '../middleware/authenticate';
import { optionalAuth } from '../middleware/optionalAuth';

const router = Router();

/**
 * Protected routes (authentication required)
 * IMPORTANT: These must come BEFORE the generic /:idOrSlug route
 */

// Get current user's enrollments (alternative route)
router.get('/enrolled', authenticate, courseController.getMyEnrollments);

// Get current user's enrollments
router.get('/my-enrollments', authenticate, courseController.getMyEnrollments);

/**
 * Course content routes (authentication required)
 */

// Get course modules with progress
router.get('/:courseId/modules', authenticate, moduleController.getCourseModules);

// Get detailed course progress for current user
// router.get('/:courseId/progress', authenticate, progressController.getCourseProgress); // TODO: Implement getCourseProgress method

/**
 * Public routes (no authentication required)
 */

// Get all published courses
router.get('/', courseController.getCourses);

// Get single course by ID or slug (optionalAuth to check enrollment status)
router.get('/:idOrSlug', optionalAuth, courseController.getCourse);

// Get course statistics
router.get('/:courseId/stats', courseController.getCourseStats);

// Enroll in a course (requires authentication via optionalAuth middleware)
router.post('/:courseId/enroll', optionalAuth, courseController.enrollInCourse);

export default router;
