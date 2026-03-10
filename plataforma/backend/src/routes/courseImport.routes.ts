/**
 * Course Import Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as courseImportController from '../controllers/courseImport.controller';

const router = Router();

// All routes require authentication and ADMIN or INSTRUCTOR role
router.use(authenticate);
router.use(authorize(['ADMIN', 'INSTRUCTOR']));

// Import course from ZIP
router.post(
  '/import',
  courseImportController.uploadMiddleware,
  courseImportController.importCourse
);

// Validate ZIP without importing
router.post(
  '/import/validate',
  courseImportController.uploadMiddleware,
  courseImportController.validateZip
);

// Get import template
router.get('/import/template', courseImportController.getImportTemplate);

// Get import status (for async imports - not yet implemented)
router.get('/import/status/:importId', courseImportController.getImportStatus);

export default router;