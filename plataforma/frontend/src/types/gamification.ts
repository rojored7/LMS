/**
 * Gamification Types - Adapted for FastAPI backend
 */

export interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  color?: string;
  xp_reward: number;
  created_at?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  badge?: Badge;
  awarded_at: string;
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
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
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
