/**
 * Course Import Controller
 * Handles HTTP requests for course import functionality
 */

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import courseImportService from '../services/courseImport.service';
import auditLogService from '../services/auditLog.service';
import logger from '../utils/logger';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype === 'application/zip' ||
        file.mimetype === 'application/x-zip-compressed' ||
        file.originalname.toLowerCase().endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'));
    }
  },
});

// Export multer middleware for use in routes
export const uploadMiddleware = upload.single('courseZip');

/**
 * Import a course from ZIP file
 * POST /api/admin/courses/import
 */
export const importCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please provide a ZIP file.',
      });
    }

    const userId = req.user!.id;
    const zipBuffer = req.file.buffer;

    // Optional metadata overrides from request body
    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : undefined;

    logger.info(`User ${userId} importing course from ZIP (${req.file.originalname})`);

    // Import the course
    const course = await courseImportService.importCourseFromZip(
      zipBuffer,
      userId,
      metadata
    );

    // Log the action
    await auditLogService.logAction({
      userId,
      action: 'COURSE_IMPORTED',
      entityType: 'Course',
      entityId: course.id,
      metadata: {
        filename: req.file.originalname,
        fileSize: req.file.size,
        courseTitle: course.title,
        courseSlug: course.slug,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Course imported successfully',
      data: {
        course,
      },
    });
  } catch (error: any) {
    logger.error('Error importing course:', error);

    // Handle specific error types
    if (error.name === 'InvalidZipStructureError') {
      return res.status(400).json({
        success: false,
        error: error.message,
        details: 'The ZIP file structure is invalid. Please check the required folder structure.',
      });
    }

    if (error.name === 'MissingRequiredFilesError') {
      return res.status(400).json({
        success: false,
        error: error.message,
        details: 'Required files are missing from the ZIP archive.',
      });
    }

    if (error.name === 'InvalidMarkdownError') {
      return res.status(400).json({
        success: false,
        error: error.message,
        details: 'One or more Markdown files contain invalid content.',
      });
    }

    if (error.name === 'DuplicateCourseSlugError') {
      return res.status(409).json({
        success: false,
        error: error.message,
        details: 'A course with this slug already exists. Please rename or update the existing course.',
      });
    }

    next(error);
  }
};

/**
 * Validate a ZIP file without importing
 * POST /api/admin/courses/import/validate
 */
export const validateZip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please provide a ZIP file.',
      });
    }

    const userId = req.user!.id;
    const zipBuffer = req.file.buffer;

    logger.info(`User ${userId} validating ZIP file (${req.file.originalname})`);

    // Parse the ZIP structure
    const structure = await courseImportService.parseZipStructure(zipBuffer);

    // Validate the structure
    const validation = courseImportService.validateCourseStructure(structure);

    // Prepare response
    const response: any = {
      success: validation.valid,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
    };

    // Add structure preview if valid
    if (validation.valid) {
      response.preview = {
        title: structure.metadata.title,
        description: structure.metadata.description,
        author: structure.metadata.author,
        level: structure.metadata.level,
        modules: structure.modules.map(m => ({
          name: m.name,
          order: m.order,
          lessons: m.lessons.length,
          quizzes: m.quizzes.length,
          labs: m.labs.length,
        })),
        stats: {
          totalModules: structure.modules.length,
          totalLessons: structure.modules.reduce((sum, m) => sum + m.lessons.length, 0),
          totalQuizzes: structure.modules.reduce((sum, m) => sum + m.quizzes.length, 0),
          totalLabs: structure.modules.reduce((sum, m) => sum + m.labs.length, 0),
        },
      };
    }

    res.status(200).json(response);
  } catch (error: any) {
    logger.error('Error validating ZIP:', error);

    // Handle specific error types
    if (error.name === 'InvalidZipStructureError') {
      return res.status(400).json({
        success: false,
        valid: false,
        error: error.message,
        errors: [{
          type: 'STRUCTURE',
          message: error.message,
        }],
        warnings: [],
      });
    }

    next(error);
  }
};

/**
 * Get import template structure
 * GET /api/admin/courses/import/template
 */
export const getImportTemplate = async (req: Request, res: Response) => {
  try {
    const template = {
      structure: {
        'README.md': 'Course metadata and description (required)',
        'teoria/': {
          '01_module_name/': {
            '01_lesson.md': 'Lesson content with frontmatter',
            '02_lesson.md': 'Another lesson',
          },
          '02_another_module/': {
            '01_lesson.md': 'Lesson content',
          },
        },
        'evaluacion/': {
          'quiz_module_1.md': 'Quiz for module 1',
          'quiz_module_2.md': 'Quiz for module 2',
        },
        'laboratorios/': {
          'lab_01.md': 'Lab exercise (optional)',
        },
        'recursos/': {
          'additional_resources.md': 'Extra materials (optional)',
        },
      },
      readme_example: `---
title: Course Title
author: Author Name
level: BEGINNER
duration: 120
tags: tag1, tag2, tag3
version: 1.0
---

# Course Title

## Description

Detailed course description here...

## Learning Objectives

- Objective 1
- Objective 2
- Objective 3`,
      lesson_example: `---
title: Lesson Title
order: 1
type: TEXT
estimatedTime: 15
---

# Lesson Title

Lesson content in Markdown format...

## Section 1

Content...

## Section 2

More content...`,
      quiz_example: `---
title: Quiz Title
passingScore: 70
timeLimit: 30
attempts: 3
---

# Quiz Title

Quiz description...

## Question 1

What is the correct answer?

A. Option 1
B. Option 2
C. Option 3
D. Option 4

<!-- Answer: B -->
<!-- Explanation: This is why B is correct... -->`,
    };

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('Error getting import template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate import template',
    });
  }
};

/**
 * Get import status (for async imports)
 * GET /api/admin/courses/import/status/:importId
 */
export const getImportStatus = async (req: Request, res: Response) => {
  try {
    // This would be implemented if we support async imports
    // For now, imports are synchronous
    res.status(501).json({
      success: false,
      error: 'Async imports not yet implemented',
    });
  } catch (error) {
    logger.error('Error getting import status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get import status',
    });
  }
};