import { Router } from 'express';
import * as courseController from '../controllers/course.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * Public routes (no authentication required)
 */

// Get all published courses
router.get('/', courseController.getCourses);

// Get single course by ID or slug
router.get('/:idOrSlug', courseController.getCourse);

// Get course statistics
router.get('/:courseId/stats', courseController.getCourseStats);

/**
 * Protected routes (authentication required)
 */

// Get current user's enrollments
router.get('/my-enrollments', authenticate, courseController.getMyEnrollments);

// Enroll in a course
router.post('/:courseId/enroll', authenticate, courseController.enrollInCourse);

export default router;
