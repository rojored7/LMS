/**
 * Course, Module, Lesson, Quiz, and Lab types
 */

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum LessonType {
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
  QUIZ = 'QUIZ',
  LAB = 'LAB',
  ASSIGNMENT = 'ASSIGNMENT',
}

export enum QuizQuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  CODE = 'CODE',
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  level: CourseLevel;
  status: CourseStatus;
  duration: number; // in minutes
  price: number;
  instructorId: string;
  instructorName?: string;
  tags?: string[];
  modules?: Module[];
  enrollmentCount: number;
  rating?: number;
  ratingCount?: number;
  createdAt: string;
  updatedAt: string;
  isEnrolled?: boolean;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  duration: number; // in minutes
  isPublished: boolean;
  lessons: Lesson[];
  quizzes: Quiz[];
  labs: Lab[];
  userProgress?: number; // 0-100 percentage
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  moduleId?: string;
  title: string;
  description?: string;
  type: LessonType;
  order: number;
  estimatedTime: number; // in minutes
  content?: string; // Text content, video URL, etc.
  videoUrl?: string;
  resources?: Resource[];
  isCompleted?: boolean; // Set by backend when userId is provided
  createdAt?: string;
  updatedAt?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: string; // 'pdf', 'video', 'link', etc.
  url: string;
  size?: number;
}

export interface Quiz {
  id: string;
  moduleId?: string;
  title: string;
  description?: string;
  passingScore: number; // percentage
  timeLimit?: number; // in minutes
  attempts: number; // max attempts allowed
  questions?: QuizQuestion[];
  isPassed?: boolean; // Set by backend when userId is provided
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  type: QuizQuestionType;
  options?: string[]; // For multiple choice
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
  order: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  answers: QuizAnswer[];
  startedAt: string;
  completedAt?: string;
  isPassed: boolean;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
}

export interface Lab {
  id: string;
  moduleId?: string;
  title: string;
  description?: string;
  language: string; // Programming language
  difficulty?: CourseLevel;
  estimatedTime?: number; // in minutes
  objectives?: string[];
  tasks?: LabTask[];
  resources?: Resource[];
  isPassed?: boolean; // Set by backend when userId is provided
  createdAt?: string;
  updatedAt?: string;
}

export interface LabTask {
  id: string;
  title: string;
  description: string;
  order: number;
  isRequired: boolean;
  validationCriteria?: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  progress: number; // percentage
  completedLessons: string[];
  lastAccessedAt: string;
  certificateId?: string;
}

/**
 * Enrollment with nested course data
 * This is the structure returned by the backend for enrolled courses
 */
export interface EnrollmentWithCourse {
  id: string;
  userId: string;
  courseId: string;
  progress: number; // Individual user progress (0-100)
  enrolledAt: string;
  completedAt: string | null;
  course: {
    id: string;
    slug: string;
    title: string;
    description: string;
    level: CourseLevel;
    duration: number;
    thumbnail: string | null;
    isPublished: boolean;
    tags: string[];
    prerequisites: string[];
    objectives: string[];
    createdAt: string;
    updatedAt: string;
    modules: Module[];
  };
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
  certificateUrl: string;
  verificationCode: string;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastLessonId?: string;
  timeSpent: number; // in minutes
  updatedAt: string;
}
