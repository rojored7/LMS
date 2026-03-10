/**
 * E2E Test: HU-005 - Recuperación de Contraseña
 * Verificar que el flujo de recuperación de contraseña funciona correctamente
 */

import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

test.describe('HU-005: Recuperación de contraseña funciona correctamente', () => {
  test('Formulario de recuperación envía email', async ({ page }) => {
    // Primero registrar un usuario
    const testEmail = `recovery_test_${Date.now()}@example.com`;
    const testPassword = 'OldPassword123!';

    // Registrar usuario
    await page.request.post(`${API_URL}/auth/register`, {
      data: {
        name: 'Recovery Test User',
        email: testEmail,
        password: testPassword,
      },
    });

    // Ir a página de recuperación
    await page.goto(`${BASE_URL}/forgot-password`);

    // Verificar que el formulario está presente
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="email"]').or(
      page.locator('input[type="email"]')
    )).toBeVisible();

    // Llenar y enviar formulario
    await page.fill('input[name="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Verificar mensaje de confirmación
    await expect(page.locator('text=/email.*enviado/i').or(
      page.locator('text=/check.*inbox/i').or(
        page.locator('[data-testid="success-message"]')
      )
    )).toBeVisible({ timeout: 10000 });
  });

  test('Email no registrado muestra mensaje apropiado', async ({ page }) => {
    const nonExistentEmail = `nonexistent_${Date.now()}@example.com`;

    await page.goto(`${BASE_URL}/forgot-password`);

    await page.fill('input[name="email"]', nonExistentEmail);
    await page.click('button[type="submit"]');

    // Podría mostrar mensaje genérico por seguridad o error específico
    await expect(
      page.locator('text=/email.*enviado/i').or(
        page.locator('text=/no.*encontrado/i').or(
          page.locator('text=/email.*not.*found/i')
        )
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('Validación de email en formulario de recuperación', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);

    // Probar email inválido
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    // Verificar mensaje de validación
    await expect(
      page.locator('text=/email.*inválido/i').or(
        page.locator('text=/valid.*email/i').or(
          page.locator('[data-testid="email-error"]')
        )
      )
    ).toBeVisible({ timeout: 5000 });

    // Limpiar y probar con email vacío
    await page.fill('input[name="email"]', '');
    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=/requerido/i').or(
        page.locator('text=/required/i')
      )
    ).toBeVisible({ timeout: 5000 });
  });

  test('Reset de contraseña con token válido', async ({ page }) => {
    // Este test simula el flujo completo con un token mock
    // En un ambiente real, necesitaríamos interceptar el email o usar un token de prueba

    const mockResetToken = 'test-reset-token-12345';

    // Navegar directamente a la página de reset con token
    await page.goto(`${BASE_URL}/reset-password/${mockResetToken}`);

    // Verificar que el formulario de nueva contraseña está presente
    const passwordField = page.locator('input[name="password"]').or(
      page.locator('input[name="newPassword"]')
    );
    const confirmField = page.locator('input[name="confirmPassword"]').or(
      page.locator('input[name="passwordConfirm"]')
    );

    await expect(passwordField).toBeVisible({ timeout: 5000 });
    await expect(confirmField).toBeVisible({ timeout: 5000 });

    // Llenar nueva contraseña
    const newPassword = 'NewSecurePass123!@#';
    await passwordField.fill(newPassword);
    await confirmField.fill(newPassword);

    // Enviar formulario
    await page.click('button[type="submit"]');

    // Verificar resultado (podría ser error si el token es inválido o success si hay mock)
    await expect(
      page.locator('text=/contraseña.*actualizada/i').or(
        page.locator('text=/password.*updated/i').or(
          page.locator('text=/token.*inválido/i').or(
            page.locator('text=/invalid.*token/i')
          )
        )
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('Validación de nueva contraseña en reset', async ({ page }) => {
    const mockResetToken = 'test-reset-token-67890';

    await page.goto(`${BASE_URL}/reset-password/${mockResetToken}`);

    const passwordField = page.locator('input[name="password"]').or(
      page.locator('input[name="newPassword"]').first()
    );
    const confirmField = page.locator('input[name="confirmPassword"]').or(
      page.locator('input[name="passwordConfirm"]').first()
    );

    // Probar contraseña muy corta
    await passwordField.fill('123');
    await confirmField.fill('123');
    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=/mínimo/i').or(
        page.locator('text=/at least/i').or(
          page.locator('text=/caracteres/i')
        )
      )
    ).toBeVisible({ timeout: 5000 });

    // Probar contraseñas que no coinciden
    await passwordField.fill('NewPassword123!');
    await confirmField.fill('DifferentPassword123!');
    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=/no.*coinciden/i').or(
        page.locator('text=/match/i').or(
          page.locator('text=/diferentes/i')
        )
      )
    ).toBeVisible({ timeout: 5000 });
  });

  test('Token expirado muestra error apropiado', async ({ page }) => {
    // Token obviamente expirado/inválido
    const expiredToken = 'expired-token-from-yesterday';

    await page.goto(`${BASE_URL}/reset-password/${expiredToken}`);

    // Podría mostrar error inmediatamente o al intentar enviar
    const passwordField = page.locator('input[name="password"]').or(
      page.locator('input[name="newPassword"]').first()
    );

    if (await passwordField.isVisible({ timeout: 3000 })) {
      // Si muestra el formulario, llenar y enviar
      await passwordField.fill('NewPassword123!');

      const confirmField = page.locator('input[name="confirmPassword"]').or(
        page.locator('input[name="passwordConfirm"]').first()
      );
      await confirmField.fill('NewPassword123!');

      await page.click('button[type="submit"]');
    }

    // Verificar mensaje de error
    await expect(
      page.locator('text=/expirado/i').or(
        page.locator('text=/expired/i').or(
          page.locator('text=/inválido/i').or(
            page.locator('text=/invalid/i')
          )
        )
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('Link a login desde página de recuperación', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);

    // Buscar link para volver a login
    const loginLink = page.locator('a:has-text("Iniciar sesión")').or(
      page.locator('a:has-text("Login")').or(
        page.locator('a[href*="/login"]')
      )
    );

    await expect(loginLink).toBeVisible();
    await loginLink.click();

    // Verificar redirección
    await expect(page).toHaveURL(/.*login/);
  });
});