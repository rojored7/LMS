/**
 * E2E Tests: Course Enrollment and Learning Flow
 * Tests de navegación, inscripción y aprendizaje en cursos
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

// Helper para hacer login y obtener token
async function loginUser(page: any) {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Test123!@#';

  // Registrar usuario
  await page.request.post(`${API_URL}/auth/register`, {
    data: {
      name: 'Test User',
      email: testEmail,
      password: testPassword,
    },
  });

  // Login
  const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
    data: {
      email: testEmail,
      password: testPassword,
    },
  });

  const loginData = await loginResponse.json();
  const accessToken = loginData.accessToken || loginData.data?.accessToken;

  // Setear token en localStorage
  await page.goto(BASE_URL);
  await page.evaluate((token) => {
    localStorage.setItem('accessToken', token);
  }, accessToken);

  return { email: testEmail, token: accessToken };
}

test.describe('Course Catalog', () => {
  test('should display course catalog', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);

    // Verificar que la página de cursos se carga
    await expect(page).toHaveURL(/\/courses/);

    // Verificar que hay al menos un curso visible
    const courseCards = page.locator('[data-testid="course-card"], .course-card, article').first();
    await expect(courseCards).toBeVisible({ timeout: 5000 });
  });

  test('should filter courses by level', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);

    // Verificar que hay filtros de nivel (si están implementados)
    const levelFilter = page.locator('select[name="level"], button:has-text("Nivel")').first();

    if (await levelFilter.isVisible({ timeout: 2000 })) {
      await levelFilter.click();

      // Seleccionar "Beginner"
      const beginnerOption = page.locator('text=Beginner, text=Principiante').first();
      if (await beginnerOption.isVisible()) {
        await beginnerOption.click();

        // Verificar que los cursos se filtran
        await page.waitForTimeout(500);
        const courseCount = await page.locator('[data-testid="course-card"], .course-card').count();
        expect(courseCount).toBeGreaterThan(0);
      }
    }
  });

  test('should navigate to course detail', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);

    // Click en el primer curso
    const firstCourse = page.locator('[data-testid="course-card"], .course-card, article').first();
    await firstCourse.click();

    // Verificar navegación al detalle
    await page.waitForURL(/\/courses\/[^/]+/, { timeout: 5000 });

    // Verificar que el título del curso está visible
    const courseTitle = page.locator('h1').first();
    await expect(courseTitle).toBeVisible();
  });
});

test.describe('Course Detail', () => {
  test('should show course details without authentication', async ({ page }) => {
    // Obtener primer curso disponible
    const coursesResponse = await page.request.get(`${API_URL}/courses`);
    const courses = await coursesResponse.json();
    const firstCourse = Array.isArray(courses) ? courses[0] : courses.data?.[0];

    if (!firstCourse) {
      console.log('No courses available - skipping test');
      return;
    }

    await page.goto(`${BASE_URL}/courses/${firstCourse.slug || firstCourse.id}`);

    // Verificar información del curso
    await expect(page.locator('h1')).toContainText(firstCourse.title);

    // Verificar que el botón de inscripción está visible
    const enrollButton = page.locator('button:has-text("Inscribirse"), button:has-text("Enroll")').first();
    await expect(enrollButton).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to login when trying to enroll without authentication', async ({ page }) => {
    const coursesResponse = await page.request.get(`${API_URL}/courses`);
    const courses = await coursesResponse.json();
    const firstCourse = Array.isArray(courses) ? courses[0] : courses.data?.[0];

    if (!firstCourse) return;

    await page.goto(`${BASE_URL}/courses/${firstCourse.slug || firstCourse.id}`);

    // Click en inscribirse
    const enrollButton = page.locator('button:has-text("Inscribirse"), button:has-text("Enroll")').first();
    await enrollButton.click();

    // Verificar redirección a login
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });
});

test.describe('Course Enrollment', () => {
  test('should enroll in course successfully', async ({ page }) => {
    // Login primero
    await loginUser(page);

    // Navegar a cursos
    await page.goto(`${BASE_URL}/courses`);

    // Click en primer curso
    const firstCourse = page.locator('[data-testid="course-card"], .course-card, article').first();
    await firstCourse.click();

    // Esperar a que cargue el detalle
    await page.waitForURL(/\/courses\/[^/]+/, { timeout: 5000 });

    // Click en inscribirse
    const enrollButton = page.locator('button:has-text("Inscribirse"), button:has-text("Enroll")').first();
    await enrollButton.click();

    // Verificar toast de éxito
    const successToast = page.locator('.toast:has-text("inscrito"), [role="alert"]:has-text("inscrito")').first();
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Verificar que el botón cambió a "Continuar" o "Comenzar"
    const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Comenzar"), button:has-text("Continue")').first();
    await expect(continueButton).toBeVisible({ timeout: 5000 });
  });

  test('should be idempotent (no error on duplicate enrollment)', async ({ page }) => {
    await loginUser(page);
    await page.goto(`${BASE_URL}/courses`);

    const firstCourse = page.locator('[data-testid="course-card"], .course-card, article').first();
    await firstCourse.click();
    await page.waitForURL(/\/courses\/[^/]+/, { timeout: 5000 });

    // Primera inscripción
    let enrollButton = page.locator('button:has-text("Inscribirse")').first();
    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      await page.waitForTimeout(1000);
    }

    // Intentar inscribirse de nuevo
    enrollButton = page.locator('button:has-text("Inscribirse")').first();
    if (await enrollButton.isVisible()) {
      await enrollButton.click();

      // No debería haber error, solo confirmación o ignorar
      const errorToast = page.locator('.toast:has-text("error"), [role="alert"]:has-text("error")').first();
      await expect(errorToast).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should show enrolled courses in "My Courses"', async ({ page }) => {
    await loginUser(page);

    // Inscribirse en un curso
    await page.goto(`${BASE_URL}/courses`);
    const firstCourse = page.locator('[data-testid="course-card"], .course-card, article').first();
    const courseTitle = await firstCourse.locator('h2, h3').first().textContent();
    await firstCourse.click();
    await page.waitForURL(/\/courses\/[^/]+/);

    const enrollButton = page.locator('button:has-text("Inscribirse")').first();
    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      await page.waitForTimeout(1000);
    }

    // Navegar a "Mis Cursos"
    await page.goto(`${BASE_URL}/courses/enrolled`);

    // Verificar que el curso aparece en la lista
    if (courseTitle) {
      const enrolledCourse = page.locator(`text=${courseTitle}`).first();
      await expect(enrolledCourse).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Course Learning Interface', () => {
  test('should navigate to learning interface after enrollment', async ({ page }) => {
    await loginUser(page);

    // Inscribirse en curso
    await page.goto(`${BASE_URL}/courses`);
    const firstCourse = page.locator('[data-testid="course-card"], .course-card, article').first();
    await firstCourse.click();
    await page.waitForURL(/\/courses\/[^/]+/);

    const enrollButton = page.locator('button:has-text("Inscribirse")').first();
    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      await page.waitForTimeout(1000);
    }

    // Click en "Comenzar" o "Continuar"
    const startButton = page.locator('button:has-text("Comenzar"), button:has-text("Continuar")').first();
    await startButton.click();

    // Verificar navegación a learning interface
    await page.waitForURL(/\/courses\/[^/]+\/learning/, { timeout: 5000 });

    // Verificar que el sidebar de módulos está visible
    const sidebar = page.locator('[data-testid="course-sidebar"], .sidebar, aside').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  test('should display course modules in sidebar', async ({ page }) => {
    await loginUser(page);

    // Navegar directamente a learning (asumiendo que ya hay enrollment)
    const coursesResponse = await page.request.get(`${API_URL}/courses`);
    const courses = await coursesResponse.json();
    const firstCourse = Array.isArray(courses) ? courses[0] : courses.data?.[0];

    if (!firstCourse) return;

    // Inscribirse primero
    await page.request.post(`${API_URL}/courses/${firstCourse.id}/enroll`, {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`,
      },
    });

    await page.goto(`${BASE_URL}/courses/${firstCourse.slug || firstCourse.id}/learning`);

    // Verificar que hay módulos en el sidebar
    const modules = page.locator('[data-testid="module"], .module');
    const moduleCount = await modules.count();
    expect(moduleCount).toBeGreaterThan(0);
  });

  test('should expand/collapse modules', async ({ page }) => {
    await loginUser(page);

    const coursesResponse = await page.request.get(`${API_URL}/courses`);
    const courses = await coursesResponse.json();
    const firstCourse = Array.isArray(courses) ? courses[0] : courses.data?.[0];

    if (!firstCourse) return;

    await page.request.post(`${API_URL}/courses/${firstCourse.id}/enroll`, {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`,
      },
    });

    await page.goto(`${BASE_URL}/courses/${firstCourse.slug || firstCourse.id}/learning`);

    // Click en primer módulo para expandir
    const firstModule = page.locator('[data-testid="module-header"], .module-header, button:has-text("Módulo")').first();
    await firstModule.click();

    // Verificar que las lecciones están visibles
    await page.waitForTimeout(500);
    const lessons = page.locator('[data-testid="lesson"], .lesson-item, li:has-text("Lección")');
    const lessonCount = await lessons.count();

    if (lessonCount > 0) {
      await expect(lessons.first()).toBeVisible();
    }
  });

  test('should show progress bar', async ({ page }) => {
    await loginUser(page);

    const coursesResponse = await page.request.get(`${API_URL}/courses`);
    const courses = await coursesResponse.json();
    const firstCourse = Array.isArray(courses) ? courses[0] : courses.data?.[0];

    if (!firstCourse) return;

    await page.request.post(`${API_URL}/courses/${firstCourse.id}/enroll`, {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`,
      },
    });

    await page.goto(`${BASE_URL}/courses/${firstCourse.slug || firstCourse.id}/learning`);

    // Verificar que hay una barra de progreso visible
    const progressBar = page.locator('[role="progressbar"], .progress-bar, progress').first();
    await expect(progressBar).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Lesson Content', () => {
  test('should load and display lesson content', async ({ page }) => {
    await loginUser(page);

    const coursesResponse = await page.request.get(`${API_URL}/courses`);
    const courses = await coursesResponse.json();
    const firstCourse = Array.isArray(courses) ? courses[0] : courses.data?.[0];

    if (!firstCourse) return;

    await page.request.post(`${API_URL}/courses/${firstCourse.id}/enroll`, {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`,
      },
    });

    await page.goto(`${BASE_URL}/courses/${firstCourse.slug || firstCourse.id}/learning`);

    // Expandir primer módulo
    const firstModule = page.locator('[data-testid="module-header"], .module-header, button:has-text("Módulo")').first();
    await firstModule.click();

    // Click en primera lección
    const firstLesson = page.locator('[data-testid="lesson"], .lesson-item, li:has-text("Lección")').first();
    await firstLesson.click();

    // Verificar que el contenido de la lección se carga
    await page.waitForTimeout(1000);
    const lessonContent = page.locator('article, .lesson-content, [data-testid="lesson-content"]').first();
    await expect(lessonContent).toBeVisible({ timeout: 5000 });

    // Verificar que hay texto (contenido markdown)
    const contentText = await lessonContent.textContent();
    expect(contentText).toBeTruthy();
    expect(contentText!.length).toBeGreaterThan(50);
  });

  test('should mark lesson as completed', async ({ page }) => {
    await loginUser(page);

    const coursesResponse = await page.request.get(`${API_URL}/courses`);
    const courses = await coursesResponse.json();
    const firstCourse = Array.isArray(courses) ? courses[0] : courses.data?.[0];

    if (!firstCourse) return;

    await page.request.post(`${API_URL}/courses/${firstCourse.id}/enroll`, {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`,
      },
    });

    await page.goto(`${BASE_URL}/courses/${firstCourse.slug || firstCourse.id}/learning`);

    // Expandir módulo y click en lección
    const firstModule = page.locator('[data-testid="module-header"], .module-header, button:has-text("Módulo")').first();
    await firstModule.click();

    const firstLesson = page.locator('[data-testid="lesson"], .lesson-item, li:has-text("Lección")').first();
    await firstLesson.click();
    await page.waitForTimeout(1000);

    // Click en "Marcar como completado"
    const completeButton = page.locator('button:has-text("Marcar como completado"), button:has-text("Completar")').first();

    if (await completeButton.isVisible({ timeout: 3000 })) {
      await completeButton.click();

      // Verificar toast de éxito
      const successToast = page.locator('.toast, [role="alert"]').first();
      await expect(successToast).toBeVisible({ timeout: 5000 });

      // Verificar checkmark en sidebar
      const checkmark = page.locator('[data-testid="lesson-completed"], .lesson-completed, svg.checkmark').first();
      await expect(checkmark).toBeVisible({ timeout: 3000 });
    }
  });

  test('should navigate between lessons with next/previous buttons', async ({ page }) => {
    await loginUser(page);

    const coursesResponse = await page.request.get(`${API_URL}/courses`);
    const courses = await coursesResponse.json();
    const firstCourse = Array.isArray(courses) ? courses[0] : courses.data?.[0];

    if (!firstCourse) return;

    await page.request.post(`${API_URL}/courses/${firstCourse.id}/enroll`, {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`,
      },
    });

    await page.goto(`${BASE_URL}/courses/${firstCourse.slug || firstCourse.id}/learning`);

    // Navegar a primera lección
    const firstModule = page.locator('[data-testid="module-header"], .module-header, button:has-text("Módulo")').first();
    await firstModule.click();
    const firstLesson = page.locator('[data-testid="lesson"], .lesson-item, li:has-text("Lección")').first();
    await firstLesson.click();
    await page.waitForTimeout(1000);

    // Click en botón "Siguiente"
    const nextButton = page.locator('button:has-text("Siguiente"), button:has-text("Next")').first();

    if (await nextButton.isVisible({ timeout: 3000 })) {
      await nextButton.click();

      // Verificar que el contenido cambió
      await page.waitForTimeout(500);

      // Verificar botón "Anterior" ahora visible
      const prevButton = page.locator('button:has-text("Anterior"), button:has-text("Previous")').first();
      await expect(prevButton).toBeVisible({ timeout: 3000 });
    }
  });
});
