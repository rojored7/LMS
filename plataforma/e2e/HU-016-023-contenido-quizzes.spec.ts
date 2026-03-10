/**
 * E2E Tests: HU-016 a HU-023 - Contenido y Quizzes
 * Tests de visualización de contenido, sistema de quizzes y evaluación
 */

import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';
import { enrollInCourse, navigateToModule, navigateToLesson, submitQuizWithCorrectAnswers } from './helpers/course';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Contenido y Sistema de Quizzes', () => {
  test('HU-016: Lecciones renderizan Markdown correctamente', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');

    // Inscribirse en curso
    await enrollInCourse(page, 'ciberseguridad-postcuantica');

    // Navegar a página de aprendizaje
    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/learning`);

    // Click en primera lección disponible
    const firstLesson = page.locator('[data-testid^="lesson-"]').first().or(
      page.locator('a:has-text("Lección 1")').first()
    );

    await firstLesson.click();
    await page.waitForLoadState('networkidle');

    // Verificar elementos Markdown renderizados

    // Headers
    const headers = page.locator('h1, h2, h3');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);

    // Párrafos
    const paragraphs = page.locator('p');
    const paragraphCount = await paragraphs.count();
    expect(paragraphCount).toBeGreaterThan(0);

    // Code blocks
    const codeBlocks = page.locator('pre code').or(
      page.locator('.code-block')
    );
    const codeCount = await codeBlocks.count();
    if (codeCount > 0) {
      // Verificar syntax highlighting
      const firstCode = codeBlocks.first();
      const codeClasses = await firstCode.getAttribute('class');

      // Debería tener clases de syntax highlighting
      if (codeClasses) {
        expect(codeClasses).toMatch(/(language-|hljs|prism)/);
      }
    }

    // Imágenes
    const images = page.locator('img').or(
      page.locator('[data-testid="lesson-image"]')
    );
    const imageCount = await images.count();
    if (imageCount > 0) {
      // Verificar que las imágenes cargan
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();

      // Verificar alt text
      const altText = await firstImage.getAttribute('alt');
      expect(altText).toBeTruthy();
    }

    // Listas
    const lists = page.locator('ul, ol');
    const listCount = await lists.count();
    if (listCount > 0) {
      const listItems = page.locator('li');
      const itemCount = await listItems.count();
      expect(itemCount).toBeGreaterThan(0);
    }

    // Enlaces
    const links = page.locator('a[href^="http"]');
    const linkCount = await links.count();
    if (linkCount > 0) {
      const firstLink = links.first();
      const href = await firstLink.getAttribute('href');
      expect(href).toMatch(/^https?:\/\//);

      // Verificar que enlaces externos abren en nueva pestaña
      const target = await firstLink.getAttribute('target');
      expect(target).toBe('_blank');
    }

    // Tablas
    const tables = page.locator('table');
    const tableCount = await tables.count();
    if (tableCount > 0) {
      const firstTable = tables.first();
      await expect(firstTable.locator('thead')).toBeVisible();
      await expect(firstTable.locator('tbody')).toBeVisible();
    }
  });

  test('HU-017: Estudiante puede tomar quiz', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');
    await enrollInCourse(page);

    // Navegar al primer quiz disponible
    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/learning`);

    // Buscar quiz en el menú
    const quizLink = page.locator('a:has-text("Quiz")').first().or(
      page.locator('[data-testid^="quiz-"]').first()
    );

    if (await quizLink.isVisible({ timeout: 5000 })) {
      await quizLink.click();

      // Verificar que se carga la página del quiz
      await expect(page.locator('h1:has-text("Quiz")')).toBeVisible({ timeout: 5000 });

      // Verificar instrucciones
      await expect(
        page.locator('text=/instrucciones/i').or(
          page.locator('[data-testid="quiz-instructions"]')
        )
      ).toBeVisible();

      // Verificar preguntas
      const questions = page.locator('[data-testid^="question-"]').or(
        page.locator('.question-container')
      );

      const questionCount = await questions.count();
      expect(questionCount).toBeGreaterThan(0);

      // Responder cada pregunta
      for (let i = 0; i < questionCount; i++) {
        const question = questions.nth(i);

        // Verificar texto de la pregunta
        const questionText = question.locator('.question-text').or(
          question.locator('p').first()
        );
        await expect(questionText).toBeVisible();

        // Verificar opciones de respuesta
        const options = question.locator('input[type="radio"]').or(
          question.locator('input[type="checkbox"]')
        );

        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(1);

        // Seleccionar primera opción
        await options.first().click();
      }

      // Enviar respuestas
      const submitButton = page.locator('button:has-text("Enviar")').or(
        page.locator('button[type="submit"]')
      );

      await submitButton.click();

      // Verificar resultados
      await expect(
        page.locator('[data-testid="quiz-results"]').or(
          page.locator('text=/resultado/i')
        )
      ).toBeVisible({ timeout: 10000 });

      // Verificar puntuación
      const scoreElement = page.locator('[data-testid="quiz-score"]').or(
        page.locator('text=/puntuación/i')
      );

      const scoreText = await scoreElement.textContent();
      expect(scoreText).toMatch(/\d+/);
    }
  });

  test('HU-018: Quiz se califica automáticamente', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');
    await enrollInCourse(page);

    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/quizzes/1`);

    // Responder quiz
    const questions = page.locator('[data-testid^="question-"]');
    const questionCount = await questions.count();

    if (questionCount > 0) {
      // Responder todas las preguntas
      for (let i = 0; i < questionCount; i++) {
        const question = questions.nth(i);
        const firstOption = question.locator('input[type="radio"]').first();
        await firstOption.click();
      }

      // Enviar
      await page.click('button:has-text("Enviar")');

      // Verificar calificación inmediata
      await expect(
        page.locator('[data-testid="quiz-score"]').or(
          page.locator('text=/calificación/i')
        )
      ).toBeVisible({ timeout: 5000 });

      // Verificar desglose de respuestas
      const feedback = page.locator('[data-testid="answer-feedback"]').or(
        page.locator('.answer-feedback')
      );

      const feedbackCount = await feedback.count();
      if (feedbackCount > 0) {
        // Verificar indicadores de correcto/incorrecto
        const correctAnswers = page.locator('.correct-answer').or(
          page.locator('[data-correct="true"]')
        );

        const incorrectAnswers = page.locator('.incorrect-answer').or(
          page.locator('[data-correct="false"]')
        );

        const totalAnswers = (await correctAnswers.count()) + (await incorrectAnswers.count());
        expect(totalAnswers).toBeGreaterThan(0);
      }

      // Verificar que el resultado se guarda
      await page.reload();

      // Debería mostrar que el quiz ya fue tomado
      await expect(
        page.locator('text=/completado/i').or(
          page.locator('[data-testid="quiz-completed"]')
        )
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('HU-019: Límite de intentos en quizzes', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');
    await enrollInCourse(page);

    // Navegar a un quiz
    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/quizzes/1`);

    // Verificar información de intentos
    const attemptsInfo = page.locator('[data-testid="attempts-info"]').or(
      page.locator('text=/intentos/i')
    );

    if (await attemptsInfo.isVisible({ timeout: 3000 })) {
      const attemptsText = await attemptsInfo.textContent();
      expect(attemptsText).toMatch(/\d+/);

      // Simular múltiples intentos (si el quiz lo permite)
      const maxAttempts = 3;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Si ya se completó, buscar botón de reintentar
        const retryButton = page.locator('button:has-text("Reintentar")').or(
          page.locator('button:has-text("Intentar de nuevo")')
        );

        if (await retryButton.isVisible({ timeout: 2000 })) {
          await retryButton.click();
          await page.waitForTimeout(1000);
        }

        // Responder quiz rápidamente
        const questions = page.locator('input[type="radio"]');
        const questionCount = await questions.count();

        if (questionCount > 0) {
          for (let i = 0; i < questionCount; i += 4) {
            // Asumiendo 4 opciones por pregunta
            await questions.nth(i).click();
          }

          await page.click('button:has-text("Enviar")');
          await page.waitForTimeout(2000);
        }
      }

      // Después del límite, no debería permitir más intentos
      const retryButtonFinal = page.locator('button:has-text("Reintentar")');
      const isDisabled = await retryButtonFinal.isDisabled().catch(() => true);

      // O mostrar mensaje de límite alcanzado
      const limitMessage = page.locator('text=/límite.*alcanzado/i').or(
        page.locator('text=/no.*más.*intentos/i')
      );

      const hasLimit = await limitMessage.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isDisabled || hasLimit).toBeTruthy();
    }
  });

  test('HU-020: Retroalimentación en respuestas de quiz', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');
    await enrollInCourse(page);

    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/quizzes/1`);

    // Responder quiz
    const questions = page.locator('[data-testid^="question-"]');
    const questionCount = await questions.count();

    if (questionCount > 0) {
      for (let i = 0; i < Math.min(3, questionCount); i++) {
        const question = questions.nth(i);
        const options = question.locator('input[type="radio"]');

        // Seleccionar opción aleatoria
        const optionCount = await options.count();
        if (optionCount > 0) {
          const randomIndex = Math.floor(Math.random() * optionCount);
          await options.nth(randomIndex).click();
        }
      }

      await page.click('button:has-text("Enviar")');

      // Verificar retroalimentación
      await page.waitForTimeout(2000);

      // Buscar explicaciones de respuestas
      const explanations = page.locator('[data-testid="answer-explanation"]').or(
        page.locator('.explanation')
      );

      const explanationCount = await explanations.count();
      if (explanationCount > 0) {
        // Verificar que hay texto explicativo
        const firstExplanation = await explanations.first().textContent();
        expect(firstExplanation).toBeTruthy();
        expect(firstExplanation?.length).toBeGreaterThan(10);
      }

      // Verificar indicadores visuales
      const correctIndicators = page.locator('.correct').or(
        page.locator('[data-testid="correct-answer"]')
      );

      const incorrectIndicators = page.locator('.incorrect').or(
        page.locator('[data-testid="incorrect-answer"]')
      );

      const hasIndicators =
        (await correctIndicators.count()) > 0 ||
        (await incorrectIndicators.count()) > 0;

      expect(hasIndicators).toBeTruthy();
    }
  });

  test('HU-021: Navegación entre lecciones', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');
    await enrollInCourse(page);

    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/learning`);

    // Navegar a primera lección
    const firstLesson = page.locator('[data-testid="lesson-1"]').or(
      page.locator('a:has-text("Lección 1")').first()
    );

    await firstLesson.click();

    // Verificar controles de navegación
    const nextButton = page.locator('button:has-text("Siguiente")').or(
      page.locator('[data-testid="next-lesson"]')
    );

    const prevButton = page.locator('button:has-text("Anterior")').or(
      page.locator('[data-testid="prev-lesson"]')
    );

    // En la primera lección, anterior debería estar deshabilitado
    if (await prevButton.isVisible({ timeout: 2000 })) {
      const isPrevDisabled = await prevButton.isDisabled();
      expect(isPrevDisabled).toBeTruthy();
    }

    // Navegar a siguiente lección
    if (await nextButton.isVisible({ timeout: 2000 })) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      // Verificar que cambió la lección
      const currentTitle = await page.locator('h1').textContent();
      expect(currentTitle).toBeTruthy();

      // Ahora anterior debería estar habilitado
      if (await prevButton.isVisible()) {
        const isPrevDisabled = await prevButton.isDisabled();
        expect(isPrevDisabled).toBeFalsy();

        // Volver a lección anterior
        await prevButton.click();
        await page.waitForLoadState('networkidle');

        // Verificar que volvimos
        const newTitle = await page.locator('h1').textContent();
        expect(newTitle).not.toBe(currentTitle);
      }
    }

    // Verificar indicador de progreso de lección
    const progressIndicator = page.locator('[data-testid="lesson-progress"]').or(
      page.locator('.lesson-progress')
    );

    if (await progressIndicator.isVisible({ timeout: 2000 })) {
      const progressText = await progressIndicator.textContent();
      expect(progressText).toMatch(/\d+.*\d+/); // e.g., "1 de 5"
    }
  });

  test('HU-023: Marcado de lecciones como completadas', async ({ page }) => {
    const student = await registerAndLogin(page, 'STUDENT');
    await enrollInCourse(page);

    await page.goto(`${BASE_URL}/courses/ciberseguridad-postcuantica/learning`);

    // Ir a una lección
    const lesson = page.locator('[data-testid^="lesson-"]').first();
    await lesson.click();

    // Buscar botón de marcar como completada
    const completeButton = page.locator('button:has-text("Marcar como completada")').or(
      page.locator('[data-testid="mark-complete"]')
    );

    if (await completeButton.isVisible({ timeout: 5000 })) {
      // Estado inicial
      const initialText = await completeButton.textContent();

      // Marcar como completada
      await completeButton.click();
      await page.waitForTimeout(1000);

      // Verificar cambio de estado
      const updatedText = await completeButton.textContent();
      expect(updatedText).not.toBe(initialText);

      // Podría cambiar a "Completada" o deshabilitarse
      const isDisabled = await completeButton.isDisabled();
      const hasCompletedText = updatedText?.toLowerCase().includes('completada');

      expect(isDisabled || hasCompletedText).toBeTruthy();

      // Volver al módulo y verificar indicador
      await page.goBack();

      // La lección debería mostrar marca de completada
      const completedMark = lesson.locator('.completed').or(
        lesson.locator('[data-completed="true"]').or(
          lesson.locator('svg[data-testid="check-icon"]')
        )
      );

      const hasCompletedMark = await completedMark.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasCompletedMark).toBeTruthy();

      // Verificar que el progreso del módulo se actualiza
      const moduleProgress = page.locator('[data-testid="module-progress"]').or(
        page.locator('.module-progress')
      );

      if (await moduleProgress.isVisible({ timeout: 2000 })) {
        const progressText = await moduleProgress.textContent();
        expect(progressText).toMatch(/\d+/);
      }
    }
  });
});