/**
 * ContentEditor Service Tests
 * Comprehensive test coverage for course content editing operations
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { contentEditorService } from '../../services/contentEditor.service';
import { prisma } from '../../utils/prisma';
import { ValidationError, NotFoundError, ConflictError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../utils/prisma', () => ({
  prisma: {
    module: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    quiz: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    lab: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userProgress: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('ContentEditor Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Module Operations', () => {
    describe('createModule', () => {
      it('should create a new module with auto-assigned order', async () => {
        const courseId = 'course-1';
        const moduleData = {
          title: 'New Module',
          description: 'Module description',
        };

        (prisma.course.findUnique as jest.Mock).mockResolvedValue({ id: courseId });
        (prisma.module.findMany as jest.Mock).mockResolvedValue([
          { order: 1 },
          { order: 2 },
        ]);
        (prisma.module.create as jest.Mock).mockResolvedValue({
          id: 'module-1',
          ...moduleData,
          order: 3,
        });

        const result = await contentEditorService.createModule(courseId, moduleData);

        expect(result.order).toBe(3);
        expect(prisma.module.create).toHaveBeenCalledWith({
          data: {
            ...moduleData,
            courseId,
            order: 3,
          },
        });
      });

      it('should validate required module fields', async () => {
        const courseId = 'course-1';
        const invalidData = {
          description: 'No title provided',
        };

        await expect(contentEditorService.createModule(courseId, invalidData))
          .rejects.toThrow(ValidationError);
      });

      it('should throw NotFoundError for non-existent course', async () => {
        (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(contentEditorService.createModule('invalid-course', { title: 'Module' }))
          .rejects.toThrow(NotFoundError);
      });
    });

    describe('updateModule', () => {
      it('should update module content', async () => {
        const existingModule = {
          id: 'module-1',
          title: 'Old Title',
          order: 1,
        };

        const updateData = {
          title: 'Updated Title',
          description: 'New description',
        };

        (prisma.module.findUnique as jest.Mock).mockResolvedValue(existingModule);
        (prisma.module.update as jest.Mock).mockResolvedValue({
          ...existingModule,
          ...updateData,
        });

        const result = await contentEditorService.updateModule('module-1', updateData);

        expect(result.title).toBe('Updated Title');
        expect(prisma.module.update).toHaveBeenCalledWith({
          where: { id: 'module-1' },
          data: updateData,
        });
      });

      it('should maintain order when updating', async () => {
        const module = { id: 'module-1', order: 2 };

        (prisma.module.findUnique as jest.Mock).mockResolvedValue(module);
        (prisma.module.update as jest.Mock).mockResolvedValue(module);

        await contentEditorService.updateModule('module-1', { title: 'New' });

        expect(prisma.module.update).toHaveBeenCalledWith({
          where: { id: 'module-1' },
          data: { title: 'New' }, // Order not included
        });
      });
    });

    describe('reorderModules', () => {
      it('should atomically reorder modules', async () => {
        const courseId = 'course-1';
        const modules = [
          { id: 'mod-1', order: 1 },
          { id: 'mod-2', order: 2 },
          { id: 'mod-3', order: 3 },
        ];

        const newOrder = ['mod-3', 'mod-1', 'mod-2'];

        (prisma.course.findUnique as jest.Mock).mockResolvedValue({ id: courseId });
        (prisma.module.findMany as jest.Mock).mockResolvedValue(modules);
        (prisma.$transaction as jest.Mock).mockImplementation(async (operations) => {
          return operations;
        });

        await contentEditorService.reorderModules(courseId, newOrder);

        expect(prisma.$transaction).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.any(Promise), // Update for mod-3 to order 1
            expect.any(Promise), // Update for mod-1 to order 2
            expect.any(Promise), // Update for mod-2 to order 3
          ])
        );
      });

      it('should validate all module IDs belong to course', async () => {
        const courseId = 'course-1';
        const modules = [
          { id: 'mod-1', courseId, order: 1 },
          { id: 'mod-2', courseId, order: 2 },
        ];

        const invalidOrder = ['mod-1', 'mod-99', 'mod-2'];

        (prisma.course.findUnique as jest.Mock).mockResolvedValue({ id: courseId });
        (prisma.module.findMany as jest.Mock).mockResolvedValue(modules);

        await expect(contentEditorService.reorderModules(courseId, invalidOrder))
          .rejects.toThrow('Invalid module IDs');
      });

      it('should handle concurrent reorder attempts', async () => {
        const courseId = 'course-1';
        const order1 = ['mod-1', 'mod-2'];
        const order2 = ['mod-2', 'mod-1'];

        (prisma.course.findUnique as jest.Mock).mockResolvedValue({ id: courseId });
        (prisma.module.findMany as jest.Mock).mockResolvedValue([
          { id: 'mod-1', order: 1 },
          { id: 'mod-2', order: 2 },
        ]);

        // Simulate optimistic locking
        (prisma.$transaction as jest.Mock)
          .mockRejectedValueOnce(new Error('Transaction conflict'))
          .mockResolvedValueOnce([]);

        await contentEditorService.reorderModules(courseId, order1);

        expect(prisma.$transaction).toHaveBeenCalledTimes(2); // Retry on conflict
      });
    });

    describe('deleteModule', () => {
      it('should cascade delete all module content', async () => {
        const module = {
          id: 'module-1',
          courseId: 'course-1',
        };

        (prisma.module.findUnique as jest.Mock).mockResolvedValue(module);
        (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));

        await contentEditorService.deleteModule('module-1');

        expect(prisma.lesson.deleteMany).toHaveBeenCalledWith({
          where: { moduleId: 'module-1' },
        });
        expect(prisma.quiz.deleteMany).toHaveBeenCalledWith({
          where: { moduleId: 'module-1' },
        });
        expect(prisma.lab.deleteMany).toHaveBeenCalledWith({
          where: { moduleId: 'module-1' },
        });
        expect(prisma.userProgress.deleteMany).toHaveBeenCalledWith({
          where: { moduleId: 'module-1' },
        });
        expect(prisma.module.delete).toHaveBeenCalledWith({
          where: { id: 'module-1' },
        });
      });

      it('should reorder remaining modules after deletion', async () => {
        const modules = [
          { id: 'mod-1', order: 1 },
          { id: 'mod-2', order: 2 },  // To be deleted
          { id: 'mod-3', order: 3 },
          { id: 'mod-4', order: 4 },
        ];

        (prisma.module.findUnique as jest.Mock).mockResolvedValue(modules[1]);
        (prisma.module.findMany as jest.Mock).mockResolvedValue(modules);
        (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));

        await contentEditorService.deleteModule('mod-2');

        expect(prisma.module.updateMany).toHaveBeenCalledWith({
          where: {
            courseId: expect.any(String),
            order: { gt: 2 },
          },
          data: {
            order: { decrement: 1 },
          },
        });
      });
    });
  });

  describe('Lesson Operations', () => {
    describe('createLesson', () => {
      it('should create lesson with proper order', async () => {
        const lessonData = {
          title: 'New Lesson',
          content: '# Lesson Content',
          duration: 30,
        };

        (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: 'module-1' });
        (prisma.lesson.findMany as jest.Mock).mockResolvedValue([
          { order: 1 },
          { order: 2 },
        ]);
        (prisma.lesson.create as jest.Mock).mockResolvedValue({
          id: 'lesson-1',
          ...lessonData,
          order: 3,
        });

        const result = await contentEditorService.createLesson('module-1', lessonData);

        expect(result.order).toBe(3);
      });

      it('should sanitize lesson content', async () => {
        const lessonData = {
          title: 'XSS Test',
          content: '<script>alert("xss")</script># Real Content',
        };

        (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: 'module-1' });
        (prisma.lesson.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.lesson.create as jest.Mock).mockImplementation(({ data }) => ({
          id: 'lesson-1',
          ...data,
        }));

        await contentEditorService.createLesson('module-1', lessonData);

        expect(prisma.lesson.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            content: expect.not.stringContaining('<script>'),
          }),
        });
      });

      it('should validate markdown format', async () => {
        const invalidLesson = {
          title: 'Invalid',
          content: 123, // Not a string
        };

        await expect(contentEditorService.createLesson('module-1', invalidLesson))
          .rejects.toThrow(ValidationError);
      });
    });

    describe('updateLesson', () => {
      it('should update lesson and track changes', async () => {
        const existingLesson = {
          id: 'lesson-1',
          title: 'Original',
          content: 'Original content',
          updatedAt: new Date('2024-01-01'),
        };

        const updates = {
          content: 'Updated content',
        };

        (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(existingLesson);
        (prisma.lesson.update as jest.Mock).mockResolvedValue({
          ...existingLesson,
          ...updates,
          updatedAt: new Date(),
        });

        const result = await contentEditorService.updateLesson('lesson-1', updates);

        expect(result.content).toBe('Updated content');
        expect(result.updatedAt).not.toEqual(existingLesson.updatedAt);
      });

      it('should prevent empty content updates', async () => {
        const updates = {
          content: '',
        };

        await expect(contentEditorService.updateLesson('lesson-1', updates))
          .rejects.toThrow('Content cannot be empty');
      });
    });
  });

  describe('Quiz Operations', () => {
    describe('createQuiz', () => {
      it('should create quiz with valid questions', async () => {
        const quizData = {
          title: 'Module Quiz',
          questions: [
            {
              question: 'What is Node.js?',
              type: 'multiple_choice',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 0,
              explanation: 'Node.js is...',
            },
            {
              question: 'True or False?',
              type: 'true_false',
              correctAnswer: true,
            },
          ],
          passingScore: 70,
          maxAttempts: 3,
        };

        (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: 'module-1' });
        (prisma.quiz.create as jest.Mock).mockResolvedValue({
          id: 'quiz-1',
          ...quizData,
        });

        const result = await contentEditorService.createQuiz('module-1', quizData);

        expect(result.questions).toHaveLength(2);
        expect(prisma.quiz.create).toHaveBeenCalledWith({
          data: {
            ...quizData,
            moduleId: 'module-1',
            questions: JSON.stringify(quizData.questions),
          },
        });
      });

      it('should validate question formats', async () => {
        const invalidQuiz = {
          title: 'Invalid Quiz',
          questions: [
            {
              question: 'No options?',
              type: 'multiple_choice',
              options: [], // Empty options
              correctAnswer: 0,
            },
          ],
        };

        await expect(contentEditorService.createQuiz('module-1', invalidQuiz))
          .rejects.toThrow('Multiple choice questions must have at least 2 options');
      });

      it('should validate correct answer indices', async () => {
        const invalidQuiz = {
          title: 'Quiz',
          questions: [
            {
              question: 'Question',
              type: 'multiple_choice',
              options: ['A', 'B'],
              correctAnswer: 5, // Out of bounds
            },
          ],
        };

        await expect(contentEditorService.createQuiz('module-1', invalidQuiz))
          .rejects.toThrow('Correct answer index out of bounds');
      });

      it('should enforce passing score range', async () => {
        const invalidQuiz = {
          title: 'Quiz',
          questions: [],
          passingScore: 150, // Over 100
        };

        await expect(contentEditorService.createQuiz('module-1', invalidQuiz))
          .rejects.toThrow('Passing score must be between 0 and 100');
      });
    });

    describe('updateQuiz', () => {
      it('should update quiz questions atomically', async () => {
        const existingQuiz = {
          id: 'quiz-1',
          questions: JSON.stringify([{ question: 'Old' }]),
        };

        const updates = {
          questions: [
            { question: 'New 1' },
            { question: 'New 2' },
          ],
        };

        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(existingQuiz);
        (prisma.quiz.update as jest.Mock).mockResolvedValue({
          ...existingQuiz,
          questions: JSON.stringify(updates.questions),
        });

        await contentEditorService.updateQuiz('quiz-1', updates);

        expect(prisma.quiz.update).toHaveBeenCalledWith({
          where: { id: 'quiz-1' },
          data: {
            questions: JSON.stringify(updates.questions),
          },
        });
      });

      it('should preserve quiz attempts when updating questions', async () => {
        const existingQuiz = {
          id: 'quiz-1',
          maxAttempts: 3,
        };

        const updates = {
          questions: [{ question: 'Updated' }],
        };

        (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(existingQuiz);
        (prisma.quiz.update as jest.Mock).mockResolvedValue(existingQuiz);

        await contentEditorService.updateQuiz('quiz-1', updates);

        expect(prisma.quiz.update).toHaveBeenCalledWith({
          where: { id: 'quiz-1' },
          data: expect.not.objectContaining({
            maxAttempts: expect.anything(),
          }),
        });
      });
    });
  });

  describe('Lab Operations', () => {
    describe('createLab', () => {
      it('should create lab with test cases', async () => {
        const labData = {
          title: 'Python Lab',
          description: 'Write a function',
          instructions: '# Instructions\n\nCreate a function...',
          initialCode: 'def solution():\n    pass',
          testCases: [
            {
              input: '5',
              expectedOutput: '25',
              description: 'Square of 5',
            },
            {
              input: '0',
              expectedOutput: '0',
              description: 'Square of 0',
            },
          ],
          language: 'python',
          difficulty: 'MEDIUM',
        };

        (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: 'module-1' });
        (prisma.lab.create as jest.Mock).mockResolvedValue({
          id: 'lab-1',
          ...labData,
        });

        const result = await contentEditorService.createLab('module-1', labData);

        expect(result.testCases).toHaveLength(2);
      });

      it('should validate supported languages', async () => {
        const invalidLab = {
          title: 'Lab',
          language: 'cobol', // Unsupported
        };

        await expect(contentEditorService.createLab('module-1', invalidLab))
          .rejects.toThrow('Unsupported language: cobol');
      });

      it('should validate test case format', async () => {
        const invalidLab = {
          title: 'Lab',
          language: 'python',
          testCases: [
            {
              input: '1',
              // Missing expectedOutput
            },
          ],
        };

        await expect(contentEditorService.createLab('module-1', invalidLab))
          .rejects.toThrow('Test case must have input and expectedOutput');
      });

      it('should sanitize code snippets', async () => {
        const labData = {
          title: 'Lab',
          initialCode: '```python\nimport os\nos.system("rm -rf /")\n```',
          language: 'python',
        };

        (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: 'module-1' });
        (prisma.lab.create as jest.Mock).mockImplementation(({ data }) => ({
          id: 'lab-1',
          ...data,
        }));

        await contentEditorService.createLab('module-1', labData);

        // Should flag dangerous code
        expect(prisma.lab.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            flags: expect.arrayContaining(['potentially_dangerous']),
          }),
        });
      });
    });
  });

  describe('Content Validation', () => {
    it('should detect and prevent XSS in all content types', async () => {
      const xssPatterns = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        '<img src=x onerror=alert(1)>',
        '<iframe src="javascript:alert(1)">',
      ];

      for (const pattern of xssPatterns) {
        const lessonData = {
          title: 'Test',
          content: pattern,
        };

        await expect(contentEditorService.validateContent(lessonData))
          .rejects.toThrow('Potentially malicious content detected');
      }
    });

    it('should allow legitimate HTML in markdown', async () => {
      const validContent = {
        title: 'Test',
        content: '# Header\n\n<details>\n<summary>Click me</summary>\nContent\n</details>',
      };

      await expect(contentEditorService.validateContent(validContent))
        .resolves.not.toThrow();
    });

    it('should enforce content size limits', async () => {
      const largeContent = {
        title: 'Test',
        content: 'A'.repeat(1000001), // 1MB+ content
      };

      await expect(contentEditorService.validateContent(largeContent))
        .rejects.toThrow('Content exceeds maximum size limit');
    });
  });

  describe('Transaction Management', () => {
    it('should rollback on partial failure during bulk operations', async () => {
      const moduleId = 'module-1';
      const lessons = [
        { title: 'Lesson 1', content: 'Content 1' },
        { title: 'Lesson 2', content: 'Content 2' },
      ];

      (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: moduleId });
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

      await expect(contentEditorService.bulkCreateLessons(moduleId, lessons))
        .rejects.toThrow('Transaction failed');

      // Verify no partial data was committed
      expect(prisma.lesson.create).not.toHaveBeenCalled();
    });

    it('should handle deadlocks with retry logic', async () => {
      const moduleId = 'module-1';

      (prisma.module.findUnique as jest.Mock).mockResolvedValue({ id: moduleId });
      (prisma.module.update as jest.Mock)
        .mockRejectedValueOnce(new Error('Deadlock detected'))
        .mockResolvedValueOnce({ id: moduleId, title: 'Updated' });

      const result = await contentEditorService.updateModule(moduleId, { title: 'Updated' }, { retry: true });

      expect(result.title).toBe('Updated');
      expect(prisma.module.update).toHaveBeenCalledTimes(2);
    });
  });
});