import type { APIRequestContext } from '@playwright/test';

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const API_URL = process.env.API_URL || `${BASE_URL}/api`;

/**
 * Obtiene el ID de la primera leccion disponible via API.
 * Retorna undefined si no hay cursos o lecciones en el entorno actual.
 */
export async function getFirstLessonId(request: APIRequestContext): Promise<string | undefined> {
  const coursesRes = await request.get(`${API_URL}/courses?limit=5`);
  if (!coursesRes.ok()) return undefined;
  const body = await coursesRes.json();
  const courses = body.data ?? body;
  if (!Array.isArray(courses) || courses.length === 0) return undefined;
  const courseRes = await request.get(`${API_URL}/courses/${courses[0].id}`);
  if (!courseRes.ok()) return undefined;
  const courseBody = await courseRes.json();
  const course = courseBody.data ?? courseBody;
  return course.modules?.[0]?.lessons?.[0]?.id;
}
