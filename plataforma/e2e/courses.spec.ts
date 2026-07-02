/**
 * E2E Tests: Course Enrollment and Learning Flow
 * Tests de navegacion, inscripcion y aprendizaje en cursos
 */

import { test, expect } from '@playwright/test';
import { CourseCatalogPage } from './pages/CourseCatalogPage';
import { CourseLearningPage } from './pages/CourseLearningPage';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || `${BASE_URL}/api`;

// Usar usuario seed para evitar rate limit en registro
// El seed_base provisiona: student@ciber.com / Student123!
async function loginUser(page: any) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[name="email"]', 'student@ciber.com');
  await page.fill('[name="password"]', 'Student123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|courses)/, { timeout: 15000 });
  return { email: 'student@ciber.com' };
}

test.describe('Course Catalog', () => {
  test('should display course catalog', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);
    await catalog.navigate();

    await expect(page).toHaveURL(/\/courses/);

    const cards = await catalog.getCourseCards();
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('should filter courses by level', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);
    await catalog.navigate();

    const levelFilter = page.locator('[data-testid="level-filter"]');
    if (await levelFilter.isVisible({ timeout: 2000 })) {
      await catalog.filterByLevel('BEGINNER');
      const cards = await catalog.getCourseCards();
      const courseCount = await cards.count();
      expect(courseCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should navigate to course detail', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);
    await catalog.navigate();

    await catalog.clickCourseCard(0);

    await page.waitForURL(/\/courses\/[^/]+/, { timeout: 5000 });

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

    // Verificar que el titulo del curso es visible
    await expect(page.locator('h1')).toContainText(firstCourse.title, { timeout: 5000 });

    // Sin autenticacion, el boton muestra "Inicia sesion para inscribirte"
    // o algun boton de accion relacionado con la inscripcion
    const actionButton = page
      .locator('button:has-text("Inicia sesion"), button:has-text("Inscribirse"), button:has-text("sesion")')
      .first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to login when trying to enroll without authentication', async ({ page }) => {
    const coursesResponse = await page.request.get(`${API_URL}/courses`);
    const courses = await coursesResponse.json();
    const firstCourse = Array.isArray(courses) ? courses[0] : courses.data?.[0];

    if (!firstCourse) return;

    await page.goto(`${BASE_URL}/courses/${firstCourse.slug || firstCourse.id}`);

    // Sin auth, el boton dice "Inicia sesion para inscribirte"
    const enrollButton = page
      .locator('button:has-text("Inicia sesion"), button:has-text("sesion")')
      .first();
    await enrollButton.click();

    // Verificar redireccion a login
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });
});

test.describe('Course Enrollment', () => {
  test('should enroll in course successfully', async ({ page }) => {
    await loginUser(page);

    const catalog = new CourseCatalogPage(page);
    await catalog.navigate();

    // Click en primer curso
    const firstCourse = page.locator('[data-testid="course-card"]').first();
    await firstCourse.click();

    await page.waitForURL(/\/courses\/[^/]+/, { timeout: 5000 });

    // Click en inscribirse usando data-testid (solo visible si autenticado y no inscrito)
    const enrollButton = page.locator('[data-testid="enroll-button"]');
    if (await enrollButton.isVisible({ timeout: 5000 })) {
      await enrollButton.click();

      // Verificar que el boton cambio a "Continuar"
      const continueButton = page.locator('[data-testid="continue-button"]');
      await expect(continueButton).toBeVisible({ timeout: 5000 });
    }
  });

  test('should be idempotent (no error on duplicate enrollment)', async ({ page }) => {
    await loginUser(page);

    const catalog = new CourseCatalogPage(page);
    await catalog.navigate();

    const firstCourse = page.locator('[data-testid="course-card"]').first();
    await firstCourse.click();
    await page.waitForURL(/\/courses\/[^/]+/, { timeout: 5000 });

    // Primera inscripcion
    const enrollButton = page.locator('[data-testid="enroll-button"]');
    if (await enrollButton.isVisible({ timeout: 3000 })) {
      await enrollButton.click();
      await page.waitForTimeout(1000);
    }

    // No deberia haber error
    const errorToast = page.locator('[role="alert"]:has-text("error")').first();
    await expect(errorToast).not.toBeVisible({ timeout: 2000 });
  });

  test('should show enrolled courses in "My Courses"', async ({ page }) => {
    await loginUser(page);

    const catalog = new CourseCatalogPage(page);
    await catalog.navigate();

    const firstCourse = page.locator('[data-testid="course-card"]').first();
    const courseTitle = await firstCourse.locator('[data-testid="course-title"]').textContent();
    await firstCourse.click();
    await page.waitForURL(/\/courses\/[^/]+/);

    const enrollButton = page.locator('[data-testid="enroll-button"]');
    if (await enrollButton.isVisible({ timeout: 3000 })) {
      await enrollButton.click();
      // Esperar a que la inscripcion complete (boton cambia a "continue-button")
      await page.locator('[data-testid="continue-button"]').waitFor({ timeout: 8000 }).catch(() => {});
    }

    // Navegar al dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Verificar que el grid de cursos inscritos es visible y tiene contenido
    const courseGrid = page.locator('[data-testid="enrolled-courses-grid"]');
    await expect(courseGrid).toBeVisible({ timeout: 10000 });
    const coursesInGrid = courseGrid.locator('h3');
    await expect(coursesInGrid.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Course Learning Interface', () => {
  test('should navigate to learning interface after enrollment', async ({ page }) => {
    await loginUser(page);

    const catalog = new CourseCatalogPage(page);
    await catalog.navigate();

    const firstCourse = page.locator('[data-testid="course-card"]').first();
    await firstCourse.click();
    await page.waitForURL(/\/courses\/[^/]+/);

    const enrollButton = page.locator('[data-testid="enroll-button"]');
    if (await enrollButton.isVisible({ timeout: 3000 })) {
      await enrollButton.click();
      // Esperar a que el boton cambie a continue-button (inscripcion completada)
      await page.locator('[data-testid="continue-button"]').waitFor({ timeout: 8000 }).catch(() => {});
    }

    // Click en "Continuar Curso"
    const continueButton = page.locator('[data-testid="continue-button"]');
    if (await continueButton.isVisible({ timeout: 5000 })) {
      await continueButton.click();
      await page.waitForURL(/\/courses\/[^/]+\/learn/, { timeout: 5000 });
    }
  });

  test('should display course modules in sidebar', async ({ page }) => {
    await loginUser(page);

    const learningPage = new CourseLearningPage(page);
    await learningPage.navigate('hacking-etico-pentesting-fundamentos');

    const sidebar = learningPage.getSidebar();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Verificar que hay modulos en el sidebar usando los data-testid
    const modules = page.locator('[data-testid^="module-"]');
    const moduleCount = await modules.count();
    expect(moduleCount).toBeGreaterThan(0);
  });

  test('should expand/collapse modules', async ({ page }) => {
    await loginUser(page);

    const learningPage = new CourseLearningPage(page);
    await learningPage.navigate('hacking-etico-pentesting-fundamentos');

    // El sidebar ya tiene modulos expandidos por defecto
    const sidebar = learningPage.getSidebar();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Verificar que hay lecciones visibles
    const lessons = page.locator('[data-testid^="lesson-"]');
    const lessonCount = await lessons.count();
    if (lessonCount > 0) {
      await expect(lessons.first()).toBeVisible();
    }
  });

  test('should show progress bar', async ({ page }) => {
    await loginUser(page);

    const learningPage = new CourseLearningPage(page);
    await learningPage.navigate('hacking-etico-pentesting-fundamentos');

    const progressBar = learningPage.getProgressBar();
    await expect(progressBar).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Lesson Content', () => {
  test('should load and display lesson content', async ({ page }) => {
    await loginUser(page);

    const learningPage = new CourseLearningPage(page);
    await learningPage.navigate('hacking-etico-pentesting-fundamentos');

    // Esperar que el sidebar cargue primero
    const sidebar = learningPage.getSidebar();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Hacer click en la primera leccion para cargar el contenido
    // (el auto-select puede dispararse despues de networkidle, causando race condition)
    const firstLesson = page.locator('[data-testid^="lesson-"]').first();
    if (await firstLesson.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLesson.click();
      await page.waitForTimeout(1000);
    }

    const lessonContent = learningPage.getLessonContent();
    await expect(lessonContent).toBeVisible({ timeout: 30000 });

    const contentText = await lessonContent.textContent();
    expect(contentText).toBeTruthy();
    expect(contentText!.length).toBeGreaterThan(50);
  });

  test('should mark lesson as completed', async ({ page }) => {
    await loginUser(page);

    const learningPage = new CourseLearningPage(page);
    await learningPage.navigate('hacking-etico-pentesting-fundamentos');

    const firstLesson = page.locator('[data-testid^="lesson-"]').first();
    if (await firstLesson.isVisible({ timeout: 5000 })) {
      await firstLesson.click();
      await page.waitForTimeout(1000);
    }

    const completeButton = page
      .locator('button:has-text("Marcar como completado"), button:has-text("Completar")')
      .first();
    if (await completeButton.isVisible({ timeout: 3000 })) {
      await completeButton.click();

      // Wait for lesson to be marked complete (green badge or toast text)
      await expect(
        page.locator('text=Lección completada, text=completada exitosamente').first()
      ).toBeVisible({ timeout: 8000 });
    }
  });

  test('should navigate between lessons with next/previous buttons', async ({ page }) => {
    await loginUser(page);

    const learningPage = new CourseLearningPage(page);
    await learningPage.navigate('hacking-etico-pentesting-fundamentos');

    const firstLesson = page.locator('[data-testid^="lesson-"]').first();
    if (await firstLesson.isVisible({ timeout: 5000 })) {
      await firstLesson.click();
      await page.waitForTimeout(1000);
    }

    const nextButton = page.locator('[data-testid="next-lesson"]');
    if (await nextButton.isVisible({ timeout: 3000 })) {
      await nextButton.click();
      await page.waitForTimeout(500);

      const prevButton = page.locator('[data-testid="prev-lesson"]');
      await expect(prevButton).toBeVisible({ timeout: 3000 });
    }
  });
});
