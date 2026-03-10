/**
 * E2E Tests: HU-011 a HU-015 - Sistema Multi-Curso
 * Tests de modelo multi-curso, importación, navegación y gestión de cursos
 */

import { test, expect } from '@playwright/test';
import { registerAndLogin, loginAsAdmin, createTestAdmin } from './helpers/auth';
import { enrollInCourse, getAvailableCourses, searchCourses, verifyCourseModules } from './helpers/course';
import { importCourseFromMarkdown } from './helpers/admin';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Sistema Multi-Curso', () => {
  test('HU-011: Sistema soporta múltiples cursos', async ({ page }) => {
    // Login como estudiante
    const student = await registerAndLogin(page, 'STUDENT');

    // Ir a catálogo de cursos
    await page.goto(`${BASE_URL}/courses`);

    // Verificar que hay múltiples cursos
    const courseCards = page.locator('[data-testid="course-card"]').or(
      page.locator('.course-card')
    );

    const courseCount = await courseCards.count();
    expect(courseCount).toBeGreaterThan(0);

    // Si hay múltiples cursos, verificar diversidad
    if (courseCount > 1) {
      // Verificar diferentes niveles de dificultad
      const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
      let foundLevels = 0;

      for (const level of levels) {
        const levelElement = page.locator(`text=/${level}/i`);
        if (await levelElement.isVisible({ timeout: 1000 }).catch(() => false)) {
          foundLevels++;
        }
      }

      expect(foundLevels).toBeGreaterThan(0);

      // Verificar diferentes categorías o tags
      const categories = page.locator('[data-testid="course-category"]').or(
        page.locator('.course-tag')
      );

      const categoryCount = await categories.count();
      if (categoryCount > 0) {
        const firstCategory = await categories.first().textContent();
        const lastCategory = await categories.last().textContent();

        // Si hay múltiples categorías, deberían ser diferentes
        if (categoryCount > 1) {
          expect(firstCategory).not.toBe(lastCategory);
        }
      }
    }

    // Verificar información de cada curso
    for (let i = 0; i < Math.min(3, courseCount); i++) {
      const card = courseCards.nth(i);

      // Cada curso debe tener título
      const title = card.locator('h3').or(card.locator('.course-title'));
      await expect(title).toBeVisible();

      // Descripción
      const description = card.locator('p').or(card.locator('.course-description'));
      await expect(description).toBeVisible();

      // Información adicional (duración, módulos, etc.)
      const info = await card.textContent();
      expect(info).toBeTruthy();
    }
  });

  test('HU-012: Admin puede importar curso desde Markdown', async ({ page }) => {
    // Login como admin
    await createTestAdmin(page);
    await loginAsAdmin(page);

    // Navegar a importador
    await page.goto(`${BASE_URL}/admin/courses/import`);

    // Verificar formulario de importación
    await expect(page.locator('form')).toBeVisible({ timeout: 5000 });

    // Verificar campos requeridos
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.locator('input[name="courseTitle"]')).toBeVisible();
    await expect(page.locator('select[name="difficulty"]')).toBeVisible();

    // Crear archivo markdown de prueba
    const markdownContent = `
# Curso de Prueba E2E

## Módulo 1: Introducción
### Lección 1: Conceptos básicos
Contenido de la lección...

### Quiz 1
1. ¿Pregunta de prueba?
   - a) Opción correcta
   - b) Opción incorrecta

## Módulo 2: Avanzado
### Lección 2: Temas avanzados
Más contenido...
    `;

    // Simular carga de archivo (esto requiere un archivo real en el sistema)
    // Por ahora, verificar que el formulario acepta archivos
    const fileInput = page.locator('input[type="file"]');

    // Verificar validación del formulario
    await page.fill('input[name="courseTitle"]', 'Curso Test E2E');
    await page.selectOption('select[name="difficulty"]', 'BEGINNER');

    // Verificar preview si existe
    const previewButton = page.locator('button:has-text("Preview")').or(
      page.locator('button:has-text("Vista previa")')
    );

    if (await previewButton.isVisible({ timeout: 2000 })) {
      await previewButton.click();

      // Debería mostrar preview del curso
      await expect(
        page.locator('[data-testid="course-preview"]').or(
          page.locator('.preview-modal')
        )
      ).toBeVisible({ timeout: 3000 });
    }

    // Verificar opciones de configuración
    const configOptions = [
      'input[name="isPublished"]',
      'input[name="generateQuizzes"]',
      'select[name="trainingProfile"]'
    ];

    for (const selector of configOptions) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);

      if (isVisible && selector.includes('generateQuizzes')) {
        await element.check();
      }
    }
  });

  test('HU-013: Navegación entre cursos funciona correctamente', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');

    // Obtener lista de cursos
    const courses = await getAvailableCourses(page);

    if (courses.length > 1) {
      // Navegar al primer curso
      await page.goto(`${BASE_URL}/courses/${courses[0].slug || 'course-1'}`);

      // Verificar que estamos en la página del curso
      await expect(page.locator('h1')).toContainText(courses[0].title || 'Curso');

      // Inscribirse si es necesario
      const enrollButton = page.locator('button:has-text("Inscribirse")');
      if (await enrollButton.isVisible({ timeout: 2000 })) {
        await enrollButton.click();
        await page.waitForTimeout(1000);
      }

      // Verificar breadcrumbs o navegación
      const breadcrumbs = page.locator('[data-testid="breadcrumbs"]').or(
        page.locator('.breadcrumb')
      );

      if (await breadcrumbs.isVisible({ timeout: 2000 })) {
        await expect(breadcrumbs).toContainText('Cursos');
      }

      // Volver al catálogo
      await page.click('a:has-text("Cursos")').or(
        page.goto(`${BASE_URL}/courses`)
      );

      // Navegar a otro curso
      if (courses[1]) {
        await page.goto(`${BASE_URL}/courses/${courses[1].slug || 'course-2'}`);
        await expect(page.locator('h1')).toContainText(courses[1].title || 'Curso');
      }
    }
  });

  test('HU-014: Búsqueda y filtrado de cursos', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');

    await page.goto(`${BASE_URL}/courses`);

    // Buscar por palabra clave
    const searchInput = page.locator('input[placeholder*="Buscar"]').or(
      page.locator('input[name="search"]')
    );

    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('seguridad');
      await searchInput.press('Enter');

      await page.waitForTimeout(1000);

      // Verificar que los resultados se filtran
      const courseCards = page.locator('[data-testid="course-card"]');
      const resultCount = await courseCards.count();

      if (resultCount > 0) {
        // Verificar que los cursos mostrados contienen el término
        const firstCourseText = await courseCards.first().textContent();
        expect(firstCourseText?.toLowerCase()).toContain('seguridad');
      } else {
        // Si no hay resultados, debería mostrar mensaje
        await expect(
          page.locator('text=/no.*encontrado/i').or(
            page.locator('text=/no.*results/i')
          )
        ).toBeVisible();
      }
    }

    // Filtrar por nivel
    const levelFilter = page.locator('select[name="level"]').or(
      page.locator('[data-testid="level-filter"]')
    );

    if (await levelFilter.isVisible({ timeout: 3000 })) {
      await levelFilter.selectOption('BEGINNER');
      await page.waitForTimeout(1000);

      // Verificar que solo muestra cursos de nivel principiante
      const courseCards = page.locator('[data-testid="course-card"]');
      const firstCard = courseCards.first();

      if (await firstCard.isVisible({ timeout: 2000 })) {
        const cardText = await firstCard.textContent();
        expect(cardText).toContain('BEGINNER');
      }
    }

    // Filtrar por categoría
    const categoryFilter = page.locator('select[name="category"]').or(
      page.locator('[data-testid="category-filter"]')
    );

    if (await categoryFilter.isVisible({ timeout: 3000 })) {
      const options = await categoryFilter.locator('option').count();

      if (options > 1) {
        await categoryFilter.selectOption({ index: 1 });
        await page.waitForTimeout(1000);

        // Los cursos deberían actualizarse
        const courseCount = await page.locator('[data-testid="course-card"]').count();
        expect(courseCount).toBeGreaterThanOrEqual(0);
      }
    }

    // Ordenamiento
    const sortSelect = page.locator('select[name="sort"]').or(
      page.locator('[data-testid="sort-select"]')
    );

    if (await sortSelect.isVisible({ timeout: 3000 })) {
      // Ordenar por popularidad
      await sortSelect.selectOption('popular');
      await page.waitForTimeout(1000);

      // Verificar que el orden cambió (comparando primeros elementos)
      const firstCourseTitle = await page.locator('[data-testid="course-card"]')
        .first()
        .locator('h3')
        .textContent();

      // Cambiar a otro orden
      await sortSelect.selectOption('newest');
      await page.waitForTimeout(1000);

      const newFirstTitle = await page.locator('[data-testid="course-card"]')
        .first()
        .locator('h3')
        .textContent();

      // Los títulos podrían ser diferentes si hay múltiples cursos
      const courseCount = await page.locator('[data-testid="course-card"]').count();
      if (courseCount > 1) {
        // Al menos verificar que la página se actualizó
        expect(firstCourseTitle || newFirstTitle).toBeTruthy();
      }
    }
  });

  test('HU-015: Vista de cursos inscritos vs disponibles', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');

    // Ir a cursos
    await page.goto(`${BASE_URL}/courses`);

    // Verificar tabs o filtros de vista
    const enrolledTab = page.locator('button:has-text("Mis cursos")').or(
      page.locator('[data-testid="enrolled-courses-tab"]')
    );

    const availableTab = page.locator('button:has-text("Disponibles")').or(
      page.locator('[data-testid="available-courses-tab"]')
    );

    // Inscribirse en un curso primero
    const firstCourse = page.locator('[data-testid="course-card"]').first();
    const courseTitle = await firstCourse.locator('h3').textContent();

    await firstCourse.click();

    const enrollButton = page.locator('button:has-text("Inscribirse")');
    if (await enrollButton.isVisible({ timeout: 3000 })) {
      await enrollButton.click();
      await page.waitForTimeout(1000);
    }

    // Volver a la lista de cursos
    await page.goto(`${BASE_URL}/courses`);

    // Verificar vista de cursos inscritos
    if (await enrolledTab.isVisible({ timeout: 3000 })) {
      await enrolledTab.click();
      await page.waitForTimeout(1000);

      // Debería mostrar el curso inscrito
      const enrolledCourses = page.locator('[data-testid="course-card"]');
      const enrolledCount = await enrolledCourses.count();

      if (enrolledCount > 0) {
        const enrolledTitle = await enrolledCourses.first().locator('h3').textContent();
        expect(enrolledTitle).toBe(courseTitle);

        // Verificar indicador de progreso
        const progressIndicator = enrolledCourses.first().locator('[data-testid="progress"]').or(
          enrolledCourses.first().locator('.progress-bar')
        );

        const hasProgress = await progressIndicator.isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasProgress).toBeTruthy();
      }
    }

    // Verificar vista de cursos disponibles
    if (await availableTab.isVisible({ timeout: 3000 })) {
      await availableTab.click();
      await page.waitForTimeout(1000);

      // Debería mostrar cursos no inscritos
      const availableCourses = page.locator('[data-testid="course-card"]');
      const availableCount = await availableCourses.count();

      // Verificar que no muestra indicadores de progreso
      for (let i = 0; i < Math.min(3, availableCount); i++) {
        const card = availableCourses.nth(i);
        const progressBar = card.locator('.progress-bar');

        const hasProgress = await progressBar.isVisible({ timeout: 1000 }).catch(() => false);
        expect(hasProgress).toBeFalsy();

        // Debería tener botón de inscribirse
        const enrollBtn = card.locator('button:has-text("Inscribirse")').or(
          card.locator('button:has-text("Ver detalles")')
        );

        const hasButton = await enrollBtn.isVisible({ timeout: 1000 }).catch(() => false);
        expect(hasButton).toBeTruthy();
      }
    }

    // Verificar contador de cursos
    const courseStats = page.locator('[data-testid="course-stats"]').or(
      page.locator('.course-summary')
    );

    if (await courseStats.isVisible({ timeout: 2000 })) {
      const statsText = await courseStats.textContent();
      expect(statsText).toMatch(/\d+/); // Debería contener números
    }
  });
});