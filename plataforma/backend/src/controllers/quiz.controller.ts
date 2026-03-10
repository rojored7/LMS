/**
 * Quiz Controller
 * HTTP handlers for quiz routes
 */

import { Request, Response, NextFunction } from 'express';
import quizService from '../services/quiz.service';
import { CreateQuizDto, UpdateQuizDto } from '../validators/quiz.validator';

/**
 * Create a new quiz
 * POST /api/quizzes
 */
export const createQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    // Only INSTRUCTOR and ADMIN can create quizzes
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear quizzes',
      });
    }

    const quizData = req.body as CreateQuizDto;
    const quiz = await quizService.createQuiz(quizData, userId);

    res.status(201).json({
      success: true,
      message: 'Quiz creado exitosamente',
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a quiz
 * PUT /api/quizzes/:id
 */
export const updateQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const updateData = req.body as UpdateQuizDto;
    const quiz = await quizService.updateQuiz(id, updateData, userId, role!);

    res.json({
      success: true,
      message: 'Quiz actualizado exitosamente',
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a quiz
 * DELETE /api/quizzes/:id
 */
export const deleteQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    // Only ADMIN can delete quizzes
    if (role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar quizzes',
      });
    }

    await quizService.deleteQuiz(id);

    res.json({
      success: true,
      message: 'Quiz eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all quizzes for a module
 * GET /api/modules/:moduleId/quizzes
 */
export const getModuleQuizzes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const quizzes = await quizService.getModuleQuizzes(moduleId, userId);

    res.json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a quiz with questions (without correct answers)
 * GET /api/quizzes/:quizId
 */
export const getQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { quizId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const quiz = await quizService.getQuiz(quizId, userId);

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit a quiz attempt
 * POST /api/quizzes/:quizId/submit
 */
export const submitQuizAttempt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { quizId } = req.params;
    const userId = req.user?.userId;
    const { answers } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Respuestas inválidas',
      });
    }

    const result = await quizService.submitQuizAttempt(quizId, userId, answers);

    res.json({
      success: true,
      message: result.passed
        ? '¡Felicitaciones! Has aprobado el quiz'
        : 'No has alcanzado la puntuación necesaria. Intenta nuevamente.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quiz attempt details
 * GET /api/quizzes/attempts/:attemptId
 */
export const getQuizAttempt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const attempt = await quizService.getQuizAttempt(attemptId, userId);

    res.json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all attempts for a quiz
 * GET /api/quizzes/:quizId/attempts
 */
export const getQuizAttempts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { quizId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const attempts = await quizService.getQuizAttempts(quizId, userId);

    res.json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    next(error);
  }
};
