/**
 * Lesson Controller
 * HTTP handlers for lesson routes
 */

import { Request, Response, NextFunction } from 'express';
import lessonService from '../services/lesson.service';

/**
 * Get all lessons for a module
 * GET /api/modules/:moduleId/lessons
 */
export const getModuleLessons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user?.userId; // From authenticate middleware

    const lessons = await lessonService.getModuleLessons(moduleId, userId);

    res.json({
      success: true,
      data: lessons,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single lesson by ID with full content
 * GET /api/lessons/:lessonId
 */
export const getLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user?.userId; // From authenticate middleware

    const lesson = await lessonService.getLesson(lessonId, userId);

    res.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a lesson as complete
 * POST /api/lessons/:lessonId/complete
 */
export const completeLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user?.userId; // From authenticate middleware
    const { timeSpent } = req.body; // Optional time spent in seconds

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const progress = await lessonService.completeLesson(
      lessonId,
      userId,
      timeSpent
    );

    res.json({
      success: true,
      message: 'Lección marcada como completada',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lesson progress for current user
 * GET /api/lessons/:lessonId/progress
 */
export const getLessonProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user?.userId; // From authenticate middleware

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const progress = await lessonService.getLessonProgress(lessonId, userId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate multimedia URLs in lesson content
 * POST /api/lessons/:id/validate-media
 */
export const validateLessonMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const validation = await lessonService.validateMediaUrls(id);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    next(error);
  }
};
