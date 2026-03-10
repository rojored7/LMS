/**
 * Content Editor Service
 * Handles CRUD operations for course content (modules, lessons, quizzes, labs)
 */

import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import {
  CreateModuleDto,
  UpdateModuleDto,
  CreateLessonDto,
  UpdateLessonDto,
  CreateQuizDto,
  UpdateQuizDto,
  CreateLabDto,
  UpdateLabDto,
  ContentValidationResult,
} from '../types/contentEditor';
import { Module, Lesson, Quiz, Lab, Prisma } from '@prisma/client';

// Initialize DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export class ContentEditorService {
  // ============================================================================
  // MODULE OPERATIONS
  // ============================================================================

  /**
   * Create a new module for a course
   * @param courseId Course ID
   * @param data Module creation data
   * @param userId User creating the module
   * @returns Created module
   */
  async createModule(courseId: string, data: CreateModuleDto, userId: string): Promise<Module> {
    try {
      // Verify course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Get next order if not provided
      let order = data.order;
      if (!order) {
        const lastModule = await prisma.module.findFirst({
          where: { courseId },
          orderBy: { order: 'desc' },
        });
        order = (lastModule?.order || 0) + 1;
      }

      // Create module
      const module = await prisma.module.create({
        data: {
          courseId,
          order,
          title: data.title,
          description: this.sanitizeContent(data.description),
          duration: data.duration,
          isPublished: data.isPublished || false,
        },
      });

      logger.info(`Module created: ${module.id} for course ${courseId} by user ${userId}`);
      return module;
    } catch (error) {
      logger.error('Error creating module:', error);
      throw error;
    }
  }

  /**
   * Update a module
   * @param moduleId Module ID
   * @param data Update data
   * @param userId User updating the module
   * @returns Updated module
   */
  async updateModule(moduleId: string, data: UpdateModuleDto, userId: string): Promise<Module> {
    try {
      const updateData: Prisma.ModuleUpdateInput = {};

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) {
        updateData.description = this.sanitizeContent(data.description);
      }
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.order !== undefined) updateData.order = data.order;
      if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

      const module = await prisma.module.update({
        where: { id: moduleId },
        data: updateData,
      });

      logger.info(`Module updated: ${moduleId} by user ${userId}`);
      return module;
    } catch (error) {
      logger.error('Error updating module:', error);
      throw error;
    }
  }

  /**
   * Delete a module (cascades to lessons, quizzes, labs)
   * @param moduleId Module ID
   * @param userId User deleting the module
   */
  async deleteModule(moduleId: string, userId: string): Promise<void> {
    try {
      await prisma.module.delete({
        where: { id: moduleId },
      });

      logger.info(`Module deleted: ${moduleId} by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting module:', error);
      throw error;
    }
  }

  /**
   * Reorder modules within a course
   * @param courseId Course ID
   * @param order Array of module IDs in new order
   * @param userId User reordering modules
   */
  async reorderModules(courseId: string, order: string[], userId: string): Promise<void> {
    try {
      // Verify all modules belong to the course
      const modules = await prisma.module.findMany({
        where: {
          courseId,
          id: { in: order },
        },
      });

      if (modules.length !== order.length) {
        throw new Error('Invalid module IDs provided');
      }

      // Update orders in transaction
      await prisma.$transaction(
        order.map((moduleId, index) =>
          prisma.module.update({
            where: { id: moduleId },
            data: { order: index + 1 },
          })
        )
      );

      logger.info(`Modules reordered for course ${courseId} by user ${userId}`);
    } catch (error) {
      logger.error('Error reordering modules:', error);
      throw error;
    }
  }

  // ============================================================================
  // LESSON OPERATIONS
  // ============================================================================

  /**
   * Create a new lesson for a module
   * @param moduleId Module ID
   * @param data Lesson creation data
   * @param userId User creating the lesson
   * @returns Created lesson
   */
  async createLesson(moduleId: string, data: CreateLessonDto, userId: string): Promise<Lesson> {
    try {
      // Verify module exists
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        throw new Error('Module not found');
      }

      // Get next order if not provided
      let order = data.order;
      if (!order) {
        const lastLesson = await prisma.lesson.findFirst({
          where: { moduleId },
          orderBy: { order: 'desc' },
        });
        order = (lastLesson?.order || 0) + 1;
      }

      // Create lesson
      const lesson = await prisma.lesson.create({
        data: {
          moduleId,
          order,
          title: data.title,
          content: this.sanitizeContent(data.content),
          type: data.type || 'TEXT',
          estimatedTime: data.estimatedTime,
        },
      });

      logger.info(`Lesson created: ${lesson.id} for module ${moduleId} by user ${userId}`);
      return lesson;
    } catch (error) {
      logger.error('Error creating lesson:', error);
      throw error;
    }
  }

  /**
   * Update a lesson
   * @param lessonId Lesson ID
   * @param data Update data
   * @param userId User updating the lesson
   * @returns Updated lesson
   */
  async updateLesson(lessonId: string, data: UpdateLessonDto, userId: string): Promise<Lesson> {
    try {
      const updateData: Prisma.LessonUpdateInput = {};

      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) {
        updateData.content = this.sanitizeContent(data.content);
      }
      if (data.type !== undefined) updateData.type = data.type;
      if (data.estimatedTime !== undefined) updateData.estimatedTime = data.estimatedTime;
      if (data.order !== undefined) updateData.order = data.order;

      const lesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: updateData,
      });

      logger.info(`Lesson updated: ${lessonId} by user ${userId}`);
      return lesson;
    } catch (error) {
      logger.error('Error updating lesson:', error);
      throw error;
    }
  }

  /**
   * Delete a lesson
   * @param lessonId Lesson ID
   * @param userId User deleting the lesson
   */
  async deleteLesson(lessonId: string, userId: string): Promise<void> {
    try {
      await prisma.lesson.delete({
        where: { id: lessonId },
      });

      logger.info(`Lesson deleted: ${lessonId} by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting lesson:', error);
      throw error;
    }
  }

  /**
   * Reorder lessons within a module
   * @param moduleId Module ID
   * @param order Array of lesson IDs in new order
   * @param userId User reordering lessons
   */
  async reorderLessons(moduleId: string, order: string[], userId: string): Promise<void> {
    try {
      // Verify all lessons belong to the module
      const lessons = await prisma.lesson.findMany({
        where: {
          moduleId,
          id: { in: order },
        },
      });

      if (lessons.length !== order.length) {
        throw new Error('Invalid lesson IDs provided');
      }

      // Update orders in transaction
      await prisma.$transaction(
        order.map((lessonId, index) =>
          prisma.lesson.update({
            where: { id: lessonId },
            data: { order: index + 1 },
          })
        )
      );

      logger.info(`Lessons reordered for module ${moduleId} by user ${userId}`);
    } catch (error) {
      logger.error('Error reordering lessons:', error);
      throw error;
    }
  }

  // ============================================================================
  // QUIZ OPERATIONS
  // ============================================================================

  /**
   * Create a new quiz for a module
   * @param moduleId Module ID
   * @param data Quiz creation data
   * @param userId User creating the quiz
   * @returns Created quiz
   */
  async createQuiz(moduleId: string, data: CreateQuizDto, userId: string): Promise<Quiz> {
    try {
      // Verify module exists
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        throw new Error('Module not found');
      }

      // Create quiz with questions in transaction
      const quiz = await prisma.$transaction(async (tx) => {
        // Create quiz
        const newQuiz = await tx.quiz.create({
          data: {
            moduleId,
            title: data.title,
            description: this.sanitizeContent(data.description),
            passingScore: data.passingScore,
            timeLimit: data.timeLimit,
            attempts: data.attempts || 3,
          },
        });

        // Create questions
        if (data.questions && data.questions.length > 0) {
          await tx.question.createMany({
            data: data.questions.map(q => ({
              quizId: newQuiz.id,
              order: q.order,
              type: q.type,
              question: this.sanitizeContent(q.question),
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation ? this.sanitizeContent(q.explanation) : null,
            })),
          });
        }

        return newQuiz;
      });

      logger.info(`Quiz created: ${quiz.id} for module ${moduleId} by user ${userId}`);
      return quiz;
    } catch (error) {
      logger.error('Error creating quiz:', error);
      throw error;
    }
  }

  /**
   * Update a quiz
   * @param quizId Quiz ID
   * @param data Update data
   * @param userId User updating the quiz
   * @returns Updated quiz
   */
  async updateQuiz(quizId: string, data: UpdateQuizDto, userId: string): Promise<Quiz> {
    try {
      const quiz = await prisma.$transaction(async (tx) => {
        // Update quiz metadata
        const updateData: Prisma.QuizUpdateInput = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) {
          updateData.description = this.sanitizeContent(data.description);
        }
        if (data.passingScore !== undefined) updateData.passingScore = data.passingScore;
        if (data.timeLimit !== undefined) updateData.timeLimit = data.timeLimit;
        if (data.attempts !== undefined) updateData.attempts = data.attempts;

        const updatedQuiz = await tx.quiz.update({
          where: { id: quizId },
          data: updateData,
        });

        // Update questions if provided
        if (data.questions) {
          // Delete existing questions
          await tx.question.deleteMany({
            where: { quizId },
          });

          // Create new questions
          if (data.questions.length > 0) {
            await tx.question.createMany({
              data: data.questions.map(q => ({
                quizId,
                order: q.order || 1,
                type: q.type || 'MULTIPLE_CHOICE',
                question: this.sanitizeContent(q.question || ''),
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation ? this.sanitizeContent(q.explanation) : null,
              })),
            });
          }
        }

        return updatedQuiz;
      });

      logger.info(`Quiz updated: ${quizId} by user ${userId}`);
      return quiz;
    } catch (error) {
      logger.error('Error updating quiz:', error);
      throw error;
    }
  }

  /**
   * Delete a quiz (cascades to questions)
   * @param quizId Quiz ID
   * @param userId User deleting the quiz
   */
  async deleteQuiz(quizId: string, userId: string): Promise<void> {
    try {
      await prisma.quiz.delete({
        where: { id: quizId },
      });

      logger.info(`Quiz deleted: ${quizId} by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting quiz:', error);
      throw error;
    }
  }

  // ============================================================================
  // LAB OPERATIONS
  // ============================================================================

  /**
   * Create a new lab for a module
   * @param moduleId Module ID
   * @param data Lab creation data
   * @param userId User creating the lab
   * @returns Created lab
   */
  async createLab(moduleId: string, data: CreateLabDto, userId: string): Promise<Lab> {
    try {
      // Verify module exists
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        throw new Error('Module not found');
      }

      // Create lab
      const lab = await prisma.lab.create({
        data: {
          moduleId,
          title: data.title,
          description: this.sanitizeContent(data.description),
          language: data.language,
          starterCode: data.starterCode,
          solution: data.solution,
          tests: data.tests,
          hints: data.hints,
        },
      });

      logger.info(`Lab created: ${lab.id} for module ${moduleId} by user ${userId}`);
      return lab;
    } catch (error) {
      logger.error('Error creating lab:', error);
      throw error;
    }
  }

  /**
   * Update a lab
   * @param labId Lab ID
   * @param data Update data
   * @param userId User updating the lab
   * @returns Updated lab
   */
  async updateLab(labId: string, data: UpdateLabDto, userId: string): Promise<Lab> {
    try {
      const updateData: Prisma.LabUpdateInput = {};

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) {
        updateData.description = this.sanitizeContent(data.description);
      }
      if (data.language !== undefined) updateData.language = data.language;
      if (data.starterCode !== undefined) updateData.starterCode = data.starterCode;
      if (data.solution !== undefined) updateData.solution = data.solution;
      if (data.tests !== undefined) updateData.tests = data.tests;
      if (data.hints !== undefined) updateData.hints = data.hints;

      const lab = await prisma.lab.update({
        where: { id: labId },
        data: updateData,
      });

      logger.info(`Lab updated: ${labId} by user ${userId}`);
      return lab;
    } catch (error) {
      logger.error('Error updating lab:', error);
      throw error;
    }
  }

  /**
   * Delete a lab
   * @param labId Lab ID
   * @param userId User deleting the lab
   */
  async deleteLab(labId: string, userId: string): Promise<void> {
    try {
      await prisma.lab.delete({
        where: { id: labId },
      });

      logger.info(`Lab deleted: ${labId} by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting lab:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Sanitize and validate HTML/Markdown content
   * @param content Raw content
   * @returns Sanitized content
   */
  private sanitizeContent(content: string): string {
    // Sanitize HTML to prevent XSS
    const sanitized = purify.sanitize(content, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'ul', 'ol', 'li',
        'a', 'strong', 'b', 'em', 'i', 'u', 'strike',
        'code', 'pre', 'blockquote',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'img', 'figure', 'figcaption',
        'div', 'span',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });

    return sanitized;
  }

  /**
   * Validate content structure
   * @param content Content to validate
   * @returns Validation result
   */
  validateContent(content: string): ContentValidationResult {
    const warnings: string[] = [];

    // Check for potentially dangerous patterns
    if (content.includes('<script')) {
      warnings.push('Script tags detected and removed');
    }

    if (content.includes('javascript:')) {
      warnings.push('JavaScript protocol links detected and removed');
    }

    if (content.length > 1000000) {
      warnings.push('Content exceeds 1MB limit');
      return {
        valid: false,
        sanitized: '',
        warnings,
      };
    }

    const sanitized = this.sanitizeContent(content);

    return {
      valid: true,
      sanitized,
      warnings,
    };
  }
}

// Export singleton instance
export default new ContentEditorService();