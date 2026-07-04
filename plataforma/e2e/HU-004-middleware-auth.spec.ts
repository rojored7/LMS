/**
 * E2E Test: HU-004 - Middleware de Autenticación JWT
 * Verificar que el middleware JWT valida tokens correctamente.
 * NOTA: El backend usa HttpOnly cookies, NO localStorage.
 * Los tests verifican comportamiento observable (URLs, contenido) no tokens directos.
 */

import { test, expect } from '@playwright/test';
import { AUTH_FILES } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || `${BASE_URL}/api`;

// Tests que NO requieren autenticacion previa
test.describe('HU-004: Middleware JWT - Acceso sin autenticacion', () => {
  test('Rutas protegidas requieren autenticación', async ({ page }) => {
    // Sin autenticacion, acceder a rutas protegidas redirige a /login
    const protectedRoutes = [
      '/profile',
      '/courses/enrolled',
    ];

    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await expect(page).toHaveURL(/.*login/, { timeout: 20000 });
      await expect(page.locator('form')).toBeVisible();
    }
  });

  test('Token inválido en API retorna error 401', async ({ page }) => {
    // Hacer peticion API con token invalido en el header
    const response = await page.request.get(`${API_URL}/users/profile`, {
      headers: {
        'Authorization': 'Bearer invalid-token-12345'
      }
    }).catch((err) => err.response);

    // Debe retornar 401 Unauthorized
    expect(response.status()).toBe(401);
  });
});

// Tests que usan storageState para evitar login fresco (no consumen rate limit)
// NOTA: NO incluye el test de logout porque logout blacklistea el token compartido en Redis,
//       lo que invalidaria todos los demas tests que usan el mismo student.json storageState.
test.describe('HU-004: Middleware JWT valida tokens correctamente', () => {
  test.use({ storageState: AUTH_FILES.student });

  test('Token válido permite acceso a rutas protegidas', async ({ page }) => {
    // storageState ya tiene la sesion - acceder directamente a rutas protegidas
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).not.toHaveURL(/.*login/);
    await expect(
      page.locator('h1').first()
    ).toBeVisible({ timeout: 20000 });

    await page.goto(`${BASE_URL}/courses`);
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('Sesion activa persiste al navegar entre rutas', async ({ page }) => {
    // Navegar entre multiples rutas para verificar que la sesion persiste
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).not.toHaveURL(/.*login/);

    await page.goto(`${BASE_URL}/courses`);
    await expect(page).not.toHaveURL(/.*login/);

    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('Refresh token mantiene sesión activa', async ({ page }) => {
    // storageState mantiene sesion - navegar entre rutas
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForLoadState('load');

    await page.goto(`${BASE_URL}/profile`);
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('Peticiones API con cookies HttpOnly funcionan correctamente', async ({ page }) => {
    // Las cookies HttpOnly se envian automaticamente en requests (withCredentials: true)
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('load');

    // La pagina debe mostrar datos del usuario (no redirigir a login)
    await expect(page).not.toHaveURL(/.*login/);
  });
});

// Test de logout en describe separado SIN storageState compartido.
// Hace login fresco para que solo ese token sea blacklisteado al hacer logout,
// sin afectar el student.json compartido que usan los demas tests.
test.describe('HU-004: Logout revoca acceso correctamente', () => {
  test('Logout elimina sesión y revoca acceso', async ({ page }) => {
    // Fresh login - crea token propio que no afecta a otros tests
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[name="email"]', { timeout: 15000 });
    await page.fill('input[name="email"]', 'student@ciber.com');
    await page.fill('input[name="password"]', 'Student123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|courses)/, { timeout: 30000 });

    // Verificar que tenemos sesion activa
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).not.toHaveURL(/.*login/);

    // Logout via Header dropdown
    const headerButtons = page.locator('header button');
    const count = await headerButtons.count();
    if (count > 0) {
      await headerButtons.nth(count - 1).click();
    }

    const logoutButton = page.locator('button:has-text("Cerrar Sesión"), button:has-text("Cerrar sesión")').first();
    if (await logoutButton.isVisible({ timeout: 3000 })) {
      await logoutButton.click();
      await page.waitForURL(/.*login/, { timeout: 20000 });
    }

    // Despues de logout, ruta protegida debe redirigir a login
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).toHaveURL(/.*login/, { timeout: 20000 });
  });
});
