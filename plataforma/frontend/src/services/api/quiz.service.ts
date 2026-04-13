/**
 * Quiz Service
 * API client for quiz-related operations
 */

import api from '../api';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options: QuizOption[];
  order: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  attempts: number; // max allowed attempts (int from backend)
  moduleId: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  attemptNumber: number;
  maxAttempts: number;
}

/**
 * Normalize options from backend format (string[]) to QuizOption[]
 */
function normalizeOptions(raw: unknown): QuizOption[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item, index) => {
      if (typeof item === 'string') {
        return { id: String(index), text: item };
      }
      if (typeof item === 'object' && item !== null && 'text' in item) {
        return { id: (item as any).id || String(index), text: (item as any).text };
      }
      return { id: String(index), text: String(item) };
    });
  }
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, string>).map(([key, value]) => ({
      id: key,
      text: String(value),
    }));
  }
  return [];
}

/**
 * Normalize quiz response from backend
 */
function normalizeQuiz(data: any): Quiz {
  return {
    ...data,
    questions: (data.questions || []).map((q: any) => ({
      ...q,
      options: normalizeOptions(q.options),
    })),
  };
}

/**
 * Get a quiz with questions
 */
export const getQuiz = async (quizId: string): Promise<Quiz> => {
  const response = await api.get(`/quizzes/${quizId}`);
  const data = (response as any).data || response;
  return normalizeQuiz(data);
};

/**
 * Submit a quiz attempt
 * Backend expects: { answers: { "questionId": "selectedOptionIndex" } }
 */
export const submitQuiz = async (
  quizId: string,
  answers: Record<string, string>
): Promise<QuizResult> => {
  const response = await api.post(`/quizzes/${quizId}/attempt`, { answers });
  return (response as any).data || response;
};

export default {
  getQuiz,
  submitQuiz,
};
