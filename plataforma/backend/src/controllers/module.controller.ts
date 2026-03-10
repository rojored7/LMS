/**
 * Module Controller
 * HTTP handlers for module routes
 */

import { Request, Response, NextFunction } from 'express';
import moduleService from '../services/module.service';

/**
 * Get all modules for a course
 * GET /api/courses/:courseId/modules
 */
export const getCourseModules = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId; // From authenticate middleware

    const modules = await moduleService.getCourseModules(courseId, userId);

    res.json({
      success: true,
      data: modules,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single module by ID
 * GET /api/modules/:moduleId
 */
export const getModule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user?.userId; // From authenticate middleware

    const module = await moduleService.getModule(moduleId, userId);

    res.json({
      success: true,
      data: module,
    });
  } catch (error) {
    next(error);
  }
};
