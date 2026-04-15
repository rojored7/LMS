/**
 * Visual Regression Tests
 * Detecta cambios visuales no intencionales en la UI
 */

import { test, expect } from '@playwright/test';
import { loginAsStudent, loginAsAdmin, loginAsInstructor } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Visual Regression - Páginas Públicas', () => {
  test('Landing page', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('landing-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: false, // Solo viewport para consistencia
      animations: 'disabled'
    });
  });

  test('Register page', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('register-page.png', {
      fullPage: false,
      animations: 'disabled'
    });
  });

  test('Course catalog', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForSelector('.course-card, .course-item');
    await page.waitForLoadState('networkidle');

    // Esperar a que las imágenes carguen
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('course-catalog.png', {
      fullPage: false,
      animations: 'disabled',
      mask: [page.locator('img')] // Enmascarar imágenes dinámicas
    });
  });
});

test.describe('Visual Regression - Dashboard Student', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('Student dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('student-dashboard.png', {
      fullPage: false,
      animations: 'disabled',
      mask: [
        page.locator('.user-avatar'),
        page.locator('.timestamp'),
        page.locator('[class*="date"]')
      ]
    });
  });

  test('Course detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    const firstCourse = page.locator('.course-card, .course-item').first();
    await firstCourse.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('course-detail.png', {
      fullPage: false,
      animations: 'disabled',
      mask: [page.locator('img'), page.locator('.video-embed')]
    });
  });

  test('Profile page', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('profile-page.png', {
      fullPage: false,
      animations: 'disabled',
      mask: [
        page.locator('input[type="email"]'),
        page.locator('.avatar'),
        page.locator('[class*="date"]')
      ]
    });
  });

  test('Notifications page', async ({ page }) => {
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('notifications-page.png', {
      fullPage: false,
      animations: 'disabled',
      mask: [page.locator('.timestamp'), page.locator('[class*="ago"]')]
    });
  });
});

test.describe('Visual Regression - Learning Experience', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('Lesson viewer', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    const course = page.locator('.enrolled-course, .course-card').first();

    if (await course.isVisible({ timeout: 5000 }).catch(() => false)) {
      await course.click();
      await page.waitForURL(/\/courses\/[^\/]+/);

      const lessonLink = page.locator('a:has-text(/lección|lesson/i)').first();
      if (await lessonLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await lessonLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await expect(page).toHaveScreenshot('lesson-viewer.png', {
          fullPage: false,
          animations: 'disabled',
          mask: [page.locator('.video-player'), page.locator('iframe')]
        });
      }
    }
  });

  test('Quiz interface', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    const course = page.locator('.enrolled-course').first();

    if (await course.isVisible({ timeout: 5000 }).catch(() => false)) {
      await course.click();
      await page.waitForURL(/\/courses\/[^\/]+/);

      const quizLink = page.locator('a:has-text(/quiz|evaluación/i)').first();
      if (await quizLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await quizLink.click();
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveScreenshot('quiz-interface.png', {
          fullPage: false,
          animations: 'disabled'
        });
      }
    }
  });

  test('Code editor (Monaco)', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    const course = page.locator('.enrolled-course').first();

    if (await course.isVisible({ timeout: 5000 }).catch(() => false)) {
      await course.click();
      const labLink = page.locator('a:has-text(/laboratorio|lab/i)').first();

      if (await labLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await labLink.click();
        await page.waitForSelector('.monaco-editor', { timeout: 10000 });
        await page.waitForTimeout(2000); // Dar tiempo para que cargue completamente

        await expect(page).toHaveScreenshot('code-editor.png', {
          fullPage: false,
          animations: 'disabled'
        });
      }
    }
  });
});

test.describe('Visual Regression - Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Admin dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      fullPage: false,
      animations: 'disabled',
      mask: [
        page.locator('.stat-value'),
        page.locator('.chart'),
        page.locator('[class*="number"]')
      ]
    });
  });

  test('Users list', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('admin-users-list.png', {
      fullPage: false,
      animations: 'disabled',
      mask: [
        page.locator('td:has-text("@")'), // Emails
        page.locator('[class*="date"]'),
        page.locator('.timestamp')
      ]
    });
  });

  test('Training profiles', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/training-profiles`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('training-profiles.png', {
      fullPage: false,
      animations: 'disabled'
    });
  });
});

test.describe('Visual Regression - Responsive Design', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    test(`Landing page - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`landing-${viewport.name}.png`, {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test(`Dashboard - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loginAsStudent(page);
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`dashboard-${viewport.name}.png`, {
        fullPage: false,
        animations: 'disabled',
        mask: [page.locator('.timestamp'), page.locator('.user-name')]
      });
    });
  }
});

test.describe('Visual Regression - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('Dashboard in dark mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Activar modo oscuro
    const themeToggle = page.locator('[aria-label*="theme" i], .theme-toggle, button:has-text(/dark|oscuro/i)').first();
    if (await themeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(500); // Esperar transición

      // Verificar que se aplicó el modo oscuro
      const htmlClass = await page.getAttribute('html', 'class');
      if (htmlClass?.includes('dark')) {
        await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
          fullPage: false,
          animations: 'disabled',
          mask: [page.locator('.timestamp')]
        });
      }
    }
  });

  test('Course catalog in dark mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);

    // Activar modo oscuro
    const themeToggle = page.locator('[aria-label*="theme" i], .theme-toggle').first();
    if (await themeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('catalog-dark-mode.png', {
        fullPage: false,
        animations: 'disabled',
        mask: [page.locator('img')]
      });
    }
  });
});

test.describe('Visual Regression - Components', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('Modal dialog', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Trigger any modal (e.g., settings, help)
    const modalTrigger = page.locator('button[aria-label*="settings" i], button[aria-label*="help" i]').first();
    if (await modalTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await modalTrigger.click();

      const modal = page.locator('[role="dialog"], .modal');
      await expect(modal).toBeVisible({ timeout: 3000 });

      await expect(modal).toHaveScreenshot('modal-component.png', {
        animations: 'disabled'
      });
    }
  });

  test('Toast notifications', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);

    // Trigger a toast by updating profile
    const updateButton = page.locator('button[type="submit"], button:has-text(/guardar|save/i)').first();
    if (await updateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await updateButton.click();

      const toast = page.locator('.toast, .notification, [role="alert"]').first();
      if (await toast.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(toast).toHaveScreenshot('toast-notification.png', {
          animations: 'disabled'
        });
      }
    }
  });

  test('Progress bars', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    const progressBar = page.locator('.progress-bar, [role="progressbar"], .progress').first();
    if (await progressBar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(progressBar).toHaveScreenshot('progress-bar.png', {
        animations: 'disabled'
      });
    }
  });

  test('Badges and chips', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);

    const badgeSection = page.locator('.badges, .achievements, [class*="badge"]').first();
    if (await badgeSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(badgeSection).toHaveScreenshot('badges-component.png', {
        animations: 'disabled'
      });
    }
  });
});

test.describe('Visual Regression - Error States', () => {
  test('404 Not Found page', async ({ page }) => {
    await page.goto(`${BASE_URL}/non-existent-page-404`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('404-page.png', {
      fullPage: false,
      animations: 'disabled'
    });
  });

  test('Form validation errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    // Submit empty form to trigger validation
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('form-validation-errors.png', {
      fullPage: false,
      animations: 'disabled'
    });
  });

  test('Empty state', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto(`${BASE_URL}/notifications`);

    // If there's an empty state
    const emptyState = page.locator('.empty-state, [class*="empty"], text=/no.*notificacion/i');
    if (await emptyState.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(emptyState).toHaveScreenshot('empty-state.png', {
        animations: 'disabled'
      });
    }
  });
});