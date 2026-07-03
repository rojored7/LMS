/**
 * Fixtures de autenticacion compartidas para tests E2E.
 *
 * Uso:
 *   import { test, expect } from '../fixtures/auth.fixture';
 *
 *   test('algo como admin', async ({ adminPage }) => { ... });
 *   test('algo como instructor', async ({ instructorPage }) => { ... });
 *
 * El login se hace UNA vez por fixture, no en cada test.
 */

import { test as base, Browser, Page } from '@playwright/test';
import { TEST_CREDENTIALS } from '../helpers/auth';

const API_URL = process.env.API_URL || 'http://localhost:4000/api';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

type AuthFixtures = {
  adminPage: Page;
  instructorPage: Page;
  studentPage: Page;
};

async function loginViaAPI(browser: Browser, credentials: { email: string; password: string }): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login via API para obtener cookies de sesion
  const response = await page.request.post(`${API_URL}/auth/login`, {
    data: credentials,
  });

  if (!response.ok()) {
    throw new Error(`Login fallido para ${credentials.email}: ${response.status()}`);
  }

  // Navegar al home para que las cookies queden activas en el contexto del browser
  await page.goto(BASE_URL);
  return page;
}

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const page = await loginViaAPI(browser, TEST_CREDENTIALS.admin);
    await use(page);
    await page.context().close();
  },

  instructorPage: async ({ browser }, use) => {
    const page = await loginViaAPI(browser, TEST_CREDENTIALS.instructor);
    await use(page);
    await page.context().close();
  },

  studentPage: async ({ browser }, use) => {
    // Los estudiantes se crean dinamicamente para no depender de seeds
    const context = await browser.newContext();
    const page = await context.newPage();
    const email = `student_e2e_${Date.now()}@test.com`;
    const password = 'Test123!';

    await page.request.post(`${API_URL}/auth/register`, {
      data: { name: 'Student E2E', email, password },
    });

    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard|courses/, { timeout: 30000 });

    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
