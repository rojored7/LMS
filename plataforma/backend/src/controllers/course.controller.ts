import { Request, Response, NextFunction } from 'express';
import courseService from '../services/course.service';
import { CourseLevel } from '@prisma/client';

/**
 * Get all courses with optional filtering
 * GET /api/courses
 */
export const getCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '10',
      level,
      tag,
      search,
      isPublished = 'true',
    } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      level: level as CourseLevel | undefined,
      tag: tag as string | undefined,
      search: search as string | undefined,
      isPublished: isPublished === 'true',
    };

    const result = await courseService.getCourses(options);

    res.json({
      success: true,
      data: result.courses,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single course by ID or slug
 * GET /api/courses/:idOrSlug
 */
export const getCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { idOrSlug } = req.params;

    const course = await courseService.getCourse(idOrSlug);

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get course statistics
 * GET /api/courses/:courseId/stats
 */
export const getCourseStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.params;

    const stats = await courseService.getCourseStats(courseId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enroll current user in a course
 * POST /api/courses/:courseId/enroll
 * Note: Requires authentication. User must be logged in.
 */
export const enrollInCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.params;

    // For now, require authentication
    // In the future, could support guest enrollments
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Debe iniciar sesión para inscribirse en un curso',
        hint: 'Use POST /api/auth/login para autenticarse primero',
      });
    }

    const enrollment = await courseService.enrollUser(userId, courseId);

    res.status(201).json({
      success: true,
      message: 'Inscripción exitosa',
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's enrollments
 * GET /api/courses/my-enrollments
 */
export const getMyEnrollments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id; // From auth middleware

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const enrollments = await courseService.getUserEnrollments(userId);

    res.json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
};
