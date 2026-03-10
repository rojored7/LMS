/**
 * Course Management Controller
 * Handles HTTP requests for course CRUD operations
 */

import { Request, Response, NextFunction } from 'express';
import courseManagementService from '../services/courseManagement.service';
import courseExportService from '../services/courseExport.service';
import auditLogService from '../services/auditLog.service';
import logger from '../utils/logger';
import { UserRole } from '@prisma/client';

/**
 * List courses with filters and pagination
 * GET /api/admin/courses
 */
export const listCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const filters = {
      search: req.query.search as string,
      level: req.query.level as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      isPublished: req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : undefined,
      author: req.query.author as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: req.query.sortBy as any || 'createdAt',
      sortOrder: req.query.sortOrder as any || 'desc',
    };

    logger.info(`User ${userId} listing courses with filters:`, filters);

    const result = await courseManagementService.getCoursesForInstructor(userId, filters);

    logger.info('Successfully got courses, sending response...');
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('CATCH BLOCK EXECUTING - Error:', error);
    logger.error('Error listing courses:', error || 'Unknown error');
    next(error || new Error('Unknown error in listCourses'));
  }
};

/**
 * Create a new course
 * POST /api/admin/courses
 */
export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const courseData = req.body;

    logger.info(`User ${userId} creating new course:`, courseData.title);

    const course = await courseManagementService.createCourse(courseData, userId);

    // Log the action
    await auditLogService.logAction({
      userId,
      action: 'COURSE_CREATED',
      entityType: 'Course',
      entityId: course.id,
      metadata: {
        courseTitle: course.title,
        courseSlug: course.slug,
        ipAddress: req.ip,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course },
    });
  } catch (error: any) {
    logger.error('Error creating course:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    next(error);
  }
};

/**
 * Get course with full content
 * GET /api/admin/courses/:id
 */
export const getCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id;
    const userId = req.user!.id;

    logger.info(`User ${userId} fetching course ${courseId}`);

    const course = await courseManagementService.getCourseWithFullContent(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { course },
    });
  } catch (error) {
    logger.error('Error getting course:', error);
    next(error);
  }
};

/**
 * Update course metadata
 * PUT /api/admin/courses/:id
 */
export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id;
    const userId = req.user!.id;
    const updateData = req.body;

    logger.info(`User ${userId} updating course ${courseId}`);

    // Get original course for audit log
    const originalCourse = await courseManagementService.getCourseWithFullContent(courseId);

    const course = await courseManagementService.updateCourse(courseId, updateData, userId);

    // Log the action
    await auditLogService.logAction({
      userId,
      action: 'COURSE_UPDATED',
      entityType: 'Course',
      entityId: course.id,
      metadata: auditLogService.createChangeMetadata(
        originalCourse,
        course,
        { ipAddress: req.ip }
      ),
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: { course },
    });
  } catch (error: any) {
    logger.error('Error updating course:', error);

    if (error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    next(error);
  }
};

/**
 * Delete a course
 * DELETE /api/admin/courses/:id
 */
export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id;
    const userId = req.user!.id;

    logger.info(`User ${userId} deleting course ${courseId}`);

    await courseManagementService.deleteCourse(courseId, userId);

    // Log the action
    await auditLogService.logAction({
      userId,
      action: 'COURSE_DELETED',
      entityType: 'Course',
      entityId: courseId,
      metadata: {
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting course:', error);

    if (error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('published')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    next(error);
  }
};

/**
 * Duplicate a course
 * POST /api/admin/courses/:id/duplicate
 */
export const duplicateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id;
    const userId = req.user!.id;
    const options = req.body;

    logger.info(`User ${userId} duplicating course ${courseId}`);

    const newCourse = await courseManagementService.duplicateCourse(courseId, userId, options);

    // Log the action
    await auditLogService.logAction({
      userId,
      action: 'COURSE_DUPLICATED',
      entityType: 'Course',
      entityId: courseId,
      metadata: {
        newCourseId: newCourse.id,
        newCourseSlug: newCourse.slug,
        options,
        ipAddress: req.ip,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Course duplicated successfully',
      data: { course: newCourse },
    });
  } catch (error: any) {
    logger.error('Error duplicating course:', error);

    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    next(error);
  }
};

/**
 * Export course to ZIP
 * GET /api/admin/courses/:id/export
 */
export const exportCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id;
    const userId = req.user!.id;

    logger.info(`User ${userId} exporting course ${courseId}`);

    // Get course details for filename
    const course = await courseManagementService.getCourseWithFullContent(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    // Generate ZIP
    const zipBuffer = await courseExportService.exportCourseToZip(courseId);

    // Log the action
    await auditLogService.logAction({
      userId,
      action: 'COURSE_EXPORTED',
      entityType: 'Course',
      entityId: courseId,
      metadata: {
        courseTitle: course.title,
        courseSlug: course.slug,
        fileSize: zipBuffer.length,
        ipAddress: req.ip,
      },
    });

    // Set headers for file download
    const filename = `${course.slug}_export_${Date.now()}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', zipBuffer.length.toString());

    // Send the ZIP file
    res.status(200).send(zipBuffer);
  } catch (error) {
    logger.error('Error exporting course:', error);
    next(error);
  }
};

/**
 * Publish a course
 * POST /api/admin/courses/:id/publish
 */
export const publishCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id;
    const userId = req.user!.id;

    logger.info(`User ${userId} publishing course ${courseId}`);

    const course = await courseManagementService.publishCourse(courseId, userId);

    // Log the action
    await auditLogService.logAction({
      userId,
      action: 'COURSE_PUBLISHED',
      entityType: 'Course',
      entityId: course.id,
      metadata: {
        courseTitle: course.title,
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Course published successfully',
      data: { course },
    });
  } catch (error: any) {
    logger.error('Error publishing course:', error);

    if (error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('without')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    next(error);
  }
};

/**
 * Unpublish a course
 * POST /api/admin/courses/:id/unpublish
 */
export const unpublishCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id;
    const userId = req.user!.id;

    logger.info(`User ${userId} unpublishing course ${courseId}`);

    const course = await courseManagementService.unpublishCourse(courseId, userId);

    // Log the action
    await auditLogService.logAction({
      userId,
      action: 'COURSE_UNPUBLISHED',
      entityType: 'Course',
      entityId: course.id,
      metadata: {
        courseTitle: course.title,
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Course unpublished successfully',
      data: { course },
    });
  } catch (error: any) {
    logger.error('Error unpublishing course:', error);

    if (error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    next(error);
  }
};

/**
 * Get course statistics
 * GET /api/admin/courses/:id/stats
 */
export const getCourseStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id;
    const userId = req.user!.id;

    logger.info(`User ${userId} fetching stats for course ${courseId}`);

    const stats = await courseManagementService.getCourseStats(courseId);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    logger.error('Error getting course stats:', error);
    next(error);
  }
};