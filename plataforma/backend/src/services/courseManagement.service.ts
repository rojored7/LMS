/**
 * Course Management Service
 * Handles CRUD operations for courses at the metadata level
 */

import { prisma } from '../utils/prisma';
import logger from '../utils/logger';
import { Course, Prisma, UserRole } from '@prisma/client';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseFilters,
  CourseWithContent,
  CoursePaginated,
  CourseStats,
  DuplicateCourseOptions,
} from '../types/courseManagement';

export class CourseManagementService {
  /**
   * Create a new course manually
   * @param data Course creation data
   * @param authorId ID of the course author
   * @returns Created course
   */
  async createCourse(data: CreateCourseDto, authorId: string): Promise<Course> {
    try {
      // Check for duplicate slug
      const existingCourse = await prisma.course.findUnique({
        where: { slug: data.slug },
      });

      if (existingCourse) {
        throw new Error(`Course with slug "${data.slug}" already exists`);
      }

      // Create course
      const course = await prisma.course.create({
        data: {
          slug: data.slug,
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          duration: data.duration,
          level: data.level,
          tags: data.tags || [],
          author: data.author,
          version: data.version || '1.0',
          price: data.price || 0,
          isPublished: data.isPublished || false,
        },
      });

      logger.info(`Course created: ${course.id} by user ${authorId}`);
      return course;
    } catch (error) {
      logger.error('Error creating course:', error);
      throw error;
    }
  }

  /**
   * Update course metadata
   * @param id Course ID
   * @param data Update data
   * @param userId User requesting the update
   * @returns Updated course
   */
  async updateCourse(id: string, data: UpdateCourseDto, userId: string): Promise<Course> {
    try {
      // Check if user can update the course
      const canUpdate = await this.canUserModifyCourse(id, userId);

      if (!canUpdate) {
        throw new Error('You do not have permission to update this course');
      }

      // Check for slug conflicts if updating slug
      if (data.slug) {
        const existingCourse = await prisma.course.findFirst({
          where: {
            slug: data.slug,
            NOT: { id },
          },
        });

        if (existingCourse) {
          throw new Error(`Course with slug "${data.slug}" already exists`);
        }
      }

      // Update course
      const course = await prisma.course.update({
        where: { id },
        data: {
          slug: data.slug,
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          duration: data.duration,
          level: data.level,
          tags: data.tags,
          author: data.author,
          version: data.version,
          price: data.price,
          isPublished: data.isPublished,
          updatedAt: new Date(),
        },
      });

      logger.info(`Course updated: ${course.id} by user ${userId}`);
      return course;
    } catch (error) {
      logger.error('Error updating course:', error);
      throw error;
    }
  }

  /**
   * Delete a course (soft delete by unpublishing)
   * @param id Course ID
   * @param userId User requesting deletion
   */
  async deleteCourse(id: string, userId: string): Promise<void> {
    try {
      // Check if user can delete the course
      const canDelete = await this.canUserModifyCourse(id, userId);

      if (!canDelete) {
        throw new Error('You do not have permission to delete this course');
      }

      // Check if course is published
      const course = await prisma.course.findUnique({
        where: { id },
        select: { isPublished: true },
      });

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.isPublished) {
        throw new Error('Cannot delete a published course. Unpublish it first.');
      }

      // Delete course (cascade will handle related entities)
      await prisma.course.delete({
        where: { id },
      });

      logger.info(`Course deleted: ${id} by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting course:', error);
      throw error;
    }
  }

  /**
   * Duplicate a course with all its content
   * @param id Course ID to duplicate
   * @param userId User requesting duplication
   * @param options Duplication options
   * @returns New duplicated course
   */
  async duplicateCourse(
    id: string,
    userId: string,
    options?: DuplicateCourseOptions
  ): Promise<Course> {
    try {
      // Fetch original course with all content
      const originalCourse = await this.getCourseWithFullContent(id);

      if (!originalCourse) {
        throw new Error('Course not found');
      }

      // Generate new slug
      const timestamp = Date.now();
      const newSlugSuffix = options?.newSlugSuffix || `copy-${timestamp}`;
      const newSlug = `${originalCourse.slug}-${newSlugSuffix}`;

      // Create duplicate in transaction
      const duplicatedCourse = await prisma.$transaction(async (tx) => {
        // Create new course
        const newCourse = await tx.course.create({
          data: {
            slug: newSlug,
            title: `${originalCourse.title} (Copy)`,
            description: originalCourse.description,
            thumbnail: originalCourse.thumbnail,
            duration: originalCourse.duration,
            level: originalCourse.level,
            tags: originalCourse.tags,
            author: originalCourse.author,
            version: originalCourse.version,
            price: originalCourse.price,
            isPublished: false, // Always unpublished initially
          },
        });

        // Duplicate modules with content if requested
        if (options?.includeContent !== false) {
          for (const module of originalCourse.modules) {
            const newModule = await tx.module.create({
              data: {
                courseId: newCourse.id,
                order: module.order,
                title: module.title,
                description: module.description,
                duration: module.duration,
                isPublished: module.isPublished,
              },
            });

            // Duplicate lessons
            for (const lesson of module.lessons) {
              await tx.lesson.create({
                data: {
                  moduleId: newModule.id,
                  order: lesson.order,
                  title: lesson.title,
                  content: lesson.content,
                  type: lesson.type,
                  estimatedTime: lesson.estimatedTime,
                },
              });
            }

            // Duplicate quizzes
            for (const quiz of module.quizzes) {
              const quizData = await tx.quiz.findUnique({
                where: { id: quiz.id },
                include: { questions: true },
              });

              if (quizData) {
                const newQuiz = await tx.quiz.create({
                  data: {
                    moduleId: newModule.id,
                    title: quizData.title,
                    description: quizData.description,
                    passingScore: quizData.passingScore,
                    timeLimit: quizData.timeLimit,
                    attempts: quizData.attempts,
                  },
                });

                // Duplicate questions
                for (const question of quizData.questions) {
                  await tx.question.create({
                    data: {
                      quizId: newQuiz.id,
                      order: question.order,
                      type: question.type,
                      question: question.question,
                      options: question.options,
                      correctAnswer: question.correctAnswer,
                      explanation: question.explanation,
                    },
                  });
                }
              }
            }

            // Duplicate labs
            for (const lab of module.labs) {
              await tx.lab.create({
                data: {
                  moduleId: newModule.id,
                  title: lab.title,
                  description: lab.description,
                  language: lab.language,
                  starterCode: lab.starterCode,
                  solution: lab.solution,
                  tests: lab.tests,
                  hints: lab.hints,
                },
              });
            }
          }
        }

        // Duplicate projects if requested
        if (options?.includeProjects) {
          const projects = await tx.project.findMany({
            where: { courseId: originalCourse.id },
          });

          for (const project of projects) {
            await tx.project.create({
              data: {
                courseId: newCourse.id,
                title: project.title,
                description: project.description,
                requirements: project.requirements,
                rubric: project.rubric,
                dueDate: project.dueDate,
              },
            });
          }
        }

        return newCourse;
      });

      logger.info(`Course duplicated: ${id} -> ${duplicatedCourse.id} by user ${userId}`);
      return duplicatedCourse;
    } catch (error) {
      logger.error('Error duplicating course:', error);
      throw error;
    }
  }

  /**
   * Get course with all its content
   * @param id Course ID or slug
   * @returns Course with modules, lessons, quizzes, labs
   */
  async getCourseWithFullContent(id: string): Promise<CourseWithContent | null> {
    try {
      const course = await prisma.course.findFirst({
        where: {
          OR: [
            { id },
            { slug: id },
          ],
        },
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
              },
              quizzes: true,
              labs: true,
            },
          },
          projects: true,
          enrollments: {
            select: { id: true },
          },
        },
      });

      if (!course) {
        return null;
      }

      // Add enrollment count
      const courseWithStats = {
        ...course,
        enrollmentCount: course.enrollments.length,
        enrollments: undefined, // Remove enrollments array from response
      };

      return courseWithStats as CourseWithContent;
    } catch (error) {
      logger.error('Error getting course with content:', error);
      throw error;
    }
  }

  /**
   * Publish a course
   * @param id Course ID
   * @param userId User requesting publication
   * @returns Published course
   */
  async publishCourse(id: string, userId: string): Promise<Course> {
    try {
      const canPublish = await this.canUserModifyCourse(id, userId);

      if (!canPublish) {
        throw new Error('You do not have permission to publish this course');
      }

      // Check if course has content
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      });

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.modules.length === 0) {
        throw new Error('Cannot publish a course without modules');
      }

      const hasLessons = course.modules.some(m => m.lessons.length > 0);
      if (!hasLessons) {
        throw new Error('Cannot publish a course without lessons');
      }

      // Update course
      const publishedCourse = await prisma.course.update({
        where: { id },
        data: {
          isPublished: true,
          updatedAt: new Date(),
        },
      });

      logger.info(`Course published: ${id} by user ${userId}`);
      return publishedCourse;
    } catch (error) {
      logger.error('Error publishing course:', error);
      throw error;
    }
  }

  /**
   * Unpublish a course
   * @param id Course ID
   * @param userId User requesting unpublication
   * @returns Unpublished course
   */
  async unpublishCourse(id: string, userId: string): Promise<Course> {
    try {
      const canUnpublish = await this.canUserModifyCourse(id, userId);

      if (!canUnpublish) {
        throw new Error('You do not have permission to unpublish this course');
      }

      // Update course
      const unpublishedCourse = await prisma.course.update({
        where: { id },
        data: {
          isPublished: false,
          updatedAt: new Date(),
        },
      });

      logger.info(`Course unpublished: ${id} by user ${userId}`);
      return unpublishedCourse;
    } catch (error) {
      logger.error('Error unpublishing course:', error);
      throw error;
    }
  }

  /**
   * Get courses for an instructor with filters and pagination
   * @param instructorId Instructor ID
   * @param filters Course filters
   * @returns Paginated course list
   */
  async getCoursesForInstructor(
    instructorId: string,
    filters: CourseFilters
  ): Promise<CoursePaginated> {
    try {
      const {
        search,
        level,
        tags,
        isPublished,
        author,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      // Build where clause
      const where: Prisma.CourseWhereInput = {};

      // Search in title and description
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (level) {
        where.level = level as any;
      }

      if (tags && tags.length > 0) {
        where.tags = { hasSome: tags };
      }

      if (isPublished !== undefined) {
        where.isPublished = isPublished;
      }

      if (author) {
        where.author = { contains: author, mode: 'insensitive' };
      }

      // NOTE: Currently all users (ADMIN and INSTRUCTOR) see all courses
      // The 'author' field is a string (author name), not a user ID
      // Future improvement: Add 'createdById' field to Course model to track ownership
      // and filter courses for instructors to only show their own courses

      // Verify user exists (for validation only, not for filtering)
      const user = await prisma.user.findUnique({
        where: { id: instructorId },
        select: { role: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // In the future when createdById is added:
      // if (user.role !== UserRole.ADMIN) {
      //   where.createdById = instructorId;
      // }

      // Count total
      const total = await prisma.course.count({ where });

      // Calculate pagination
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      // Fetch courses
      const courses = await prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      });

      return {
        courses,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    } catch (error) {
      logger.error('Error getting courses for instructor:', error);
      throw error;
    }
  }

  /**
   * Get course statistics
   * @param courseId Course ID
   * @returns Course statistics
   */
  async getCourseStats(courseId: string): Promise<CourseStats> {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId },
        select: {
          progress: true,
          completedAt: true,
          lastAccessedAt: true,
        },
      });

      const totalEnrollments = enrollments.length;
      const completedEnrollments = enrollments.filter(e => e.completedAt).length;
      const activeStudents = enrollments.filter(e => {
        if (!e.lastAccessedAt) return false;
        const daysSinceLastAccess = Math.floor(
          (Date.now() - e.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceLastAccess <= 7; // Active in last 7 days
      }).length;

      const totalProgress = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
      const averageProgress = totalEnrollments > 0 ? totalProgress / totalEnrollments : 0;
      const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

      // Calculate revenue if course has a price
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { price: true },
      });

      const totalRevenue = course?.price ? course.price * totalEnrollments : 0;

      return {
        totalEnrollments,
        completionRate,
        averageProgress,
        totalRevenue,
        activeStudents,
      };
    } catch (error) {
      logger.error('Error getting course stats:', error);
      throw error;
    }
  }

  /**
   * Check if user can modify a course
   * @param courseId Course ID
   * @param userId User ID
   * @returns True if user can modify
   */
  private async canUserModifyCourse(courseId: string, userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Admins can modify any course
    if (user?.role === UserRole.ADMIN) {
      return true;
    }

    // Check if user is course author
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { author: true },
    });

    return course?.author === userId;
  }
}

// Export singleton instance
export default new CourseManagementService();