/**
 * Gamification Types - Adapted for FastAPI backend
 */

export interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  iconUrl?: string;
  color?: string;
  xpReward: number;
  courseId?: string;
  level?: string;
  durationHours?: number;
  source?: string;
  isExternal?: boolean;
  category?: string;
  requirement?: string;
  createdAt?: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge?: Badge;
  earnedAt: string;
  enrolledAt?: string;
  completedAt?: string;
  courseId?: string;
}

export interface XPLevel {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  totalXP: number;
  progressPercentage: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export enum NotificationType {
  BADGE_AWARDED = 'BADGE_AWARDED',
  COURSE_COMPLETED = 'COURSE_COMPLETED',
  CERTIFICATE_ISSUED = 'CERTIFICATE_ISSUED',
  QUIZ_PASSED = 'QUIZ_PASSED',
  LAB_PASSED = 'LAB_PASSED',
  PROJECT_GRADED = 'PROJECT_GRADED',
  COURSE_ASSIGNED = 'COURSE_ASSIGNED',
}
