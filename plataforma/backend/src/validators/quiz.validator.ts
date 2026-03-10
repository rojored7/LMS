/**
 * Quiz Validator
 * Validation schemas for quiz operations
 */

import { z } from 'zod';

// Schema for creating a quiz question option
const quizOptionSchema = z.object({
  text: z.string().min(1).max(500),
  isCorrect: z.boolean(),
});

// Schema for creating a quiz question
const createQuestionSchema = z.object({
  text: z.string().min(10).max(1000),
  type: z.enum(['MULTIPLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER']),
  points: z.number().min(1).max(100).default(1),
  order: z.number().int().min(0),
  options: z.array(quizOptionSchema).min(2).max(10).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().max(1000).optional(),
});

// Schema for creating a quiz
export const createQuizSchema = z.object({
  body: z.object({
    moduleId: z.string().cuid(),
    title: z.string().min(5).max(200),
    description: z.string().max(1000).optional(),
    timeLimit: z.number().min(5).max(180).nullable().optional(), // minutos
    passingScore: z.number().min(0).max(100).default(70),
    maxAttempts: z.number().min(1).max(10).default(3),
    questions: z.array(createQuestionSchema).min(1).max(50),
  }),
});

// Schema for updating a quiz
export const updateQuizSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(200).optional(),
    description: z.string().max(1000).optional(),
    timeLimit: z.number().min(5).max(180).nullable().optional(),
    passingScore: z.number().min(0).max(100).optional(),
    maxAttempts: z.number().min(1).max(10).optional(),
    questions: z.array(createQuestionSchema).optional(),
  }),
});

// Schema for quiz ID parameter
export const quizIdParamSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

// Schema for submitting quiz answers
export const submitQuizSchema = z.object({
  body: z.object({
    answers: z.array(z.object({
      questionId: z.string().cuid(),
      selectedOptions: z.array(z.string()).min(0),
    })),
  }),
});

export type CreateQuizDto = z.infer<typeof createQuizSchema>['body'];
export type UpdateQuizDto = z.infer<typeof updateQuizSchema>['body'];
export type SubmitQuizDto = z.infer<typeof submitQuizSchema>['body'];