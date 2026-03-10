/**
 * Gamification Types
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  category: BadgeCategory;
  requirement: string;
  xpReward: number;
  createdAt: string;
  updatedAt: string;
}

export enum BadgeCategory {
  PROGRESS = 'PROGRESS',
  ACHIEVEMENT = 'ACHIEVEMENT',
  SKILL = 'SKILL',
  SPECIAL = 'SPECIAL',
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: string;
}

export interface XPLevel {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  totalXP: number;
  progressPercentage: number;
}

export interface XPBreakdown {
  lessons: number;
  quizzes: number;
  labs: number;
  projects: number;
  badges: number;
  total: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export enum NotificationType {
  COURSE_ENROLLMENT = 'COURSE_ENROLLMENT',
  LESSON_COMPLETED = 'LESSON_COMPLETED',
  QUIZ_PASSED = 'QUIZ_PASSED',
  QUIZ_FAILED = 'QUIZ_FAILED',
  LAB_COMPLETED = 'LAB_COMPLETED',
  PROJECT_SUBMITTED = 'PROJECT_SUBMITTED',
  PROJECT_GRADED = 'PROJECT_GRADED',
  BADGE_EARNED = 'BADGE_EARNED',
  CERTIFICATE_ISSUED = 'CERTIFICATE_ISSUED',
  SYSTEM = 'SYSTEM',
}
