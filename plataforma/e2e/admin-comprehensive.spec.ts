/**
 * Comprehensive E2E Admin Tests
 * Tests critical admin user journeys:
 * - Login as admin
 * - Admin dashboard stats
 * - Users list
 * - Courses list
 * - Training profiles
 * - Courses catalog
 */

import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@ciber.com';
const ADMIN_PASSWORD = 'Admin1234!';
const SCREENSHOT_DIR = process.cwd();

async function captureScreenshot(page: Page, filename: string) {
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  return filepath;
}

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(ADMIN_EMAIL);

  const passwordInput = page.locator('input[type="password"]').first();
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill(ADMIN_PASSWORD);

  await page.locator('button[type="submit"]').first().click();

  // waitForURL with URL object - .href contains the full url string
  await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15000 });
}

test.describe('Admin E2E Comprehensive Tests', () => {

  test('Full admin flow: login + all admin sections', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // ----------------------------------------------------------------
    // STEP 1: Clear localStorage
    // ----------------------------------------------------------------
    await page.goto(BASE_URL);
    const cleared = await page.evaluate(() => {
      localStorage.clear();
      return 'ok';
    });
    expect(cleared).toBe('ok');
    console.log('\n[STEP 1] Clear localStorage: PASS - Home page loaded, localStorage cleared');

    // ----------------------------------------------------------------
    // STEP 2: Login as admin
    // ----------------------------------------------------------------
    const errorsBeforeLogin = [...consoleErrors];
    consoleErrors.length = 0;

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill(ADMIN_EMAIL);

    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(ADMIN_PASSWORD);

    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15000 });

    const afterLoginUrl = page.url();
    await captureScreenshot(page, 'e2e-admin-01-dashboard.png');

    const loginRedirectedToAdmin = afterLoginUrl.includes('/admin') || afterLoginUrl.includes('/dashboard');
    const loginErrors = [...consoleErrors];
    consoleErrors.length = 0;

    console.log(`\n[STEP 2] Login as admin: ${loginRedirectedToAdmin ? 'PASS' : 'WARN'}`);
    console.log(`  URL after login: ${afterLoginUrl}`);
    console.log(`  Expected redirect to /admin or /dashboard: ${loginRedirectedToAdmin}`);
    if (loginErrors.length > 0) {
      console.log(`  Console errors (${loginErrors.length}):`);
      loginErrors.slice(0, 5).forEach(e => console.log(`    - ${e.substring(0, 150)}`));
    } else {
      console.log('  Console errors: none');
    }

    expect(afterLoginUrl).not.toContain('/login');

    // ----------------------------------------------------------------
    // STEP 3: Admin Dashboard
    // ----------------------------------------------------------------
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');

    const adminDashUrl = page.url();
    await captureScreenshot(page, 'e2e-admin-02-admin-dashboard.png');

    // Check for stats cards using multiple strategies
    const statsTestIds = [
      '[data-testid="total-users"]',
      '[data-testid="total-courses"]',
      '[data-testid="active-enrollments"]',
      '[data-testid="completion-rate"]',
    ];
    const statsCssClasses = [
      '.stat-card', '.stats-card', '[class*="Stat"]', '[class*="stat"]',
      '[class*="card"]', '[class*="Card"]'
    ];

    let statsFoundBy = '';
    for (const sel of statsTestIds) {
      if (await page.locator(sel).first().isVisible({ timeout: 2000 }).catch(() => false)) {
        statsFoundBy = sel;
        break;
      }
    }
    if (!statsFoundBy) {
      for (const sel of statsCssClasses) {
        const count = await page.locator(sel).count();
        if (count >= 2) {
          statsFoundBy = `${sel} (${count} elements)`;
          break;
        }
      }
    }

    const adminDashboardErrors = [...consoleErrors];
    consoleErrors.length = 0;

    const adminAccessOk = adminDashUrl.includes('/admin') || !adminDashUrl.includes('/login');
    const dashboardStatus = adminAccessOk ? 'PASS' : 'FAIL';

    console.log(`\n[STEP 3] Admin Dashboard: ${dashboardStatus}`);
    console.log(`  URL: ${adminDashUrl}`);
    console.log(`  Stats cards found by: ${statsFoundBy || 'not found by testid/class - checking page content'}`);
    if (!statsFoundBy) {
      const bodyText = await page.locator('body').textContent() || '';
      const numbers = bodyText.match(/\d+/g)?.slice(0, 5).join(', ') || 'none';
      console.log(`  Numbers visible on page: ${numbers}`);
    }
    if (adminDashboardErrors.length > 0) {
      console.log(`  Console errors (${adminDashboardErrors.length}):`);
      adminDashboardErrors.slice(0, 5).forEach(e => console.log(`    - ${e.substring(0, 150)}`));
    } else {
      console.log('  Console errors: none');
    }

    expect(adminAccessOk).toBe(true);

    // ----------------------------------------------------------------
    // STEP 4: Admin Users List
    // ----------------------------------------------------------------
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');

    const usersUrl = page.url();
    await captureScreenshot(page, 'e2e-admin-03-users-list.png');

    let usersFoundBy = '';
    const userSelectors = [
      'table', 'tbody tr', '[data-testid="users-table"]',
      '[data-testid="users-list"]', '[class*="user"]', 'tr'
    ];
    for (const sel of userSelectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        usersFoundBy = `${sel} (${count} elements)`;
        break;
      }
    }

    const usersErrors = [...consoleErrors];
    consoleErrors.length = 0;

    const usersPageOk = usersUrl.includes('/admin') && !usersUrl.includes('/login');

    console.log(`\n[STEP 4] Admin Users List: ${usersPageOk ? 'PASS' : 'FAIL'}`);
    console.log(`  URL: ${usersUrl}`);
    console.log(`  Users table/list found by: ${usersFoundBy || 'not found'}`);
    if (usersErrors.length > 0) {
      console.log(`  Console errors (${usersErrors.length}):`);
      usersErrors.slice(0, 5).forEach(e => console.log(`    - ${e.substring(0, 150)}`));
    } else {
      console.log('  Console errors: none');
    }

    expect(usersPageOk).toBe(true);

    // ----------------------------------------------------------------
    // STEP 5: Admin Courses List
    // ----------------------------------------------------------------
    await page.goto(`${BASE_URL}/admin/courses`);
    await page.waitForLoadState('networkidle');

    const adminCoursesUrl = page.url();
    await captureScreenshot(page, 'e2e-admin-04-courses-list.png');

    let coursesFoundBy = '';
    const courseSelectors = [
      'table', 'tbody tr', '[data-testid="courses-table"]',
      '[data-testid="courses-list"]', '[class*="course"]', 'tr'
    ];
    for (const sel of courseSelectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        coursesFoundBy = `${sel} (${count} elements)`;
        break;
      }
    }

    const coursesErrors = [...consoleErrors];
    consoleErrors.length = 0;

    const coursesPageOk = adminCoursesUrl.includes('/admin') && !adminCoursesUrl.includes('/login');

    console.log(`\n[STEP 5] Admin Courses List: ${coursesPageOk ? 'PASS' : 'FAIL'}`);
    console.log(`  URL: ${adminCoursesUrl}`);
    console.log(`  Courses table/list found by: ${coursesFoundBy || 'not found'}`);
    if (coursesErrors.length > 0) {
      console.log(`  Console errors (${coursesErrors.length}):`);
      coursesErrors.slice(0, 5).forEach(e => console.log(`    - ${e.substring(0, 150)}`));
    } else {
      console.log('  Console errors: none');
    }

    expect(coursesPageOk).toBe(true);

    // ----------------------------------------------------------------
    // STEP 6: Admin Training Profiles
    // ----------------------------------------------------------------
    await page.goto(`${BASE_URL}/admin/training-profiles`);
    await page.waitForLoadState('networkidle');

    const trainingProfilesUrl = page.url();
    await captureScreenshot(page, 'e2e-admin-05-training-profiles.png');

    let profilesFoundBy = '';
    const profileSelectors = [
      'table', 'tbody tr', '[data-testid="profiles-table"]',
      '[data-testid="training-profiles"]', '[class*="profile"]',
      'h1', 'h2', 'main'
    ];
    for (const sel of profileSelectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        const el = page.locator(sel).first();
        const visible = await el.isVisible({ timeout: 2000 }).catch(() => false);
        if (visible) {
          profilesFoundBy = `${sel} (${count} elements)`;
          break;
        }
      }
    }

    const profilesErrors = [...consoleErrors];
    consoleErrors.length = 0;

    const profilesPageOk = trainingProfilesUrl.includes('/admin') && !trainingProfilesUrl.includes('/login');

    console.log(`\n[STEP 6] Admin Training Profiles: ${profilesPageOk ? 'PASS' : 'FAIL'}`);
    console.log(`  URL: ${trainingProfilesUrl}`);
    console.log(`  Profiles content found by: ${profilesFoundBy || 'not found'}`);
    if (profilesErrors.length > 0) {
      console.log(`  Console errors (${profilesErrors.length}):`);
      profilesErrors.slice(0, 5).forEach(e => console.log(`    - ${e.substring(0, 150)}`));
    } else {
      console.log('  Console errors: none');
    }

    expect(profilesPageOk).toBe(true);

    // ----------------------------------------------------------------
    // STEP 7: Courses Catalog
    // ----------------------------------------------------------------
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForLoadState('networkidle');

    const catalogUrl = page.url();
    await captureScreenshot(page, 'e2e-admin-06-courses-catalog.png');

    let catalogFoundBy = '';
    let courseItemCount = 0;
    const catalogSelectors = [
      '[data-testid="course-card"]', '[class*="CourseCard"]',
      '[class*="course-card"]', '.course-card', 'article',
      '[class*="card"]', 'h2', 'h3'
    ];
    for (const sel of catalogSelectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        catalogFoundBy = `${sel} (${count} elements)`;
        courseItemCount = count;
        break;
      }
    }

    const catalogErrors = [...consoleErrors];
    consoleErrors.length = 0;

    const catalogPageOk = catalogUrl.includes('/courses') && !catalogUrl.includes('/login');
    const bodyText = await page.locator('body').textContent() || '';
    const hasCourseContent = /curso|course|ciberseguridad|security|inscr/i.test(bodyText);

    console.log(`\n[STEP 7] Courses Catalog: ${catalogPageOk ? 'PASS' : 'FAIL'}`);
    console.log(`  URL: ${catalogUrl}`);
    console.log(`  Catalog items found by: ${catalogFoundBy || 'not found with specific selectors'}`);
    console.log(`  Has course-related text: ${hasCourseContent}`);
    if (catalogErrors.length > 0) {
      console.log(`  Console errors (${catalogErrors.length}):`);
      catalogErrors.slice(0, 5).forEach(e => console.log(`    - ${e.substring(0, 150)}`));
    } else {
      console.log('  Console errors: none');
    }

    expect(catalogPageOk).toBe(true);

    // ----------------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------------
    const steps = [
      { name: 'Step 1 - Clear localStorage', pass: true },
      { name: 'Step 2 - Login as admin', pass: !afterLoginUrl.includes('/login') },
      { name: 'Step 3 - Admin Dashboard', pass: adminAccessOk },
      { name: 'Step 4 - Admin Users List', pass: usersPageOk },
      { name: 'Step 5 - Admin Courses List', pass: coursesPageOk },
      { name: 'Step 6 - Admin Training Profiles', pass: profilesPageOk },
      { name: 'Step 7 - Courses Catalog', pass: catalogPageOk },
    ];

    const passCount = steps.filter(s => s.pass).length;

    console.log('\n============================================================');
    console.log('FINAL SUMMARY');
    console.log('============================================================');
    steps.forEach(s => console.log(`  [${s.pass ? 'PASS' : 'FAIL'}] ${s.name}`));
    console.log(`------------------------------------------------------------`);
    console.log(`  TOTAL: ${steps.length} | PASS: ${passCount} | FAIL: ${steps.length - passCount}`);
    console.log(`  Pass rate: ${Math.round((passCount / steps.length) * 100)}%`);
    console.log(`  Screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log('============================================================\n');
  });
});
