/**
 * Type definitions for content editor functionality
 */

export interface CreateModuleDto {
  title: string;
  description: string;
  duration: number;
  order?: number;
  isPublished?: boolean;
}

export interface UpdateModuleDto {
  title?: string;
  description?: string;
  duration?: number;
  order?: number;
  isPublished?: boolean;
}

export interface CreateLessonDto {
  title: string;
  content: string;
  type?: 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'READING';
  estimatedTime: number;
  order?: number;
}

export interface UpdateLessonDto {
  title?: string;
  content?: string;
  type?: 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'READING';
  estimatedTime?: number;
  order?: number;
}

export interface CreateQuizDto {
  title: string;
  description: string;
  passingScore: number;
  timeLimit?: number;
  attempts?: number;
  questions: CreateQuestionDto[];
}

export interface UpdateQuizDto {
  title?: string;
  description?: string;
  passingScore?: number;
  timeLimit?: number;
  attempts?: number;
  questions?: UpdateQuestionDto[];
}

export interface CreateQuestionDto {
  order: number;
  type: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  question: string;
  options?: any;
  correctAnswer: any;
  explanation?: string;
}

export interface UpdateQuestionDto {
  id?: string;
  order?: number;
  type?: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  question?: string;
  options?: any;
  correctAnswer?: any;
  explanation?: string;
}

export interface CreateLabDto {
  title: string;
  description: string;
  language: string;
  starterCode: string;
  solution?: string;
  tests: any;
  hints?: any;
}

export interface UpdateLabDto {
  title?: string;
  description?: string;
  language?: string;
  starterCode?: string;
  solution?: string;
  tests?: any;
  hints?: any;
}

export interface ReorderItemsDto {
  order: string[]; // Array of IDs in new order
}

export interface ContentValidationResult {
  valid: boolean;
  sanitized: string;
  warnings?: string[];
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
}