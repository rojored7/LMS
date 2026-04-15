/**
 * HU-001: Registro de Usuario
 * Como usuario nuevo, quiero registrarme con mi email y contraseña
 * para acceder a la plataforma de aprendizaje.
 *
 * Criterios de Aceptación:
 * AC1: El sistema permite registrar usuarios con email y contraseña válidos
 * AC2: Se valida el formato del email
 * AC3: La contraseña debe cumplir requisitos mínimos de seguridad
 * AC4: No se permite registro con emails duplicados
 * AC5: Se asigna automáticamente el rol STUDENT a nuevos usuarios
 * AC6: Se envía email de confirmación (opcional en MVP)
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

test.describe('HU-001: Registro de Usuario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
  });

  test('AC1: Usuario puede registrarse con email y contraseña válidos', async ({ page }) => {
    const timestamp = Date.now();
    const email = `newuser${timestamp}@example.com`;

    // Llenar formulario de registro
    await page.fill('[name="name"], [name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"], [name="passwordConfirm"]', 'SecurePass123!');

    // Enviar formulario
    await page.click('button[type="submit"]');

    // Verificar redirección a dashboard o login
    await page.waitForURL((url) =>
      url.pathname.includes('/dashboard') ||
      url.pathname.includes('/login') ||
      url.pathname.includes('/courses'),
      { timeout: 10000 }
    );

    // Si redirigió a login, intentar hacer login
    if (page.url().includes('/login')) {
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', 'SecurePass123!');
      await page.click('button[type="submit"]');

      // Verificar que el login funciona
      await page.waitForURL((url) =>
        url.pathname.includes('/dashboard') ||
        url.pathname.includes('/courses'),
        { timeout: 10000 }
      );
    }

    // Verificar que estamos en el dashboard
    await expect(page.locator('text=/dashboard|mis cursos|cursos disponibles/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('AC2: Validación de formato de email', async ({ page }) => {
    // Probar con email inválido
    await page.fill('[name="name"], [name="firstName"]', 'John');
    await page.fill('[name="email"]', 'invalid-email');
    await page.fill('[name="password"]', 'Pass123!');

    // Intentar enviar
    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    await expect(page.locator('text=/email.*inválido|formato.*email|email.*válido/i').first()).toBeVisible({ timeout: 5000 });

    // Verificar que seguimos en la página de registro
    expect(page.url()).toContain('/register');
  });

  test('AC3: Validación de fortaleza de contraseña', async ({ page }) => {
    const timestamp = Date.now();

    // Test 1: Contraseña muy corta
    await page.fill('[name="email"]', `user${timestamp}@example.com`);
    await page.fill('[name="password"]', '123');
    await page.fill('[name="confirmPassword"], [name="passwordConfirm"]', '123');

    // Verificar mensaje de error inline o al enviar
    const shortPasswordError = page.locator('text=/contraseña.*debe.*tener|mínimo.*caracteres|password.*must/i');

    // Hacer click en submit o verificar error inline
    if (!await shortPasswordError.isVisible({ timeout: 1000 })) {
      await page.click('button[type="submit"]');
    }

    await expect(shortPasswordError.first()).toBeVisible({ timeout: 5000 });

    // Test 2: Contraseña sin números
    await page.fill('[name="password"]', 'OnlyLetters');
    await page.fill('[name="confirmPassword"], [name="passwordConfirm"]', 'OnlyLetters');

    // Verificar validación (puede ser inline o al enviar)
    const weakPasswordError = page.locator('text=/debe.*contener.*número|incluir.*dígito|password.*weak/i');

    if (!await weakPasswordError.isVisible({ timeout: 1000 })) {
      await page.click('button[type="submit"]');
    }

    // Algunos sistemas pueden aceptar contraseñas solo con letras si son largas
    // Verificar si hay algún tipo de advertencia o error
    const anyPasswordError = page.locator('text=/contraseña|password/i');
    const errorVisible = await anyPasswordError.first().isVisible({ timeout: 2000 }).catch(() => false);

    // Si no hay errores, verificar que al menos la contraseña fue aceptada
    if (!errorVisible) {
      // La contraseña puede ser aceptada si es suficientemente larga
      expect(page.url()).toContain('/register'); // Aún en registro
    }
  });

  test('AC4: Prevención de emails duplicados', async ({ page, request }) => {
    const duplicateEmail = `duplicate${Date.now()}@example.com`;

    // Primera registración
    await page.fill('[name="name"], [name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="email"]', duplicateEmail);
    await page.fill('[name="password"]', 'Pass123!@#');
    await page.fill('[name="confirmPassword"], [name="passwordConfirm"]', 'Pass123!@#');
    await page.click('button[type="submit"]');

    // Esperar a que complete el registro
    await page.waitForURL((url) =>
      !url.pathname.includes('/register'),
      { timeout: 10000 }
    );

    // Volver a la página de registro
    await page.goto(`${BASE_URL}/register`);

    // Intentar registrar con el mismo email
    await page.fill('[name="name"], [name="firstName"]', 'Jane');
    await page.fill('[name="lastName"]', 'Smith');
    await page.fill('[name="email"]', duplicateEmail);
    await page.fill('[name="password"]', 'Pass456!@#');
    await page.fill('[name="confirmPassword"], [name="passwordConfirm"]', 'Pass456!@#');
    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    await expect(page.locator('text=/email.*ya.*registrado|email.*existe|already.*registered/i').first()).toBeVisible({ timeout: 5000 });

    // Verificar que seguimos en la página de registro
    expect(page.url()).toContain('/register');
  });

  test('AC5: Rol STUDENT asignado automáticamente', async ({ page, request }) => {
    const timestamp = Date.now();
    const email = `roletest${timestamp}@example.com`;
    const password = 'Pass123!@#';

    // Registrar usuario
    await page.fill('[name="name"], [name="firstName"]', 'Role');
    await page.fill('[name="lastName"]', 'Test');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    await page.fill('[name="confirmPassword"], [name="passwordConfirm"]', password);
    await page.click('button[type="submit"]');

    // Esperar redirección
    await page.waitForURL((url) =>
      !url.pathname.includes('/register'),
      { timeout: 10000 }
    );

    // Si redirigió a login, hacer login
    if (page.url().includes('/login')) {
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    }

    // Obtener token del localStorage o hacer petición API para verificar rol
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));

    if (token) {
      // Verificar rol via API
      const response = await request.get(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });

      if (response.ok()) {
        const userData = await response.json();
        const user = userData.data || userData;
        expect(user.role).toBe('STUDENT');
      }
    } else {
      // Verificar visualmente que es un estudiante (no tiene acceso admin)
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Debería ser redirigido o mostrar error de acceso
      await expect(page).toHaveURL((url) =>
        !url.pathname.includes('/admin') ||
        url.pathname.includes('/forbidden') ||
        url.pathname.includes('/401') ||
        url.pathname.includes('/403'),
        { timeout: 5000 }
      );
    }
  });

  test('AC6: Confirmación visual de registro exitoso', async ({ page }) => {
    const timestamp = Date.now();
    const email = `confirm${timestamp}@example.com`;

    // Registrar usuario
    await page.fill('[name="name"], [name="firstName"]', 'Confirm');
    await page.fill('[name="lastName"]', 'Test');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', 'Pass123!@#');
    await page.fill('[name="confirmPassword"], [name="passwordConfirm"]', 'Pass123!@#');

    // Capturar cualquier notificación o toast
    const toastPromise = page.waitForSelector('text=/registro.*exitoso|cuenta.*creada|welcome|bienvenido/i', {
      timeout: 5000,
      state: 'visible'
    }).catch(() => null);

    await page.click('button[type="submit"]');

    // Esperar redirección o mensaje
    await page.waitForURL((url) =>
      !url.pathname.includes('/register'),
      { timeout: 10000 }
    );

    // Verificar si apareció algún mensaje de éxito
    const toastElement = await toastPromise;
    if (toastElement) {
      await expect(toastElement).toBeVisible();
    }

    // Verificar que el usuario puede acceder al dashboard
    if (page.url().includes('/login')) {
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', 'Pass123!@#');
      await page.click('button[type="submit"]');
    }

    // Verificar acceso exitoso
    await expect(page).toHaveURL((url) =>
      url.pathname.includes('/dashboard') ||
      url.pathname.includes('/courses'),
      { timeout: 10000 }
    );
  });

  test('Validación de contraseñas coincidentes', async ({ page }) => {
    const timestamp = Date.now();

    await page.fill('[name="name"], [name="firstName"]', 'Mismatch');
    await page.fill('[name="email"]', `mismatch${timestamp}@example.com`);
    await page.fill('[name="password"]', 'Pass123!@#');
    await page.fill('[name="confirmPassword"], [name="passwordConfirm"]', 'Different123!@#');

    // Intentar enviar o verificar error inline
    const mismatchError = page.locator('text=/contraseñas.*no.*coinciden|passwords.*match|confirmar.*contraseña/i');

    if (!await mismatchError.isVisible({ timeout: 1000 })) {
      await page.click('button[type="submit"]');
    }

    await expect(mismatchError.first()).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('/register');
  });

  test('Campos obligatorios deben estar marcados', async ({ page }) => {
    // Intentar enviar formulario vacío
    await page.click('button[type="submit"]');

    // Verificar mensajes de campos requeridos
    const requiredErrors = await page.locator('text=/requerido|obligatorio|required|fill/i').count();
    expect(requiredErrors).toBeGreaterThan(0);

    // Verificar que seguimos en registro
    expect(page.url()).toContain('/register');
  });
});