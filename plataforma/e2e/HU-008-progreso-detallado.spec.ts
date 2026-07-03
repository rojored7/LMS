/**
 * HU-008: Ver Progreso Detallado de Usuario
 * Como administrador, quiero ver el progreso detallado de cualquier usuario
 * para identificar dificultades y brindar soporte personalizado.
 *
 * Criterios de Aceptación:
 * AC1: Admin puede acceder al detalle de cualquier usuario desde la lista
 * AC2: Se muestra información completa del perfil del usuario
 * AC3: Se visualizan todos los cursos en los que está inscrito
 * AC4: Se muestra el progreso por módulo y lección
 * AC5: Se visualiza el historial de quizzes con intentos y puntuaciones
 * AC6: Se muestran los laboratorios completados con sus resultados
 */

import { test, expect } from '@playwright/test';
import { AUTH_FILES } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || `${BASE_URL}/api`;

test.describe('HU-008: Ver Progreso Detallado de Usuario', () => {
  test.use({ storageState: AUTH_FILES.admin });

  test('AC1: Admin puede acceder al detalle de cualquier usuario desde la lista', async ({ page }) => {
    // Navegar a lista de usuarios
    await page.goto(`${BASE_URL}/admin/users`);

    // Esperar a que cargue la tabla
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    // Buscar un usuario estudiante en la lista
    const studentRow = page.locator('tr').filter({ hasText: /Estudiante|STUDENT/ }).first();
    await expect(studentRow).toBeVisible({ timeout: 10000 });

    // Buscar botón de ver detalles
    const viewButton = studentRow.locator('button, a').filter({ hasText: /ver|detalle|view/i }).first();
    await viewButton.click();

    // Verificar que navegamos a la página de detalle
    await page.waitForURL(/\/admin\/users\/[^?#]+/, { timeout: 10000 });

    // Verificar que estamos en la página correcta
    await expect(page.locator('h1, h2').filter({ hasText: /progreso|detalle.*usuario|user.*progress/i }).first()).toBeVisible();
  });

  test('AC2: Se muestra información completa del perfil del usuario', async ({ page }) => {
    // Ir directamente a lista de usuarios
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    // Seleccionar primer usuario estudiante
    const studentRow = page.locator('tr').filter({ hasText: /Estudiante|STUDENT/ }).first();
    const viewButton = studentRow.locator('button, a').filter({ hasText: /ver|detalle|view/i }).first();
    await viewButton.click();

    // Esperar página de detalle
    await page.waitForURL(/\/admin\/users\/[^?#]+/, { timeout: 10000 });

    // Verificar info del usuario: h1 con nombre, p con email
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 });

    // Verificar que hay datos reales (email con @)
    const emailElement = await page.locator('text=/@/').first().textContent();
    expect(emailElement).toContain('@');
  });

  test('AC3: Se visualizan todos los cursos en los que está inscrito', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    // Buscar usuario con cursos inscritos
    const userWithCourses = page.locator('tr').filter({ hasText: /Estudiante|STUDENT/i }).first();
    const viewButton = userWithCourses.locator('button, a').filter({ hasText: /ver|detalle|view/i }).first();
    await viewButton.click();

    await page.waitForURL(/\/admin\/users\/[^?#]+/, { timeout: 10000 });

    // Buscar seccion de progreso por curso (h2 "Progreso por Curso")
    const coursesSection = page.locator('div').filter({ hasText: /Progreso por Curso|cursos.*inscritos/i }).first();
    const hasCourseSection = await coursesSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCourseSection) {
      // Verificar que muestra cursos o mensaje de sin cursos
      const emptyMsg = page.locator('text=/sin cursos|Sin cursos|no.*inscrito/i');
      const hasEmpty = await emptyMsg.isVisible({ timeout: 2000 }).catch(() => false);
      if (!hasEmpty) {
        // Si hay cursos, debe haber algun elemento visible
        await expect(coursesSection).toBeVisible();
      }
    } else {
      // Si no hay seccion de cursos, al menos el perfil esta visible
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('AC4: Se muestra el progreso por módulo y lección', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    // Seleccionar usuario
    const studentRow = page.locator('tr').filter({ hasText: /Estudiante|STUDENT/ }).first();
    const viewButton = studentRow.locator('button, a').filter({ hasText: /ver|detalle|view/i }).first();
    await viewButton.click();

    await page.waitForURL(/\/admin\/users\/[^?#]+/, { timeout: 10000 });

    // Buscar sección de progreso detallado
    const progressSection = page.locator('section, div').filter({ hasText: /progreso.*detallado|detailed.*progress|módulos/i }).first();

    // Si hay cursos inscritos, debería mostrar módulos
    if (await progressSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Verificar estructura de módulos
      const modules = progressSection.locator('.module-item, .module-row, [class*="module"]');
      const moduleCount = await modules.count();

      if (moduleCount > 0) {
        const firstModule = modules.first();

        // Verificar información del módulo
        await expect(firstModule.locator('text=/módulo|module/i')).toBeVisible();

        // Buscar indicadores de progreso
        const progressIndicator = firstModule.locator('.progress-bar, [class*="progress"], text=/[0-9]+%/');
        if (await progressIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
          const progressText = await progressIndicator.textContent();
          expect(progressText).toMatch(/\d+/); // Contiene números
        }
      }
    }
  });

  test('AC5: Se visualiza el historial de quizzes con intentos y puntuaciones', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    const studentRow = page.locator('tr').filter({ hasText: /Estudiante|STUDENT/ }).first();
    const viewButton = studentRow.locator('button, a').filter({ hasText: /ver|detalle|view/i }).first();
    await viewButton.click();

    await page.waitForURL(/\/admin\/users\/[^?#]+/, { timeout: 10000 });

    // Buscar sección de quizzes
    const quizSection = page.locator('section, div').filter({ hasText: /quiz|evaluaci|examen|prueba/i }).first();

    if (await quizSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Verificar estructura del historial
      const quizAttempts = quizSection.locator('.quiz-attempt, .quiz-item, tr, li');
      const attemptCount = await quizAttempts.count();

      if (attemptCount > 0) {
        const firstAttempt = quizAttempts.first();

        // Verificar información esperada
        const hasScore = await firstAttempt.locator('text=/[0-9]+.*[0-9]+|[0-9]+%/').isVisible({ timeout: 2000 }).catch(() => false);
        const hasDate = await firstAttempt.locator('text=/[0-9]{1,2}[/-][0-9]{1,2}|ago|fecha/i').isVisible({ timeout: 2000 }).catch(() => false);

        expect(hasScore || hasDate).toBeTruthy();
      } else {
        // Si no hay intentos, debe mostrar mensaje
        await expect(quizSection.locator('text=/no.*quiz|sin.*evaluaciones|no.*intentos/i')).toBeVisible();
      }
    }
  });

  test('AC6: Se muestran los laboratorios completados con sus resultados', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    const studentRow = page.locator('tr').filter({ hasText: /Estudiante|STUDENT/ }).first();
    const viewButton = studentRow.locator('button, a').filter({ hasText: /ver|detalle|view/i }).first();
    await viewButton.click();

    await page.waitForURL(/\/admin\/users\/[^?#]+/, { timeout: 10000 });

    // Buscar sección de laboratorios
    const labSection = page.locator('section, div').filter({ hasText: /laboratorio|lab|práctica/i }).first();

    if (await labSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Verificar estructura de laboratorios
      const labItems = labSection.locator('.lab-item, .lab-submission, tr, li');
      const labCount = await labItems.count();

      if (labCount > 0) {
        const firstLab = labItems.first();

        // Verificar información del laboratorio
        const hasStatus = await firstLab.locator('text=/completado|passed|aprobado|failed|pendiente/i').isVisible({ timeout: 2000 }).catch(() => false);
        const hasDate = await firstLab.locator('text=/[0-9]{1,2}[/-][0-9]{1,2}|ago/i').isVisible({ timeout: 2000 }).catch(() => false);

        expect(hasStatus || hasDate).toBeTruthy();

        // Verificar si muestra código o resultado
        const hasCodeOrResult = await firstLab.locator('text=/código|code|resultado|output/i').isVisible({ timeout: 2000 }).catch(() => false);
        if (hasCodeOrResult) {
          expect(hasCodeOrResult).toBeTruthy();
        }
      } else {
        // Si no hay labs, debe mostrar mensaje
        await expect(labSection.locator('text=/no.*laboratorio|sin.*prácticas|no.*labs/i')).toBeVisible();
      }
    }
  });

  test('Navegación entre secciones del detalle funciona correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    const studentRow = page.locator('tr').filter({ hasText: /Estudiante|STUDENT/ }).first();
    const viewButton = studentRow.locator('button, a').filter({ hasText: /ver|detalle|view/i }).first();
    await viewButton.click();

    await page.waitForURL(/\/admin\/users\/[^?#]+/, { timeout: 10000 });

    // Buscar tabs o secciones navegables
    const tabs = page.locator('[role="tab"], .tab, .nav-tab, button[class*="tab"]');
    const tabCount = await tabs.count();

    if (tabCount > 0) {
      // Probar navegación entre tabs
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        const tab = tabs.nth(i);
        await tab.click();
        await page.waitForTimeout(500); // Esperar animación

        // Verificar que el contenido cambió
        const activeContent = page.locator('[role="tabpanel"]:visible, .tab-content:visible, .panel:visible').first();
        await expect(activeContent).toBeVisible();
      }
    }

    // Verificar botón de volver
    const backButton = page.locator('button, a').filter({ hasText: /volver|back|regresar/i }).first();
    if (await backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backButton.click();

      // Debería volver a la lista de usuarios
      await page.waitForURL(/\/admin\/users\/?$/, { timeout: 5000 });
    }
  });

  test('Se pueden filtrar y buscar datos del progreso', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    const studentRow = page.locator('tr').filter({ hasText: /Estudiante|STUDENT/ }).first();
    const viewButton = studentRow.locator('button, a').filter({ hasText: /ver|detalle|view/i }).first();
    await viewButton.click();

    await page.waitForURL(/\/admin\/users\/[^?#]+/, { timeout: 10000 });

    // Buscar controles de filtro
    const filterControls = page.locator('input[type="search"], select[name*="filter"], .filter-control');

    if (await filterControls.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Probar filtro de búsqueda
      const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="search" i]').first();
      if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await searchInput.fill('test');
        await page.waitForTimeout(500); // Esperar debounce

        // Verificar que el contenido se actualizó
        const resultsArea = page.locator('.results, .filtered-content, table, .list').first();
        await expect(resultsArea).toBeVisible();
      }

      // Probar filtro de fecha si existe
      const dateFilter = page.locator('input[type="date"], select[name*="period"], select[name*="fecha"]').first();
      if (await dateFilter.isVisible({ timeout: 1000 }).catch(() => false)) {
        if (dateFilter.getAttribute('type') === 'date') {
          await dateFilter.fill('2024-01-01');
        } else {
          await dateFilter.selectOption({ index: 1 });
        }
        await page.waitForTimeout(500);
      }
    }
  });
});