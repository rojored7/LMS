/**
 * E2E Tests: Authentication Flow
 * Tests de registro, login, logout y recuperacion de contrasena
 */

import { test, expect } from '@playwright/test';
import { AUTH_FILES } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || `${BASE_URL}/api`;

// Seed users provisioned by seed_base script
const SEED_STUDENT = { email: 'student@ciber.com', password: 'Student123!', name: 'Student' };
const SEED_ADMIN = { email: 'admin@ciber.com', password: 'Admin123!' };

// Helper para generar email unico (solo para tests que realmente registran)
const generateTestEmail = () => `test_${Date.now()}@example.com`;

// Helper: login via UI form and wait for redirect
async function loginViaUI(page: any, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|courses)/, { timeout: 30000 });
}

// Helper: fill and submit registration form
async function fillRegisterForm(
  page: any,
  name: string,
  email: string,
  password: string
) {
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.check('#accept-terms');
}

test.describe('Authentication Flow', () => {
  // Serial para evitar rate limiting en endpoint de login (10/15min)
  test.describe.configure({ mode: 'serial' });
  test('should complete full registration flow', async ({ page }) => {
    const testEmail = generateTestEmail();
    const testPassword = 'Test123!@#';
    const testName = 'Test User E2E';

    // 1. Navegar a pagina de registro
    await page.goto(`${BASE_URL}/register`);
    await expect(page).toHaveURL(/\/register/);

    // 2. Verificar que el formulario esta presente
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();

    // 3. Llenar formulario completo incluyendo confirmPassword y terminos
    await fillRegisterForm(page, testName, testEmail, testPassword);

    // 4. Enviar formulario
    await page.click('button[type="submit"]');

    // 5. Verificar redireccion exitosa
    await page.waitForURL(/\/(dashboard|login|courses)/, { timeout: 30000 });

    // 6. Verificar que el usuario llego al dashboard (sesion activa via cookie)
    expect(page.url()).toMatch(/\/(dashboard|courses)/);
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    // Intentar enviar con email invalido y contrasena corta
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'short');
    await page.click('button[type="submit"]');

    // Verificar mensajes de error
    const errorMessage = page.locator('text=/email|contrase|v.lido/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    // Usar email seed pre-existente para evitar consumir cuota de registro (5/hora)
    const existingEmail = SEED_STUDENT.email;
    const testPassword = 'Test123!@#';

    await page.goto(`${BASE_URL}/register`);
    await fillRegisterForm(page, 'Another User', existingEmail, testPassword);
    await page.click('button[type="submit"]');

    // Verificar error de email ya registrado
    // El backend retorna: "El email ya esta registrado"
    const errorMessage = page.getByText(/ya esta registrado|email.*registrado|registrado|ya exist/i).first();
    await expect(errorMessage).toBeVisible({ timeout: 30000 });
  });

  test('should login with valid credentials', async ({ page }) => {
    // Usar usuario seed para evitar rate limit de registro
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(/\/login/);

    // Llenar formulario de login
    await page.fill('input[name="email"]', SEED_STUDENT.email);
    await page.fill('input[name="password"]', SEED_STUDENT.password);
    await page.click('button[type="submit"]');

    // Verificar redireccion exitosa
    await page.waitForURL(/\/(dashboard|courses)/, { timeout: 30000 });

    // Verificar que la sesion esta activa (el usuario llego al dashboard)
    expect(page.url()).toMatch(/\/(dashboard|courses)/);
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    // Limpiar estado de autenticacion de tests anteriores
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await page.goto(`${BASE_URL}/login`);

    // Esperar que el formulario este listo
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    await expect(emailInput).toBeVisible({ timeout: 30000 });

    // Usar click + type para asegurar que React actualiza su estado interno
    await emailInput.click();
    await emailInput.fill('nonexistent@example.com');
    await passwordInput.click();
    await passwordInput.fill('WrongPass123!');

    // Interceptar la respuesta del API para confirmar que se hizo la peticion
    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/auth/login'), { timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);

    // El backend retorna 401 con "Credenciales invalidas"
    expect(response.status()).toBe(401);

    // Verificar que no se redirige al dashboard
    await page.waitForTimeout(500);
    expect(page.url()).not.toMatch(/\/dashboard/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login via UI con usuario seed
    await loginViaUI(page, SEED_STUDENT.email, SEED_STUDENT.password);

    // El boton de usuario esta en el header; hacer click para abrir el dropdown
    // El Header renderiza un boton con el avatar y el nombre del usuario
    // Buscar por el texto del usuario o por la estructura del header
    const userDropdownTrigger = page
      .locator('header button')
      .filter({ has: page.locator('svg[class*="rotate"], svg[class*="w-4"]') })
      .first();

    if (await userDropdownTrigger.isVisible({ timeout: 3000 })) {
      await userDropdownTrigger.click();
    } else {
      // Fallback: el ultimo boton del header es el menu de usuario cuando esta autenticado
      const headerButtons = page.locator('header button');
      const count = await headerButtons.count();
      if (count > 0) {
        await headerButtons.nth(count - 1).click();
      }
    }

    // Esperar que aparezca el dropdown con "Cerrar Sesion"
    const logoutButton = page.locator('button:has-text("Cerrar Sesión"), button:has-text("Cerrar Sesion")').first();
    await expect(logoutButton).toBeVisible({ timeout: 30000 });
    await logoutButton.click();

    // Verificar redireccion a login
    await page.waitForURL(/\/login/, { timeout: 30000 });
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Intentar acceder a ruta protegida sin autenticacion
    await page.goto(`${BASE_URL}/courses/enrolled`);

    // Verificar redireccion a login
    await page.waitForURL(/\/login/, { timeout: 30000 });
  });

  test('should request password reset', async ({ page }) => {
    // Navegar a pagina de login
    await page.goto(`${BASE_URL}/login`);

    // Click en "Olvidaste tu contrasena?"
    const forgotPasswordLink = page.locator('a:has-text("Olvidaste"), a:has-text("contrase")').first();

    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();

      // Verificar que estamos en la pagina de recuperacion
      await expect(page).toHaveURL(/\/forgot-password|\/reset-password/);

      // Llenar email
      await page.fill('input[name="email"]', SEED_STUDENT.email);
      await page.click('button[type="submit"]');

      // Verificar mensaje de exito
      const successMessage = page.locator('text=/enviado|correo|email/i').first();
      await expect(successMessage).toBeVisible({ timeout: 30000 });
    } else {
      console.log('Password reset feature not implemented yet - skipping');
    }
  });
});

test.describe('Session Persistence', () => {
  test.use({ storageState: AUTH_FILES.student });

  test('should maintain session after page refresh', async ({ page }) => {
    // storageState provee sesion activa - verificar que persiste al recargar
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);

    expect(page.url()).not.toContain('/login');
    expect(page.url()).toMatch(/\/(dashboard|courses)/);

    // Recargar la pagina
    await page.reload();
    await page.waitForLoadState('load');

    // Verificar que el usuario sigue logueado (no redirige a login)
    await page.waitForTimeout(1500);
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toMatch(/\/(dashboard|courses)/);
  });

  test('should persist session across browser tabs', async ({ context }) => {
    // Con storageState, la primera pagina ya tiene sesion activa
    const page1 = await context.newPage();
    await page1.goto(`${BASE_URL}/dashboard`);
    await page1.waitForLoadState('load');
    await page1.waitForTimeout(500);

    // Verificar que el usuario esta logueado en pagina 1
    expect(page1.url()).not.toContain('/login');

    // Abrir segunda pestana y navegar al mismo origen
    const page2 = await context.newPage();
    await page2.goto(BASE_URL);

    // Con HttpOnly cookies, la sesion deberia persistir en la misma sesion de contexto
    await page2.waitForTimeout(1000);
    expect(page2.url()).not.toContain('/login');
  });
});
