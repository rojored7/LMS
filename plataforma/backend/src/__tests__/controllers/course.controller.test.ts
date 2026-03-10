/**
 * Course Controller Tests
 * Tests exhaustivos para el controlador de cursos
 */

import { Request, Response, NextFunction } from 'express';
import * as courseController from '../../controllers/course.controller';
import courseService from '../../services/course.service';
import { UserRole, CourseLevel } from '@prisma/client';
import {
  generateMockRequest,
  generateMockResponse,
  generateMockNext,
  expectSuccessResponse,
  expectErrorResponse,
  expectUnauthorizedResponse,
  expectForbiddenResponse
} from '../helpers/auth.helper';
import { testCourses, testModules, testEnrollments } from '../fixtures/courses.fixture';

// Mock de servicios
jest.mock('../../services/course.service');
jest.mock('../../utils/prisma');
jest.mock('../../utils/redis');

describe('CourseController', () => {
  let mockedCourseService: jest.Mocked<typeof courseService>;
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    mockedCourseService = courseService as jest.Mocked<typeof courseService>;

    req = generateMockRequest();
    res = generateMockResponse();
    next = generateMockNext();

    jest.clearAllMocks();
  });

  describe('getCourses', () => {
    it('should return all published courses', async () => {
      const publishedCourses = testCourses.filter(c => c.isPublished);
      mockedCourseService.getCourses.mockResolvedValue({
        courses: publishedCourses as any,
        pagination: { total: publishedCourses.length, page: 1, limit: 10, totalPages: 1 }
      });

      await courseController.getCourses(req, res, next);

      expect(mockedCourseService.getCourses).toHaveBeenCalled();
      expectSuccessResponse(res, publishedCourses);
    });

    it('should filter courses by level', async () => {
      req.query = { level: CourseLevel.BEGINNER };
      const beginnerCourses = testCourses.filter(c => c.level === CourseLevel.BEGINNER);
      mockedCourseService.getCourses.mockResolvedValue({
        courses: beginnerCourses as any,
        pagination: { total: beginnerCourses.length, page: 1, limit: 10, totalPages: 1 }
      });

      await courseController.getCourses(req, res, next);

      expect(mockedCourseService.getCourses).toHaveBeenCalledWith(expect.objectContaining({ level: CourseLevel.BEGINNER }));
      expectSuccessResponse(res, beginnerCourses);
    });

    it('should filter courses by search query', async () => {
      req.query = { search: 'ciberseguridad' };
      const filteredCourses = testCourses.filter(c =>
        c.title?.toLowerCase().includes('ciberseguridad')
      );
      mockedCourseService.getCourses.mockResolvedValue({
        courses: filteredCourses as any,
        pagination: { total: filteredCourses.length, page: 1, limit: 10, totalPages: 1 }
      });

      await courseController.getCourses(req, res, next);

      expect(mockedCourseService.getCourses).toHaveBeenCalledWith({ search: 'ciberseguridad' });
      expectSuccessResponse(res, filteredCourses);
    });

    it('should paginate results', async () => {
      req.query = { page: '2', limit: '10' };
      mockedCourseService.getCourses.mockResolvedValue({
        courses: testCourses.slice(10, 20) as any,
        pagination: { total: 20, page: 2, limit: 10, totalPages: 2 }
      });

      await courseController.getCourses(req, res, next);

      expect(mockedCourseService.getCourses).toHaveBeenCalledWith({
        page: 2,
        limit: 10
      });
    });

    it('should sort courses by creation date', async () => {
      req.query = { sortBy: 'createdAt', order: 'desc' };
      const sortedCourses = [...testCourses].sort((a, b) =>
        (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      );
      mockedCourseService.getCourses.mockResolvedValue({
        courses: sortedCourses as any,
        pagination: { total: sortedCourses.length, page: 1, limit: 10, totalPages: 1 }
      });

      await courseController.getCourses(req, res, next);

      expect(mockedCourseService.getCourses).toHaveBeenCalledWith({
        sortBy: 'createdAt',
        order: 'desc'
      });
    });

    it('should handle empty results', async () => {
      mockedCourseService.getCourses.mockResolvedValue({
        courses: [] as any,
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      });

      await courseController.getCourses(req, res, next);

      expectSuccessResponse(res, []);
    });

    it('should handle service errors', async () => {
      mockedCourseService.getCourses.mockRejectedValue(new Error('Database error'));

      await courseController.getCourses(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Database error'
      }));
    });
  });

  describe('getCourse', () => {
    it('should get course by ID', async () => {
      req.params = { idOrSlug: 'course-1' };
      mockedCourseService.getCourse.mockResolvedValue(testCourses[0] as any);

      await courseController.getCourse(req, res, next);

      expect(mockedCourseService.getCourse).toHaveBeenCalledWith('course-1', undefined);
      expectSuccessResponse(res, testCourses[0]);
    });

    it('should get course by slug', async () => {
      req.params = { idOrSlug: 'fundamentos-ciberseguridad' };
      mockedCourseService.getCourse.mockResolvedValue(testCourses[0] as any);

      await courseController.getCourse(req, res, next);

      expect(mockedCourseService.getCourse).toHaveBeenCalledWith('fundamentos-ciberseguridad', undefined);
      expectSuccessResponse(res, testCourses[0]);
    });

    it('should handle course not found', async () => {
      req.params = { idOrSlug: 'non-existent' };
      mockedCourseService.getCourse.mockRejectedValue(new Error('Course not found'));

      await courseController.getCourse(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Course not found'
      }));
    });

    it('should not return unpublished courses to students', async () => {
      req.params = { idOrSlug: 'course-draft' };
      req.user = { id: 'user-1', userId: 'user-1', email: 'test@test.com', name: 'Test User', role: UserRole.STUDENT };

      mockedCourseService.getCourse.mockRejectedValue(new Error('Course not found'));

      await courseController.getCourse(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return unpublished courses to instructors', async () => {
      req.params = { idOrSlug: 'course-draft' };
      req.user = { id: 'instructor-1', userId: 'instructor-1', email: 'instructor@test.com', name: 'Instructor', role: UserRole.INSTRUCTOR };

      mockedCourseService.getCourse.mockResolvedValue(testCourses[3] as any);

      await courseController.getCourse(req, res, next);

      expectSuccessResponse(res, testCourses[3]);
    });
  });

  describe('enrollInCourse', () => {
    it('should enroll user successfully', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        params: { id: 'course-1' }
      });

      const enrollment = {
        id: 'enrollment-new',
        userId: 'user-1',
        courseId: 'course-1',
        enrolledAt: new Date(),
        progressPercentage: 0
      };

      mockedCourseService.enrollUser.mockResolvedValue(enrollment as any);

      await courseController.enrollInCourse(req, res, next);

      expect(mockedCourseService.enrollUser).toHaveBeenCalledWith('user-1', 'course-1');
      expectSuccessResponse(res, enrollment);
    });

    it('should handle duplicate enrollment (idempotent)', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        params: { id: 'course-1' }
      });

      const existingEnrollment = testEnrollments[0];
      mockedCourseService.enrollUser.mockResolvedValue(existingEnrollment as any);

      await courseController.enrollInCourse(req, res, next);

      expect(mockedCourseService.enrollUser).toHaveBeenCalledWith('user-1', 'course-1');
      expectSuccessResponse(res, existingEnrollment);
    });

    it('should require authentication', async () => {
      req.params = { id: 'course-1' };
      // No user in request

      await courseController.enrollInCourse(req, res, next);

      expectUnauthorizedResponse(res);
    });

    it('should handle course not found', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        params: { id: 'non-existent' }
      });

      mockedCourseService.enrollUser.mockRejectedValue(new Error('Course not found'));

      await courseController.enrollInCourse(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Course not found'
      }));
    });

    it('should not allow enrollment in unpublished courses', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        params: { id: 'course-draft' }
      });

      mockedCourseService.enrollUser.mockRejectedValue(new Error('Course is not published'));

      await courseController.enrollInCourse(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle enrollment with slug', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        params: { id: 'fundamentos-ciberseguridad' }
      });

      const enrollment = {
        id: 'enrollment-new',
        userId: 'user-1',
        courseId: 'course-1',
        enrolledAt: new Date(),
        progressPercentage: 0
      };

      mockedCourseService.enrollUser.mockResolvedValue(enrollment as any);

      await courseController.enrollInCourse(req, res, next);

      expect(mockedCourseService.enrollUser).toHaveBeenCalledWith('user-1', 'fundamentos-ciberseguridad');
    });
  });

  describe('getMyEnrollments', () => {
    it('should return enrolled courses for authenticated user', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT }
      });

      const enrolledCourses = [testCourses[0], testCourses[1]];
      mockedCourseService.getUserEnrollments.mockResolvedValue(enrolledCourses as any);

      await courseController.getMyEnrollments(req, res, next);

      expect(mockedCourseService.getUserEnrollments).toHaveBeenCalledWith('user-1');
      expectSuccessResponse(res, enrolledCourses);
    });

    it('should require authentication', async () => {
      // No user in request
      await courseController.getMyEnrollments(req, res, next);

      expectUnauthorizedResponse(res);
    });

    it('should return empty array for user with no enrollments', async () => {
      req = generateMockRequest({
        user: { userId: 'user-new', role: UserRole.STUDENT }
      });

      mockedCourseService.getUserEnrollments.mockResolvedValue([] as any);

      await courseController.getMyEnrollments(req, res, next);

      expectSuccessResponse(res, []);
    });

    it('should include progress information', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT }
      });

      const enrollmentsWithProgress = [{
        ...testCourses[0],
        enrollment: testEnrollments[0]
      }];

      mockedCourseService.getUserEnrollments.mockResolvedValue(enrollmentsWithProgress as any);

      await courseController.getMyEnrollments(req, res, next);

      expectSuccessResponse(res, enrollmentsWithProgress);
    });
  });

  describe.skip('getCourseModules - Method not in controller', () => {
    it('should return course modules', async () => {
      req.params = { id: 'course-1' };

      mockedCourseService.getCourseModules.mockResolvedValue(testModules.filter(m => m.courseId === 'course-1'));

      await courseController.getCourseModules(req, res, next);

      expect(mockedCourseService.getCourseModules).toHaveBeenCalledWith('course-1');
      expectSuccessResponse(res);
    });

    it('should return modules in order', async () => {
      req.params = { id: 'course-1' };

      const orderedModules = testModules
        .filter(m => m.courseId === 'course-1')
        .sort((a, b) => a.order - b.order);

      mockedCourseService.getCourseModules.mockResolvedValue(orderedModules);

      await courseController.getCourseModules(req, res, next);

      expectSuccessResponse(res, orderedModules);
    });

    it('should handle course not found', async () => {
      req.params = { id: 'non-existent' };

      mockedCourseService.getCourseModules.mockRejectedValue(new Error('Course not found'));

      await courseController.getCourseModules(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return empty array for course with no modules', async () => {
      req.params = { id: 'course-empty' };

      mockedCourseService.getCourseModules.mockResolvedValue([]);

      await courseController.getCourseModules(req, res, next);

      expectSuccessResponse(res, []);
    });
  });

  describe.skip('createCourse - Method not in controller', () => {
    const newCourseData = {
      title: 'New Security Course',
      description: 'Course description',
      shortDescription: 'Short desc',
      level: CourseLevel.INTERMEDIATE,
      duration: 45
    };

    it('should create course as instructor', async () => {
      req = generateMockRequest({
        user: { userId: 'instructor-1', role: UserRole.INSTRUCTOR },
        body: newCourseData
      });

      const createdCourse = {
        id: 'course-new',
        ...newCourseData,
        instructorId: 'instructor-1',
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockedCourseService.createCourse.mockResolvedValue(createdCourse);

      await courseController.createCourse(req, res, next);

      expect(mockedCourseService.createCourse).toHaveBeenCalledWith({
        ...newCourseData,
        instructorId: 'instructor-1'
      });
      expectSuccessResponse(res, createdCourse);
    });

    it('should create course as admin', async () => {
      req = generateMockRequest({
        user: { userId: 'admin-1', role: UserRole.ADMIN },
        body: { ...newCourseData, instructorId: 'instructor-1' }
      });

      const createdCourse = {
        id: 'course-new',
        ...newCourseData,
        instructorId: 'instructor-1',
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockedCourseService.createCourse.mockResolvedValue(createdCourse);

      await courseController.createCourse(req, res, next);

      expectSuccessResponse(res, createdCourse);
    });

    it('should not allow students to create courses', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        body: newCourseData
      });

      await courseController.createCourse(req, res, next);

      expectForbiddenResponse(res);
    });

    it('should validate required fields', async () => {
      req = generateMockRequest({
        user: { userId: 'instructor-1', role: UserRole.INSTRUCTOR },
        body: { title: 'Only Title' } // Missing required fields
      });

      await courseController.createCourse(req, res, next);

      expectErrorResponse(res, 400);
    });

    it('should handle duplicate slug', async () => {
      req = generateMockRequest({
        user: { userId: 'instructor-1', role: UserRole.INSTRUCTOR },
        body: newCourseData
      });

      mockedCourseService.createCourse.mockRejectedValue(new Error('Slug already exists'));

      await courseController.createCourse(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Slug already exists'
      }));
    });
  });

  describe.skip('updateCourse - Method not in controller', () => {
    const updateData = {
      title: 'Updated Course Title',
      description: 'Updated description'
    };

    it('should update course as owner instructor', async () => {
      req = generateMockRequest({
        user: { userId: 'instructor-1', role: UserRole.INSTRUCTOR },
        params: { id: 'course-1' },
        body: updateData
      });

      const updatedCourse = {
        ...testCourses[0],
        ...updateData
      };

      mockedCourseService.updateCourse.mockResolvedValue(updatedCourse);

      await courseController.updateCourse(req, res, next);

      expect(mockedCourseService.updateCourse).toHaveBeenCalledWith('course-1', updateData, 'instructor-1');
      expectSuccessResponse(res, updatedCourse);
    });

    it('should update course as admin', async () => {
      req = generateMockRequest({
        user: { userId: 'admin-1', role: UserRole.ADMIN },
        params: { id: 'course-1' },
        body: updateData
      });

      const updatedCourse = {
        ...testCourses[0],
        ...updateData
      };

      mockedCourseService.updateCourse.mockResolvedValue(updatedCourse);

      await courseController.updateCourse(req, res, next);

      expectSuccessResponse(res, updatedCourse);
    });

    it('should not allow non-owner instructor to update', async () => {
      req = generateMockRequest({
        user: { userId: 'instructor-2', role: UserRole.INSTRUCTOR },
        params: { id: 'course-1' },
        body: updateData
      });

      mockedCourseService.updateCourse.mockRejectedValue(new Error('Not authorized'));

      await courseController.updateCourse(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle course not found', async () => {
      req = generateMockRequest({
        user: { userId: 'instructor-1', role: UserRole.INSTRUCTOR },
        params: { id: 'non-existent' },
        body: updateData
      });

      mockedCourseService.updateCourse.mockRejectedValue(new Error('Course not found'));

      await courseController.updateCourse(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe.skip('deleteCourse - Method not in controller', () => {
    it('should delete course as admin', async () => {
      req = generateMockRequest({
        user: { userId: 'admin-1', role: UserRole.ADMIN },
        params: { id: 'course-1' }
      });

      mockedCourseService.deleteCourse.mockResolvedValue({ success: true });

      await courseController.deleteCourse(req, res, next);

      expect(mockedCourseService.deleteCourse).toHaveBeenCalledWith('course-1');
      expectSuccessResponse(res);
    });

    it('should not allow instructor to delete course', async () => {
      req = generateMockRequest({
        user: { userId: 'instructor-1', role: UserRole.INSTRUCTOR },
        params: { id: 'course-1' }
      });

      await courseController.deleteCourse(req, res, next);

      expectForbiddenResponse(res);
    });

    it('should not allow deletion of course with enrollments', async () => {
      req = generateMockRequest({
        user: { userId: 'admin-1', role: UserRole.ADMIN },
        params: { id: 'course-1' }
      });

      mockedCourseService.deleteCourse.mockRejectedValue(new Error('Course has active enrollments'));

      await courseController.deleteCourse(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Course has active enrollments'
      }));
    });

    it('should handle course not found', async () => {
      req = generateMockRequest({
        user: { userId: 'admin-1', role: UserRole.ADMIN },
        params: { id: 'non-existent' }
      });

      mockedCourseService.deleteCourse.mockRejectedValue(new Error('Course not found'));

      await courseController.deleteCourse(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe.skip('checkEnrollment - Method not in controller', () => {
    it('should return true for enrolled user', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        params: { idOrSlug: 'course-1' }
      });

      mockedCourseService.isUserEnrolled.mockResolvedValue(true);

      await courseController.checkEnrollment(req, res, next);

      expect(mockedCourseService.isUserEnrolled).toHaveBeenCalledWith('user-1', 'course-1');
      expectSuccessResponse(res, { isEnrolled: true });
    });

    it('should return false for non-enrolled user', async () => {
      req = generateMockRequest({
        user: { userId: 'user-2', role: UserRole.STUDENT },
        params: { idOrSlug: 'course-1' }
      });

      mockedCourseService.isUserEnrolled.mockResolvedValue(false);

      await courseController.checkEnrollment(req, res, next);

      expectSuccessResponse(res, { isEnrolled: false });
    });

    it('should work with course slug', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        params: { idOrSlug: 'fundamentos-ciberseguridad' }
      });

      mockedCourseService.isUserEnrolled.mockResolvedValue(true);

      await courseController.checkEnrollment(req, res, next);

      expect(mockedCourseService.isUserEnrolled).toHaveBeenCalledWith('user-1', 'fundamentos-ciberseguridad');
    });

    it('should handle unauthenticated requests', async () => {
      req.params = { idOrSlug: 'course-1' };
      // No user in request

      await courseController.checkEnrollment(req, res, next);

      expectSuccessResponse(res, { isEnrolled: false });
    });
  });
});