/**
 * Course store using Zustand
 * Manages course-related state
 */

import { create } from 'zustand';
import type { Course, Enrollment, EnrollmentWithCourse } from '../types';
import courseService from '../services/course.service';

interface CourseState {
  courses: Course[];
  enrolledCourses: EnrollmentWithCourse[];
  selectedCourse: Course | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCourses: (courses: Course[]) => void;
  setEnrolledCourses: (enrollments: EnrollmentWithCourse[]) => void;
  setSelectedCourse: (course: Course | null) => void;
  fetchCourses: (params?: any) => Promise<void>;
  fetchEnrolledCourses: () => Promise<void>;
  fetchCourseById: (courseId: string) => Promise<void>;
  enrollInCourse: (courseId: string) => Promise<void>;
  unenrollFromCourse: (courseId: string) => Promise<void>;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  enrolledCourses: [],
  selectedCourse: null,
  isLoading: false,
  error: null,

  setCourses: (courses) => {
    set({ courses });
  },

  setEnrolledCourses: (enrolledCourses) => {
    set({ enrolledCourses });
  },

  setSelectedCourse: (course) => {
    set({ selectedCourse: course });
  },

  fetchCourses: async (params) => {
    set({ isLoading: true, error: null });

    try {
      const response = await courseService.getCourses(params);
      set({ courses: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.error?.message || 'Error al cargar los cursos',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchEnrolledCourses: async () => {
    set({ isLoading: true, error: null });

    try {
      const courses = await courseService.getEnrolledCourses();
      set({ enrolledCourses: courses, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.error?.message || 'Error al cargar los cursos inscritos',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchCourseById: async (courseId) => {
    set({ isLoading: true, error: null });

    try {
      const course = await courseService.getCourseById(courseId);
      set({ selectedCourse: course, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.error?.message || 'Error al cargar el curso',
        isLoading: false,
      });
      throw error;
    }
  },

  enrollInCourse: async (courseId) => {
    set({ isLoading: true, error: null });

    try {
      await courseService.enrollCourse(courseId);

      // Refresh enrolled courses
      await get().fetchEnrolledCourses();

      // Update selected course if it's the one we enrolled in
      if (get().selectedCourse?.id === courseId) {
        await get().fetchCourseById(courseId);
      }

      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error?.error?.message || 'Error al inscribirse en el curso',
        isLoading: false,
      });
      throw error;
    }
  },

  unenrollFromCourse: async (courseId) => {
    set({ isLoading: true, error: null });

    try {
      await courseService.unenrollCourse(courseId);

      // Refresh enrolled courses
      await get().fetchEnrolledCourses();

      // Update selected course if it's the one we unenrolled from
      if (get().selectedCourse?.id === courseId) {
        await get().fetchCourseById(courseId);
      }

      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error?.error?.message || 'Error al desinscribirse del curso',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },
}));
