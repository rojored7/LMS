/**
 * Lab Routes
 */

import { Router } from 'express';
import * as labController from '../controllers/lab.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * GET /api/labs/:labId
 * Get a lab with details
 * Requires authentication
 */
router.get('/:labId', authenticate, labController.getLab);

/**
 * POST /api/labs/:labId/submit
 * Submit a lab solution
 * Requires authentication
 */
router.post('/:labId/submit', authenticate, labController.submitLabSolution);

/**
 * GET /api/labs/:labId/submissions
 * Get all submissions for a lab
 * Requires authentication
 */
router.get('/:labId/submissions', authenticate, labController.getLabSubmissions);

/**
 * GET /api/labs/submissions/:submissionId
 * Get lab submission details
 * Requires authentication
 * NOTE: This route must be registered BEFORE /:labId to avoid conflict
 */
router.get('/submissions/:submissionId', authenticate, labController.getLabSubmission);

export default router;
