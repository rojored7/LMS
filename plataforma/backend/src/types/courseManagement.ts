/**
 * Type definitions for course management functionality
 */

import { Course, Module, Lesson, Quiz, Lab, Project } from '@prisma/client';

export interface CreateCourseDto {
  slug: string;
  title: string;
  description: string;
  thumbnail?: string;
  duration: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  tags?: string[];
  author: string;
  version?: string;
  price?: number;
  isPublished?: boolean;
}

export interface UpdateCourseDto {
  slug?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  tags?: string[];
  author?: string;
  version?: string;
  price?: number;
  isPublished?: boolean;
}

export interface CourseFilters {
  search?: string;
  level?: string;
  tags?: string[];
  isPublished?: boolean;
  author?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'level';
  sortOrder?: 'asc' | 'desc';
}

export interface CourseWithContent extends Course {
  modules: ModuleWithContent[];
  projects?: Project[];
  enrollmentCount?: number;
}

export interface ModuleWithContent extends Module {
  lessons: Lesson[];
  quizzes: Quiz[];
  labs: Lab[];
}

export interface CoursePaginated {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CourseStats {
  totalEnrollments: number;
  completionRate: number;
  averageProgress: number;
  totalRevenue?: number;
  activeStudents: number;
}

export interface DuplicateCourseOptions {
  includeContent?: boolean;
  includeProjects?: boolean;
  newSlugSuffix?: string;
}