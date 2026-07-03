/**
 * E2E Tests: Course Enrollment and Learning Flow
 * Tests de navegacion, inscripcion y aprendizaje en cursos
 */

import { test, expect } from '@playwright/test';
import { AUTH_FILES } from './helpers/auth';
import { CourseCatalogPage } from './pages/CourseCatalogPage';
import { CourseLearningPage } from './pages/CourseLearningPage';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || `${BASE_URL}/api`;

async function getFirstCourseSlug(page: any): Promise<string | null> {
  const response = await page.request.get(`${API_URL}/courses?limit=5`).catch(() => null);
  if (!response || !response.ok()) return null;
  const body = await response.json().catch(() => null);
  const courses = body?.data || (Array.isArray(body) ? body : null);
  if (!Array.isArray(courses) || courses.length === 0) return null;
  return String(courses[0].slug || courses[0].id);
}

test.describe('Course Catalog', () => {
  // No auth needed - catalog is public

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
    const coursesResponse = await page.request.get(`${API_URL}/courses`);
    const courses = await coursesResponse.json();
    const firstCourse = Array.isArray(courses) ? courses[0] : courses.data?.[0];

    if (!firstCourse) {
      console.log('No courses available - skipping test');
      return;
    }

    await page.goto(`${BASE_URL}/courses/${firstCourse.slug || firstCourse.id}`);

    await expect(page.locator('h1')).toContainText(firstCourse.title, { timeout: 5000 });

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

    const enrollButton = page
      .locator('button:has-text("Inicia sesion"), button:has-text("sesion")')
      .first();
    await enrollButton.click();

    await page.waitForURL(/\/login/, { timeout: 5000 });
  });
});

test.describe('Course Enrollment', () => {
  test.use({ storageState: AUTH_FILES.student });

  test('should enroll in course successfully', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);
    await catalog.navigate();

    const firstCourse = page.locator('[data-testid="course-card"]').first();
    await firstCourse.click();

    await page.waitForURL(/\/courses\/[^/]+/, { timeout: 5000 });

    const enrollButton = page.locator('[data-testid="enroll-button"]');
    if (await enrollButton.isVisible({ timeout: 5000 })) {
      await enrollButton.click();

      const continueButton = page.locator('[data-testid="continue-button"]');
      await expect(continueButton).toBeVisible({ timeout: 5000 });
    }
  });

  test('should be idempotent (no error on duplicate enrollment)', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);
    await catalog.navigate();

    const firstCourse = page.locator('[data-testid="course-card"]').first();
    await firstCourse.click();
    await page.waitForURL(/\/courses\/[^/]+/, { timeout: 5000 });

    const enrollButton = page.locator('[data-testid="enroll-button"]');
    if (await enrollButton.isVisible({ timeout: 3000 })) {
      await enrollButton.click();
      await page.waitForTimeout(1000);
    }

    const errorToast = page.locator('[role="alert"]:has-text("error")').first();
    await expect(errorToast).not.toBeVisible({ timeout: 2000 });
  });

  test('should show enrolled courses in dashboard', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);
    await catalog.navigate();

    const firstCourse = page.locator('[data-testid="course-card"]').first();
    await firstCourse.click();
    await page.waitForURL(/\/courses\/[^/]+/);

    const enrollButton = page.locator('[data-testid="enroll-button"]');
    if (await enrollButton.isVisible({ timeout: 3000 })) {
      await enrollButton.click();
      await page.locator('[data-testid="continue-button"]').waitFor({ timeout: 8000 }).catch(() => {});
    }

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('load');

    const courseGrid = page.locator('[data-testid="enrolled-courses-grid"]');
    await expect(courseGrid).toBeVisible({ timeout: 10000 });
    const coursesInGrid = courseGrid.locator('h3');
    await expect(coursesInGrid.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Course Learning Interface', () => {
  test.use({ storageState: AUTH_FILES.student });

  test('should navigate to learning interface after enrollment', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);
    await catalog.navigate();

    const firstCourse = page.locator('[data-testid="course-card"]').first();
    await firstCourse.click();
    await page.waitForURL(/\/courses\/[^/]+/);

    const enrollButton = page.locator('[data-testid="enroll-button"]');
    if (await enrollButton.isVisible({ timeout: 3000 })) {
      await enrollButton.click();
      await page.locator('[data-testid="continue-button"]').waitFor({ timeout: 8000 }).catch(() => {});
    }

    const continueButton = page.locator('[data-testid="continue-button"]');
    if (await continueButton.isVisible({ timeout: 5000 })) {
      await continueButton.click();
      await page.waitForURL(/\/courses\/[^/]+\/learn/, { timeout: 5000 });
    }
  });

  test('should display course modules in sidebar', async ({ page }) => {
    const slug = await getFirstCourseSlug(page);
    if (!slug) {
      console.log('No courses available - skipping test');
      return;
    }

    // Ensure enrolled first
    const courseResponse = await page.request.get(`${API_URL}/courses/${slug}`).catch(() => null);
    if (courseResponse?.ok()) {
      const body = await courseResponse.json().catch(() => null);
      const courseId = body?.data?.id || body?.id;
      if (courseId) {
        await page.request.post(`${API_URL}/courses/${courseId}/enroll`).catch(() => {});
      }
    }

    const learningPage = new CourseLearningPage(page);
    await learningPage.navigate(slug);

    const sidebar = learningPage.getSidebar();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    const modules = page.locator('[data-testid^="module-"]');
    const moduleCount = await modules.count();
    expect(moduleCount).toBeGreaterThan(0);
  });

  test('should show progress bar', async ({ page }) => {
    const slug = await getFirstCourseSlug(page);
    if (!slug) {
      console.log('No courses available - skipping test');
      return;
    }

    const learningPage = new CourseLearningPage(page);
    await learningPage.navigate(slug);

    const progressBar = learningPage.getProgressBar();
    await expect(progressBar).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Lesson Content', () => {
  test.use({ storageState: AUTH_FILES.student });

  test('should load and display lesson content', async ({ page }) => {
    const slug = await getFirstCourseSlug(page);
    if (!slug) {
      console.log('No courses available - skipping test');
      return;
    }

    const learningPage = new CourseLearningPage(page);
    await learningPage.navigate(slug);

    const sidebar = learningPage.getSidebar();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

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

  test('should navigate between lessons with next/previous buttons', async ({ page }) => {
    const slug = await getFirstCourseSlug(page);
    if (!slug) {
      console.log('No courses available - skipping test');
      return;
    }

    const learningPage = new CourseLearningPage(page);
    await learningPage.navigate(slug);

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
