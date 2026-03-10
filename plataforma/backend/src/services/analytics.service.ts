/**
 * Analytics Service
 * Business logic for course and student analytics
 */

import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';
import { subDays } from 'date-fns';

interface CourseAnalytics {
  totalEnrollments: number;
  completions: number;
  completionRate: number;
  avgProgress: number;
  activeStudents: number;
}

interface QuizAnalytics {
  quizId: string;
  title: string;
  attempts: number;
  avgScore: number;
  passRate: number;
  uniqueStudents: number;
}

interface EngagementMetrics {
  moduleId: string;
  moduleTitle: string;
  avgTimeSpent: number;
  completionRate: number;
  dropoffRate: number;
}

class AnalyticsService {
  /**
   * Get course overview analytics
   */
  async getCourseOverview(courseId: string): Promise<CourseAnalytics> {
    // Try to get from cache first
    const cacheKey = `analytics:course:${courseId}:overview`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Calculate metrics
    const [enrollments, completions, avgProgressResult, activeStudents] = await Promise.all([
      prisma.enrollment.count({
        where: { courseId }
      }),
      prisma.enrollment.count({
        where: {
          courseId,
          completedAt: { not: null }
        }
      }),
      prisma.enrollment.aggregate({
        where: { courseId },
        _avg: { progressPercentage: true }
      }),
      prisma.enrollment.count({
        where: {
          courseId,
          lastAccessedAt: {
            gte: subDays(new Date(), 7)
          }
        }
      })
    ]);

    const data: CourseAnalytics = {
      totalEnrollments: enrollments,
      completions,
      completionRate: enrollments > 0 ? (completions / enrollments) * 100 : 0,
      avgProgress: avgProgressResult._avg.progressPercentage || 0,
      activeStudents
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(data));

    return data;
  }

  /**
   * Get quiz performance analytics
   */
  async getQuizPerformance(courseId: string): Promise<QuizAnalytics[]> {
    const cacheKey = `analytics:course:${courseId}:quiz-performance`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const modules = await prisma.module.findMany({
      where: { courseId },
      include: {
        quizzes: {
          include: {
            quizAttempts: {
              select: {
                score: true,
                passed: true,
                userId: true
              }
            }
          }
        }
      }
    });

    const quizStats: QuizAnalytics[] = modules.flatMap(module =>
      module.quizzes.map(quiz => {
        const attempts = quiz.quizAttempts;
        const totalScore = attempts.reduce((acc, a) => acc + a.score, 0);
        const passedCount = attempts.filter(a => a.passed).length;
        const uniqueUsers = new Set(attempts.map(a => a.userId));

        return {
          quizId: quiz.id,
          title: quiz.title,
          attempts: attempts.length,
          avgScore: attempts.length > 0 ? totalScore / attempts.length : 0,
          passRate: attempts.length > 0 ? (passedCount / attempts.length) * 100 : 0,
          uniqueStudents: uniqueUsers.size
        };
      })
    );

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(quizStats));

    return quizStats;
  }

  /**
   * Get engagement metrics by module
   */
  async getEngagementMetrics(courseId: string): Promise<EngagementMetrics[]> {
    const modules = await prisma.module.findMany({
      where: { courseId },
      include: {
        userProgress: {
          select: {
            completed: true,
            progress: true,
            timeSpent: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    const metrics: EngagementMetrics[] = modules.map(module => {
      const progress = module.userProgress;
      const totalProgress = progress.length;
      const completed = progress.filter(p => p.completed).length;
      const avgTime = progress.reduce((acc, p) => acc + (p.timeSpent || 0), 0) / (totalProgress || 1);

      // Calculate dropoff (users who started but didn't complete)
      const started = progress.filter(p => p.progress > 0).length;
      const dropoff = started > 0 ? ((started - completed) / started) * 100 : 0;

      return {
        moduleId: module.id,
        moduleTitle: module.title,
        avgTimeSpent: avgTime,
        completionRate: totalProgress > 0 ? (completed / totalProgress) * 100 : 0,
        dropoffRate: dropoff
      };
    });

    return metrics;
  }

  /**
   * Get lab completion statistics
   */
  async getLabSuccess(courseId: string) {
    const modules = await prisma.module.findMany({
      where: { courseId },
      include: {
        labs: {
          include: {
            submissions: {
              select: {
                passed: true,
                attempts: true,
                userId: true,
                executionTime: true
              }
            }
          }
        }
      }
    });

    const labStats = modules.flatMap(module =>
      module.labs.map(lab => {
        const submissions = lab.submissions;
        const passedSubmissions = submissions.filter(s => s.passed);
        const avgAttempts = submissions.reduce((acc, s) => acc + s.attempts, 0) / (submissions.length || 1);
        const avgExecutionTime = submissions.reduce((acc, s) => acc + (s.executionTime || 0), 0) / (submissions.length || 1);

        return {
          labId: lab.id,
          title: lab.title,
          totalSubmissions: submissions.length,
          successRate: submissions.length > 0 ? (passedSubmissions.length / submissions.length) * 100 : 0,
          avgAttempts,
          avgExecutionTime: avgExecutionTime / 1000, // Convert to seconds
          uniqueStudents: new Set(submissions.map(s => s.userId)).size
        };
      })
    );

    return labStats;
  }

  /**
   * Get time to complete statistics
   */
  async getTimeToComplete(courseId: string) {
    const completedEnrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
        completedAt: { not: null }
      },
      select: {
        enrolledAt: true,
        completedAt: true
      }
    });

    if (completedEnrollments.length === 0) {
      return {
        avgDays: 0,
        minDays: 0,
        maxDays: 0,
        median: 0
      };
    }

    const completionTimes = completedEnrollments
      .map(e => {
        const enrolled = new Date(e.enrolledAt).getTime();
        const completed = new Date(e.completedAt!).getTime();
        return (completed - enrolled) / (1000 * 60 * 60 * 24); // Convert to days
      })
      .sort((a, b) => a - b);

    const avgDays = completionTimes.reduce((acc, t) => acc + t, 0) / completionTimes.length;
    const minDays = completionTimes[0];
    const maxDays = completionTimes[completionTimes.length - 1];
    const median = completionTimes[Math.floor(completionTimes.length / 2)];

    return {
      avgDays: Math.round(avgDays),
      minDays: Math.round(minDays),
      maxDays: Math.round(maxDays),
      median: Math.round(median)
    };
  }
}

export default new AnalyticsService();