/**
 * Type definitions for course import functionality
 */

export interface CourseStructure {
  readme: string;
  modules: ModuleStructure[];
  metadata: CourseMetadata;
}

export interface CourseMetadata {
  title: string;
  description: string;
  author: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  duration: number;
  tags: string[];
  version?: string;
  thumbnail?: string;
}

export interface ModuleStructure {
  name: string;
  order: number;
  description?: string;
  lessons: LessonFile[];
  quizzes: QuizFile[];
  labs: LabFile[];
}

export interface LessonFile {
  filename: string;
  title: string;
  content: string;
  order: number;
  type?: 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'READING';
  estimatedTime?: number;
}

export interface QuizFile {
  filename: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimit?: number;
  attempts: number;
  questions: QuestionData[];
}

export interface QuestionData {
  order: number;
  type: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  question: string;
  options?: string[];
  correctAnswer: string | string[] | boolean;
  explanation?: string;
}

export interface LabFile {
  filename: string;
  title: string;
  description: string;
  language: string;
  starterCode: string;
  solution?: string;
  tests: TestCase[];
  hints?: string[];
}

export interface TestCase {
  name: string;
  input?: string;
  expectedOutput?: string;
  validator?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'STRUCTURE' | 'CONTENT' | 'FORMAT' | 'MISSING_REQUIRED';
  message: string;
  path?: string;
}

export interface ValidationWarning {
  type: 'RECOMMENDATION' | 'IMPROVEMENT' | 'BEST_PRACTICE';
  message: string;
  path?: string;
}

export interface MarkdownFiles {
  [path: string]: {
    content: string;
    frontmatter?: Record<string, any>;
  };
}

export interface FileStructure {
  [path: string]: string | Buffer;
}

// Error classes
export class InvalidZipStructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidZipStructureError';
  }
}

export class MissingRequiredFilesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingRequiredFilesError';
  }
}

export class InvalidMarkdownError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMarkdownError';
  }
}

export class DuplicateCourseSlugError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateCourseSlugError';
  }
}