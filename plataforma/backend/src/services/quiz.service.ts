/**
 * Quiz Service
 * Business logic for quizzes and quiz attempts
 */

import { prisma } from '../utils/prisma';
import { CreateQuizDto, UpdateQuizDto } from '../validators/quiz.validator';
import { UserRole } from '@prisma/client';

interface QuizAnswer {
  questionId: string;
  selectedOptions: string[]; // Array of option IDs
}

class QuizService {
  /**
   * Create a new quiz with questions
   * @param data - Quiz creation data
   * @param userId - ID of the user creating the quiz
   */
  async createQuiz(data: CreateQuizDto, userId: string) {
    // Verify module exists and get course
    const module = await prisma.module.findUnique({
      where: { id: data.moduleId },
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
    });

    if (!module) {
      throw new Error('Módulo no encontrado');
    }

    // Create quiz with questions in transaction
    const quiz = await prisma.$transaction(async (tx) => {
      // Create the quiz
      const createdQuiz = await tx.quiz.create({
        data: {
          moduleId: data.moduleId,
          title: data.title,
          description: data.description || '',
          timeLimit: data.timeLimit || null,
          passingScore: data.passingScore || 70,
          attempts: data.maxAttempts || 3,
        },
      });

      // Create questions
      if (data.questions && data.questions.length > 0) {
        await tx.question.createMany({
          data: data.questions.map((q) => ({
            quizId: createdQuiz.id,
            type: q.type,
            question: q.text,
            order: q.order,
            options: q.options || null,
            correctAnswer: q.correctAnswer || q.options?.filter((o: any) => o.isCorrect) || null,
            explanation: q.explanation || null,
          })),
        });
      }

      // Return quiz with questions
      return await tx.quiz.findUnique({
        where: { id: createdQuiz.id },
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
          module: {
            select: {
              id: true,
              title: true,
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });
    });

    return quiz;
  }

  /**
   * Update a quiz
   * @param id - Quiz ID
   * @param data - Update data
   * @param userId - User making the update
   * @param role - User's role
   */
  async updateQuiz(id: string, data: UpdateQuizDto, userId: string, role: UserRole) {
    // Verify quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: true,
          },
        },
        questions: true,
      },
    });

    if (!existingQuiz) {
      throw new Error('Quiz no encontrado');
    }

    // Check permissions (ADMIN can update any, INSTRUCTOR only their courses)
    if (role === 'INSTRUCTOR') {
      // For now, we assume instructors can edit any quiz in the system
      // In production, you'd check if they're the course instructor
    }

    // Update quiz and questions in transaction
    const updatedQuiz = await prisma.$transaction(async (tx) => {
      // Update quiz basic info
      const quiz = await tx.quiz.update({
        where: { id },
        data: {
          title: data.title || existingQuiz.title,
          description: data.description ?? existingQuiz.description,
          timeLimit: data.timeLimit !== undefined ? data.timeLimit : existingQuiz.timeLimit,
          passingScore: data.passingScore ?? existingQuiz.passingScore,
          attempts: data.maxAttempts ?? existingQuiz.attempts,
        },
      });

      // If questions are provided, replace all existing questions
      if (data.questions && data.questions.length > 0) {
        // Delete existing questions
        await tx.question.deleteMany({
          where: { quizId: id },
        });

        // Create new questions
        await tx.question.createMany({
          data: data.questions.map((q) => ({
            quizId: id,
            type: q.type,
            question: q.text,
            order: q.order,
            options: q.options || null,
            correctAnswer: q.correctAnswer || q.options?.filter((o: any) => o.isCorrect) || null,
            explanation: q.explanation || null,
          })),
        });
      }

      // Return updated quiz with questions
      return await tx.quiz.findUnique({
        where: { id },
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
          module: {
            select: {
              id: true,
              title: true,
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });
    });

    return updatedQuiz;
  }

  /**
   * Delete a quiz
   * @param id - Quiz ID
   */
  async deleteQuiz(id: string) {
    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        quizAttempts: {
          take: 1,
        },
      },
    });

    if (!quiz) {
      throw new Error('Quiz no encontrado');
    }

    // Delete quiz (cascade deletes questions and attempts)
    await prisma.quiz.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Get all quizzes for a module
   * @param moduleId - Module ID
   * @param userId - User ID to check enrollment
   */
  async getModuleQuizzes(moduleId: string, userId: string) {
    // Verify module exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: {
        id: true,
        courseId: true,
      },
    });

    if (!module) {
      throw new Error('Módulo no encontrado');
    }

    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new Error('No estás inscrito en este curso');
    }

    // Get all quizzes for the module
    const quizzes = await prisma.quiz.findMany({
      where: { moduleId },
      select: {
        id: true,
        title: true,
        description: true,
        passingScore: true,
        timeLimit: true,
        attempts: true,
        _count: {
          select: { questions: true },
        },
      },
    });

    // Get user attempts for each quiz
    const quizzesWithAttempts = await Promise.all(
      quizzes.map(async (quiz) => {
        const attempts = await prisma.quizAttempt.count({
          where: {
            userId,
            quizId: quiz.id,
          },
        });

        const lastAttempt = await prisma.quizAttempt.findFirst({
          where: {
            userId,
            quizId: quiz.id,
          },
          orderBy: { completedAt: 'desc' },
          select: {
            score: true,
            passed: true,
            completedAt: true,
          },
        });

        return {
          ...quiz,
          questionsCount: quiz._count.questions,
          userAttempts: attempts,
          canAttempt: attempts < quiz.attempts,
          lastAttempt,
        };
      })
    );

    return quizzesWithAttempts;
  }
  /**
   * Get a quiz by ID with questions
   * @param quizId - Quiz ID
   * @param userId - User ID to check enrollment
   */
  async getQuiz(quizId: string, userId: string) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            type: true,
            options: true, // This will include correct answer info
            order: true,
          },
          orderBy: { order: 'asc' },
        },
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new Error('Quiz no encontrado');
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: quiz.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new Error('No estás inscrito en este curso');
    }

    // Get user's previous attempts
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId,
      },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        score: true,
        passed: true,
        completedAt: true,
        startedAt: true,
      },
    });

    // Check if user can attempt quiz
    const canAttempt = attempts.length < quiz.attempts;
    const hasPassed = attempts.some((attempt) => attempt.passed);

    // Remove correct answers from questions for security
    const questionsWithoutAnswers = quiz.questions.map((question) => {
      const options = Array.isArray(question.options) ? question.options : [];
      const sanitizedOptions = options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        // Do NOT include 'isCorrect' field
      }));

      return {
        id: question.id,
        question: question.question,
        type: question.type,
        options: sanitizedOptions,
        order: question.order,
      };
    });

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      maxAttempts: quiz.attempts, // Use correct field name from schema
      questions: questionsWithoutAnswers,
      attempts,
      canAttempt,
      hasPassed,
    };
  }

  /**
   * Submit a quiz attempt
   * @param quizId - Quiz ID
   * @param userId - User ID
   * @param answers - User's answers
   */
  async submitQuizAttempt(quizId: string, userId: string, answers: QuizAnswer[]) {
    // Get quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        module: {
          select: {
            courseId: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new Error('Quiz no encontrado');
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: quiz.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new Error('No estás inscrito en este curso');
    }

    // Check attempts limit
    const previousAttempts = await prisma.quizAttempt.count({
      where: { userId, quizId },
    });

    if (previousAttempts >= quiz.attempts) {
      throw new Error(`Has alcanzado el límite de ${quiz.attempts} intentos`);
    }

    // Calculate score (all questions worth 1 point each)
    let totalPoints = 0;
    let earnedPoints = 0;
    const results: any[] = [];

    for (const question of quiz.questions) {
      totalPoints += 1; // Each question worth 1 point

      const userAnswer = answers.find((a) => a.questionId === question.id);
      const options = Array.isArray(question.options) ? question.options : [];

      const correctOptions = options
        .filter((opt: any) => opt.isCorrect)
        .map((opt: any) => opt.id);

      const selectedOptions = userAnswer?.selectedOptions || [];

      // Check if answer is correct
      const isCorrect =
        selectedOptions.length === correctOptions.length &&
        selectedOptions.every((id) => correctOptions.includes(id));

      if (isCorrect) {
        earnedPoints += 1; // Award 1 point for correct answer
      }

      results.push({
        questionId: question.id,
        isCorrect,
        selectedOptions,
        correctOptions,
        points: isCorrect ? 1 : 0,
      });
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passingScore;

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        answers: answers as any,
        score,
        passed,
        completedAt: new Date(),
      },
    });

    return {
      attemptId: attempt.id,
      attemptNumber: previousAttempts + 1, // Calculate based on count
      score,
      passed,
      passingScore: quiz.passingScore,
      results,
      totalPoints,
      earnedPoints,
    };
  }

  /**
   * Get quiz attempt details
   * @param attemptId - Attempt ID
   * @param userId - User ID
   */
  async getQuizAttempt(attemptId: string, userId: string) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new Error('Intento no encontrado');
    }

    if (attempt.userId !== userId) {
      throw new Error('No tienes permiso para ver este intento');
    }

    // Build detailed results
    const userAnswers = Array.isArray(attempt.answers) ? attempt.answers : [];
    const results = attempt.quiz.questions.map((question) => {
      const options = Array.isArray(question.options) ? question.options : [];
      const userAnswer = (userAnswers as QuizAnswer[]).find(
        (a) => a.questionId === question.id
      );

      const correctOptions = options
        .filter((opt: any) => opt.isCorrect)
        .map((opt: any) => opt.id);

      const selectedOptions = userAnswer?.selectedOptions || [];

      const isCorrect =
        selectedOptions.length === correctOptions.length &&
        selectedOptions.every((id) => correctOptions.includes(id));

      return {
        questionId: question.id,
        question: question.question,
        type: question.type,
        options: options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          wasSelected: selectedOptions.includes(opt.id),
        })),
        isCorrect,
        points: 1, // Each question worth 1 point
        earnedPoints: isCorrect ? 1 : 0,
      };
    });

    // Calculate attempt number by counting previous attempts
    const attemptCount = await prisma.quizAttempt.count({
      where: {
        userId: attempt.userId,
        quizId: attempt.quizId,
        startedAt: { lte: attempt.startedAt },
      },
    });

    return {
      attemptId: attempt.id,
      attemptNumber: attemptCount,
      score: attempt.score,
      passed: attempt.passed,
      completedAt: attempt.completedAt,
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        passingScore: attempt.quiz.passingScore,
      },
      results,
    };
  }

  /**
   * Get all attempts for a quiz by a user
   * @param quizId - Quiz ID
   * @param userId - User ID
   */
  async getQuizAttempts(quizId: string, userId: string) {
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId,
      },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        score: true,
        passed: true,
        completedAt: true,
        startedAt: true,
      },
    });

    // Add attempt numbers based on order
    return attempts.map((attempt, index) => ({
      ...attempt,
      attemptNumber: attempts.length - index,
    }));
  }
}

export default new QuizService();
