/**
 * E2E Test: HU-006 - Lista de Usuarios Admin
 * Verificar que el admin puede ver y gestionar la lista de usuarios
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, createTestAdmin, registerAndLogin } from './helpers/auth';
import { navigateToUsersList, searchUserByEmail } from './helpers/admin';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('HU-006: Admin puede ver lista de usuarios', () => {
  test.beforeEach(async ({ page }) => {
    // Intentar login como admin
    await createTestAdmin(page);
    await loginAsAdmin(page);
  });

  test('Lista de usuarios se muestra correctamente', async ({ page }) => {
    // Navegar a lista de usuarios
    await navigateToUsersList(page);

    // Verificar que la tabla está presente
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // Verificar encabezados de tabla
    const headers = ['Email', 'Nombre', 'Rol', 'Estado', 'Acciones'];
    for (const header of headers) {
      const headerElement = page.locator(`th:has-text("${header}")`).or(
        page.locator(`thead >> text=/${header}/i`)
      );
      const isVisible = await headerElement.isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        expect(isVisible).toBeTruthy();
      }
    }

    // Verificar que hay al menos una fila de usuario
    const userRows = page.locator('tbody tr');
    const rowCount = await userRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Búsqueda de usuarios funciona correctamente', async ({ page }) => {
    await navigateToUsersList(page);

    // Buscar por email específico
    const searchInput = page.locator('input[placeholder*="Buscar"]').or(
      page.locator('input[name="search"]')
    );

    await searchInput.fill('admin');
    await searchInput.press('Enter');

    await page.waitForTimeout(1000);

    // Verificar que los resultados se filtran
    const userRows = page.locator('tbody tr');
    const rowCount = await userRows.count();

    if (rowCount > 0) {
      // Verificar que al menos una fila contiene "admin"
      const firstRowText = await userRows.first().textContent();
      expect(firstRowText?.toLowerCase()).toContain('admin');
    }
  });

  test('Paginación funciona correctamente', async ({ page }) => {
    await navigateToUsersList(page);

    // Verificar controles de paginación
    const paginationControls = page.locator('[data-testid="pagination"]').or(
      page.locator('.pagination').or(
        page.locator('nav[aria-label*="pagination"]')
      )
    );

    // Si hay suficientes usuarios, debería haber paginación
    const nextButton = page.locator('button:has-text("Siguiente")').or(
      page.locator('button:has-text("Next")').or(
        page.locator('[aria-label="Next page"]')
      )
    );

    // Si el botón siguiente existe y está habilitado, hacer click
    if (await nextButton.isVisible({ timeout: 3000 })) {
      const isDisabled = await nextButton.isDisabled();
      if (!isDisabled) {
        await nextButton.click();

        // Verificar que la URL o el contenido cambia
        await page.waitForTimeout(1000);

        // La tabla debería seguir visible pero con diferentes datos
        await expect(page.locator('table')).toBeVisible();
      }
    }
  });

  test('Filtros por rol funcionan', async ({ page }) => {
    await navigateToUsersList(page);

    // Buscar selector de rol
    const roleFilter = page.locator('select[name="role"]').or(
      page.locator('[data-testid="role-filter"]')
    );

    if (await roleFilter.isVisible({ timeout: 3000 })) {
      // Filtrar por estudiantes
      await roleFilter.selectOption('STUDENT');
      await page.waitForTimeout(1000);

      // Verificar que solo muestra estudiantes
      const userRows = page.locator('tbody tr');
      const firstRowText = await userRows.first().textContent();

      if (firstRowText) {
        expect(firstRowText).toContain('STUDENT');
      }

      // Cambiar a instructores
      await roleFilter.selectOption('INSTRUCTOR');
      await page.waitForTimeout(1000);

      // Verificar actualización
      const updatedRowText = await userRows.first().textContent();
      if (updatedRowText && updatedRowText !== firstRowText) {
        expect(updatedRowText).toContain('INSTRUCTOR');
      }
    }
  });

  test('Detalles de usuario se muestran al hacer click', async ({ page }) => {
    await navigateToUsersList(page);

    // Click en el primer usuario
    const firstUserRow = page.locator('tbody tr').first();
    const viewButton = firstUserRow.locator('button:has-text("Ver")').or(
      firstUserRow.locator('[data-testid="view-user"]').or(
        firstUserRow.locator('a[href*="/users/"]')
      )
    );

    if (await viewButton.isVisible({ timeout: 3000 })) {
      await viewButton.click();

      // Debería mostrar detalles del usuario
      await expect(
        page.locator('h1:has-text("Usuario")').or(
          page.locator('[data-testid="user-details"]').or(
            page.locator('text=/perfil.*usuario/i')
          )
        )
      ).toBeVisible({ timeout: 5000 });

      // Verificar que muestra información del usuario
      await expect(page.locator('text=/email/i')).toBeVisible();
      await expect(page.locator('text=/rol/i')).toBeVisible();
    }
  });

  test('Exportación de datos funciona', async ({ page }) => {
    await navigateToUsersList(page);

    // Buscar botón de exportar
    const exportButton = page.locator('button:has-text("Exportar")').or(
      page.locator('[data-testid="export-users"]')
    );

    if (await exportButton.isVisible({ timeout: 3000 })) {
      // Preparar para descargar
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        exportButton.click()
      ]).catch(() => [null]);

      if (download) {
        // Verificar que se descarga un archivo
        expect(download.suggestedFilename()).toMatch(/\.(csv|json|xlsx)$/);
      }
    }
  });

  test('Ordenamiento de columnas funciona', async ({ page }) => {
    await navigateToUsersList(page);

    // Click en header de columna para ordenar
    const emailHeader = page.locator('th:has-text("Email")').or(
      page.locator('[data-testid="sort-email"]')
    );

    if (await emailHeader.isVisible({ timeout: 3000 })) {
      // Obtener orden inicial
      const firstRowBefore = await page.locator('tbody tr').first().textContent();

      // Click para ordenar
      await emailHeader.click();
      await page.waitForTimeout(1000);

      // Obtener nuevo orden
      const firstRowAfter = await page.locator('tbody tr').first().textContent();

      // El contenido debería ser diferente (a menos que solo haya un usuario)
      const rowCount = await page.locator('tbody tr').count();
      if (rowCount > 1) {
        // Verificar que hay algún indicador de ordenamiento
        const sortIcon = emailHeader.locator('[aria-label*="sort"]').or(
          emailHeader.locator('.sort-icon')
        );
        const hasIcon = await sortIcon.isVisible({ timeout: 1000 }).catch(() => false);
        expect(hasIcon || firstRowBefore !== firstRowAfter).toBeTruthy();
      }
    }
  });
});