/**
 * Auth Helper Functions for E2E Tests
 * Funciones de ayuda para autenticación en tests E2E
 */

import { Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

/**
 * Login como usuario ADMIN
 */
export async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[name="email"]', 'admin@test.com');
  await page.fill('[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*admin|dashboard/, { timeout: 10000 });
}

/**
 * Login como usuario INSTRUCTOR
 */
export async function loginAsInstructor(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[name="email"]', 'instructor@test.com');
  await page.fill('[name="password"]', 'instructor123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*courses|dashboard/, { timeout: 10000 });
}

/**
 * Login como usuario STUDENT
 */
export async function loginAsStudent(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[name="email"]', 'student@test.com');
  await page.fill('[name="password"]', 'student123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*courses|dashboard/, { timeout: 10000 });
}

/**
 * Registrar y hacer login con un nuevo usuario
 */
export async function registerAndLogin(page: Page, userType: 'STUDENT' | 'INSTRUCTOR' = 'STUDENT') {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Test123!@#';
  const testName = `Test ${userType} ${Date.now()}`;

  // Registrar usuario
  const registerResponse = await page.request.post(`${API_URL}/auth/register`, {
    data: {
      name: testName,
      email: testEmail,
      password: testPassword,
    },
  });

  const registerData = await registerResponse.json();
  const accessToken = registerData.accessToken || registerData.data?.accessToken;

  // Setear token en localStorage
  await page.goto(BASE_URL);
  await page.evaluate((token) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', token); // Por si se necesita
  }, accessToken);

  return { email: testEmail, password: testPassword, name: testName, token: accessToken };
}

/**
 * Logout del usuario actual
 */
export async function logout(page: Page) {
  // Intentar diferentes selectores de logout
  const logoutSelectors = [
    'button[aria-label="User menu"]',
    'button[aria-label="Logout"]',
    '[data-testid="user-menu"]',
    '.user-menu-button',
  ];

  for (const selector of logoutSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
      await element.click();
      break;
    }
  }

  // Buscar y hacer click en el botón de cerrar sesión
  const logoutButton = page.locator('text=/cerrar.*sesi[oó]n/i').or(page.locator('text=/logout/i'));
  if (await logoutButton.isVisible({ timeout: 2000 })) {
    await logoutButton.click();
  }

  // Esperar redirección a login
  await page.waitForURL(/\/(login|home|\/)/, { timeout: 5000 });
}

/**
 * Verificar que el usuario está autenticado
 */
export async function verifyAuthenticated(page: Page) {
  const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  return token !== null && token !== '';
}

/**
 * Crear usuario admin de prueba (requiere acceso a DB o endpoint especial)
 */
export async function createTestAdmin(page: Page) {
  const adminEmail = 'admin@test.com';
  const adminPassword = 'admin123';

  try {
    // Intentar crear admin via API especial o seed
    await page.request.post(`${API_URL}/auth/register`, {
      data: {
        name: 'Admin Test',
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN', // Esto podría no funcionar dependiendo de la API
      },
    });
  } catch {
    // Si falla, asumir que el admin ya existe
  }

  return { email: adminEmail, password: adminPassword };
}

/**
 * Crear usuario instructor de prueba
 */
export async function createTestInstructor(page: Page) {
  const instructorEmail = 'instructor@test.com';
  const instructorPassword = 'instructor123';

  try {
    await page.request.post(`${API_URL}/auth/register`, {
      data: {
        name: 'Instructor Test',
        email: instructorEmail,
        password: instructorPassword,
        role: 'INSTRUCTOR',
      },
    });
  } catch {
    // Si falla, asumir que ya existe
  }

  return { email: instructorEmail, password: instructorPassword };
}

/**
 * Crear usuario estudiante de prueba
 */
export async function createTestStudent(page: Page) {
  const studentEmail = 'student@test.com';
  const studentPassword = 'student123';

  try {
    await page.request.post(`${API_URL}/auth/register`, {
      data: {
        name: 'Student Test',
        email: studentEmail,
        password: studentPassword,
      },
    });
  } catch {
    // Si falla, asumir que ya existe
  }

  return { email: studentEmail, password: studentPassword };
}