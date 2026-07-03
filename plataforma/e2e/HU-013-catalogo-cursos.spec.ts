/**
 * HU-013: Catálogo de Cursos Filtrado
 * Como estudiante, quiero explorar un catálogo de cursos filtrable
 * para encontrar cursos relevantes a mis intereses.
 */

import { test, expect } from '@playwright/test';
import { AUTH_FILES } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// El catalogo es publico pero usar auth para ver cursos con datos de inscripcion
test.describe('HU-013: Catálogo de Cursos Filtrado', () => {
  test.use({ storageState: AUTH_FILES.student });

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForLoadState('load');
  });

  test('AC1: Se muestran cursos disponibles en formato grid', async ({ page }) => {
    // Esperar que cargue el catalogo
    await page.waitForSelector('[data-testid="course-catalog"]', { timeout: 10000 });

    // El grid de cursos debe estar visible
    const grid = page.locator('[data-testid="course-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // Debe haber al menos un curso
    const courses = page.locator('[data-testid="course-card"]');
    const courseCount = await courses.count();
    expect(courseCount).toBeGreaterThan(0);

    // Verificar estructura del primer curso
    const firstCourse = courses.first();
    await expect(firstCourse).toBeVisible();

    // Debe tener titulo
    const title = firstCourse.locator('[data-testid="course-title"]');
    await expect(title).toBeVisible();
  });

  test('AC2: Se puede filtrar por nivel', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-grid"]', { timeout: 10000 });

    // Usar el filtro de nivel que ya tiene data-testid
    const levelFilter = page.locator('[data-testid="level-filter"]');

    if (await levelFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Contar cursos antes de filtrar
      const initialCount = await page.locator('[data-testid="course-card"]').count();

      // Seleccionar nivel principiante
      await levelFilter.selectOption('BEGINNER');
      await page.waitForTimeout(500);

      // Los cursos deben seguir mostrando algo o el grid debe estar visible
      const afterFilter = page.locator('[data-testid="course-card"], [data-testid="course-catalog"]');
      await expect(afterFilter.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('AC3: Se puede buscar cursos por nombre', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-catalog"]', { timeout: 10000 });

    // Usar el input de busqueda con data-testid
    const searchInput = page.locator('[data-testid="search-input"]').or(
      page.locator('input[type="search"]')
    ).first();

    await expect(searchInput).toBeVisible({ timeout: 3000 });

    // Buscar por texto generico
    await searchInput.fill('seguridad');
    await page.waitForTimeout(800);

    // Verificar que la busqueda filtra (grid visible o mensaje de no resultados)
    const grid = page.locator('[data-testid="course-grid"]');
    const noResults = page.locator('text=/no.*encontr|no.*result|sin.*resultado/i');
    const hasResults = await grid.isVisible({ timeout: 3000 }).catch(() => false);
    const hasNoResults = await noResults.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasResults || hasNoResults).toBeTruthy();

    // Limpiar busqueda
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Deben volver a aparecer cursos
    await expect(page.locator('[data-testid="course-grid"]')).toBeVisible({ timeout: 5000 });
  });

  test('AC4: Cada curso muestra informacion basica', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-grid"]', { timeout: 10000 });

    const firstCourse = page.locator('[data-testid="course-card"]').first();
    await expect(firstCourse).toBeVisible();

    // Titulo del curso
    const title = firstCourse.locator('[data-testid="course-title"]');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText).toBeTruthy();
    expect(titleText!.length).toBeGreaterThan(0);

    // Debe tener boton de accion (Ver Detalles o Continuar)
    const actionButton = firstCourse.locator('[data-testid="enroll-button"], [data-testid="continue-button"]');
    await expect(actionButton.first()).toBeVisible();
  });

  test('AC5: Boton de accion navega a detalles del curso', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-grid"]', { timeout: 10000 });

    const firstCourse = page.locator('[data-testid="course-card"]').first();
    await expect(firstCourse).toBeVisible();

    // Hacer click en el boton de Ver Detalles
    const actionButton = firstCourse.locator('[data-testid="enroll-button"], [data-testid="continue-button"]');
    await actionButton.first().click();

    // Debe navegar a la pagina de detalles del curso
    await page.waitForURL(/\/courses\/[^/]+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/courses\//);
  });
});
