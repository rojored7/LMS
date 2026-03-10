/**
 * CourseImport Service Tests
 * Comprehensive test coverage for course import functionality
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { courseImportService } from '../../services/courseImport.service';
import { prisma } from '../../utils/prisma';
import * as fs from 'fs/promises';
import * as path from 'path';
import AdmZip from 'adm-zip';

// Mock dependencies
jest.mock('../../utils/prisma', () => ({
  prisma: {
    course: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    module: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    lesson: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    quiz: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    lab: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('fs/promises');
jest.mock('adm-zip');

describe('CourseImport Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('parseZipFile', () => {
    it('should successfully parse a valid course ZIP file', async () => {
      // Mock ZIP structure
      const mockZip = {
        getEntries: jest.fn().mockReturnValue([
          {
            entryName: 'course.json',
            isDirectory: false,
            getData: () => Buffer.from(JSON.stringify({
              title: 'Test Course',
              description: 'Test Description',
              slug: 'test-course',
              level: 'BEGINNER',
            })),
          },
          {
            entryName: 'modules/01-intro/module.json',
            isDirectory: false,
            getData: () => Buffer.from(JSON.stringify({
              title: 'Introduction',
              description: 'Intro module',
              order: 1,
            })),
          },
          {
            entryName: 'modules/01-intro/lessons/01-welcome.md',
            isDirectory: false,
            getData: () => Buffer.from('# Welcome\n\nContent here'),
          },
        ]),
      };

      (AdmZip as jest.Mock).mockImplementation(() => mockZip);

      const result = await courseImportService.parseZipFile(Buffer.from('fake-zip'));

      expect(result).toBeDefined();
      expect(result.metadata.title).toBe('Test Course');
      expect(result.modules).toHaveLength(1);
      expect(result.modules[0].lessons).toHaveLength(1);
    });

    it('should reject ZIP files without course.json', async () => {
      const mockZip = {
        getEntries: jest.fn().mockReturnValue([
          {
            entryName: 'random-file.txt',
            isDirectory: false,
            getData: () => Buffer.from('random content'),
          },
        ]),
      };

      (AdmZip as jest.Mock).mockImplementation(() => mockZip);

      await expect(courseImportService.parseZipFile(Buffer.from('fake-zip')))
        .rejects.toThrow('course.json not found');
    });

    it('should handle malformed course.json gracefully', async () => {
      const mockZip = {
        getEntries: jest.fn().mockReturnValue([
          {
            entryName: 'course.json',
            isDirectory: false,
            getData: () => Buffer.from('{ invalid json }'),
          },
        ]),
      };

      (AdmZip as jest.Mock).mockImplementation(() => mockZip);

      await expect(courseImportService.parseZipFile(Buffer.from('fake-zip')))
        .rejects.toThrow();
    });

    it('should reject ZIP files exceeding size limit', async () => {
      const largeBuffer = Buffer.alloc(100 * 1024 * 1024); // 100MB

      await expect(courseImportService.parseZipFile(largeBuffer))
        .rejects.toThrow('File size exceeds limit');
    });

    it('should sanitize malicious content in markdown files', async () => {
      const mockZip = {
        getEntries: jest.fn().mockReturnValue([
          {
            entryName: 'course.json',
            isDirectory: false,
            getData: () => Buffer.from(JSON.stringify({
              title: 'Test Course',
              slug: 'test-course',
            })),
          },
          {
            entryName: 'modules/01-intro/lessons/01-xss.md',
            isDirectory: false,
            getData: () => Buffer.from('<script>alert("XSS")</script>\n# Content'),
          },
        ]),
      };

      (AdmZip as jest.Mock).mockImplementation(() => mockZip);

      const result = await courseImportService.parseZipFile(Buffer.from('fake-zip'));

      // Should sanitize the script tag
      expect(result.modules[0].lessons[0].content).not.toContain('<script>');
    });

    it('should handle path traversal attempts', async () => {
      const mockZip = {
        getEntries: jest.fn().mockReturnValue([
          {
            entryName: 'course.json',
            isDirectory: false,
            getData: () => Buffer.from(JSON.stringify({
              title: 'Test Course',
              slug: 'test-course',
            })),
          },
          {
            entryName: '../../etc/passwd',
            isDirectory: false,
            getData: () => Buffer.from('malicious content'),
          },
        ]),
      };

      (AdmZip as jest.Mock).mockImplementation(() => mockZip);

      const result = await courseImportService.parseZipFile(Buffer.from('fake-zip'));

      // Should ignore path traversal files
      expect(result.modules).toHaveLength(0);
    });
  });

  describe('validateCourseStructure', () => {
    it('should validate a correct course structure', () => {
      const validStructure = {
        metadata: {
          title: 'Valid Course',
          description: 'Valid description',
          slug: 'valid-course',
          level: 'INTERMEDIATE',
        },
        modules: [
          {
            title: 'Module 1',
            description: 'Module description',
            order: 1,
            lessons: [
              {
                title: 'Lesson 1',
                content: 'Content',
                order: 1,
              },
            ],
            quizzes: [],
            labs: [],
          },
        ],
      };

      expect(() => courseImportService.validateCourseStructure(validStructure))
        .not.toThrow();
    });

    it('should reject courses without title', () => {
      const invalidStructure = {
        metadata: {
          description: 'Description',
          slug: 'course-slug',
        },
        modules: [],
      };

      expect(() => courseImportService.validateCourseStructure(invalidStructure))
        .toThrow('Course title is required');
    });

    it('should reject courses with invalid slug format', () => {
      const invalidStructure = {
        metadata: {
          title: 'Course',
          slug: 'Invalid Slug!',
        },
        modules: [],
      };

      expect(() => courseImportService.validateCourseStructure(invalidStructure))
        .toThrow('Invalid slug format');
    });

    it('should reject courses with empty modules', () => {
      const invalidStructure = {
        metadata: {
          title: 'Course',
          slug: 'course-slug',
        },
        modules: [],
      };

      expect(() => courseImportService.validateCourseStructure(invalidStructure))
        .toThrow('At least one module is required');
    });

    it('should reject modules without any content', () => {
      const invalidStructure = {
        metadata: {
          title: 'Course',
          slug: 'course-slug',
        },
        modules: [
          {
            title: 'Empty Module',
            lessons: [],
            quizzes: [],
            labs: [],
          },
        ],
      };

      expect(() => courseImportService.validateCourseStructure(invalidStructure))
        .toThrow('Module must have at least one lesson, quiz, or lab');
    });
  });

  describe('importCourse', () => {
    it('should successfully import a new course', async () => {
      const courseData = {
        metadata: {
          title: 'New Course',
          description: 'Description',
          slug: 'new-course',
          level: 'BEGINNER',
        },
        modules: [
          {
            title: 'Module 1',
            order: 1,
            lessons: [
              { title: 'Lesson 1', content: 'Content', order: 1 },
            ],
          },
        ],
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));
      (prisma.course.create as jest.Mock).mockResolvedValue({ id: 'course-id', ...courseData.metadata });

      const result = await courseImportService.importCourse(courseData, 'user-id');

      expect(result.id).toBe('course-id');
      expect(prisma.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New Course',
          slug: 'new-course',
        }),
      });
    });

    it('should handle duplicate course slugs with overwrite option', async () => {
      const existingCourse = { id: 'existing-id', slug: 'existing-course' };
      const courseData = {
        metadata: {
          title: 'Updated Course',
          slug: 'existing-course',
        },
        modules: [],
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(existingCourse);
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));
      (prisma.course.update as jest.Mock).mockResolvedValue({ ...existingCourse, ...courseData.metadata });

      const result = await courseImportService.importCourse(courseData, 'user-id', { overwrite: true });

      expect(prisma.course.update).toHaveBeenCalled();
      expect(prisma.module.deleteMany).toHaveBeenCalledWith({
        where: { courseId: 'existing-id' },
      });
    });

    it('should reject duplicate slugs without overwrite option', async () => {
      const existingCourse = { id: 'existing-id', slug: 'existing-course' };
      const courseData = {
        metadata: {
          title: 'New Course',
          slug: 'existing-course',
        },
        modules: [],
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(existingCourse);

      await expect(courseImportService.importCourse(courseData, 'user-id'))
        .rejects.toThrow('Course with this slug already exists');
    });

    it('should rollback transaction on error', async () => {
      const courseData = {
        metadata: {
          title: 'Course',
          slug: 'course-slug',
        },
        modules: [{ title: 'Module', lessons: [] }],
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(courseImportService.importCourse(courseData, 'user-id'))
        .rejects.toThrow('Database error');
    });

    it('should properly assign order to modules and lessons', async () => {
      const courseData = {
        metadata: {
          title: 'Course',
          slug: 'course-slug',
        },
        modules: [
          {
            title: 'Module 1',
            lessons: [
              { title: 'Lesson A', content: 'A' },
              { title: 'Lesson B', content: 'B' },
            ],
          },
          {
            title: 'Module 2',
            lessons: [
              { title: 'Lesson C', content: 'C' },
            ],
          },
        ],
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));
      (prisma.course.create as jest.Mock).mockResolvedValue({ id: 'course-id' });

      await courseImportService.importCourse(courseData, 'user-id');

      expect(prisma.module.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ order: 1 }),
          expect.objectContaining({ order: 2 }),
        ]),
      });
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle extremely long course titles', () => {
      const longTitle = 'A'.repeat(1000);
      const courseData = {
        metadata: {
          title: longTitle,
          slug: 'course',
        },
        modules: [],
      };

      expect(() => courseImportService.validateCourseStructure(courseData))
        .toThrow('Title exceeds maximum length');
    });

    it('should validate quiz question formats', () => {
      const courseData = {
        metadata: { title: 'Course', slug: 'course' },
        modules: [{
          title: 'Module',
          quizzes: [{
            title: 'Quiz',
            questions: [
              {
                question: 'What?',
                options: [], // Empty options
                correctAnswer: 0,
              },
            ],
          }],
        }],
      };

      expect(() => courseImportService.validateCourseStructure(courseData))
        .toThrow('Quiz must have at least 2 options');
    });

    it('should handle concurrent import attempts for same slug', async () => {
      const courseData = {
        metadata: { title: 'Course', slug: 'concurrent-course' },
        modules: [],
      };

      // Simulate race condition
      const promise1 = courseImportService.importCourse(courseData, 'user1');
      const promise2 = courseImportService.importCourse(courseData, 'user2');

      // One should succeed, one should fail
      const results = await Promise.allSettled([promise1, promise2]);

      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);
    });

    it('should sanitize file paths in ZIP entries', async () => {
      const mockZip = {
        getEntries: jest.fn().mockReturnValue([
          {
            entryName: 'course.json',
            getData: () => Buffer.from(JSON.stringify({ title: 'Test', slug: 'test' })),
          },
          {
            entryName: 'modules/../../../etc/passwd',
            getData: () => Buffer.from('malicious'),
          },
          {
            entryName: 'modules/01-valid/lesson.md',
            getData: () => Buffer.from('# Valid'),
          },
        ]),
      };

      (AdmZip as jest.Mock).mockImplementation(() => mockZip);

      const result = await courseImportService.parseZipFile(Buffer.from('fake-zip'));

      // Should only include valid paths
      expect(result.modules).toHaveLength(1);
      expect(result.modules[0].lessons[0].content).toContain('Valid');
    });

    it('should handle special characters in course metadata', () => {
      const courseData = {
        metadata: {
          title: 'Course with émojis 🎓 and spëcial çhars',
          description: '<script>alert("xss")</script>',
          slug: 'course-emoji',
        },
        modules: [],
      };

      const sanitized = courseImportService.sanitizeCourseData(courseData);

      expect(sanitized.metadata.description).not.toContain('<script>');
      expect(sanitized.metadata.title).toContain('🎓');
    });
  });
});