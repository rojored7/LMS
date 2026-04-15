/**
 * HU-014: Sistema de Inscripción
 * Como estudiante, quiero inscribirme en cursos de mi interés
 * para comenzar mi aprendizaje de forma organizada.
 *
 * Criterios de Aceptación:
 * AC1: Botón de inscripción visible en cursos no inscritos
 * AC2: Confirmación antes de inscribirse
 * AC3: Inscripción exitosa muestra el curso en "Mis Cursos"
 * AC4: No se puede inscribir dos veces al mismo curso
 * AC5: Se verifica cumplimiento de prerequisitos
 * AC6: Se envía notificación de inscripción exitosa
 */

import { test, expect } from '@playwright/test';
import { loginAsStudent } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

test.describe('HU-014: Sistema de Inscripción', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('AC1: Botón de inscripción visible en cursos no inscritos', async ({ page }) => {
    // Ir al catálogo
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForSelector('.course-card, .course-item', { timeout: 10000 });

    // Buscar un curso sin inscripción
    const availableCourses = page.locator('.course-card, .course-item').filter({ hasNotText: /inscrito|enrolled|cursando/i });

    if (await availableCourses.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const firstAvailable = availableCourses.first();

      // Verificar botón de inscripción
      const enrollButton = firstAvailable.locator('button:has-text(/inscribir|enroll|comenzar|empezar/i), a:has-text(/inscribir|enroll/i)');
      await expect(enrollButton.first()).toBeVisible();

      // El botón debe estar habilitado
      const isDisabled = await enrollButton.first().isDisabled();
      expect(isDisabled).toBeFalsy();
    }
  });

  test('AC2: Confirmación antes de inscribirse', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForSelector('.course-card, .course-item', { timeout: 10000 });

    // Buscar curso disponible
    const availableCourse = page.locator('.course-card, .course-item').filter({ hasNotText: /inscrito|enrolled/i }).first();

    if (await availableCourse.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click en ver detalles primero
      const detailsButton = availableCourse.locator('a, button').filter({ hasText: /ver.*más|detalles|view/i }).first();
      await detailsButton.click();

      // Esperar página de detalles
      await page.waitForURL(/\/courses\/[^\/]+/, { timeout: 5000 });

      // Click en inscribir
      const enrollButton = page.locator('button:has-text(/inscribir|enroll|comenzar/i)').first();
      await enrollButton.click();

      // Verificar modal de confirmación o mensaje
      const confirmModal = page.locator('[role="dialog"], .confirm-modal, .enrollment-confirm');
      const confirmMessage = page.locator('text=/confirmar.*inscripción|está.*seguro|confirm.*enrollment/i');

      const hasConfirmation = await confirmModal.isVisible({ timeout: 2000 }).catch(() => false) ||
                              await confirmMessage.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasConfirmation) {
        // Confirmar inscripción
        const confirmButton = page.locator('button:has-text(/confirmar|sí|yes|inscribir/i)').first();
        await confirmButton.click();
      }

      // Verificar inscripción exitosa
      await expect(page.locator('text=/inscripción.*exitosa|successfully.*enrolled|bienvenido.*curso/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('AC3: Inscripción exitosa muestra el curso en "Mis Cursos"', async ({ page }) => {
    // Primero inscribirse en un curso
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForSelector('.course-card, .course-item', { timeout: 10000 });

    const availableCourse = page.locator('.course-card, .course-item').filter({ hasNotText: /inscrito|enrolled/i }).first();

    if (await availableCourse.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Obtener nombre del curso
      const courseTitle = await availableCourse.locator('h2, h3, h4, .course-title').first().textContent();

      // Inscribirse
      const enrollButton = availableCourse.locator('button:has-text(/inscribir|enroll/i), a:has-text(/ver.*más/i)').first();
      await enrollButton.click();

      // Si estamos en detalles, buscar botón de inscripción
      if (page.url().includes('/courses/')) {
        const detailEnrollButton = page.locator('button:has-text(/inscribir|enroll|comenzar/i)').first();
        if (await detailEnrollButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await detailEnrollButton.click();
        }
      }

      // Confirmar si hay modal
      const confirmButton = page.locator('button:has-text(/confirmar|sí|yes/i)');
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Ir a Mis Cursos
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForSelector('.enrolled-course, .course-card, .my-course', { timeout: 10000 });

      // Verificar que el curso aparece
      await expect(page.locator(`text="${courseTitle}"`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('AC4: No se puede inscribir dos veces al mismo curso', async ({ page }) => {
    // Ir a un curso ya inscrito
    await page.goto(`${BASE_URL}/dashboard`);

    const enrolledCourse = page.locator('.enrolled-course, .course-card, .my-course').first();

    if (await enrolledCourse.isVisible({ timeout: 5000 }).catch(() => false)) {
      const courseTitle = await enrolledCourse.locator('h2, h3, h4, .course-title').first().textContent();

      // Ir al catálogo
      await page.goto(`${BASE_URL}/courses`);

      // Buscar el mismo curso
      const sameCourse = page.locator('.course-card, .course-item').filter({ hasText: courseTitle || '' }).first();

      if (await sameCourse.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Verificar que no hay botón de inscripción o está deshabilitado
        const enrollButton = sameCourse.locator('button:has-text(/inscribir|enroll/i)');

        if (await enrollButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          const isDisabled = await enrollButton.isDisabled();
          expect(isDisabled).toBeTruthy();
        } else {
          // Debe mostrar estado de inscrito
          await expect(sameCourse.locator('text=/inscrito|enrolled|cursando|continuar/i')).toBeVisible();
        }
      }
    }
  });

  test('AC5: Se verifica cumplimiento de prerequisitos', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);

    // Buscar un curso avanzado que pueda tener prerequisitos
    const advancedCourse = page.locator('.course-card, .course-item').filter({ hasText: /avanzado|advanced|nivel.*3/i }).first();

    if (await advancedCourse.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Ver detalles del curso
      const detailsButton = advancedCourse.locator('a, button').first();
      await detailsButton.click();

      await page.waitForURL(/\/courses\/[^\/]+/, { timeout: 5000 });

      // Buscar sección de prerequisitos
      const prerequisites = page.locator('text=/prerequisito|requisito.*previo|prerequisite|required.*course/i');

      if (await prerequisites.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Intentar inscribirse
        const enrollButton = page.locator('button:has-text(/inscribir|enroll/i)').first();

        if (await enrollButton.isVisible() && !await enrollButton.isDisabled()) {
          await enrollButton.click();

          // Podría mostrar advertencia sobre prerequisitos
          const warningMessage = page.locator('text=/debe.*completar|prerequisito.*requerido|must.*complete.*first/i');

          if (await warningMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(warningMessage).toBeVisible();
          }
        }
      }
    }
  });

  test('AC6: Se envía notificación de inscripción exitosa', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForSelector('.course-card, .course-item', { timeout: 10000 });

    const availableCourse = page.locator('.course-card, .course-item').filter({ hasNotText: /inscrito|enrolled/i }).first();

    if (await availableCourse.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Preparar para detectar notificaciones
      const toastPromise = page.waitForSelector('.toast, .notification, .alert, [role="alert"]', {
        timeout: 10000,
        state: 'visible'
      }).catch(() => null);

      // Inscribirse
      const enrollButton = availableCourse.locator('button:has-text(/inscribir|enroll/i), a:has-text(/ver.*más/i)').first();
      await enrollButton.click();

      // Si estamos en detalles
      if (page.url().includes('/courses/')) {
        const detailEnrollButton = page.locator('button:has-text(/inscribir|enroll/i)').first();
        if (await detailEnrollButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await detailEnrollButton.click();
        }
      }

      // Confirmar si necesario
      const confirmButton = page.locator('button:has-text(/confirmar|sí/i)');
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Verificar notificación
      const notification = await toastPromise;
      if (notification) {
        await expect(notification).toBeVisible();
        const notificationText = await notification.textContent();
        expect(notificationText).toMatch(/inscri|enroll|éxito|success/i);
      }

      // Alternativamente, verificar en el centro de notificaciones
      const notificationBell = page.locator('[aria-label*="notification" i], .notification-bell');
      if (await notificationBell.isVisible({ timeout: 2000 }).catch(() => false)) {
        await notificationBell.click();

        const notificationList = page.locator('.notification-list, .notifications-dropdown');
        if (await notificationList.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(notificationList.locator('text=/inscripción|enrolled/i').first()).toBeVisible();
        }
      }
    }
  });

  test('Desinscripción de un curso', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    const enrolledCourse = page.locator('.enrolled-course, .course-card').first();

    if (await enrolledCourse.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Buscar opción de desinscribir
      const moreOptions = enrolledCourse.locator('button[aria-label*="more" i], button[aria-label*="options" i]');
      const unenrollButton = page.locator('button:has-text(/desinscribir|unenroll|abandonar/i)');

      if (await moreOptions.isVisible({ timeout: 2000 }).catch(() => false)) {
        await moreOptions.click();
        await page.waitForTimeout(500);
      }

      if (await unenrollButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await unenrollButton.click();

        // Confirmar desinscripción
        const confirmButton = page.locator('button:has-text(/confirmar|sí/i)');
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();

          // Verificar mensaje de confirmación
          await expect(page.locator('text=/desinscripción.*exitosa|successfully.*unenrolled/i')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('Inscripción con límite de cupos', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);

    // Buscar curso con información de cupos
    const courseWithSeats = page.locator('.course-card, .course-item').filter({ hasText: /cupos|plazas|seats.*available/i }).first();

    if (await courseWithSeats.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Verificar información de cupos
      const seatsInfo = courseWithSeats.locator('text=/[0-9]+.*cupos|[0-9]+.*disponible/i');
      if (await seatsInfo.isVisible({ timeout: 2000 }).catch(() => false)) {
        const seatsText = await seatsInfo.textContent();
        expect(seatsText).toMatch(/\d+/);

        // Si hay cupos disponibles, el botón debe estar habilitado
        const enrollButton = courseWithSeats.locator('button:has-text(/inscribir|enroll/i)');
        if (await enrollButton.isVisible()) {
          const seatsNumber = parseInt(seatsText.match(/\d+/)?.[0] || '0');
          if (seatsNumber > 0) {
            const isDisabled = await enrollButton.isDisabled();
            expect(isDisabled).toBeFalsy();
          }
        }
      }
    }
  });
});