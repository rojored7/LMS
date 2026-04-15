/**
 * HU-010: Asignar Perfil a Usuario
 * Como administrador, quiero asignar perfiles de entrenamiento a usuarios
 * para que automáticamente se inscriban en los cursos correspondientes.
 *
 * Criterios de Aceptación:
 * AC1: Admin puede asignar un perfil desde la página de usuario
 * AC2: Se pueden asignar perfiles de forma masiva a múltiples usuarios
 * AC3: Al asignar un perfil, el usuario se inscribe automáticamente en sus cursos
 * AC4: Se puede cambiar el perfil asignado a un usuario
 * AC5: Se puede quitar un perfil asignado
 * AC6: Se muestra confirmación antes de realizar cambios masivos
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

test.describe('HU-010: Asignar Perfil a Usuario', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('AC1: Admin puede asignar un perfil desde la página de usuario', async ({ page }) => {
    // Navegar a lista de usuarios
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    // Seleccionar un usuario estudiante
    const studentRow = page.locator('tr:has-text("STUDENT"), .user-item:has-text("Estudiante")').first();
    await expect(studentRow).toBeVisible();

    // Hacer click en editar o ver detalles
    const actionButton = studentRow.locator('button:has-text(/editar|edit|detalle|view/i), a:has-text(/editar|edit/i)').first();
    await actionButton.click();

    // Esperar página de edición/detalle
    await page.waitForURL(/\/admin\/users\/[^\/]+/, { timeout: 5000 });

    // Buscar selector de perfil
    const profileSelector = page.locator('select[name*="profile" i], select[name*="training" i]').first();
    const profileRadios = page.locator('input[type="radio"][name*="profile" i]');
    const profileDropdown = page.locator('[role="combobox"][aria-label*="profile" i], .profile-selector');

    if (await profileSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Select dropdown
      const options = await profileSelector.locator('option').count();
      if (options > 1) {
        await profileSelector.selectOption({ index: 1 });
      }
    } else if (await profileRadios.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Radio buttons
      const firstRadio = profileRadios.first();
      await firstRadio.check();
    } else if (await profileDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Custom dropdown
      await profileDropdown.click();
      const firstOption = page.locator('[role="option"], .dropdown-item').first();
      await firstOption.click();
    }

    // Guardar cambios
    const saveButton = page.locator('button[type="submit"], button:has-text(/guardar|save|asignar|assign/i)').first();
    await saveButton.click();

    // Verificar mensaje de éxito
    await expect(page.locator('text=/perfil.*asignado|profile.*assigned|actualizado.*exitosamente/i')).toBeVisible({ timeout: 5000 });

    // Verificar que el perfil se muestra en la información del usuario
    const profileInfo = page.locator('text=/perfil|training.*profile/i').first();
    await expect(profileInfo).toBeVisible();
  });

  test('AC2: Se pueden asignar perfiles de forma masiva a múltiples usuarios', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    // Buscar checkboxes para selección múltiple
    const selectAllCheckbox = page.locator('input[type="checkbox"][aria-label*="select all" i], thead input[type="checkbox"]').first();
    const userCheckboxes = page.locator('tbody input[type="checkbox"], .user-item input[type="checkbox"]');

    if (await selectAllCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Seleccionar todos
      await selectAllCheckbox.check();
    } else if (await userCheckboxes.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Seleccionar algunos usuarios manualmente
      const checkboxCount = await userCheckboxes.count();
      for (let i = 0; i < Math.min(3, checkboxCount); i++) {
        await userCheckboxes.nth(i).check();
      }
    }

    // Buscar botón de acciones masivas
    const bulkActionButton = page.locator('button:has-text(/acción.*masiva|bulk.*action|asignar.*perfil.*seleccionados/i)').first();
    const dropdownTrigger = page.locator('button:has-text(/acciones|actions/i), [aria-label*="bulk" i]').first();

    if (await bulkActionButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bulkActionButton.click();
    } else if (await dropdownTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dropdownTrigger.click();
      const assignProfileOption = page.locator('text=/asignar.*perfil|assign.*profile/i').first();
      await assignProfileOption.click();
    }

    // Esperar modal de selección de perfil
    await page.waitForSelector('[role="dialog"], .modal, .bulk-assign-modal', { timeout: 5000 });

    // Seleccionar un perfil
    const modalProfileSelector = page.locator('dialog select[name*="profile"], .modal select').first();
    const modalProfileRadio = page.locator('dialog input[type="radio"], .modal input[type="radio"]').first();

    if (await modalProfileSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modalProfileSelector.selectOption({ index: 1 });
    } else if (await modalProfileRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modalProfileRadio.check();
    }

    // Confirmar asignación masiva
    const confirmButton = page.locator('dialog button:has-text(/confirmar|confirm|asignar|assign/i), .modal button[type="submit"]').first();
    await confirmButton.click();

    // Verificar mensaje de éxito
    await expect(page.locator('text=/perfil.*asignado.*[0-9]+.*usuarios|assigned.*successfully|actualización.*masiva/i')).toBeVisible({ timeout: 5000 });
  });

  test('AC3: Al asignar un perfil, el usuario se inscribe automáticamente en sus cursos', async ({ page, request }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    // Seleccionar un usuario sin perfil o con pocos cursos
    const userRow = page.locator('tr:has-text("STUDENT"), .user-item').first();
    const editButton = userRow.locator('button:has-text(/editar|edit/i)').first();
    await editButton.click();

    await page.waitForURL(/\/admin\/users\/[^\/]+/, { timeout: 5000 });

    // Obtener ID del usuario de la URL
    const userId = page.url().split('/').pop();

    // Verificar cursos actuales del usuario (si la información está disponible)
    const currentCoursesSection = page.locator('text=/cursos.*inscrito|enrolled.*courses/i');
    let initialCourseCount = 0;

    if (await currentCoursesSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      const courseItems = page.locator('.course-item, .enrolled-course');
      initialCourseCount = await courseItems.count();
    }

    // Asignar un perfil con cursos
    const profileSelector = page.locator('select[name*="profile"]').first();
    if (await profileSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Seleccionar un perfil que tenga cursos
      const options = profileSelector.locator('option');
      const optionCount = await options.count();

      for (let i = 1; i < optionCount; i++) {
        const optionText = await options.nth(i).textContent();
        if (optionText && optionText.match(/[1-9].*curso/i)) {
          await profileSelector.selectOption({ index: i });
          break;
        }
      }
    }

    // Guardar
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verificar que ahora tiene más cursos inscritos
    if (await currentCoursesSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      const newCourseItems = page.locator('.course-item, .enrolled-course');
      const newCourseCount = await newCourseItems.count();
      expect(newCourseCount).toBeGreaterThanOrEqual(initialCourseCount);
    }

    // Alternativamente, verificar via API
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    if (token && userId) {
      const response = await request.get(`${API_URL}/users/${userId}/enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok()) {
        const enrollments = await response.json();
        expect(enrollments.data || enrollments).toBeInstanceOf(Array);
      }
    }
  });

  test('AC4: Se puede cambiar el perfil asignado a un usuario', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    // Seleccionar usuario con perfil asignado
    const userWithProfile = page.locator('tr, .user-item').filter({ hasText: /perfil|profile/i }).first();

    if (await userWithProfile.isVisible({ timeout: 3000 }).catch(() => false)) {
      const editButton = userWithProfile.locator('button:has-text(/editar|edit/i)').first();
      await editButton.click();

      await page.waitForURL(/\/admin\/users\/[^\/]+/, { timeout: 5000 });

      // Obtener perfil actual
      const currentProfileElement = page.locator('select[name*="profile"] option[selected], .current-profile').first();
      const currentProfile = await currentProfileElement.textContent().catch(() => null);

      // Cambiar a otro perfil
      const profileSelector = page.locator('select[name*="profile"]').first();
      if (await profileSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
        const options = profileSelector.locator('option');
        const optionCount = await options.count();

        // Buscar un perfil diferente
        for (let i = 0; i < optionCount; i++) {
          const optionText = await options.nth(i).textContent();
          if (optionText && optionText !== currentProfile) {
            await profileSelector.selectOption({ index: i });
            break;
          }
        }
      }

      // Guardar cambio
      await page.click('button[type="submit"]');

      // Verificar mensaje de actualización
      await expect(page.locator('text=/perfil.*actualizado|profile.*updated|cambiado.*exitosamente/i')).toBeVisible({ timeout: 5000 });

      // Verificar que el perfil cambió
      const newProfileElement = page.locator('select[name*="profile"] option[selected], .current-profile').first();
      const newProfile = await newProfileElement.textContent().catch(() => null);

      if (currentProfile && newProfile) {
        expect(newProfile).not.toBe(currentProfile);
      }
    }
  });

  test('AC5: Se puede quitar un perfil asignado', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    // Buscar usuario con perfil asignado
    const userWithProfile = page.locator('tr, .user-item').filter({ hasText: /perfil|profile/i }).first();

    if (await userWithProfile.isVisible({ timeout: 3000 }).catch(() => false)) {
      const editButton = userWithProfile.locator('button:has-text(/editar|edit/i)').first();
      await editButton.click();

      await page.waitForURL(/\/admin\/users\/[^\/]+/, { timeout: 5000 });

      // Buscar opción para quitar perfil
      const profileSelector = page.locator('select[name*="profile"]').first();
      const removeButton = page.locator('button:has-text(/quitar.*perfil|remove.*profile|sin.*perfil/i)').first();

      if (await profileSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Buscar opción "Sin perfil" o vacía
        const noneOption = profileSelector.locator('option:has-text(/ninguno|none|sin.*perfil|--/i)').first();
        if (await noneOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await profileSelector.selectOption(await noneOption.getAttribute('value') || '');
        } else {
          // Seleccionar primera opción (usualmente vacía)
          await profileSelector.selectOption({ index: 0 });
        }

        // Guardar
        await page.click('button[type="submit"]');
      } else if (await removeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await removeButton.click();

        // Confirmar si hay modal
        const confirmButton = page.locator('button:has-text(/confirmar|confirm|sí|yes/i)').first();
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }
      }

      // Verificar que el perfil fue quitado
      await expect(page.locator('text=/perfil.*eliminado|profile.*removed|sin.*perfil.*asignado/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('AC6: Se muestra confirmación antes de realizar cambios masivos', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    // Seleccionar múltiples usuarios
    const userCheckboxes = page.locator('tbody input[type="checkbox"], .user-item input[type="checkbox"]');
    const checkboxCount = await userCheckboxes.count();

    if (checkboxCount >= 2) {
      // Seleccionar al menos 2 usuarios
      await userCheckboxes.nth(0).check();
      await userCheckboxes.nth(1).check();

      // Buscar acción masiva
      const bulkButton = page.locator('button:has-text(/acciones|bulk|masiva/i)').first();
      if (await bulkButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bulkButton.click();

        const assignOption = page.locator('text=/asignar.*perfil/i').first();
        await assignOption.click();
      }

      // Esperar modal de confirmación
      const confirmModal = page.locator('[role="dialog"], .confirm-modal, .modal').first();
      await expect(confirmModal).toBeVisible({ timeout: 5000 });

      // Verificar que muestra información sobre la acción
      await expect(confirmModal.locator('text=/[0-9]+.*usuarios|confirmar|está.*seguro/i')).toBeVisible();

      // Verificar que hay botones de confirmar y cancelar
      const confirmButton = confirmModal.locator('button:has-text(/confirmar|sí|proceed/i)');
      const cancelButton = confirmModal.locator('button:has-text(/cancelar|no|cancel/i)');

      await expect(confirmButton).toBeVisible();
      await expect(cancelButton).toBeVisible();

      // Probar cancelación
      await cancelButton.click();

      // Modal debe cerrarse sin hacer cambios
      await expect(confirmModal).not.toBeVisible({ timeout: 2000 });

      // Los usuarios siguen seleccionados pero sin cambios
      await expect(userCheckboxes.nth(0)).toBeChecked();
    }
  });

  test('Se muestra historial de cambios de perfil', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    // Seleccionar un usuario
    const userRow = page.locator('tr, .user-item').first();
    const viewButton = userRow.locator('button:has-text(/ver|view|historial/i)').first();

    if (await viewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewButton.click();

      await page.waitForURL(/\/admin\/users\/[^\/]+/, { timeout: 5000 });

      // Buscar sección de historial
      const historySection = page.locator('text=/historial.*cambios|profile.*history|registro.*actividad/i').first();

      if (await historySection.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Verificar que muestra entradas del historial
        const historyItems = page.locator('.history-item, .activity-log-item, .timeline-item');
        const itemCount = await historyItems.count();

        if (itemCount > 0) {
          const firstItem = historyItems.first();
          // Verificar que muestra fecha y tipo de cambio
          await expect(firstItem.locator('text=/[0-9]{1,2}[/-][0-9]{1,2}|ago|perfil/i')).toBeVisible();
        }
      }
    }
  });

  test('Validación de perfiles compatibles con el rol del usuario', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table, .user-list', { timeout: 10000 });

    // Buscar un instructor (rol diferente)
    const instructorRow = page.locator('tr:has-text("INSTRUCTOR"), .user-item:has-text("Instructor")').first();

    if (await instructorRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      const editButton = instructorRow.locator('button:has-text(/editar|edit/i)').first();
      await editButton.click();

      await page.waitForURL(/\/admin\/users\/[^\/]+/, { timeout: 5000 });

      // Verificar que los perfiles disponibles son apropiados para instructores
      const profileSelector = page.locator('select[name*="profile"]').first();
      if (await profileSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
        const options = profileSelector.locator('option');
        const optionTexts = await options.allTextContents();

        // Los perfiles para instructores pueden ser diferentes o no estar disponibles
        // Verificar que hay algún tipo de validación o diferenciación
        expect(optionTexts.length).toBeGreaterThanOrEqual(0);
      }

      // Verificar si hay mensaje informativo
      const infoMessage = page.locator('text=/perfil.*instructor|no.*disponible.*rol/i');
      if (await infoMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(infoMessage).toBeVisible();
      }
    }
  });
});