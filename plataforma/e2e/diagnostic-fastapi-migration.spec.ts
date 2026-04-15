/**
 * Diagnostic E2E Test: FastAPI Migration Compatibility
 *
 * This test navigates each key frontend route, captures screenshots,
 * collects console errors, and documents which API endpoints cause crashes.
 *
 * Run with:
 *   npx playwright test e2e/diagnostic-fastapi-migration.spec.ts --headed --project=chromium
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4000/api';

// Collect all console errors across the test
interface ConsoleError {
  route: string;
  message: string;
  type: string;
}

const allConsoleErrors: ConsoleError[] = [];

function attachConsoleListener(page: Page, routeLabel: string) {
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      allConsoleErrors.push({
        route: routeLabel,
        message: msg.text(),
        type: msg.type(),
      });
    }
  });

  page.on('pageerror', (err) => {
    allConsoleErrors.push({
      route: routeLabel,
      message: `PAGE_CRASH: ${err.message}`,
      type: 'pageerror',
    });
  });
}

// Screenshot helper that stores files in test-results/
async function screenshotTo(page: Page, name: string) {
  const dir = path.join('test-results', 'diagnostic');
  await page.screenshot({
    path: path.join(dir, `${name}.png`),
    fullPage: true,
  });
}

test.describe('FastAPI Migration Diagnostic', () => {
  test.setTimeout(60000);

  /**
   * STEP 1: Verify backend health and API availability
   */
  test('1 - backend health check', async ({ request }) => {
    const health = await request.get('http://localhost:4000/health');
    expect(health.status()).toBe(200);
    const body = await health.json();
    console.log('Backend health:', JSON.stringify(body));
  });

  /**
   * STEP 2: Navigate to /login - check if form renders or blank
   */
  test('2 - login page renders', async ({ page }) => {
    attachConsoleListener(page, '/login');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await screenshotTo(page, '01-login-initial');

    const title = await page.title();
    console.log('Page title:', title);

    // Check for blank page (React crash = no visible content)
    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    console.log('Body text length:', bodyText.length);

    if (bodyText.length < 10) {
      console.log('BLANK PAGE DETECTED - React likely crashed before mounting');
      // Log current localStorage state
      const ls = await page.evaluate(() => JSON.stringify(localStorage));
      console.log('LocalStorage:', ls);
    }

    // Check if form fields are present
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]');

    const emailVisible = await emailInput.isVisible().catch(() => false);
    const passwordVisible = await passwordInput.isVisible().catch(() => false);

    console.log('Email input visible:', emailVisible);
    console.log('Password input visible:', passwordVisible);

    await screenshotTo(page, '02-login-form-state');
  });

  /**
   * STEP 3: Clear stale Zustand state in localStorage and reload
   */
  test('3 - clear localStorage and reload login', async ({ page }) => {
    attachConsoleListener(page, '/login-after-clear');

    await page.goto(`${BASE_URL}/login`);

    // Clear all localStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('Cleared localStorage and sessionStorage');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await screenshotTo(page, '03-login-after-clear');

    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const visibleAfterClear = await emailInput.isVisible().catch(() => false);
    console.log('Login form visible after clearing localStorage:', visibleAfterClear);

    // Log any errors after clear
    const errors = allConsoleErrors.filter((e) => e.route === '/login-after-clear');
    console.log('Console errors after localStorage clear:', JSON.stringify(errors, null, 2));
  });

  /**
   * STEP 4: Navigate to /register
   */
  test('4 - register page renders', async ({ page }) => {
    attachConsoleListener(page, '/register');

    // Start fresh
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => localStorage.clear());

    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await screenshotTo(page, '04-register-initial');

    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]');

    console.log('Name input visible:', await nameInput.isVisible().catch(() => false));
    console.log('Email input visible:', await emailInput.isVisible().catch(() => false));
    console.log('Password input visible:', await passwordInput.isVisible().catch(() => false));
  });

  /**
   * STEP 5: Attempt user registration with known test credentials
   */
  test('5 - register new user playwright@test.com', async ({ page }) => {
    attachConsoleListener(page, '/register-attempt');

    // Start fresh
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]');

    if (!(await nameInput.isVisible().catch(() => false))) {
      console.log('SKIP: Register form not visible, cannot test registration');
      await screenshotTo(page, '05-register-form-not-visible');
      return;
    }

    await nameInput.fill('Test User');
    await emailInput.fill('playwright@test.com');
    await passwordInput.fill('testpass123');

    await screenshotTo(page, '05a-register-form-filled');

    // Intercept the API request to log payload and response
    const requestPromise = page.waitForRequest((req) => req.url().includes('/api/auth/register'), {
      timeout: 10000,
    }).catch(() => null);

    const responsePromise = page.waitForResponse((res) => res.url().includes('/api/auth/register'), {
      timeout: 10000,
    }).catch(() => null);

    await submitBtn.click();

    const req = await requestPromise;
    const res = await responsePromise;

    if (req) {
      console.log('Register request URL:', req.url());
      console.log('Register request method:', req.method());
      try {
        console.log('Register request body:', req.postData());
      } catch (_) {
        // ignore
      }
    }

    if (res) {
      console.log('Register response status:', res.status());
      try {
        const body = await res.json();
        console.log('Register response body:', JSON.stringify(body));
      } catch (_) {
        const text = await res.text().catch(() => '(unreadable)');
        console.log('Register response text:', text);
      }
    }

    // Wait for navigation or error
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);
    await screenshotTo(page, '05b-register-after-submit');

    const currentUrl = page.url();
    console.log('URL after register submit:', currentUrl);

    // Check for error messages
    const errorEl = page.locator('[role="alert"], .toast, .error-message, [data-testid="error"]').first();
    if (await errorEl.isVisible().catch(() => false)) {
      console.log('Error message shown:', await errorEl.textContent());
    }
  });

  /**
   * STEP 6: API mismatch check - backend returns `name`, frontend expects `firstName`/`lastName`
   */
  test('6 - API shape mismatch: UserResponse name vs firstName/lastName', async ({ request }) => {
    // Register via API directly
    const registerRes = await request.post(`${API_URL}/auth/register`, {
      data: {
        name: 'Shape Test User',
        email: `shape_test_${Date.now()}@example.com`,
        password: 'testpass123',
      },
    });

    const status = registerRes.status();
    console.log('Register API status:', status);

    const body = await registerRes.json().catch(() => null);
    console.log('Register API response:', JSON.stringify(body, null, 2));

    // The frontend User type expects: firstName, lastName, isActive, updatedAt
    // The FastAPI UserResponse returns: name, xp, theme, locale
    // This IS the root cause of silent crashes

    if (body?.data?.user) {
      const user = body.data.user;
      console.log('--- FIELD MAPPING ANALYSIS ---');
      console.log('FastAPI returns "name":', user.name);
      console.log('Frontend expects "firstName":', user.firstName, '(MISSING - will be undefined)');
      console.log('Frontend expects "lastName":', user.lastName, '(MISSING - will be undefined)');
      console.log('FastAPI returns "role":', user.role);
      console.log('Frontend expects "isActive":', user.isActive, '(MISSING)');
      console.log('Frontend expects "createdAt":', user.createdAt, '(MISSING - FastAPI sends created_at)');
      console.log('FastAPI sends snake_case created_at:', user.created_at);
      console.log('FastAPI sends xp:', user.xp);
      console.log('FastAPI sends theme:', user.theme);
      console.log('FastAPI sends locale:', user.locale);
    }
  });

  /**
   * STEP 7: Check /courses (catalog) - should work even without auth
   */
  test('7 - courses catalog loads', async ({ page }) => {
    attachConsoleListener(page, '/courses');

    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => localStorage.clear());

    await page.goto(`${BASE_URL}/courses`);
    await page.waitForLoadState('networkidle');
    await screenshotTo(page, '07-courses-catalog');

    const currentUrl = page.url();
    console.log('Courses page URL:', currentUrl);

    const h1 = page.locator('h1').first();
    if (await h1.isVisible().catch(() => false)) {
      console.log('H1 text:', await h1.textContent());
    }

    // Check if courses render
    const courseCards = page.locator('[data-testid="course-card"], .course-card, article').first();
    const hasCards = await courseCards.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Course cards visible:', hasCards);

    const errors = allConsoleErrors.filter((e) => e.route === '/courses');
    console.log('Courses page console errors:', JSON.stringify(errors, null, 2));
  });

  /**
   * STEP 8: Check /courses API response format
   */
  test('8 - courses API response format analysis', async ({ request }) => {
    const res = await request.get(`${API_URL}/courses?page=1&limit=5`);
    const status = res.status();
    console.log('GET /courses status:', status);

    const body = await res.json().catch(() => null);
    console.log('GET /courses response:', JSON.stringify(body, null, 2));

    // Frontend CourseCatalog expects: coursesData.data (array of courses)
    // FastAPI returns: { success, data: [...], meta: { total, page, limit, pages } }
    if (body) {
      console.log('--- COURSES RESPONSE ANALYSIS ---');
      console.log('Has "success":', 'success' in body);
      console.log('Has "data" array:', Array.isArray(body.data));
      console.log('Has "meta":', body.meta ? JSON.stringify(body.meta) : 'MISSING');
      // Frontend courseService.getCourses() does: return response (the whole envelope)
      // Then CourseCatalog does: coursesData?.data - should work IF interceptor strips correctly
      console.log('Response interceptor in api.ts returns response.data (the envelope)');
      console.log('getCourses() returns the full envelope as PaginatedResponse<Course>');
      console.log('CourseCatalog reads coursesData.data - this maps to envelope.data (array)');
    }
  });

  /**
   * STEP 9: Notifications endpoint - check if /notifications/unread-count exists
   */
  test('9 - notifications endpoint compatibility', async ({ request }) => {
    // This endpoint is called on EVERY page by useNotifications hook in Header
    // If it fails for authenticated users, Header crashes

    // First register and get cookies
    const registerRes = await request.post(`${API_URL}/auth/register`, {
      data: {
        name: 'Notif Test User',
        email: `notif_test_${Date.now()}@example.com`,
        password: 'testpass123',
      },
    });

    const cookies = registerRes.headers()['set-cookie'];
    console.log('Auth cookies set:', cookies ? 'yes' : 'no (PROBLEM - withCredentials needs cookies)');

    // Try to call notifications with cookies
    const notifRes = await request.get(`${API_URL}/notifications`, {});
    const notifStatus = notifRes.status();
    console.log('GET /notifications status (no auth):', notifStatus);

    // Check unread-count endpoint (called from useNotifications)
    const countRes = await request.get(`${API_URL}/notifications/unread-count`, {});
    console.log('GET /notifications/unread-count status (no auth):', countRes.status());

    // Frontend calls: PUT /notifications/{id}/read
    // FastAPI has: POST /notifications/{id}/read (METHOD MISMATCH)
    console.log('--- METHOD MISMATCH ANALYSIS ---');
    console.log('Frontend markAsRead() uses PUT /notifications/{id}/read');
    console.log('FastAPI router has POST /notifications/{notification_id}/read');
    console.log('Frontend markAllAsRead() uses PUT /notifications/read-all');
    console.log('FastAPI router has POST /notifications/read-all');
    console.log('This WILL cause 405 Method Not Allowed errors when marking notifications');
  });

  /**
   * STEP 10: Header crash test - does Header render without auth
   */
  test('10 - header renders on unauthenticated page', async ({ page }) => {
    attachConsoleListener(page, '/header-noauth');

    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    const header = page.locator('header').first();
    const headerVisible = await header.isVisible().catch(() => false);
    console.log('Header visible:', headerVisible);

    if (headerVisible) {
      // Check login/register buttons present
      const loginBtn = page.locator('button:has-text("Iniciar Sesión")').first();
      const registerBtn = page.locator('button:has-text("Registrarse")').first();
      console.log('Login button visible:', await loginBtn.isVisible().catch(() => false));
      console.log('Register button visible:', await registerBtn.isVisible().catch(() => false));
    }

    await screenshotTo(page, '10-header-noauth');

    const errors = allConsoleErrors.filter((e) => e.route === '/header-noauth');
    console.log('Header (no auth) errors:', JSON.stringify(errors, null, 2));
  });

  /**
   * STEP 11: Full login flow test
   */
  test('11 - full login flow', async ({ page }) => {
    attachConsoleListener(page, '/login-flow');

    // First create a user via API
    const email = `login_test_${Date.now()}@example.com`;
    await page.request.post(`${API_URL}/auth/register`, {
      data: { name: 'Login Flow User', email, password: 'testpass123' },
    });

    // Clear state
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (!(await emailInput.isVisible().catch(() => false))) {
      console.log('SKIP: Login form not visible');
      return;
    }

    await emailInput.fill(email);
    await page.locator('input[name="password"], input[type="password"]').first().fill('testpass123');

    const responsePromise = page.waitForResponse((res) => res.url().includes('/api/auth/login'), {
      timeout: 10000,
    }).catch(() => null);

    await page.locator('button[type="submit"]').click();

    const res = await responsePromise;
    if (res) {
      console.log('Login response status:', res.status());
      const body = await res.json().catch(() => null);
      console.log('Login response body:', JSON.stringify(body));

      if (body?.data?.user) {
        console.log('--- USER OBJECT FROM FASTAPI ---');
        console.log('user.name:', body.data.user.name, '(frontend wants firstName)');
        console.log('user.firstName:', body.data.user.firstName, '(will be undefined)');
        console.log('user.lastName:', body.data.user.lastName, '(will be undefined)');
        console.log('user.isActive:', body.data.user.isActive, '(will be undefined)');
        console.log('user.createdAt:', body.data.user.createdAt, '(frontend wants camelCase)');
        console.log('user.created_at:', body.data.user.created_at, '(FastAPI sends snake_case)');
      }
    }

    await page.waitForTimeout(3000);
    await screenshotTo(page, '11-after-login');

    const currentUrl = page.url();
    console.log('URL after login:', currentUrl);

    const errors = allConsoleErrors.filter((e) => e.route === '/login-flow');
    console.log('Login flow errors:', JSON.stringify(errors, null, 2));
  });

  /**
   * STEP 12: Dashboard access after login
   */
  test('12 - dashboard after login', async ({ page }) => {
    attachConsoleListener(page, '/dashboard');

    const email = `dash_test_${Date.now()}@example.com`;
    const registerRes = await page.request.post(`${API_URL}/auth/register`, {
      data: { name: 'Dashboard User', email, password: 'testpass123' },
    });

    const regBody = await registerRes.json().catch(() => null);
    console.log('Register for dashboard test status:', registerRes.status());

    // Navigate and login
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (!(await emailInput.isVisible().catch(() => false))) {
      console.log('SKIP: Login form not visible, cannot reach dashboard');
      return;
    }

    await emailInput.fill(email);
    await page.locator('input[name="password"], input[type="password"]').first().fill('testpass123');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(3000);
    const urlAfterLogin = page.url();
    console.log('URL after login (should be /dashboard):', urlAfterLogin);

    if (!urlAfterLogin.includes('dashboard') && !urlAfterLogin.includes('admin')) {
      console.log('Did NOT redirect to dashboard - checking why...');
      await screenshotTo(page, '12a-not-redirected');
      return;
    }

    await page.waitForLoadState('networkidle');
    await screenshotTo(page, '12-dashboard');

    const h1 = page.locator('h1').first();
    const h1Text = await h1.textContent().catch(() => null);
    console.log('Dashboard H1:', h1Text);

    // Check if "Bienvenido, undefined" appears (firstName mapping issue)
    if (h1Text?.includes('undefined')) {
      console.log('CONFIRMED BUG: H1 shows "undefined" because user.firstName is missing');
      console.log('FastAPI returns user.name, but frontend Dashboard reads user.firstName');
    }

    const errors = allConsoleErrors.filter((e) => e.route === '/dashboard');
    console.log('Dashboard errors:', JSON.stringify(errors, null, 2));
  });

  /**
   * STEP 13: Summary report of all console errors
   */
  test('13 - summary of all console errors collected', async ({ page }) => {
    // This runs last - summarize findings
    console.log('\n====== DIAGNOSTIC SUMMARY ======');
    console.log(`Total console errors collected: ${allConsoleErrors.length}`);

    const grouped: Record<string, ConsoleError[]> = {};
    for (const err of allConsoleErrors) {
      if (!grouped[err.route]) grouped[err.route] = [];
      grouped[err.route].push(err);
    }

    for (const [route, errors] of Object.entries(grouped)) {
      console.log(`\nRoute: ${route} (${errors.length} errors)`);
      for (const err of errors) {
        console.log(`  [${err.type}] ${err.message}`);
      }
    }

    console.log('\n====== KNOWN INCOMPATIBILITIES (from code analysis) ======');
    console.log('1. USER OBJECT SHAPE MISMATCH (CRITICAL):');
    console.log('   FastAPI returns: { name, xp, theme, locale, created_at }');
    console.log('   Frontend expects: { firstName, lastName, isActive, createdAt, updatedAt }');
    console.log('   Impact: Dashboard crashes at user?.firstName (renders "undefined")');
    console.log('   Header crashes at user.firstName and user.lastName (Avatar component)');
    console.log('   Fix needed: Adapter function in authStore to split name into firstName/lastName');
    console.log('   OR: Update User type to match FastAPI response');

    console.log('\n2. NOTIFICATION HTTP METHOD MISMATCH (HIGH):');
    console.log('   Frontend markAsRead(): PUT /notifications/{id}/read');
    console.log('   FastAPI endpoint: POST /notifications/{notification_id}/read');
    console.log('   Frontend markAllAsRead(): PUT /notifications/read-all');
    console.log('   FastAPI endpoint: POST /notifications/read-all');
    console.log('   Impact: 405 errors on every notification interaction');

    console.log('\n3. COURSES RESPONSE WRAPPING (MEDIUM):');
    console.log('   API interceptor: returns response.data (the envelope)');
    console.log('   getCourses() receives the envelope { success, data, meta }');
    console.log('   CourseCatalog reads coursesData?.data - maps to the array OK');
    console.log('   getCourseById() does response.data.data._count?.enrollments - BROKEN');
    console.log('   Reason: interceptor already unwraps, then service tries .data again');

    console.log('\n4. COURSE FIELD MAPPING (MEDIUM):');
    console.log('   FastAPI CourseListResponse: check schemas/course.py for actual fields');
    console.log('   Frontend Course type: needs duration, enrollmentCount, modules etc.');

    console.log('\n5. AUTHENTICATION MECHANISM (INFO):');
    console.log('   Both use HttpOnly cookies - mechanism is COMPATIBLE');
    console.log('   withCredentials: true in axios - will send cookies to FastAPI');
    console.log('   Cookie names: access_token, refresh_token - check if frontend reads these');

    console.log('\n6. ZUSTAND PERSISTENCE KEY:');
    console.log('   authStore persists to key "auth-storage" in localStorage');
    console.log('   If stale user object with old shape is cached, it will conflict');
    console.log('   Fix: Clear localStorage to remove cached broken state');
  });
});
