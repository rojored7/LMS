/**
 * Visual Regression Tests
 * Detecta cambios visuales no intencionales en la UI
 */

import { test, expect } from '@playwright/test';
import { AUTH_FILES } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Visual regression only runs on localhost (snapshots differ per environment/data)
const isLocalhost = !process.env.BASE_URL || process.env.BASE_URL.includes('localhost');
const skipOnNonLocal = !isLocalhost;

test.describe('Visual Regression - Paginas Publicas', () => {
  test.skip(skipOnNonLocal, 'Visual regression solo se ejecuta en localhost');

  test('Landing page', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('load');
    await expect(page).toHaveScreenshot('landing-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('load');
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: false,
      animations: 'disabled'
    });
  });

  test('Register page', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('load');
    await expect(page).toHaveScreenshot('register-page.png', {
      fullPage: false,
      animations: 'disabled'
    });
  });

  test('Course catalog', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForSelector('[data-testid="course-card"], [data-testid="course-catalog"]', { timeout: 10000 }).catch(() => {});
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('course-catalog.png', {
      fullPage: false,
      animations: 'disabled',
      mask: [page.locator('img')]
    });
  });
});

test.describe('Visual Regression - Dashboard Student', () => {
  test.skip(skipOnNonLocal, 'Visual regression solo se ejecuta en localhost');
  test.use({ storageState: AUTH_FILES.student });

  test('Student dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('student-dashboard.png', {
      fullPage: false,
      animations: 'disabled',
      mask: [
        page.locator('[class*="date"]'),
        page.locator('[class*="time"]'),
      ]
    });
  });

  test('Course detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    const firstCourse = page.locator('[data-testid="course-card"]').first();
    if (await firstCourse.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstCourse.click();
      await page.waitForLoadState('load');
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('course-detail.png', {
        fullPage: false,
        animations: 'disabled',
        mask: [page.locator('img'), page.locator('iframe')]
      });
    }
  });

  test('Profile page', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('load');

    await expect(page).toHaveScreenshot('profile-page.png', {
      fullPage: false,
      animations: 'disabled',
      mask: [
        page.locator('input[type="email"]'),
        page.locator('[class*="date"]')
      ]
    });
  });

  test('Notifications page', async ({ page }) => {
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState('load');

    await expect(page).toHaveScreenshot('notifications-page.png', {
      fullPage: false,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Learning Experience', () => {
  test.skip(skipOnNonLocal, 'Visual regression solo se ejecuta en localhost');
  test.use({ storageState: AUTH_FILES.student });

  test('Lesson viewer', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('load');

    const enrolledGrid = page.locator('[data-testid="enrolled-courses-grid"]');
    if (await enrolledGrid.isVisible({ timeout: 5000 }).catch(() => false)) {
      const courseCard = enrolledGrid.locator('a, button').first();
      if (await courseCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await courseCard.click();
        await page.waitForURL(/\/courses\/[^/]+/, { timeout: 5000 }).catch(() => {});
        await page.waitForLoadState('load');
        await page.waitForTimeout(1000);

        await expect(page).toHaveScreenshot('lesson-viewer.png', {
          fullPage: false,
          animations: 'disabled',
          mask: [page.locator('iframe')]
        });
      }
    }
  });

  test('Code editor (Monaco)', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('load');

    const enrolledGrid = page.locator('[data-testid="enrolled-courses-grid"]');
    if (await enrolledGrid.isVisible({ timeout: 5000 }).catch(() => false)) {
      const courseCard = enrolledGrid.locator('a, button').first();
      if (await courseCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await courseCard.click();
        await page.waitForLoadState('load');
        const monacoEditor = page.locator('.monaco-editor');
        if (await monacoEditor.isVisible({ timeout: 5000 }).catch(() => false)) {
          await page.waitForTimeout(2000);

          await expect(page).toHaveScreenshot('code-editor.png', {
            fullPage: false,
            animations: 'disabled'
          });
        }
      }
    }
  });
});

test.describe('Visual Regression - Admin Panel', () => {
  test.skip(skipOnNonLocal, 'Visual regression solo se ejecuta en localhost');
  test.use({ storageState: AUTH_FILES.admin });

  test('Admin dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      fullPage: false,
      animations: 'disabled',
      maxDiffPixelRatio: 0.15,
      mask: [
        page.locator('[class*="number"]'),
        page.locator('[data-testid="total-users"]'),
        page.locator('[data-testid="total-courses"]'),
        page.locator('canvas'),
        page.locator('[class*="chart"]'),
        page.locator('[class*="Chart"]'),
      ]
    });
  });

  test('Users list', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, [class*="user"]', { timeout: 10000 }).catch(() => {});
    await page.waitForLoadState('load');

    await expect(page).toHaveScreenshot('admin-users-list.png', {
      fullPage: false,
      animations: 'disabled',
      mask: [
        page.locator('td:has-text("@")'),
        page.locator('[class*="date"]'),
      ]
    });
  });

  test('Training profiles', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/training-profiles`);
    await page.waitForLoadState('load');

    await expect(page).toHaveScreenshot('training-profiles.png', {
      fullPage: false,
      animations: 'disabled',
      maxDiffPixelRatio: 0.15,
    });
  });
});

test.describe('Visual Regression - Responsive Design', () => {
  test.skip(skipOnNonLocal, 'Visual regression solo se ejecuta en localhost');

  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    test(`Landing page - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(BASE_URL);
      await page.waitForLoadState('load');

      await expect(page).toHaveScreenshot(`landing-${viewport.name}.png`, {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test(`Dashboard - ${viewport.name}`, async ({ page }) => {
      await page.context().addCookies([]);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Navigate to dashboard with student session via storageState set at describe level
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('load');

      await expect(page).toHaveScreenshot(`dashboard-${viewport.name}.png`, {
        fullPage: false,
        animations: 'disabled',
        mask: [page.locator('[class*="date"]')]
      });
    });
  }
});

// Apply storageState for responsive dashboard tests
test.describe('Visual Regression - Responsive Dashboard', () => {
  test.skip(skipOnNonLocal, 'Visual regression solo se ejecuta en localhost');
  test.use({ storageState: AUTH_FILES.student });

  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
  ];

  for (const viewport of viewports) {
    test(`Dashboard authenticated - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('load');

      await expect(page).toHaveScreenshot(`dashboard-auth-${viewport.name}.png`, {
        fullPage: false,
        animations: 'disabled',
        mask: [page.locator('[class*="date"]')]
      });
    });
  }
});

test.describe('Visual Regression - Dark Mode', () => {
  test.skip(skipOnNonLocal, 'Visual regression solo se ejecuta en localhost');
  test.use({ storageState: AUTH_FILES.student });

  test('Dashboard in dark mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    const themeToggle = page.locator('[aria-label*="theme" i], .theme-toggle, button:has-text(/dark|oscuro/i)').first();
    if (await themeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      const htmlClass = await page.getAttribute('html', 'class');
      if (htmlClass?.includes('dark')) {
        await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
          fullPage: false,
          animations: 'disabled',
          mask: [page.locator('[class*="date"]')]
        });
      }
    }
  });
});

test.describe('Visual Regression - Error States', () => {
  test.skip(skipOnNonLocal, 'Visual regression solo se ejecuta en localhost');

  test('404 Not Found page', async ({ page }) => {
    await page.goto(`${BASE_URL}/non-existent-page-404`);
    await page.waitForLoadState('load');

    await expect(page).toHaveScreenshot('404-page.png', {
      fullPage: false,
      animations: 'disabled'
    });
  });

  test('Form validation errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('form-validation-errors.png', {
      fullPage: false,
      animations: 'disabled'
    });
  });
});
