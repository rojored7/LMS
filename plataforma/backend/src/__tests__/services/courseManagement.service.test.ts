/**
 * CourseManagement Service Tests
 * Comprehensive test coverage for course CRUD and management operations
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { courseManagementService } from '../../services/courseManagement.service';
import { prisma } from '../../utils/prisma';
import { UserRole } from '../../types/auth';
import { AuthorizationError, NotFoundError, ValidationError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../utils/prisma', () => ({
  prisma: {
    course: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    enrollment: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    module: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('CourseManagement Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCourses', () => {
    it('should retrieve courses with pagination', async () => {
      const mockCourses = [
        { id: '1', title: 'Course 1', published: true },
        { id: '2', title: 'Course 2', published: true },
      ];

      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      (prisma.course.count as jest.Mock).mockResolvedValue(10);

      const result = await courseManagementService.getCourses({
        page: 1,
        limit: 2,
      });

      expect(result.courses).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.pages).toBe(5);
      expect(prisma.course.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 2,
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter courses by published status', async () => {
      const mockCourses = [{ id: '1', title: 'Published', published: true }];

      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      (prisma.course.count as jest.Mock).mockResolvedValue(1);

      await courseManagementService.getCourses({
        published: true,
      });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { published: true },
        })
      );
    });

    it('should filter courses by author', async () => {
      await courseManagementService.getCourses({
        authorId: 'user-123',
      });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { authorId: 'user-123' },
        })
      );
    });

    it('should search courses by title', async () => {
      await courseManagementService.getCourses({
        search: 'python',
      });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: 'python', mode: 'insensitive' } },
              { description: { contains: 'python', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should handle empty results gracefully', async () => {
      (prisma.course.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.course.count as jest.Mock).mockResolvedValue(0);

      const result = await courseManagementService.getCourses({});

      expect(result.courses).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.pages).toBe(0);
    });
  });

  describe('getCourseById', () => {
    it('should retrieve course with full details', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Test Course',
        modules: [
          { id: 'mod-1', title: 'Module 1', lessons: [], quizzes: [], labs: [] },
        ],
        enrollments: [],
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const result = await courseManagementService.getCourseById('course-1');

      expect(result).toEqual(mockCourse);
      expect(prisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        include: {
          modules: {
            include: {
              lessons: true,
              quizzes: true,
              labs: true,
            },
            orderBy: { order: 'asc' },
          },
          enrollments: true,
        },
      });
    });

    it('should throw NotFoundError for non-existent course', async () => {
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(courseManagementService.getCourseById('non-existent'))
        .rejects.toThrow(NotFoundError);
    });

    it('should retrieve course by slug', async () => {
      const mockCourse = { id: '1', slug: 'test-course' };

      (prisma.course.findFirst as jest.Mock).mockResolvedValue(mockCourse);

      const result = await courseManagementService.getCourseBySlug('test-course');

      expect(result).toEqual(mockCourse);
      expect(prisma.course.findFirst).toHaveBeenCalledWith({
        where: { slug: 'test-course' },
      });
    });
  });

  describe('createCourse', () => {
    it('should create a new course', async () => {
      const courseData = {
        title: 'New Course',
        description: 'Description',
        slug: 'new-course',
        level: 'BEGINNER',
      };

      const createdCourse = { id: 'new-id', ...courseData };

      (prisma.course.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.course.create as jest.Mock).mockResolvedValue(createdCourse);

      const result = await courseManagementService.createCourse(courseData, 'author-id');

      expect(result).toEqual(createdCourse);
      expect(prisma.course.create).toHaveBeenCalledWith({
        data: {
          ...courseData,
          authorId: 'author-id',
          published: false,
        },
      });
    });

    it('should reject duplicate slugs', async () => {
      const courseData = {
        title: 'Course',
        slug: 'existing-slug',
      };

      (prisma.course.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(courseManagementService.createCourse(courseData, 'author-id'))
        .rejects.toThrow('Course with this slug already exists');
    });

    it('should auto-generate slug if not provided', async () => {
      const courseData = {
        title: 'Course With Spaces',
        description: 'Description',
      };

      (prisma.course.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.course.create as jest.Mock).mockResolvedValue({ id: '1', ...courseData });

      await courseManagementService.createCourse(courseData, 'author-id');

      expect(prisma.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'course-with-spaces',
        }),
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        description: 'No title',
      };

      await expect(courseManagementService.createCourse(invalidData, 'author-id'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('updateCourse', () => {
    it('should update course by owner', async () => {
      const existingCourse = {
        id: 'course-1',
        authorId: 'author-1',
        title: 'Old Title',
      };

      const updateData = {
        title: 'New Title',
        description: 'New Description',
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(existingCourse);
      (prisma.course.update as jest.Mock).mockResolvedValue({ ...existingCourse, ...updateData });

      const result = await courseManagementService.updateCourse(
        'course-1',
        updateData,
        { id: 'author-1', role: UserRole.INSTRUCTOR }
      );

      expect(result.title).toBe('New Title');
      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        data: updateData,
      });
    });

    it('should allow admin to update any course', async () => {
      const existingCourse = {
        id: 'course-1',
        authorId: 'author-1',
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(existingCourse);
      (prisma.course.update as jest.Mock).mockResolvedValue(existingCourse);

      await courseManagementService.updateCourse(
        'course-1',
        { title: 'Admin Update' },
        { id: 'admin-user', role: UserRole.ADMIN }
      );

      expect(prisma.course.update).toHaveBeenCalled();
    });

    it('should prevent non-owner from updating', async () => {
      const existingCourse = {
        id: 'course-1',
        authorId: 'author-1',
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(existingCourse);

      await expect(
        courseManagementService.updateCourse(
          'course-1',
          { title: 'Hacked' },
          { id: 'other-user', role: UserRole.INSTRUCTOR }
        )
      ).rejects.toThrow(AuthorizationError);
    });

    it('should prevent slug changes if course has enrollments', async () => {
      const existingCourse = {
        id: 'course-1',
        authorId: 'author-1',
        slug: 'original-slug',
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(existingCourse);
      (prisma.enrollment.count as jest.Mock).mockResolvedValue(5);

      await expect(
        courseManagementService.updateCourse(
          'course-1',
          { slug: 'new-slug' },
          { id: 'author-1', role: UserRole.INSTRUCTOR }
        )
      ).rejects.toThrow('Cannot change slug of course with enrollments');
    });
  });

  describe('publishCourse', () => {
    it('should publish a complete course', async () => {
      const course = {
        id: 'course-1',
        authorId: 'author-1',
        published: false,
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(course);
      (prisma.module.count as jest.Mock).mockResolvedValue(3);
      (prisma.course.update as jest.Mock).mockResolvedValue({ ...course, published: true });

      const result = await courseManagementService.publishCourse(
        'course-1',
        { id: 'author-1', role: UserRole.INSTRUCTOR }
      );

      expect(result.published).toBe(true);
    });

    it('should prevent publishing empty courses', async () => {
      const course = {
        id: 'course-1',
        authorId: 'author-1',
        published: false,
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(course);
      (prisma.module.count as jest.Mock).mockResolvedValue(0);

      await expect(
        courseManagementService.publishCourse(
          'course-1',
          { id: 'author-1', role: UserRole.INSTRUCTOR }
        )
      ).rejects.toThrow('Course must have at least one module to publish');
    });

    it('should prevent re-publishing published courses', async () => {
      const course = {
        id: 'course-1',
        authorId: 'author-1',
        published: true,
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(course);

      await expect(
        courseManagementService.publishCourse(
          'course-1',
          { id: 'author-1', role: UserRole.INSTRUCTOR }
        )
      ).rejects.toThrow('Course is already published');
    });
  });

  describe('deleteCourse', () => {
    it('should soft delete courses with enrollments', async () => {
      const course = {
        id: 'course-1',
        authorId: 'author-1',
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(course);
      (prisma.enrollment.count as jest.Mock).mockResolvedValue(10);
      (prisma.course.update as jest.Mock).mockResolvedValue({ ...course, deleted: true });

      const result = await courseManagementService.deleteCourse(
        'course-1',
        { id: 'author-1', role: UserRole.INSTRUCTOR }
      );

      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        data: { deleted: true, deletedAt: expect.any(Date) },
      });
    });

    it('should hard delete courses without enrollments', async () => {
      const course = {
        id: 'course-1',
        authorId: 'author-1',
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(course);
      (prisma.enrollment.count as jest.Mock).mockResolvedValue(0);
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));

      await courseManagementService.deleteCourse(
        'course-1',
        { id: 'author-1', role: UserRole.INSTRUCTOR }
      );

      expect(prisma.course.delete).toHaveBeenCalledWith({
        where: { id: 'course-1' },
      });
    });

    it('should prevent deletion by non-owner', async () => {
      const course = {
        id: 'course-1',
        authorId: 'author-1',
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(course);

      await expect(
        courseManagementService.deleteCourse(
          'course-1',
          { id: 'other-user', role: UserRole.INSTRUCTOR }
        )
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('duplicateCourse', () => {
    it('should create a complete copy of a course', async () => {
      const originalCourse = {
        id: 'original-1',
        title: 'Original Course',
        slug: 'original-course',
        modules: [
          {
            id: 'mod-1',
            title: 'Module 1',
            lessons: [{ id: 'les-1', title: 'Lesson 1', content: 'Content' }],
            quizzes: [],
            labs: [],
          },
        ],
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(originalCourse);
      (prisma.course.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));
      (prisma.course.create as jest.Mock).mockResolvedValue({
        id: 'copy-1',
        title: 'Copy of Original Course',
        slug: 'original-course-copy',
      });

      const result = await courseManagementService.duplicateCourse(
        'original-1',
        { id: 'user-1', role: UserRole.INSTRUCTOR }
      );

      expect(result.title).toBe('Copy of Original Course');
      expect(result.slug).toBe('original-course-copy');
    });

    it('should handle slug conflicts when duplicating', async () => {
      const originalCourse = {
        id: 'original-1',
        title: 'Course',
        slug: 'course',
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(originalCourse);
      (prisma.course.findFirst as jest.Mock)
        .mockResolvedValueOnce({ slug: 'course-copy' })
        .mockResolvedValueOnce({ slug: 'course-copy-2' })
        .mockResolvedValueOnce(null);

      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));
      (prisma.course.create as jest.Mock).mockResolvedValue({
        id: 'copy-1',
        slug: 'course-copy-3',
      });

      const result = await courseManagementService.duplicateCourse(
        'original-1',
        { id: 'user-1', role: UserRole.INSTRUCTOR }
      );

      expect(result.slug).toBe('course-copy-3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle pagination edge cases', async () => {
      // Page 0 should default to 1
      await courseManagementService.getCourses({ page: 0, limit: 10 });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0 })
      );

      // Negative limit should default to 10
      await courseManagementService.getCourses({ page: 1, limit: -5 });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );

      // Limit over 100 should cap at 100
      await courseManagementService.getCourses({ page: 1, limit: 500 });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });

    it('should handle concurrent updates gracefully', async () => {
      const course = { id: '1', authorId: 'author-1', version: 1 };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(course);
      (prisma.course.update as jest.Mock)
        .mockRejectedValueOnce(new Error('Version conflict'))
        .mockResolvedValueOnce({ ...course, title: 'Updated' });

      const result = await courseManagementService.updateCourse(
        '1',
        { title: 'Updated' },
        { id: 'author-1', role: UserRole.INSTRUCTOR },
        { retry: true }
      );

      expect(result.title).toBe('Updated');
      expect(prisma.course.update).toHaveBeenCalledTimes(2);
    });
  });
});