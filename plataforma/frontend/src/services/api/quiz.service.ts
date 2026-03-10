/**
 * Quiz Service
 * API client for quiz-related operations
 */

import api from '../api';

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  options: QuizOption[];
  points: number;
  order: number;
}

export interface QuizOption {
  id: string;
  text: string;
  // isCorrect is NOT included when fetching quiz (security)
}

export interface QuizAttemptSummary {
  id: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  completedAt: Date;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  maxAttempts?: number;
  questions: QuizQuestion[];
  attempts: QuizAttemptSummary[];
  canAttempt: boolean;
  hasPassed: boolean;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptions: string[]; // Array of option IDs
}

export interface QuizResult {
  attemptId: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  passingScore: number;
  results: QuestionResult[];
  totalPoints: number;
  earnedPoints: number;
}

export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  selectedOptions: string[];
  correctOptions: string[];
  points: number;
}

export interface QuizAttemptDetail {
  attemptId: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  completedAt: Date;
  quiz: {
    id: string;
    title: string;
    passingScore: number;
  };
  results: DetailedQuestionResult[];
}

export interface DetailedQuestionResult {
  questionId: string;
  question: string;
  type: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    wasSelected: boolean;
  }[];
  isCorrect: boolean;
  points: number;
  earnedPoints: number;
}

/**
 * Get a quiz with questions (without correct answers)
 * @param quizId - Quiz ID
 */
export const getQuiz = async (quizId: string): Promise<Quiz> => {
  const response = await api.get(`/quizzes/${quizId}`);
  return response.data;
};

/**
 * Submit a quiz attempt
 * @param quizId - Quiz ID
 * @param answers - User's answers
 */
export const submitQuiz = async (
  quizId: string,
  answers: QuizAnswer[]
): Promise<QuizResult> => {
  const response = await api.post(`/quizzes/${quizId}/submit`, { answers });
  return response.data;
};

/**
 * Get all attempts for a quiz
 * @param quizId - Quiz ID
 */
export const getQuizAttempts = async (quizId: string): Promise<QuizAttemptSummary[]> => {
  const response = await api.get(`/quizzes/${quizId}/attempts`);
  return response.data;
};

/**
 * Get quiz attempt details
 * @param attemptId - Attempt ID
 */
export const getQuizAttempt = async (attemptId: string): Promise<QuizAttemptDetail> => {
  const response = await api.get(`/quizzes/attempts/${attemptId}`);
  return response.data;
};

export default {
  getQuiz,
  submitQuiz,
  getQuizAttempts,
  getQuizAttempt,
};
