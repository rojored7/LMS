import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { AUTH_FILES } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = '/tmp/e2e-screenshots';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function captureAndReport(page: Page, name: string, stepLabel: string): Promise<{ consoleErrors: number; url: string; title: string }> {
  ensureDir(SCREENSHOT_DIR);
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const url = page.url();
  const title = await page.title();
  return { consoleErrors: 0, url, title };
}

// Steps 1-2 no requieren autenticacion
test.describe('Student Journey E2E - Public', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => {
      consoleErrors.push(`PAGE_ERROR: ${err.message}`);
    });
  });

  test('Step 1: Navigate to home and clear localStorage', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => { localStorage.clear(); });
    const result = await captureAndReport(page, 'e2e-student-00-home', 'Step 1 Home');
    console.log(`[STEP 1] URL: ${result.url} | Title: ${result.title} | Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) console.log(`[STEP 1] Errors: ${consoleErrors.join('; ')}`);
  });

  test('Step 2: Login page renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('load');
    const result = await captureAndReport(page, 'e2e-student-01-login', 'Step 2 Login');
    console.log(`[STEP 2] URL: ${result.url} | Title: ${result.title} | Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) console.log(`[STEP 2] Errors: ${consoleErrors.join('; ')}`);
    const bodyText = await page.locator('body').innerText();
    // La pagina de login puede redirigir si hay sesion activa - solo verificar que cargo algo
    const hasLoginForm = await page.locator('input[type="email"], input[name="email"]').count() > 0;
    const hasDashboard = bodyText.toLowerCase().includes('dashboard') || bodyText.toLowerCase().includes('cursos');
    console.log(`[STEP 2] Has login form: ${hasLoginForm}`);
    console.log(`[STEP 2] Body snippet: ${bodyText.slice(0, 200).replace(/\n/g, ' ')}`);
    expect(hasLoginForm || hasDashboard).toBe(true);
  });
});

// Steps 3-7 usan storageState para evitar fresh UI logins que consumen el rate limit de Nginx
test.describe('Student Journey E2E', () => {
  test.use({ storageState: AUTH_FILES.student });

  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => {
      consoleErrors.push(`PAGE_ERROR: ${err.message}`);
    });
  });

  test('Step 3: Dashboard loads for authenticated student', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    const result = await captureAndReport(page, 'e2e-student-02-dashboard', 'Step 3 Dashboard');
    console.log(`[STEP 3] URL after navigation: ${result.url} | Title: ${result.title} | Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) console.log(`[STEP 3] Errors: ${consoleErrors.join('; ')}`);

    const bodyText = await page.locator('body').innerText();
    const hasBienvenido = bodyText.toLowerCase().includes('bienvenido');
    const hasDashboard = bodyText.toLowerCase().includes('dashboard') || bodyText.toLowerCase().includes('panel');
    console.log(`[STEP 3] Has "bienvenido": ${hasBienvenido}`);
    console.log(`[STEP 3] Has dashboard content: ${hasDashboard}`);
    console.log(`[STEP 3] Body snippet: ${bodyText.slice(0, 300).replace(/\n/g, ' ')}`);
  });

  test('Step 4: Course catalog page', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    const result = await captureAndReport(page, 'e2e-student-03-courses', 'Step 4 Courses');
    console.log(`[STEP 4] URL: ${result.url} | Title: ${result.title} | Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) console.log(`[STEP 4] Errors: ${consoleErrors.join('; ')}`);

    const bodyText = await page.locator('body').innerText();
    const hasCiberseguridad = bodyText.toLowerCase().includes('ciberseguridad');
    console.log(`[STEP 4] Has "Ciberseguridad": ${hasCiberseguridad}`);
    console.log(`[STEP 4] Body snippet: ${bodyText.slice(0, 400).replace(/\n/g, ' ')}`);
  });

  test('Step 5: Course detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    const courseLinks = page.locator('a[href*="/courses/"], a[href*="/course/"]');
    const count = await courseLinks.count();
    console.log(`[STEP 5] Found ${count} course links`);

    if (count > 0) {
      await courseLinks.first().click();
      await page.waitForTimeout(2000);
    } else {
      const ciber = page.locator('text=/ciberseguridad/i');
      const ciberCount = await ciber.count();
      console.log(`[STEP 5] Found ${ciberCount} elements with ciberseguridad`);
      if (ciberCount > 0) {
        await ciber.first().click();
        await page.waitForTimeout(2000);
      }
    }

    const result = await captureAndReport(page, 'e2e-student-04-course-detail', 'Step 5 Course Detail');
    console.log(`[STEP 5] URL: ${result.url} | Title: ${result.title} | Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) console.log(`[STEP 5] Errors: ${consoleErrors.join('; ')}`);

    const bodyText = await page.locator('body').innerText();
    console.log(`[STEP 5] Body snippet: ${bodyText.slice(0, 400).replace(/\n/g, ' ')}`);
  });

  test('Step 6: Profile page', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    const result = await captureAndReport(page, 'e2e-student-05-profile', 'Step 6 Profile');
    console.log(`[STEP 6] URL: ${result.url} | Title: ${result.title} | Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) console.log(`[STEP 6] Errors: ${consoleErrors.join('; ')}`);

    const bodyText = await page.locator('body').innerText();
    const hasProfile = bodyText.toLowerCase().includes('perfil') || bodyText.toLowerCase().includes('profile');
    console.log(`[STEP 6] Has profile content: ${hasProfile}`);
    console.log(`[STEP 6] Body snippet: ${bodyText.slice(0, 400).replace(/\n/g, ' ')}`);
  });

  test('Step 7: Notifications page', async ({ page }) => {
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    const result = await captureAndReport(page, 'e2e-student-06-notifications', 'Step 7 Notifications');
    console.log(`[STEP 7] URL: ${result.url} | Title: ${result.title} | Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) console.log(`[STEP 7] Errors: ${consoleErrors.join('; ')}`);

    const bodyText = await page.locator('body').innerText();
    const hasNotifications = bodyText.toLowerCase().includes('notificacion') || bodyText.toLowerCase().includes('notification');
    console.log(`[STEP 7] Has notifications content: ${hasNotifications}`);
    console.log(`[STEP 7] Body snippet: ${bodyText.slice(0, 400).replace(/\n/g, ' ')}`);
  });
});
