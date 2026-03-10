/**
 * Course Management Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as courseManagementController from '../controllers/courseManagement.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List courses (ADMIN and INSTRUCTOR)
router.get('/', authorize(['ADMIN', 'INSTRUCTOR']), courseManagementController.listCourses);

// Create course (ADMIN and INSTRUCTOR)
router.post('/', authorize(['ADMIN', 'INSTRUCTOR']), courseManagementController.createCourse);

// Get course details (ADMIN and INSTRUCTOR)
router.get('/:id', authorize(['ADMIN', 'INSTRUCTOR']), courseManagementController.getCourse);

// Update course (ADMIN and course author)
router.put('/:id', authorize(['ADMIN', 'INSTRUCTOR']), courseManagementController.updateCourse);

// Delete course (ADMIN and course author)
router.delete('/:id', authorize(['ADMIN', 'INSTRUCTOR']), courseManagementController.deleteCourse);

// Duplicate course (ADMIN and INSTRUCTOR)
router.post('/:id/duplicate', authorize(['ADMIN', 'INSTRUCTOR']), courseManagementController.duplicateCourse);

// Export course to ZIP (ADMIN and INSTRUCTOR)
router.get('/:id/export', authorize(['ADMIN', 'INSTRUCTOR']), courseManagementController.exportCourse);

// Publish course (ADMIN and course author)
router.post('/:id/publish', authorize(['ADMIN', 'INSTRUCTOR']), courseManagementController.publishCourse);

// Unpublish course (ADMIN and course author)
router.post('/:id/unpublish', authorize(['ADMIN', 'INSTRUCTOR']), courseManagementController.unpublishCourse);

// Get course statistics (ADMIN and INSTRUCTOR)
router.get('/:id/stats', authorize(['ADMIN', 'INSTRUCTOR']), courseManagementController.getCourseStats);

export default router;