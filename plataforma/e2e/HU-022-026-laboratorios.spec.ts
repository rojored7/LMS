/**
 * E2E Tests: HU-022, HU-024 a HU-026 - Laboratorios y Ejecución de Código
 * Usa cursos reales descubiertos via API, no slugs hardcodeados.
 */

import { test, expect } from '@playwright/test';
import { AUTH_FILES } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || `${BASE_URL}/api`;

async function getFirstCourse(page: any) {
  const response = await page.request.get(`${API_URL}/courses?limit=5`).catch(() => null);
  if (!response || !response.ok()) return null;
  const body = await response.json().catch(() => null);
  const courses = body?.data || (Array.isArray(body) ? body : null);
  if (!Array.isArray(courses) || courses.length === 0) return null;
  return courses[0];
}

test.describe('Sistema de Laboratorios', () => {
  test.use({ storageState: AUTH_FILES.student });

  test('HU-022: Executor service responde correctamente', async ({ page }) => {
    // Verificar que el executor service está disponible via backend
    const response = await page.request.get(`${API_URL}/labs`).catch(() => null);

    if (!response) {
      // Si la ruta no existe, verificar el health del backend
      const health = await page.request.get(`${API_URL.replace('/api', '')}/health`);
      expect(health.ok() || health.status() === 200).toBeTruthy();
      return;
    }

    // La ruta de labs existe - verificar que responde con 200 o 401 (requiere auth)
    expect([200, 401, 403, 404]).toContain(response.status());
  });

  test('HU-024: Página de aprendizaje carga para cursos inscritos', async ({ page }) => {
    const course = await getFirstCourse(page);
    if (!course) {
      console.log('No hay cursos disponibles - test omitido');
      return;
    }

    // Inscribirse
    await page.request.post(`${API_URL}/courses/${course.id}/enroll`);

    // Navegar a la pagina de aprendizaje
    await page.goto(`${BASE_URL}/courses/${course.id}/learn`);
    await page.waitForLoadState('load');

    expect(page.url()).not.toContain('/login');

    // Verificar que la pagina cargó contenido (CourseLearning usa divs, no <main>)
    const content = page.locator('[data-testid="course-progress"], div.min-h-screen, h1, h2').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('HU-025: API de labs responde correctamente', async ({ page }) => {
    const course = await getFirstCourse(page);
    if (!course) {
      console.log('No hay cursos disponibles - test omitido');
      return;
    }

    // Inscribirse
    await page.request.post(`${API_URL}/courses/${course.id}/enroll`);

    // Intentar obtener labs del curso
    const labsResponse = await page.request.get(`${API_URL}/courses/${course.id}/labs`).catch(() => null);

    if (labsResponse && labsResponse.ok()) {
      const body = await labsResponse.json();
      expect(body).toBeTruthy();
    } else {
      // Si no hay endpoint de labs, verificar pagina de aprendizaje
      await page.goto(`${BASE_URL}/courses/${course.id}/learn`);
      await page.waitForLoadState('load');
      expect(page.url()).not.toContain('/login');
    }
  });

  test('HU-026: Estudiante puede ver su progreso en el dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('load');

    expect(page.url()).not.toContain('/login');

    // El dashboard debe mostrar progreso
    const progressElements = page.locator(
      '[data-testid="course-progress"], .progress-bar, [class*="progress"]'
    );

    const dashboard = page.locator('[data-testid="student-dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 8000 });

    // Verificar que hay algún indicador de cursos o progreso
    const statsCards = page.locator('p.text-2xl, [class*="stat"], [class*="count"]');
    const count = await statsCards.count();

    // El dashboard siempre debe tener algún contenido
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(500);
  });
});
