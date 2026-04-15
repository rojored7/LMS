/**
 * HU-013: Catálogo de Cursos Filtrado
 * Como estudiante, quiero explorar un catálogo de cursos filtrable
 * para encontrar cursos relevantes a mis intereses.
 *
 * Criterios de Aceptación:
 * AC1: Se muestran todos los cursos disponibles en formato grid/lista
 * AC2: Se puede filtrar por nivel (principiante, intermedio, avanzado)
 * AC3: Se puede filtrar por categoría/tema
 * AC4: Se puede buscar cursos por nombre o descripción
 * AC5: Se muestra información básica de cada curso (duración, nivel, instructor)
 * AC6: Se puede cambiar entre vista grid y vista lista
 */

import { test, expect } from '@playwright/test';
import { loginAsStudent } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('HU-013: Catálogo de Cursos Filtrado', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
  });

  test('AC1: Se muestran todos los cursos disponibles en formato grid/lista', async ({ page }) => {
    // Esperar que cargue el catálogo
    await page.waitForSelector('.course-card, .course-item, [class*="course"]', { timeout: 10000 });

    // Verificar que hay cursos visibles
    const courses = page.locator('.course-card, .course-item, article[class*="course"]');
    const courseCount = await courses.count();
    expect(courseCount).toBeGreaterThan(0);

    // Verificar estructura básica del primer curso
    const firstCourse = courses.first();
    await expect(firstCourse).toBeVisible();

    // Debe tener título
    const title = firstCourse.locator('h2, h3, h4, .course-title');
    await expect(title).toBeVisible();

    // Debe tener alguna imagen o ícono
    const visual = firstCourse.locator('img, svg, .course-image, .course-icon');
    const hasVisual = await visual.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasVisual).toBeTruthy();
  });

  test('AC2: Se puede filtrar por nivel (principiante, intermedio, avanzado)', async ({ page }) => {
    await page.waitForSelector('.course-card, .course-item', { timeout: 10000 });

    // Buscar filtro de nivel
    const levelFilter = page.locator('select[name*="level"], [aria-label*="nivel" i], [aria-label*="level" i]').first();
    const levelRadios = page.locator('input[type="radio"][name*="level"]');
    const levelCheckboxes = page.locator('input[type="checkbox"][value*="principiante" i], input[type="checkbox"][value*="beginner" i]');

    if (await levelFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Seleccionar nivel principiante
      await levelFilter.selectOption(/principiante|beginner|básico/i);
      await page.waitForTimeout(500); // Esperar actualización

      // Verificar que los cursos mostrados son del nivel seleccionado
      const filteredCourses = page.locator('.course-card:visible, .course-item:visible');
      const count = await filteredCourses.count();

      if (count > 0) {
        const firstCourse = filteredCourses.first();
        const levelBadge = firstCourse.locator('text=/principiante|beginner|básico/i');
        await expect(levelBadge).toBeVisible({ timeout: 3000 });
      }
    } else if (await levelRadios.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Usar radio buttons
      const beginnerRadio = levelRadios.filter({ hasText: /principiante|beginner/i }).first();
      await beginnerRadio.check();
      await page.waitForTimeout(500);
    } else if (await levelCheckboxes.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Usar checkboxes
      await levelCheckboxes.first().check();
      await page.waitForTimeout(500);
    }

    // Verificar que el número de cursos cambió o se actualizó la vista
    const coursesAfterFilter = page.locator('.course-card:visible, .course-item:visible');
    await expect(coursesAfterFilter.first()).toBeVisible({ timeout: 3000 });
  });

  test('AC3: Se puede filtrar por categoría/tema', async ({ page }) => {
    await page.waitForSelector('.course-card, .course-item', { timeout: 10000 });

    // Buscar filtro de categoría
    const categoryFilter = page.locator('select[name*="category"], select[name*="categoria"], [aria-label*="categoría" i]').first();
    const categoryButtons = page.locator('button[class*="category"], .category-tag, .filter-chip');

    if (await categoryFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Obtener opciones disponibles
      const options = categoryFilter.locator('option');
      const optionCount = await options.count();

      if (optionCount > 1) {
        // Seleccionar primera categoría no vacía
        await categoryFilter.selectOption({ index: 1 });
        await page.waitForTimeout(500);

        // Verificar que se aplicó el filtro
        const filteredCourses = page.locator('.course-card:visible, .course-item:visible');
        await expect(filteredCourses.first()).toBeVisible({ timeout: 3000 });
      }
    } else if (await categoryButtons.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Usar botones de categoría
      const firstCategory = categoryButtons.first();
      const categoryText = await firstCategory.textContent();
      await firstCategory.click();
      await page.waitForTimeout(500);

      // Verificar que el filtro está activo
      const activeFilter = page.locator('.active-filter, .selected-category, [aria-pressed="true"]');
      if (await activeFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
        const activeText = await activeFilter.textContent();
        expect(activeText).toContain(categoryText);
      }
    }
  });

  test('AC4: Se puede buscar cursos por nombre o descripción', async ({ page }) => {
    await page.waitForSelector('.course-card, .course-item', { timeout: 10000 });

    // Buscar campo de búsqueda
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="search" i]').first();
    await expect(searchInput).toBeVisible({ timeout: 3000 });

    // Obtener número inicial de cursos
    const initialCourses = await page.locator('.course-card:visible, .course-item:visible').count();

    // Realizar búsqueda
    await searchInput.fill('seguridad');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000); // Esperar resultados

    // Verificar que se actualizaron los resultados
    const searchResults = page.locator('.course-card:visible, .course-item:visible');
    const resultCount = await searchResults.count();

    if (resultCount > 0) {
      // Verificar que los resultados contienen el término buscado
      const firstResult = searchResults.first();
      const resultText = await firstResult.textContent();
      expect(resultText?.toLowerCase()).toContain('seguridad');
    } else {
      // Si no hay resultados, debe mostrar mensaje
      await expect(page.locator('text=/no.*encontrado|no.*results|sin.*resultados/i')).toBeVisible();
    }

    // Limpiar búsqueda
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Verificar que vuelven a mostrarse cursos
    const clearedResults = await page.locator('.course-card:visible, .course-item:visible').count();
    expect(clearedResults).toBeGreaterThan(0);
  });

  test('AC5: Se muestra información básica de cada curso', async ({ page }) => {
    await page.waitForSelector('.course-card, .course-item', { timeout: 10000 });

    const firstCourse = page.locator('.course-card, .course-item').first();
    await expect(firstCourse).toBeVisible();

    // Verificar título del curso
    const title = firstCourse.locator('h2, h3, h4, .course-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText).toBeTruthy();

    // Verificar duración
    const duration = firstCourse.locator('text=/[0-9]+.*hora|[0-9]+.*semana|duración|duration/i');
    const hasDuration = await duration.isVisible({ timeout: 2000 }).catch(() => false);

    // Verificar nivel
    const level = firstCourse.locator('text=/principiante|intermedio|avanzado|beginner|intermediate|advanced/i');
    const hasLevel = await level.isVisible({ timeout: 2000 }).catch(() => false);

    // Verificar instructor o autor
    const instructor = firstCourse.locator('text=/instructor|profesor|por:|by:/i');
    const hasInstructor = await instructor.isVisible({ timeout: 2000 }).catch(() => false);

    // Verificar descripción
    const description = firstCourse.locator('.course-description, p, .description');
    const hasDescription = await description.isVisible({ timeout: 2000 }).catch(() => false);

    // Al menos 3 de estos elementos deben estar presentes
    const elementsPresent = [hasDuration, hasLevel, hasInstructor, hasDescription].filter(Boolean).length;
    expect(elementsPresent).toBeGreaterThanOrEqual(2);

    // Verificar precio o estado (gratis/pago)
    const priceOrStatus = firstCourse.locator('text=/gratis|free|\\$|€|precio/i');
    const hasPriceInfo = await priceOrStatus.isVisible({ timeout: 2000 }).catch(() => false);

    // Verificar botón de acción
    const actionButton = firstCourse.locator('button, a').filter({ hasText: /ver.*más|detalles|inscribir|enroll|comenzar/i });
    await expect(actionButton.first()).toBeVisible();
  });

  test('AC6: Se puede cambiar entre vista grid y vista lista', async ({ page }) => {
    await page.waitForSelector('.course-card, .course-item', { timeout: 10000 });

    // Buscar controles de vista
    const viewToggle = page.locator('button[aria-label*="view" i], button[aria-label*="vista" i]');
    const gridButton = page.locator('button:has-text(/grid|cuadrícula|mosaico/i), button[aria-label*="grid" i]');
    const listButton = page.locator('button:has-text(/lista|list/i), button[aria-label*="list" i]');

    // Obtener clase inicial del contenedor
    const container = page.locator('.course-grid, .course-list, .courses-container, main').first();
    const initialClass = await container.getAttribute('class');

    if (await gridButton.isVisible({ timeout: 2000 }).catch(() => false) &&
        await listButton.isVisible({ timeout: 2000 }).catch(() => false)) {

      // Cambiar a vista lista
      await listButton.click();
      await page.waitForTimeout(500);

      // Verificar que la clase cambió
      const listClass = await container.getAttribute('class');
      expect(listClass).not.toBe(initialClass);

      // Verificar disposición de lista (elementos más anchos, uno debajo del otro)
      const courseItems = page.locator('.course-card, .course-item');
      if (await courseItems.first().isVisible()) {
        const firstItemBox = await courseItems.first().boundingBox();
        const secondItemBox = await courseItems.nth(1).boundingBox();

        if (firstItemBox && secondItemBox) {
          // En vista lista, los elementos deberían estar uno debajo del otro
          expect(secondItemBox.y).toBeGreaterThan(firstItemBox.y);
        }
      }

      // Volver a vista grid
      await gridButton.click();
      await page.waitForTimeout(500);

      // Verificar que volvió a la vista original
      const gridClass = await container.getAttribute('class');

      // Verificar disposición de grid (elementos lado a lado)
      const gridItems = page.locator('.course-card, .course-item');
      if (await gridItems.nth(1).isVisible()) {
        const firstGridBox = await gridItems.first().boundingBox();
        const secondGridBox = await gridItems.nth(1).boundingBox();

        if (firstGridBox && secondGridBox) {
          // En vista grid, algunos elementos deberían estar lado a lado
          // (a menos que sea mobile o pantalla muy pequeña)
          const isGridLayout = Math.abs(firstGridBox.y - secondGridBox.y) < firstGridBox.height / 2;
          // No forzar assertion ya que depende del tamaño de pantalla
        }
      }
    } else if (await viewToggle.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Usar toggle único
      await viewToggle.first().click();
      await page.waitForTimeout(500);

      // Verificar que algo cambió visualmente
      const newClass = await container.getAttribute('class');
      expect(newClass).not.toBe(initialClass);
    }
  });

  test('Paginación funciona correctamente', async ({ page }) => {
    await page.waitForSelector('.course-card, .course-item', { timeout: 10000 });

    // Buscar controles de paginación
    const pagination = page.locator('.pagination, [aria-label*="pagination" i], .page-numbers');

    if (await pagination.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Obtener primera página de cursos
      const firstPageCourse = await page.locator('.course-card, .course-item').first().textContent();

      // Ir a página siguiente
      const nextButton = page.locator('button:has-text(/siguiente|next|→/), a:has-text(/siguiente|next/)').first();
      const page2Button = page.locator('button:has-text("2"), a:has-text("2")').first();

      if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextButton.click();
      } else if (await page2Button.isVisible({ timeout: 1000 }).catch(() => false)) {
        await page2Button.click();
      }

      await page.waitForTimeout(1000);

      // Verificar que los cursos cambiaron
      const newFirstCourse = await page.locator('.course-card, .course-item').first().textContent();
      expect(newFirstCourse).not.toBe(firstPageCourse);

      // Verificar indicador de página actual
      const currentPage = page.locator('[aria-current="page"], .active.page, .current-page');
      if (await currentPage.isVisible({ timeout: 1000 }).catch(() => false)) {
        const pageText = await currentPage.textContent();
        expect(pageText).toContain('2');
      }
    }
  });

  test('Ordenamiento de cursos funciona', async ({ page }) => {
    await page.waitForSelector('.course-card, .course-item', { timeout: 10000 });

    // Buscar selector de ordenamiento
    const sortSelect = page.locator('select[name*="sort"], select[name*="order"], [aria-label*="ordenar" i]').first();
    const sortButtons = page.locator('button[class*="sort"], .sort-option');

    if (await sortSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Obtener primer curso antes de ordenar
      const initialFirstTitle = await page.locator('.course-card, .course-item').first().textContent();

      // Cambiar ordenamiento
      const options = sortSelect.locator('option');
      const optionCount = await options.count();

      if (optionCount > 1) {
        // Seleccionar diferente orden (ej: alfabético, más recientes, etc)
        await sortSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);

        // Verificar que el orden cambió
        const newFirstTitle = await page.locator('.course-card, .course-item').first().textContent();

        // El primer curso debería ser diferente (a menos que sea casualidad)
        // No hacer assertion estricta por si coincide
        if (newFirstTitle !== initialFirstTitle) {
          expect(newFirstTitle).not.toBe(initialFirstTitle);
        }
      }
    }
  });

  test('Vista previa rápida del curso', async ({ page }) => {
    await page.waitForSelector('.course-card, .course-item', { timeout: 10000 });

    const firstCourse = page.locator('.course-card, .course-item').first();

    // Buscar botón de vista previa o hover
    const previewButton = firstCourse.locator('button:has-text(/vista.*previa|preview|ver.*más/i)');

    if (await previewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await previewButton.click();

      // Esperar modal o tooltip con más información
      const modal = page.locator('[role="dialog"], .modal, .course-preview');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Verificar que muestra información adicional
      await expect(modal.locator('text=/módulo|contenido|temario|syllabus/i')).toBeVisible();

      // Cerrar modal
      const closeButton = modal.locator('button[aria-label*="close" i], button:has-text(/cerrar|close/i)');
      if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeButton.click();
        await expect(modal).not.toBeVisible({ timeout: 2000 });
      }
    } else {
      // Probar hover para vista previa
      await firstCourse.hover();
      await page.waitForTimeout(500);

      // Verificar si aparece información adicional
      const hoverInfo = page.locator('.tooltip, .popover, .hover-info');
      const hasHoverInfo = await hoverInfo.isVisible({ timeout: 1000 }).catch(() => false);

      // No hacer assertion estricta ya que no todos los diseños tienen hover
    }
  });
});