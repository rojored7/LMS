/**
 * E2E Tests: HU-007 a HU-010 - Dashboard Admin Completo
 * Tests de estadísticas, gestión de cursos, training profiles y actividad
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, createTestAdmin } from './helpers/auth';
import {
  navigateToAdminPanel,
  getAdminStatistics,
  manageCourse,
  viewGlobalProgressReport,
  createTrainingProfile,
  viewActivityLogs
} from './helpers/admin';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Dashboard Admin - Estadísticas y Gestión', () => {
  test.beforeEach(async ({ page }) => {
    await createTestAdmin(page);
    await loginAsAdmin(page);
  });

  test('HU-007: Dashboard muestra estadísticas correctas', async ({ page }) => {
    await navigateToAdminPanel(page);

    // Verificar cards de estadísticas principales
    const statsCards = [
      '[data-testid="total-users"]',
      '[data-testid="total-courses"]',
      '[data-testid="active-enrollments"]',
      '[data-testid="completion-rate"]'
    ];

    for (const selector of statsCards) {
      const element = page.locator(selector).or(
        page.locator(`text=/${selector.replace(/[\[\]"=-]/g, '.*')}/i`)
      );

      const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        const value = await element.textContent();
        expect(value).toBeTruthy();

        // Verificar que contiene un número
        expect(value).toMatch(/\d+/);
      }
    }

    // Verificar gráficos
    const charts = page.locator('.recharts-wrapper').or(
      page.locator('canvas').or(
        page.locator('[data-testid="chart"]')
      )
    );

    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);

    // Verificar período de tiempo selector
    const periodSelector = page.locator('select[name="period"]').or(
      page.locator('[data-testid="period-selector"]')
    );

    if (await periodSelector.isVisible({ timeout: 3000 })) {
      // Cambiar período
      await periodSelector.selectOption('month');
      await page.waitForTimeout(1000);

      // Los datos deberían actualizarse
      const updatedStats = await page.locator('[data-testid="total-users"]').textContent();
      expect(updatedStats).toBeTruthy();
    }
  });

  test('HU-008: Gestión de cursos desde panel admin', async ({ page }) => {
    await navigateToAdminPanel(page);

    // Ir a sección de cursos
    await page.click('a:has-text("Cursos")');
    await page.waitForURL(/.*courses/);

    // Verificar lista de cursos
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });

    // Verificar acciones disponibles
    const courseRow = page.locator('tbody tr').first();

    if (await courseRow.isVisible({ timeout: 3000 })) {
      // Verificar botones de acción
      const actions = ['Editar', 'Activar', 'Desactivar', 'Estadísticas'];

      for (const action of actions) {
        const button = courseRow.locator(`button:has-text("${action}")`);
        const exists = await button.isVisible({ timeout: 1000 }).catch(() => false);

        if (exists) {
          // Probar una acción
          if (action === 'Estadísticas') {
            await button.click();

            // Debería mostrar modal o navegar a estadísticas
            await expect(
              page.locator('[data-testid="course-stats"]').or(
                page.locator('text=/estudiantes.*inscritos/i')
              )
            ).toBeVisible({ timeout: 5000 });

            // Cerrar modal si existe
            const closeButton = page.locator('button[aria-label="Close"]').or(
              page.locator('button:has-text("Cerrar")')
            );

            if (await closeButton.isVisible({ timeout: 1000 })) {
              await closeButton.click();
            }
          }
          break;
        }
      }
    }

    // Verificar creación de curso
    const createButton = page.locator('button:has-text("Nuevo curso")').or(
      page.locator('[data-testid="create-course"]')
    );

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click();

      // Debería mostrar formulario
      await expect(page.locator('form')).toBeVisible({ timeout: 5000 });

      // Verificar campos requeridos
      await expect(page.locator('input[name="title"]')).toBeVisible();
      await expect(page.locator('textarea[name="description"]')).toBeVisible();
      await expect(page.locator('select[name="difficulty"]')).toBeVisible();
    }
  });

  test('HU-009: Gestión de training profiles', async ({ page }) => {
    await navigateToAdminPanel(page);

    // Ir a training profiles
    await page.click('a:has-text("Training Profiles")').or(
      page.click('a:has-text("Perfiles de entrenamiento")')
    );

    // Crear nuevo perfil
    const createButton = page.locator('button:has-text("Nuevo perfil")').or(
      page.locator('[data-testid="create-profile"]')
    );

    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();

      // Llenar formulario
      await page.fill('input[name="name"]', 'Perfil de Test E2E');
      await page.fill('textarea[name="description"]', 'Descripción del perfil de prueba');

      // Seleccionar cursos
      const courseCheckboxes = page.locator('input[type="checkbox"][name*="course"]');
      const checkboxCount = await courseCheckboxes.count();

      if (checkboxCount > 0) {
        // Seleccionar primeros 2 cursos
        for (let i = 0; i < Math.min(2, checkboxCount); i++) {
          await courseCheckboxes.nth(i).check();
        }
      }

      // Guardar
      await page.click('button:has-text("Guardar")').or(
        page.click('button[type="submit"]')
      );

      // Verificar confirmación
      await expect(
        page.locator('text=/perfil.*creado/i').or(
          page.locator('[data-testid="success-message"]')
        )
      ).toBeVisible({ timeout: 5000 });
    }

    // Verificar lista de perfiles
    await expect(
      page.locator('[data-testid="profiles-list"]').or(
        page.locator('table')
      )
    ).toBeVisible({ timeout: 5000 });

    // Asignar perfil a usuario
    const assignButton = page.locator('button:has-text("Asignar a usuarios")').first();

    if (await assignButton.isVisible({ timeout: 3000 })) {
      await assignButton.click();

      // Buscar usuario
      const userSearch = page.locator('input[placeholder*="Buscar usuario"]');
      if (await userSearch.isVisible({ timeout: 3000 })) {
        await userSearch.fill('test');
        await page.waitForTimeout(1000);

        // Seleccionar primer usuario
        const userOption = page.locator('[data-testid^="user-option-"]').first();
        if (await userOption.isVisible({ timeout: 2000 })) {
          await userOption.click();

          // Confirmar asignación
          await page.click('button:has-text("Asignar")');

          await expect(
            page.locator('text=/asignado.*exitosamente/i')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('HU-010: Visualización de logs de actividad', async ({ page }) => {
    await navigateToAdminPanel(page);

    // Ir a logs
    await page.click('a:has-text("Logs")').or(
      page.click('a:has-text("Actividad")')
    );

    // Verificar tabla de logs
    await expect(
      page.locator('table').or(
        page.locator('[data-testid="activity-logs"]')
      )
    ).toBeVisible({ timeout: 5000 });

    // Verificar filtros
    const filters = [
      'select[name="activityType"]',
      'select[name="userRole"]',
      'input[name="dateFrom"]',
      'input[name="dateTo"]'
    ];

    for (const selector of filters) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);

      if (isVisible) {
        // Probar filtro de tipo de actividad
        if (selector.includes('activityType')) {
          await element.selectOption('LOGIN');
          await page.waitForTimeout(1000);

          // Verificar que se actualizan los logs
          const logRows = page.locator('tbody tr');
          const firstLogText = await logRows.first().textContent();

          if (firstLogText) {
            expect(firstLogText.toLowerCase()).toContain('login');
          }
        }
      }
    }

    // Verificar búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar"]');

    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('admin');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      // Los resultados deberían filtrarse
      const logRows = page.locator('tbody tr');
      const rowCount = await logRows.count();

      if (rowCount > 0) {
        const firstLogText = await logRows.first().textContent();
        expect(firstLogText?.toLowerCase()).toContain('admin');
      }
    }

    // Verificar exportación de logs
    const exportButton = page.locator('button:has-text("Exportar")');

    if (await exportButton.isVisible({ timeout: 3000 })) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(csv|json|log)$/);
      }
    }

    // Verificar detalles de log
    const firstLogRow = page.locator('tbody tr').first();
    const detailsButton = firstLogRow.locator('button:has-text("Detalles")');

    if (await detailsButton.isVisible({ timeout: 3000 })) {
      await detailsButton.click();

      // Debería mostrar modal con detalles
      await expect(
        page.locator('[data-testid="log-details-modal"]').or(
          page.locator('.modal')
        )
      ).toBeVisible({ timeout: 3000 });

      // Verificar información detallada
      await expect(page.locator('text=/timestamp/i')).toBeVisible();
      await expect(page.locator('text=/usuario/i')).toBeVisible();
      await expect(page.locator('text=/acción/i')).toBeVisible();

      // Cerrar modal
      await page.click('button:has-text("Cerrar")').or(
        page.click('button[aria-label="Close"]')
      );
    }
  });

  test('Reportes de progreso global', async ({ page }) => {
    await navigateToAdminPanel(page);

    // Ir a reportes
    await page.click('a:has-text("Reportes")');

    // Generar reporte de progreso
    await page.click('button:has-text("Progreso global")');

    // Verificar que se muestran gráficos
    await expect(
      page.locator('.recharts-wrapper').or(
        page.locator('canvas')
      )
    ).toBeVisible({ timeout: 5000 });

    // Verificar métricas clave
    const metrics = [
      'Tasa de completación promedio',
      'Estudiantes activos',
      'Cursos más populares',
      'Tiempo promedio de completación'
    ];

    for (const metric of metrics) {
      const element = page.locator(`text=/${metric}/i`);
      const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);

      if (isVisible) {
        const value = await element.locator('..').textContent();
        expect(value).toMatch(/\d+/);
      }
    }

    // Verificar filtros de reporte
    const courseFilter = page.locator('select[name="courseId"]');

    if (await courseFilter.isVisible({ timeout: 3000 })) {
      // Filtrar por curso específico
      const options = await courseFilter.locator('option').count();

      if (options > 1) {
        await courseFilter.selectOption({ index: 1 });
        await page.waitForTimeout(1000);

        // Los datos deberían actualizarse
        await expect(page.locator('.recharts-wrapper')).toBeVisible();
      }
    }
  });
});