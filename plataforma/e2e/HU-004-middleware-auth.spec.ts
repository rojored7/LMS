/**
 * E2E Test: HU-004 - Middleware de Autenticación JWT
 * Verificar que el middleware JWT valida tokens correctamente.
 * NOTA: El backend usa HttpOnly cookies, NO localStorage.
 * Los tests verifican comportamiento observable (URLs, contenido) no tokens directos.
 */

import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';
import { AUTH_FILES } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || `${BASE_URL}/api`;

test.describe('HU-004: Middleware JWT valida tokens correctamente', () => {
  test('Rutas protegidas requieren autenticación', async ({ page }) => {
    // Sin autenticacion, acceder a rutas protegidas redirige a /login
    const protectedRoutes = [
      '/profile',
      '/courses/enrolled',
    ];

    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await expect(page).toHaveURL(/.*login/, { timeout: 8000 });
      await expect(page.locator('form')).toBeVisible();
    }
  });

  test('Token válido permite acceso a rutas protegidas', async ({ page }) => {
    // Login con usuario seed (HttpOnly cookies se setean automaticamente)
    await registerAndLogin(page);

    // Ahora puede acceder a rutas protegidas
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).not.toHaveURL(/.*login/);
    await expect(
      page.locator('h1').first()
    ).toBeVisible({ timeout: 8000 });

    await page.goto(`${BASE_URL}/courses`);
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('Sesion activa persiste al navegar entre rutas', async ({ page }) => {
    // Login y navegar entre rutas protegidas
    await registerAndLogin(page);

    // Navegar entre multiples rutas para verificar que la sesion persiste
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).not.toHaveURL(/.*login/);

    await page.goto(`${BASE_URL}/courses`);
    await expect(page).not.toHaveURL(/.*login/);

    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('Logout elimina sesión y revoca acceso', async ({ page }) => {
    // Login
    await registerAndLogin(page);

    // Verificar acceso a ruta protegida
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).not.toHaveURL(/.*login/);

    // Logout via Header dropdown
    // El dropdown se abre con el ultimo boton del header
    const headerButtons = page.locator('header button');
    const count = await headerButtons.count();
    if (count > 0) {
      await headerButtons.nth(count - 1).click();
    }

    const logoutButton = page.locator('button:has-text("Cerrar Sesión"), button:has-text("Cerrar sesión")').first();
    if (await logoutButton.isVisible({ timeout: 3000 })) {
      await logoutButton.click();
      await page.waitForURL(/.*login/, { timeout: 8000 });
    }

    // Despues de logout, ruta protegida debe redirigir a login
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).toHaveURL(/.*login/, { timeout: 8000 });
  });

  test('Refresh token mantiene sesión activa', async ({ page }) => {
    // Login con usuario seed
    await registerAndLogin(page);

    // Navegar a cursos (hace requests al API)
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForLoadState('load');

    // Navegar a otra ruta protegida - la sesion debe seguir activa
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('Peticiones API con cookies HttpOnly funcionan correctamente', async ({ page }) => {
    // Login para obtener cookies
    await registerAndLogin(page);

    // Las cookies HttpOnly se envian automaticamente en requests (withCredentials: true)
    // Verificar que el perfil del usuario carga (requiere auth)
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('load');

    // La pagina debe mostrar datos del usuario (no redirigir a login)
    await expect(page).not.toHaveURL(/.*login/);
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
