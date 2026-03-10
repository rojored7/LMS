/**
 * Lab Controller
 * HTTP handlers for lab routes
 */

import { Request, Response, NextFunction } from 'express';
import labService from '../services/lab.service';

/**
 * Get a lab with details
 * GET /api/labs/:labId
 */
export const getLab = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { labId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const lab = await labService.getLab(labId, userId);

    res.json({
      success: true,
      data: lab,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit a lab solution
 * POST /api/labs/:labId/submit
 */
export const submitLabSolution = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { labId } = req.params;
    const userId = req.user?.userId;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Código inválido',
      });
    }

    const result = await labService.submitLabSolution(labId, userId, code);

    res.json({
      success: true,
      message: result.passed
        ? '¡Felicitaciones! Has completado el lab exitosamente'
        : 'Algunos tests no pasaron. Revisa los resultados e intenta nuevamente.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lab submission details
 * GET /api/labs/submissions/:submissionId
 */
export const getLabSubmission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const submission = await labService.getLabSubmission(submissionId, userId);

    res.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all submissions for a lab
 * GET /api/labs/:labId/submissions
 */
export const getLabSubmissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { labId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const submissions = await labService.getLabSubmissions(labId, userId);

    res.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};
