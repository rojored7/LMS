/**
 * Auth Helper Functions for E2E Tests
 */

import { Page } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Rutas a los archivos de estado de autenticacion guardados por auth.setup.ts.
 * Usar con test.use({ storageState: AUTH_FILES.student }) para evitar login por UI.
 */
export const AUTH_FILES = {
  admin: path.join(__dirname, '../.auth/admin.json'),
  instructor: path.join(__dirname, '../.auth/instructor.json'),
  student: path.join(__dirname, '../.auth/student.json'),
};

// Credenciales de usuarios seed (confirmados en DB: SELECT email, role FROM users)
export const TEST_CREDENTIALS = {
  admin: { email: 'admin@ciber.com', password: 'Admin123!' },
  instructor: { email: 'instructor@test.com', password: 'Test123!' },
  student: { email: 'student@ciber.com', password: 'Student123!' },
};

/**
 * Login con usuario seed de STUDENT o INSTRUCTOR via UI.
 * Usa cuentas seed pre-existentes en la DB.
 */
export async function registerAndLogin(page: Page, userType: 'STUDENT' | 'INSTRUCTOR' = 'STUDENT') {
  const creds = userType === 'INSTRUCTOR'
    ? TEST_CREDENTIALS.instructor
    : TEST_CREDENTIALS.student;

  await page.goto(`${BASE_URL}/login`);
  await page.fill('[name="email"]', creds.email);
  await page.fill('[name="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|courses)/, { timeout: 30000 });

  return { email: creds.email, password: creds.password, name: userType === 'INSTRUCTOR' ? 'Instructor Test' : 'Estudiante Demo' };
}

/**
 * Logout del usuario actual via dropdown del Header.
 */
export async function logout(page: Page) {
  const userMenuButton = page.locator('header button').filter({
    has: page.locator('span.hidden.sm\\:inline'),
  }).first();

  if (await userMenuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await userMenuButton.click();
  } else {
    const headerButtons = page.locator('header button');
    const count = await headerButtons.count();
    if (count > 0) {
      await headerButtons.nth(count - 1).click();
    }
  }

  const logoutButton = page.locator('button:has-text("Cerrar Sesión"), button:has-text("Cerrar sesión")').first();
  if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutButton.click();
  }

  await page.waitForURL(/\/(login|home|\/)/, { timeout: 20000 });
}

