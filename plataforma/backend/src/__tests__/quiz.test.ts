/**
 * Quiz Service Tests
 * Test coverage for quiz CRUD operations
 */

import quizService from '../services/quiz.service';
import { prisma } from '../utils/prisma';
import { UserRole } from '@prisma/client';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    module: {
      findUnique: jest.fn(),
    },
    quiz: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    question: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
    },
    quizAttempt: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

describe('Quiz CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuiz', () => {
    it('should create a quiz with questions', async () => {
      const mockModule = {
        id: 'module-id',
        course: { id: 'course-id', title: 'Test Course' }
      };

      const mockQuiz = {
        id: 'quiz-id',
        moduleId: 'module-id',
        title: 'Test Quiz',
        description: 'Test Description',
        passingScore: 70,
        timeLimit: 30,
        attempts: 3,
      };

      const quizData = {
        moduleId: 'module-id',
        title: 'Test Quiz',
        description: 'Test Description',
        timeLimit: 30,
        passingScore: 70,
        maxAttempts: 3,
        questions: [
          {
            text: 'What is 2+2?',
            type: 'MULTIPLE_CHOICE' as any,
            order: 0,
            points: 1,
            options: [
              { text: '3', isCorrect: false },
              { text: '4', isCorrect: true },
              { text: '5', isCorrect: false },
            ],
          },
        ],
      };

      (prisma.module.findUnique as jest.Mock).mockResolvedValue(mockModule);
      (prisma.quiz.create as jest.Mock).mockResolvedValue(mockQuiz);
      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue({
        ...mockQuiz,
        questions: [{ id: 'q1', question: 'What is 2+2?', order: 0 }],
        module: mockModule,
      });

      const result = await quizService.createQuiz(quizData, 'user-id');

      expect(result).toBeDefined();
      expect(result!.id).toBe('quiz-id');
      expect(prisma.module.findUnique).toHaveBeenCalledWith({
        where: { id: 'module-id' },
        include: { course: { select: { id: true, title: true } } },
      });
    });

    it('should throw error if module not found', async () => {
      (prisma.module.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        quizService.createQuiz(
          { moduleId: 'invalid-id', title: 'Test', questions: [], passingScore: 70, maxAttempts: 3 },
          'user-id'
        )
      ).rejects.toThrow('Módulo no encontrado');
    });
  });

  describe('updateQuiz', () => {
    it('should update quiz and replace questions', async () => {
      const existingQuiz = {
        id: 'quiz-id',
        title: 'Old Title',
        description: 'Old Description',
        passingScore: 60,
        timeLimit: 20,
        attempts: 2,
        module: { id: 'module-id', course: { id: 'course-id' } },
        questions: [{ id: 'old-q1', question: 'Old Question' }],
      };

      const updateData = {
        title: 'Updated Title',
        passingScore: 80,
        questions: [
          {
            text: 'New Question?',
            type: 'TRUE_FALSE' as any,
            order: 0,
            points: 1,
            options: [
              { text: 'True', isCorrect: true },
              { text: 'False', isCorrect: false },
            ],
          },
        ],
      };

      (prisma.quiz.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingQuiz)
        .mockResolvedValueOnce({
          ...existingQuiz,
          title: 'Updated Title',
          passingScore: 80,
          questions: [{ id: 'new-q1', question: 'New Question?' }],
        });

      (prisma.quiz.update as jest.Mock).mockResolvedValue({
        ...existingQuiz,
        title: 'Updated Title',
        passingScore: 80,
      });

      const result = await quizService.updateQuiz(
        'quiz-id',
        updateData,
        'user-id',
        UserRole.INSTRUCTOR
      );

      expect(result).toBeDefined();
      expect(result!.title).toBe('Updated Title');
      expect(prisma.question.deleteMany).toHaveBeenCalledWith({
        where: { quizId: 'quiz-id' },
      });
      expect(prisma.question.createMany).toHaveBeenCalled();
    });

    it('should throw error if quiz not found', async () => {
      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        quizService.updateQuiz('invalid-id', {}, 'user-id', UserRole.ADMIN)
      ).rejects.toThrow('Quiz no encontrado');
    });
  });

  describe('deleteQuiz', () => {
    it('should delete quiz successfully', async () => {
      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue({
        id: 'quiz-id',
        quizAttempts: [],
      });

      (prisma.quiz.delete as jest.Mock).mockResolvedValue({ id: 'quiz-id' });

      const result = await quizService.deleteQuiz('quiz-id');

      expect(result).toBe(true);
      expect(prisma.quiz.delete).toHaveBeenCalledWith({
        where: { id: 'quiz-id' },
      });
    });

    it('should throw error if quiz not found', async () => {
      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(quizService.deleteQuiz('invalid-id')).rejects.toThrow(
        'Quiz no encontrado'
      );
    });
  });

  describe('getModuleQuizzes', () => {
    it('should return all quizzes for a module with user attempts', async () => {
      const mockModule = { id: 'module-id', courseId: 'course-id' };
      const mockEnrollment = { userId: 'user-id', courseId: 'course-id' };
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'Quiz 1',
          description: 'Description 1',
          passingScore: 70,
          timeLimit: 30,
          attempts: 3,
          _count: { questions: 5 },
        },
      ];

      (prisma.module.findUnique as jest.Mock).mockResolvedValue(mockModule);
      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollment);
      (prisma.quiz.findMany as jest.Mock).mockResolvedValue(mockQuizzes);
      (prisma.quizAttempt.count as jest.Mock).mockResolvedValue(1);
      (prisma.quizAttempt.findFirst as jest.Mock).mockResolvedValue({
        score: 85,
        passed: true,
        completedAt: new Date(),
      });

      const result = await quizService.getModuleQuizzes('module-id', 'user-id');

      expect(result).toHaveLength(1);
      expect(result![0].questionsCount).toBe(5);
      expect(result![0].userAttempts).toBe(1);
      expect(result![0].canAttempt).toBe(true);
      expect(result![0].lastAttempt?.score).toBe(85);
    });

    it('should throw error if not enrolled', async () => {
      (prisma.module.findUnique as jest.Mock).mockResolvedValue({
        id: 'module-id',
        courseId: 'course-id',
      });
      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        quizService.getModuleQuizzes('module-id', 'user-id')
      ).rejects.toThrow('No estás inscrito en este curso');
    });
  });

  describe('submitQuizAttempt', () => {
    it('should calculate score correctly and create attempt', async () => {
      const mockQuiz = {
        id: 'quiz-id',
        passingScore: 70,
        attempts: 3,
        module: { courseId: 'course-id' },
        questions: [
          {
            id: 'q1',
            options: [
              { id: 'opt1', isCorrect: false },
              { id: 'opt2', isCorrect: true },
            ],
          },
          {
            id: 'q2',
            options: [
              { id: 'opt3', isCorrect: true },
              { id: 'opt4', isCorrect: false },
            ],
          },
        ],
      };

      const answers = [
        { questionId: 'q1', selectedOptions: ['opt2'] }, // Correct
        { questionId: 'q2', selectedOptions: ['opt4'] }, // Wrong
      ];

      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);
      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-id',
        courseId: 'course-id',
      });
      (prisma.quizAttempt.count as jest.Mock).mockResolvedValue(0);
      (prisma.quizAttempt.create as jest.Mock).mockResolvedValue({
        id: 'attempt-id',
        score: 50,
        passed: false,
      });

      const result = await quizService.submitQuizAttempt(
        'quiz-id',
        'user-id',
        answers
      );

      expect(result.score).toBe(50); // 1 out of 2 correct
      expect(result.passed).toBe(false);
      expect(result.attemptNumber).toBe(1);
      expect(prisma.quizAttempt.create).toHaveBeenCalled();
    });

    it('should reject if max attempts reached', async () => {
      const mockQuiz = {
        id: 'quiz-id',
        attempts: 3,
        module: { courseId: 'course-id' },
      };

      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);
      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-id',
        courseId: 'course-id',
      });
      (prisma.quizAttempt.count as jest.Mock).mockResolvedValue(3);

      await expect(
        quizService.submitQuizAttempt('quiz-id', 'user-id', [])
      ).rejects.toThrow('Has alcanzado el límite de 3 intentos');
    });
  });
});