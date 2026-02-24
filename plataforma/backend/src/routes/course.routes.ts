import { Router } from 'express';
import * as courseController from '../controllers/course.controller';
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
 * Public routes (no authentication required)
 */

// Get all published courses
router.get('/', courseController.getCourses);

// Get single course by ID or slug
router.get('/:idOrSlug', courseController.getCourse);

// Get course statistics
router.get('/:courseId/stats', courseController.getCourseStats);

// Enroll in a course (requires authentication via optionalAuth middleware)
router.post('/:courseId/enroll', optionalAuth, courseController.enrollInCourse);

export default router;
