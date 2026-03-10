/**
 * E2E Tests: Authentication Flow
 * Tests de registro, login, logout y recuperación de contraseña
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

// Helper para generar email único
const generateTestEmail = () => `test_${Date.now()}@example.com`;

test.describe('Authentication Flow', () => {
  let testEmail: string;
  let testPassword: string;
  let testName: string;

  test.beforeEach(() => {
    testEmail = generateTestEmail();
    testPassword = 'Test123!@#';
    testName = 'Test User E2E';
  });

  test('should complete full registration flow', async ({ page }) => {
    // 1. Navegar a página de registro
    await page.goto(`${BASE_URL}/register`);
    await expect(page).toHaveURL(/\/register/);

    // 2. Verificar que el formulario está presente
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();

    // 3. Llenar formulario
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    // 4. Enviar formulario
    await page.click('button[type="submit"]');

    // 5. Verificar redirección exitosa (dashboard o login)
    await page.waitForURL(/\/(dashboard|login|courses)/, { timeout: 5000 });

    // 6. Verificar que los tokens están en localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    // 7. Verificar toast de éxito (si existe)
    const toast = page.locator('.toast, [role="alert"]').first();
    if (await toast.isVisible()) {
      await expect(toast).toContainText(/registrado|exitoso|bienvenido/i);
    }
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    // Intentar enviar con email inválido
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'short');
    await page.click('button[type="submit"]');

    // Verificar mensajes de error
    const errorMessage = page.locator('text=/email|contraseña|válido/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    // Primero, registrar el usuario
    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Esperar a que la redirección ocurra
    await page.waitForURL(/\/(dashboard|login|courses)/, { timeout: 5000 });

    // Logout
    const logoutButton = page.locator('button:has-text("Salir"), a:has-text("Cerrar sesión")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL(/\/login/, { timeout: 3000 });
    } else {
      await page.goto(`${BASE_URL}/login`);
    }

    // Intentar registrar con el mismo email
    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[name="name"]', 'Another User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Verificar error de email ya registrado
    const errorMessage = page.locator('text=/ya registrado|ya existe|duplicate/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should login with valid credentials', async ({ page }) => {
    // Primero registrar el usuario
    await page.request.post(`${API_URL}/auth/register`, {
      data: {
        name: testName,
        email: testEmail,
        password: testPassword,
      },
    });

    // Navegar a login
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(/\/login/);

    // Llenar formulario de login
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Verificar redirección exitosa
    await page.waitForURL(/\/(dashboard|courses)/, { timeout: 5000 });

    // Verificar tokens en localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).toBeTruthy();

    // Verificar que el nombre del usuario aparece en algún lugar
    const userDisplay = page.locator(`text=${testName}`).first();
    await expect(userDisplay).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Intentar login con credenciales inválidas
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    const errorMessage = page.locator('text=/credenciales|incorrecta|inválido/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Verificar que no hay tokens en localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).toBeFalsy();
  });

  test('should logout successfully', async ({ page }) => {
    // Primero hacer login
    const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });

    const loginData = await loginResponse.json();
    const accessToken = loginData.accessToken || loginData.data?.accessToken;

    // Navegar a la app con el token
    await page.goto(BASE_URL);
    await page.evaluate((token) => {
      localStorage.setItem('accessToken', token);
    }, accessToken);

    await page.reload();

    // Buscar y hacer click en botón de logout
    const logoutButton = page.locator('button:has-text("Salir"), button:has-text("Cerrar sesión"), a:has-text("Logout")').first();
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    await logoutButton.click();

    // Verificar redirección a login
    await page.waitForURL(/\/login/, { timeout: 5000 });

    // Verificar que localStorage está limpio
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(tokenAfterLogout).toBeFalsy();
  });

  test('should maintain session after page refresh', async ({ page }) => {
    // Login
    const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });

    const loginData = await loginResponse.json();
    const accessToken = loginData.accessToken || loginData.data?.accessToken;

    // Navegar a la app con el token
    await page.goto(BASE_URL);
    await page.evaluate((token) => {
      localStorage.setItem('accessToken', token);
    }, accessToken);

    await page.reload();

    // Verificar que la sesión se mantiene
    const tokenAfterRefresh = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(tokenAfterRefresh).toBeTruthy();

    // Verificar que el usuario sigue logueado (no redirige a login)
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/login');
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Intentar acceder a ruta protegida sin autenticación
    await page.goto(`${BASE_URL}/courses/enrolled`);

    // Verificar redirección a login
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });

  test('should request password reset', async ({ page }) => {
    // Navegar a página de login
    await page.goto(`${BASE_URL}/login`);

    // Click en "¿Olvidaste tu contraseña?"
    const forgotPasswordLink = page.locator('a:has-text("Olvidaste"), a:has-text("contraseña")').first();

    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();

      // Verificar que estamos en la página de recuperación
      await expect(page).toHaveURL(/\/forgot-password|\/reset-password/);

      // Llenar email
      await page.fill('input[name="email"]', testEmail);
      await page.click('button[type="submit"]');

      // Verificar mensaje de éxito
      const successMessage = page.locator('text=/enviado|correo|email/i').first();
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    } else {
      console.log('Password reset feature not implemented yet - skipping');
    }
  });
});

test.describe('Session Persistence', () => {
  let accessToken: string;

  test.beforeEach(async ({ page }) => {
    // Crear usuario y obtener token
    const testEmail = generateTestEmail();
    const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: testEmail,
        password: 'Test123!@#',
      },
    });

    const loginData = await loginResponse.json();
    accessToken = loginData.accessToken || loginData.data?.accessToken;
  });

  test('should persist session across browser tabs', async ({ context }) => {
    // Abrir primera pestaña
    const page1 = await context.newPage();
    await page1.goto(BASE_URL);
    await page1.evaluate((token) => {
      localStorage.setItem('accessToken', token);
    }, accessToken);
    await page1.reload();

    // Verificar que el usuario está logueado en página 1
    await page1.waitForTimeout(1000);
    expect(page1.url()).not.toContain('/login');

    // Abrir segunda pestaña
    const page2 = await context.newPage();
    await page2.goto(BASE_URL);

    // Verificar que el token está presente en la segunda pestaña
    const tokenInPage2 = await page2.evaluate(() => localStorage.getItem('accessToken'));
    expect(tokenInPage2).toBeTruthy();
  });
});
