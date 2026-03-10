/**
 * Course Helper Functions for E2E Tests
 * Funciones de ayuda para cursos en tests E2E
 */

import { Page, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

/**
 * Inscribirse en un curso
 */
export async function enrollInCourse(page: Page, courseSlug = 'ciberseguridad-postcuantica') {
  await page.goto(`${BASE_URL}/courses/${courseSlug}`);

  // Buscar y hacer click en el botón de inscripción
  const enrollButton = page.locator('button:has-text("Inscribirse")').or(
    page.locator('button:has-text("Enroll")')
  );

  if (await enrollButton.isVisible({ timeout: 3000 })) {
    await enrollButton.click();

    // Esperar confirmación
    await expect(
      page.locator('text=/inscri.*exitosamente/i').or(
        page.locator('text=/enrolled.*successfully/i')
      )
    ).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Navegar a un módulo específico del curso
 */
export async function navigateToModule(page: Page, courseSlug: string, moduleNumber: number) {
  await page.goto(`${BASE_URL}/courses/${courseSlug}/learning`);

  // Click en el módulo específico
  const moduleSelector = `[data-testid="module-${moduleNumber}"]`;
  const moduleLink = page.locator(moduleSelector).or(
    page.locator(`text=/módulo ${moduleNumber}/i`)
  );

  await moduleLink.click();
  await page.waitForLoadState('networkidle');
}

/**
 * Navegar a una lección específica
 */
export async function navigateToLesson(page: Page, lessonId: string | number) {
  const lessonSelector = `[data-testid="lesson-${lessonId}"]`;
  const lessonLink = page.locator(lessonSelector).or(
    page.locator(`a[href*="/lesson/${lessonId}"]`)
  );

  await lessonLink.click();
  await page.waitForLoadState('networkidle');
}

/**
 * Completar un módulo
 */
export async function completeModule(page: Page, moduleId: string) {
  // Marcar todas las lecciones como completadas
  const completeButtons = page.locator('[data-testid^="complete-lesson-"]');
  const count = await completeButtons.count();

  for (let i = 0; i < count; i++) {
    await completeButtons.nth(i).click();
    await page.waitForTimeout(500); // Pequeña pausa entre cada acción
  }

  // Completar quiz si existe
  const quizButton = page.locator('[data-testid="take-quiz"]');
  if (await quizButton.isVisible({ timeout: 2000 })) {
    await quizButton.click();
    await submitQuizWithCorrectAnswers(page);
  }

  // Completar lab si existe
  const labButton = page.locator('[data-testid="start-lab"]');
  if (await labButton.isVisible({ timeout: 2000 })) {
    await labButton.click();
    await submitLabWithCorrectCode(page);
  }
}

/**
 * Completar todos los módulos de un curso
 */
export async function completeCourse(page: Page, courseSlug: string) {
  await page.goto(`${BASE_URL}/courses/${courseSlug}/learning`);

  // Obtener todos los módulos
  const modules = page.locator('[data-testid^="module-"]');
  const moduleCount = await modules.count();

  for (let i = 0; i < moduleCount; i++) {
    await modules.nth(i).click();
    await completeModule(page, `module-${i + 1}`);
  }

  // Verificar que el curso está completo
  await expect(page.locator('text=/100%/')).toBeVisible();
}

/**
 * Enviar quiz con respuestas correctas
 */
export async function submitQuizWithCorrectAnswers(page: Page) {
  // Seleccionar todas las primeras opciones (asumiendo que son correctas para testing)
  const questions = page.locator('[data-testid^="question-"]');
  const questionCount = await questions.count();

  for (let i = 0; i < questionCount; i++) {
    const firstOption = questions.nth(i).locator('input[type="radio"]').first();
    await firstOption.click();
  }

  // Enviar respuestas
  await page.click('button:has-text("Enviar")');
  await page.waitForTimeout(1000);
}

/**
 * Enviar lab con código correcto
 */
export async function submitLabWithCorrectCode(page: Page, language = 'python') {
  const codeExamples = {
    python: 'print("Hello World")',
    javascript: 'console.log("Hello World")',
    bash: 'echo "Hello World"'
  };

  // Escribir código en el editor
  const codeEditor = page.locator('.monaco-editor textarea').or(
    page.locator('textarea[name="code"]')
  );

  await codeEditor.fill(codeExamples[language] || codeExamples.python);

  // Ejecutar código
  await page.click('button:has-text("Ejecutar")');
  await page.waitForTimeout(2000);

  // Enviar como solución
  const submitButton = page.locator('button:has-text("Enviar solución")');
  if (await submitButton.isVisible({ timeout: 2000 })) {
    await submitButton.click();
  }
}

/**
 * Verificar progreso del curso
 */
export async function verifyProgress(page: Page, expectedPercentage: number) {
  const progressText = await page.locator('[data-testid="course-progress"]').textContent();
  const actualPercentage = parseInt(progressText?.match(/\d+/)?.[0] || '0');

  expect(actualPercentage).toBeGreaterThanOrEqual(expectedPercentage);
}

/**
 * Obtener lista de cursos disponibles
 */
export async function getAvailableCourses(page: Page) {
  await page.goto(`${BASE_URL}/courses`);

  const courseCards = page.locator('[data-testid="course-card"]');
  const courses = [];
  const count = await courseCards.count();

  for (let i = 0; i < count; i++) {
    const card = courseCards.nth(i);
    const title = await card.locator('h3').textContent();
    const slug = await card.getAttribute('data-course-slug');

    courses.push({ title, slug });
  }

  return courses;
}

/**
 * Verificar que un curso tiene ciertos módulos
 */
export async function verifyCourseModules(page: Page, courseSlug: string, expectedModuleCount: number) {
  await page.goto(`${BASE_URL}/courses/${courseSlug}`);

  const modules = page.locator('[data-testid^="module-"]');
  const actualCount = await modules.count();

  expect(actualCount).toBe(expectedModuleCount);
}

/**
 * Buscar cursos por criterio
 */
export async function searchCourses(page: Page, searchTerm: string) {
  await page.goto(`${BASE_URL}/courses`);

  const searchInput = page.locator('input[placeholder*="Buscar"]').or(
    page.locator('input[name="search"]')
  );

  await searchInput.fill(searchTerm);
  await searchInput.press('Enter');

  await page.waitForLoadState('networkidle');
}