/**
 * Audit Log Service
 * Tracks all course management actions for compliance and history
 */

import { prisma } from '../utils/prisma';
import logger from '../utils/logger';
import { AuditLog } from '@prisma/client';
import {
  AuditAction,
  AuditLogEntry,
  AuditMetadata,
  LogFilters,
  AuditLogWithUser,
  AuditSummary,
} from '../types/auditLog';

export class AuditLogService {
  /**
   * Log an action to the audit trail
   * @param action Audit log entry data
   * @returns Created audit log entry
   */
  async logAction(action: AuditLogEntry): Promise<AuditLog> {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: action.userId,
          action: action.action,
          entityType: action.entityType,
          entityId: action.entityId,
          metadata: action.metadata || {},
        },
      });

      logger.info(`Audit log created: ${action.action} on ${action.entityType} ${action.entityId} by user ${action.userId}`);
      return auditLog;
    } catch (error) {
      logger.error('Error creating audit log:', error);
      // Don't throw error to avoid disrupting the main operation
      // Audit logging should be non-blocking
      return null as any;
    }
  }

  /**
   * Get audit logs for a specific course
   * @param courseId Course ID
   * @param filters Optional filters
   * @returns Array of audit logs
   */
  async getLogsForCourse(courseId: string, filters?: LogFilters): Promise<AuditLogWithUser[]> {
    try {
      const where: any = {
        entityId: courseId,
        entityType: 'Course',
      };

      // Apply filters
      if (filters) {
        if (filters.userId) where.userId = filters.userId;
        if (filters.action) {
          if (Array.isArray(filters.action)) {
            where.action = { in: filters.action };
          } else {
            where.action = filters.action;
          }
        }
        if (filters.startDate || filters.endDate) {
          where.createdAt = {};
          if (filters.startDate) where.createdAt.gte = filters.startDate;
          if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: filters?.sortOrder || 'desc',
        },
        take: filters?.limit || 100,
        skip: filters?.page ? (filters.page - 1) * (filters.limit || 100) : 0,
      });

      // Fetch user information
      const userIds = [...new Set(logs.map(log => log.userId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      const userMap = new Map(users.map(u => [u.id, u]));

      // Combine logs with user data
      const logsWithUser = logs.map(log => ({
        ...log,
        user: userMap.get(log.userId),
      }));

      return logsWithUser;
    } catch (error) {
      logger.error('Error getting logs for course:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   * @param userId User ID
   * @param filters Optional filters
   * @returns Array of audit logs
   */
  async getLogsForUser(userId: string, filters?: LogFilters): Promise<AuditLogWithUser[]> {
    try {
      const where: any = { userId };

      // Apply filters
      if (filters) {
        if (filters.entityType) where.entityType = filters.entityType;
        if (filters.entityId) where.entityId = filters.entityId;
        if (filters.action) {
          if (Array.isArray(filters.action)) {
            where.action = { in: filters.action };
          } else {
            where.action = filters.action;
          }
        }
        if (filters.startDate || filters.endDate) {
          where.createdAt = {};
          if (filters.startDate) where.createdAt.gte = filters.startDate;
          if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: filters?.sortOrder || 'desc',
        },
        take: filters?.limit || 100,
        skip: filters?.page ? (filters.page - 1) * (filters.limit || 100) : 0,
      });

      // Fetch user information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      // Combine logs with user data
      const logsWithUser = logs.map(log => ({
        ...log,
        user,
      }));

      return logsWithUser;
    } catch (error) {
      logger.error('Error getting logs for user:', error);
      throw error;
    }
  }

  /**
   * Get all logs with optional filters
   * @param filters Optional filters
   * @returns Array of audit logs
   */
  async getLogs(filters?: LogFilters): Promise<AuditLogWithUser[]> {
    try {
      const where: any = {};

      // Apply filters
      if (filters) {
        if (filters.userId) where.userId = filters.userId;
        if (filters.entityType) where.entityType = filters.entityType;
        if (filters.entityId) where.entityId = filters.entityId;
        if (filters.action) {
          if (Array.isArray(filters.action)) {
            where.action = { in: filters.action };
          } else {
            where.action = filters.action;
          }
        }
        if (filters.startDate || filters.endDate) {
          where.createdAt = {};
          if (filters.startDate) where.createdAt.gte = filters.startDate;
          if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: filters?.sortOrder || 'desc',
        },
        take: filters?.limit || 100,
        skip: filters?.page ? (filters.page - 1) * (filters.limit || 100) : 0,
      });

      // Fetch all users mentioned in logs
      const userIds = [...new Set(logs.map(log => log.userId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      const userMap = new Map(users.map(u => [u.id, u]));

      // Combine logs with user data
      const logsWithUser = logs.map(log => ({
        ...log,
        user: userMap.get(log.userId),
      }));

      return logsWithUser;
    } catch (error) {
      logger.error('Error getting logs:', error);
      throw error;
    }
  }

  /**
   * Get audit summary statistics
   * @param filters Optional filters
   * @returns Audit summary
   */
  async getAuditSummary(filters?: LogFilters): Promise<AuditSummary> {
    try {
      const where: any = {};

      // Apply date filters
      const startDate = filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = filters?.endDate || new Date();

      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };

      // Get total actions
      const totalActions = await prisma.auditLog.count({ where });

      // Get actions by type
      const actionGroups = await prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true,
        },
      });

      const actionsByType: Record<string, number> = {};
      actionGroups.forEach(group => {
        actionsByType[group.action] = group._count.action;
      });

      // Get top users
      const userGroups = await prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: {
          userId: true,
        },
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
        take: 5,
      });

      const userIds = userGroups.map(g => g.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
        },
      });

      const userMap = new Map(users.map(u => [u.id, u.name]));

      const topUsers = userGroups.map(group => ({
        userId: group.userId,
        name: userMap.get(group.userId) || 'Unknown',
        actionCount: group._count.userId,
      }));

      // Get recent actions
      const recentLogs = await this.getLogs({
        ...filters,
        limit: 10,
        sortOrder: 'desc',
      });

      return {
        totalActions,
        actionsByType,
        topUsers,
        recentActions: recentLogs,
        timeRange: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error) {
      logger.error('Error getting audit summary:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs (retention policy)
   * @param daysToKeep Number of days to keep logs (default 90)
   * @returns Number of deleted logs
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${result.count} audit logs older than ${daysToKeep} days`);
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old logs:', error);
      throw error;
    }
  }

  /**
   * Helper method to create metadata for course changes
   * @param before Previous state
   * @param after New state
   * @param additionalData Additional context
   * @returns Audit metadata
   */
  createChangeMetadata(
    before: any,
    after: any,
    additionalData?: Record<string, any>
  ): AuditMetadata {
    const changes: string[] = [];

    // Detect changed fields
    if (before && after) {
      Object.keys(after).forEach(key => {
        if (before[key] !== after[key]) {
          changes.push(key);
        }
      });
    }

    return {
      before: before ? this.sanitizeMetadata(before) : undefined,
      after: after ? this.sanitizeMetadata(after) : undefined,
      changes,
      ...additionalData,
    };
  }

  /**
   * Sanitize metadata to remove sensitive information
   * @param data Raw metadata
   * @returns Sanitized metadata
   */
  private sanitizeMetadata(data: any): any {
    const sanitized = { ...data };

    // Remove sensitive fields
    delete sanitized.passwordHash;
    delete sanitized.token;
    delete sanitized.secret;

    return sanitized;
  }
}

// Export singleton instance
export default new AuditLogService();