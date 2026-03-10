/**
 * Type definitions for audit logging functionality
 */

export type AuditAction =
  | 'COURSE_CREATED'
  | 'COURSE_UPDATED'
  | 'COURSE_DELETED'
  | 'COURSE_PUBLISHED'
  | 'COURSE_UNPUBLISHED'
  | 'COURSE_IMPORTED'
  | 'COURSE_EXPORTED'
  | 'COURSE_DUPLICATED'
  | 'MODULE_CREATED'
  | 'MODULE_UPDATED'
  | 'MODULE_DELETED'
  | 'MODULE_REORDERED'
  | 'LESSON_CREATED'
  | 'LESSON_UPDATED'
  | 'LESSON_DELETED'
  | 'LESSON_REORDERED'
  | 'QUIZ_CREATED'
  | 'QUIZ_UPDATED'
  | 'QUIZ_DELETED'
  | 'LAB_CREATED'
  | 'LAB_UPDATED'
  | 'LAB_DELETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'CONTENT_BULK_IMPORTED'
  | 'CONTENT_BULK_EXPORTED';

export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entityType: 'Course' | 'Module' | 'Lesson' | 'Quiz' | 'Lab' | 'Project';
  entityId: string;
  metadata?: AuditMetadata;
}

export interface AuditMetadata {
  before?: any;
  after?: any;
  changes?: string[];
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  fileSize?: number;
  filename?: string;
}

export interface LogFilters {
  userId?: string;
  action?: AuditAction | AuditAction[];
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogWithUser {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: any;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface AuditSummary {
  totalActions: number;
  actionsByType: Record<string, number>;
  topUsers: Array<{
    userId: string;
    name: string;
    actionCount: number;
  }>;
  recentActions: AuditLogWithUser[];
  timeRange: {
    start: Date;
    end: Date;
  };
}