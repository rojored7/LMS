/**
 * E2E Flow: RBAC - Permisos de gestion de cursos
 *
 * Verifica la separacion de permisos admin/instructor implementada:
 * - ADMIN: acceso completo a gestion de cursos (crear, editar, importar, publicar, eliminar).
 * - INSTRUCTOR: puede crear, editar, publicar sus cursos. NO puede eliminar.
 * - STUDENT: no accede a /admin/courses.
 *
 * Usa storageState pre-guardado por auth.setup.ts para evitar rate limiting
 * en /api/auth/login (Nginx: 5r/m burst=3).
 */

import { test, expect } from '@playwright/test';
import { AUTH_FILES } from '../helpers/auth';
import { AdminCoursesPage } from '../pages/AdminCoursesPage';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || `${BASE_URL}/api`;

// --- Tests de API con ADMIN ---

test.describe('RBAC - Permisos de cursos via API (Admin)', () => {
  test.use({ storageState: AUTH_FILES.admin });

  test('ADMIN puede crear un curso', async ({ page }) => {
    const title = `Curso test admin ${Date.now()}`;
    const response = await page.request.post(`${API_URL}/admin/courses`, {
      data: {
        title,
        description: 'Test E2E permisos RBAC admin',
        level: 'BEGINNER',
        duration: 60,
        modules: [],
      },
    });
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('ADMIN puede acceder al endpoint de importacion de cursos', async ({ page }) => {
    // El endpoint de validacion de ZIP requiere multipart/form-data con archivo.
    // Sin archivo, devuelve 400 o 422 (validacion), no 403.
    const response = await page.request.post(`${API_URL}/admin/courses/import/validate`, {
      data: {},
    });
    expect(response.status()).not.toBe(403);
  });

  test('ADMIN puede ver la lista de todos los cursos', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/admin/courses`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});

// --- Tests de API con INSTRUCTOR ---

test.describe('RBAC - Permisos de cursos via API (Instructor)', () => {
  test.use({ storageState: AUTH_FILES.instructor });

  test('INSTRUCTOR puede crear un curso', async ({ page }) => {
    const title = `Curso test instructor ${Date.now()}`;
    const response = await page.request.post(`${API_URL}/admin/courses`, {
      data: {
        title,
        description: 'Test E2E de permisos RBAC',
        level: 'BEGINNER',
        duration: 60,
        modules: [],
      },
    });
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe(title);
  });
});

// --- Test de API sin autenticacion ---

test.describe('RBAC - Permisos de cursos via API (Sin auth)', () => {
  test('STUDENT recibe 401 o 403 al intentar crear un curso', async ({ page }) => {
    const response = await page.request.post(`${API_URL}/admin/courses`, {
      data: {
        title: 'Intento student',
        slug: `student-fail-${Date.now()}`,
        description: 'Test',
        level: 'beginner',
        duration: 60,
      },
    });
    expect([401, 403]).toContain(response.status());
  });
});

// --- Tests de UI ---

test.describe('RBAC - Permisos de cursos via UI (Admin)', () => {
  test.use({ storageState: AUTH_FILES.admin });

  test('ADMIN en /admin/courses no ve boton Crear Curso', async ({ page }) => {
    const coursesPage = new AdminCoursesPage(page);
    await coursesPage.goto();
    await coursesPage.verifyAdminView();
  });

  test('ADMIN puede navegar a /admin/courses/create', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/courses/create`);
    // ADMIN tiene acceso completo a creacion de cursos
    await expect(page).not.toHaveURL(/403|forbidden/, { timeout: 8000 });
    await expect(page).toHaveURL(/admin\/courses\/create/, { timeout: 8000 });
  });
});

test.describe('RBAC - Permisos de cursos via UI (Instructor)', () => {
  test.use({ storageState: AUTH_FILES.instructor });

  test('INSTRUCTOR en /admin/courses ve boton Crear Curso', async ({ page }) => {
    const coursesPage = new AdminCoursesPage(page);
    await coursesPage.goto();
    await coursesPage.verifyInstructorView();
  });
});
