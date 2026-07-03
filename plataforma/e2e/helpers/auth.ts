/**
 * Auth Helper Functions for E2E Tests
 * Funciones de ayuda para autenticación en tests E2E
 */

import { Page } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || `${BASE_URL}/api`;

/**
 * Rutas a los archivos de estado de autenticación guardados por auth.setup.ts
 * Usar con test.use({ storageState: AUTH_FILES.student }) para evitar login por UI
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
 * Login como usuario ADMIN via UI
 */
export async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[name="email"]', TEST_CREDENTIALS.admin.email);
  await page.fill('[name="password"]', TEST_CREDENTIALS.admin.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*admin|dashboard/, { timeout: 30000 });
}

/**
 * Login como usuario ADMIN via UI (cookies HttpOnly, no Bearer token).
 * Hace login por UI para evitar el rate limiting de Nginx en /api/auth/login.
 */
export async function loginAsAdminAPI(page: Page): Promise<string> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  await page.fill('input[name="email"]', TEST_CREDENTIALS.admin.email);
  await page.fill('input[name="password"]', TEST_CREDENTIALS.admin.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(admin|dashboard)/, { timeout: 30000 });
  return '';
}

/**
 * Login como usuario INSTRUCTOR via UI
 */
export async function loginAsInstructor(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[name="email"]', TEST_CREDENTIALS.instructor.email);
  await page.fill('[name="password"]', TEST_CREDENTIALS.instructor.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(instructor|admin|dashboard|courses)/, { timeout: 30000 });
}

/**
 * Login como usuario INSTRUCTOR via UI (cookies HttpOnly, no Bearer token).
 * Hace login por UI para evitar el rate limiting de Nginx en /api/auth/login.
 */
export async function loginAsInstructorAPI(page: Page): Promise<string> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  await page.fill('input[name="email"]', TEST_CREDENTIALS.instructor.email);
  await page.fill('input[name="password"]', TEST_CREDENTIALS.instructor.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(instructor|admin|dashboard|courses)/, { timeout: 30000 });
  return '';
}

/**
 * Login como usuario STUDENT via UI usando cuenta seed
 */
export async function loginAsStudent(page: Page) {
  return registerAndLogin(page, 'STUDENT');
}

/**
 * Login con usuario seed de STUDENT o INSTRUCTOR.
 * NOTA: No registra usuario nuevo (rate limit: 5/hora).
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
 * Logout del usuario actual.
 * El dropdown de usuario está en el Header (botón con avatar + nombre de usuario).
 * El botón de logout dice "Cerrar Sesión" dentro del dropdown.
 */
export async function logout(page: Page) {
  // Abrir el dropdown del usuario haciendo click en el botón del header
  // El botón tiene el nombre del usuario como texto visible
  const userMenuButton = page.locator('header button').filter({
    has: page.locator('span.hidden.sm\\:inline'),
  }).first();

  if (await userMenuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await userMenuButton.click();
  } else {
    // Fallback: buscar el último botón en el header (suele ser el menú de usuario)
    const headerButtons = page.locator('header button');
    const count = await headerButtons.count();
    if (count > 0) {
      await headerButtons.nth(count - 1).click();
    }
  }

  // Hacer click en "Cerrar Sesión" en el dropdown
  const logoutButton = page.locator('button:has-text("Cerrar Sesión"), button:has-text("Cerrar sesión")').first();
  if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutButton.click();
  }

  // Esperar redirección a login
  await page.waitForURL(/\/(login|home|\/)/, { timeout: 8000 });
}

/**
 * Verificar que el usuario está autenticado
 * Fix: el backend usa HttpOnly cookies, no localStorage.
 * Verifica que la URL actual no sea /login.
 */
export async function verifyAuthenticated(page: Page) {
  return !page.url().includes('/login');
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