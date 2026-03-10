/**
 * Course Test Fixtures
 * Datos de prueba para cursos
 */

import { Course, CourseLevel } from '@prisma/client';

export const testCourses: Partial<Course>[] = [
  {
    id: 'course-1',
    title: 'Fundamentos de Ciberseguridad',
    slug: 'fundamentos-ciberseguridad',
    description: 'Curso introductorio de ciberseguridad',
    shortDescription: 'Introducción a la ciberseguridad',
    imageUrl: '/images/course1.jpg',
    level: CourseLevel.BEGINNER,
    duration: 40,
    isPublished: true,
    price: 0,
    instructorId: 'instructor-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'course-2',
    title: 'Hacking Ético Avanzado',
    slug: 'hacking-etico-avanzado',
    description: 'Técnicas avanzadas de pentesting',
    shortDescription: 'Pentesting avanzado',
    imageUrl: '/images/course2.jpg',
    level: CourseLevel.ADVANCED,
    duration: 60,
    isPublished: true,
    price: 99.99,
    instructorId: 'instructor-1',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'course-3',
    title: 'Seguridad en la Nube',
    slug: 'seguridad-nube',
    description: 'Protección de infraestructura cloud',
    shortDescription: 'Cloud security',
    imageUrl: '/images/course3.jpg',
    level: CourseLevel.INTERMEDIATE,
    duration: 45,
    isPublished: true,
    price: 79.99,
    instructorId: 'instructor-1',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
  {
    id: 'course-draft',
    title: 'Curso en Desarrollo',
    slug: 'curso-desarrollo',
    description: 'Este curso está en desarrollo',
    shortDescription: 'En desarrollo',
    imageUrl: null,
    level: CourseLevel.BEGINNER,
    duration: 0,
    isPublished: false,
    price: 0,
    instructorId: 'instructor-1',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
  },
];

export const testModules = [
  {
    id: 'module-1',
    courseId: 'course-1',
    title: 'Introducción',
    description: 'Conceptos básicos',
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'module-2',
    courseId: 'course-1',
    title: 'Fundamentos',
    description: 'Fundamentos de seguridad',
    order: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'module-3',
    courseId: 'course-2',
    title: 'Reconocimiento',
    description: 'Técnicas de reconocimiento',
    order: 1,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

export const testLessons = [
  {
    id: 'lesson-1',
    moduleId: 'module-1',
    title: 'Qué es la ciberseguridad',
    content: '# Introducción\n\nContenido de la lección...',
    videoUrl: 'https://example.com/video1',
    duration: 15,
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'lesson-2',
    moduleId: 'module-1',
    title: 'Amenazas comunes',
    content: '# Amenazas\n\nTipos de amenazas...',
    videoUrl: null,
    duration: 20,
    order: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const testEnrollments = [
  {
    id: 'enrollment-1',
    userId: 'user-1',
    courseId: 'course-1',
    enrolledAt: new Date('2024-01-05'),
    completedAt: null,
    progressPercentage: 50,
    lastAccessedAt: new Date('2024-01-10'),
  },
  {
    id: 'enrollment-2',
    userId: 'user-1',
    courseId: 'course-2',
    enrolledAt: new Date('2024-01-06'),
    completedAt: null,
    progressPercentage: 0,
    lastAccessedAt: new Date('2024-01-06'),
  },
  {
    id: 'enrollment-3',
    userId: 'user-2',
    courseId: 'course-1',
    enrolledAt: new Date('2024-01-07'),
    completedAt: new Date('2024-02-01'),
    progressPercentage: 100,
    lastAccessedAt: new Date('2024-02-01'),
  },
];

export function getTestCourse(isPublished: boolean = true): Partial<Course> {
  return testCourses.find(c => c.isPublished === isPublished) || testCourses[0];
}

export function getTestCourseById(id: string): Partial<Course> | undefined {
  return testCourses.find(c => c.id === id);
}

export function getTestCourseBySlug(slug: string): Partial<Course> | undefined {
  return testCourses.find(c => c.slug === slug);
}

export const mockCourseCreateInput = {
  title: 'Nuevo Curso de Seguridad',
  description: 'Descripción del nuevo curso',
  shortDescription: 'Curso nuevo',
  level: CourseLevel.INTERMEDIATE,
  duration: 30,
  price: 49.99,
};

export const mockCourseUpdateInput = {
  title: 'Curso Actualizado',
  description: 'Descripción actualizada',
  isPublished: true,
};