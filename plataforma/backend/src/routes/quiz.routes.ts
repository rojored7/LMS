/**
 * Quiz Routes
 */

import { Router } from 'express';
import * as quizController from '../controllers/quiz.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  createQuizSchema,
  updateQuizSchema,
  quizIdParamSchema,
  submitQuizSchema
} from '../validators/quiz.validator';

const router = Router();

/**
 * POST /api/quizzes
 * Create a new quiz
 * Requires: INSTRUCTOR or ADMIN role
 */
router.post(
  '/',
  authenticate,
  authorize(['INSTRUCTOR', 'ADMIN']),
  validate(createQuizSchema),
  quizController.createQuiz
);

/**
 * GET /api/quizzes/:quizId
 * Get a quiz with questions (without correct answers)
 * Requires authentication
 */
router.get('/:quizId', authenticate, quizController.getQuiz);

/**
 * PUT /api/quizzes/:id
 * Update a quiz
 * Requires: INSTRUCTOR or ADMIN role
 */
router.put(
  '/:id',
  authenticate,
  authorize(['INSTRUCTOR', 'ADMIN']),
  validate(updateQuizSchema),
  quizController.updateQuiz
);

/**
 * DELETE /api/quizzes/:id
 * Delete a quiz
 * Requires: ADMIN role only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validate(quizIdParamSchema),
  quizController.deleteQuiz
);

/**
 * POST /api/quizzes/:quizId/submit
 * Submit a quiz attempt
 * Requires authentication
 */
router.post('/:quizId/submit', authenticate, quizController.submitQuizAttempt);

/**
 * GET /api/quizzes/:quizId/attempts
 * Get all attempts for a quiz
 * Requires authentication
 */
router.get('/:quizId/attempts', authenticate, quizController.getQuizAttempts);

/**
 * GET /api/quizzes/attempts/:attemptId
 * Get quiz attempt details
 * Requires authentication
 * NOTE: This route must be registered BEFORE /:quizId to avoid conflict
 */
router.get('/attempts/:attemptId', authenticate, quizController.getQuizAttempt);

export default router;
