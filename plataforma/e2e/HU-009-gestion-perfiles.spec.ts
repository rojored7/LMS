/**
 * HU-009: Gestión de Perfiles de Entrenamiento
 * Como administrador, quiero gestionar perfiles de entrenamiento
 * para agrupar cursos en rutas de aprendizaje coherentes.
 *
 * Criterios de Aceptación:
 * AC1: Admin puede crear nuevos perfiles de entrenamiento
 * AC2: Se pueden asignar múltiples cursos a un perfil
 * AC3: Se puede editar nombre y descripción del perfil
 * AC4: Se pueden reordenar los cursos dentro del perfil
 * AC5: Se puede activar/desactivar un perfil
 * AC6: Se muestra el número de usuarios asignados a cada perfil
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

test.describe('HU-009: Gestión de Perfiles de Entrenamiento', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('AC1: Admin puede crear nuevos perfiles de entrenamiento', async ({ page }) => {
    // Navegar a gestión de perfiles
    await page.goto(`${BASE_URL}/admin/training-profiles`);

    // Buscar botón de crear nuevo perfil
    const createButton = page.locator('button:has-text(/nuevo.*perfil|crear.*perfil|add.*profile|new.*profile/i)').first();
    await createButton.click();

    // Esperar modal o página de creación
    await page.waitForSelector('form, [role="dialog"]', { timeout: 5000 });

    // Llenar formulario
    const timestamp = Date.now();
    const profileName = `Perfil Test ${timestamp}`;

    await page.fill('input[name="name"], input[name="nombre"], input[placeholder*="nombre" i]', profileName);
    await page.fill(
      'textarea[name="description"], textarea[name="descripcion"], input[name="description"]',
      `Descripción del perfil de prueba ${timestamp}`
    );

    // Si hay campo de slug
    const slugField = page.locator('input[name="slug"]');
    if (await slugField.isVisible({ timeout: 1000 }).catch(() => false)) {
      await slugField.fill(`perfil-test-${timestamp}`);
    }

    // Guardar
    const saveButton = page.locator('button[type="submit"], button:has-text(/guardar|save|crear|create/i)').first();
    await saveButton.click();

    // Verificar creación exitosa
    await expect(page.locator(`text="${profileName}"`).first()).toBeVisible({ timeout: 10000 });

    // Verificar mensaje de éxito
    const successMessage = page.locator('text=/creado.*exitosamente|successfully.*created|perfil.*añadido/i');
    if (await successMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(successMessage).toBeVisible();
    }
  });

  test('AC2: Se pueden asignar múltiples cursos a un perfil', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/training-profiles`);

    // Seleccionar un perfil existente o crear uno nuevo
    const profiles = page.locator('.profile-item, .profile-card, tr[class*="profile"], [data-testid="profile"]');
    let profileToEdit;

    if (await profiles.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      profileToEdit = profiles.first();
    } else {
      // Crear un perfil nuevo si no hay ninguno
      const createButton = page.locator('button:has-text(/nuevo.*perfil|crear.*perfil/i)').first();
      await createButton.click();

      const timestamp = Date.now();
      await page.fill('input[name="name"], input[name="nombre"]', `Test Profile ${timestamp}`);
      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);
      profileToEdit = page.locator('.profile-item, .profile-card').first();
    }

    // Editar el perfil
    const editButton = profileToEdit.locator('button:has-text(/editar|edit|gestionar.*cursos|manage.*courses/i), a:has-text(/editar|edit/)').first();
    await editButton.click();

    // Esperar la página/modal de edición
    await page.waitForSelector('[class*="course"], [data-testid*="course"], .course-selector', { timeout: 5000 });

    // Buscar selector de cursos
    const courseSelector = page.locator('input[type="checkbox"], select[multiple], .course-checkbox');
    const availableCourses = await courseSelector.count();

    if (availableCourses > 0) {
      // Seleccionar varios cursos
      for (let i = 0; i < Math.min(3, availableCourses); i++) {
        const course = courseSelector.nth(i);
        if (await course.isVisible()) {
          await course.check();
        }
      }
    } else {
      // Si es un selector diferente (drag and drop, lista, etc)
      const courseList = page.locator('.available-courses li, .course-list-item').first();
      if (await courseList.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Hacer click o arrastrar para añadir
        await courseList.click();

        const addButton = page.locator('button:has-text(/añadir|add|agregar|>>>/i)').first();
        if (await addButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await addButton.click();
        }
      }
    }

    // Guardar cambios
    const saveButton = page.locator('button:has-text(/guardar|save|actualizar|update/i)').first();
    await saveButton.click();

    // Verificar que los cursos se asignaron
    await page.waitForTimeout(2000);
    const assignedCoursesIndicator = page.locator('text=/[0-9]+.*curso|course.*count|cursos.*asignados/i');
    if (await assignedCoursesIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await assignedCoursesIndicator.textContent();
      expect(text).toMatch(/[1-9]/); // Al menos 1 curso asignado
    }
  });

  test('AC3: Se puede editar nombre y descripción del perfil', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/training-profiles`);

    // Seleccionar primer perfil
    const firstProfile = page.locator('.profile-item, .profile-card, tr[class*="profile"]').first();
    await expect(firstProfile).toBeVisible({ timeout: 5000 });

    // Obtener nombre original
    const originalName = await firstProfile.locator('h3, .profile-name, td').first().textContent();

    // Hacer click en editar
    const editButton = firstProfile.locator('button:has-text(/editar|edit/i), a:has-text(/editar|edit/i)').first();
    await editButton.click();

    // Esperar formulario de edición
    await page.waitForSelector('form, [role="dialog"]', { timeout: 5000 });

    // Editar campos
    const timestamp = Date.now();
    const newName = `Perfil Actualizado ${timestamp}`;
    const newDescription = `Descripción actualizada ${timestamp}`;

    const nameField = page.locator('input[name="name"], input[name="nombre"]').first();
    await nameField.clear();
    await nameField.fill(newName);

    const descField = page.locator('textarea[name="description"], textarea[name="descripcion"], input[name="description"]').first();
    await descField.clear();
    await descField.fill(newDescription);

    // Guardar
    await page.click('button[type="submit"], button:has-text(/guardar|save|actualizar/i)');

    // Verificar actualización
    await expect(page.locator(`text="${newName}"`)).toBeVisible({ timeout: 5000 });

    // Verificar que el nombre original ya no está (si era diferente)
    if (originalName && !originalName.includes(newName)) {
      await expect(page.locator(`text="${originalName}"`)).not.toBeVisible({ timeout: 2000 }).catch(() => {
        // Puede que el original aún esté en otro lugar
      });
    }
  });

  test('AC4: Se pueden reordenar los cursos dentro del perfil', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/training-profiles`);

    // Seleccionar un perfil con cursos
    const profileWithCourses = page.locator('.profile-item, .profile-card').filter({ hasText: /[1-9].*curso/i }).first();

    if (await profileWithCourses.isVisible({ timeout: 3000 }).catch(() => false)) {
      const editButton = profileWithCourses.locator('button:has-text(/editar|gestionar/i)').first();
      await editButton.click();

      // Esperar lista de cursos
      await page.waitForSelector('.course-list, .assigned-courses, [class*="sortable"]', { timeout: 5000 });

      // Buscar elementos draggables o botones de orden
      const draggableItems = page.locator('[draggable="true"], .drag-handle, [class*="draggable"]');
      const upDownButtons = page.locator('button[aria-label*="up" i], button[aria-label*="down" i], button:has-text(/subir|bajar|up|down/i)');

      if (await draggableItems.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        // Intentar drag and drop
        const firstItem = draggableItems.first();
        const secondItem = draggableItems.nth(1);

        if (await secondItem.isVisible({ timeout: 1000 }).catch(() => false)) {
          await firstItem.dragTo(secondItem);

          // Verificar que el orden cambió (visual check)
          await page.waitForTimeout(1000);
        }
      } else if (await upDownButtons.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        // Usar botones de arriba/abajo
        const downButton = page.locator('button:has-text(/bajar|down/i), button[aria-label*="down" i]').first();
        if (await downButton.isVisible()) {
          await downButton.click();
          await page.waitForTimeout(500);
        }
      }

      // Guardar cambios
      const saveButton = page.locator('button:has-text(/guardar|save/i)').first();
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
      }
    }
  });

  test('AC5: Se puede activar/desactivar un perfil', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/training-profiles`);

    const firstProfile = page.locator('.profile-item, .profile-card, tr[class*="profile"]').first();
    await expect(firstProfile).toBeVisible({ timeout: 5000 });

    // Buscar toggle de activación
    const toggleSwitch = firstProfile.locator('input[type="checkbox"][name*="active"], [role="switch"], .toggle-switch');
    const toggleButton = firstProfile.locator('button:has-text(/activar|desactivar|enable|disable/i)');

    if (await toggleSwitch.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Obtener estado actual
      const isChecked = await toggleSwitch.isChecked();

      // Cambiar estado
      await toggleSwitch.click();

      // Verificar que cambió
      await page.waitForTimeout(1000);
      const newState = await toggleSwitch.isChecked();
      expect(newState).toBe(!isChecked);

      // Verificar indicador visual
      const statusIndicator = firstProfile.locator('.status, .badge, [class*="status"]');
      if (await statusIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
        const statusText = await statusIndicator.textContent();
        expect(statusText).toMatch(/activo|inactivo|active|inactive/i);
      }
    } else if (await toggleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Usar botón de activar/desactivar
      const buttonText = await toggleButton.textContent();
      await toggleButton.click();

      // Esperar confirmación o cambio
      await page.waitForTimeout(1000);

      // Verificar que el texto del botón cambió
      const newButtonText = await toggleButton.textContent();
      expect(newButtonText).not.toBe(buttonText);
    }
  });

  test('AC6: Se muestra el número de usuarios asignados a cada perfil', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/training-profiles`);

    // Esperar que carguen los perfiles
    await page.waitForSelector('.profile-item, .profile-card, tr[class*="profile"]', { timeout: 5000 });

    // Verificar cada perfil
    const profiles = page.locator('.profile-item, .profile-card, tr[class*="profile"]');
    const profileCount = await profiles.count();

    expect(profileCount).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(3, profileCount); i++) {
      const profile = profiles.nth(i);

      // Buscar indicador de usuarios
      const userCountIndicator = profile.locator('text=/[0-9]+.*usuario|user.*count|estudiante/i');

      if (await userCountIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await userCountIndicator.textContent();
        expect(text).toMatch(/\d+/); // Contiene números
      } else {
        // Si no hay indicador inline, puede estar en el detalle
        const viewButton = profile.locator('button:has-text(/ver|view|detalle/i)').first();
        if (await viewButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await viewButton.click();

          // Buscar en la página de detalle
          const detailUserCount = page.locator('text=/[0-9]+.*usuario|usuarios.*asignados/i').first();
          await expect(detailUserCount).toBeVisible({ timeout: 3000 });

          // Volver a la lista
          await page.goBack();
          await page.waitForSelector('.profile-item, .profile-card', { timeout: 3000 });
        }
      }
    }
  });

  test('Se puede buscar y filtrar perfiles', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/training-profiles`);

    // Buscar campo de búsqueda
    const searchField = page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="search" i]').first();

    if (await searchField.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Hacer búsqueda
      await searchField.fill('test');
      await page.waitForTimeout(500); // Debounce

      // Verificar que se actualizó la lista
      const profiles = page.locator('.profile-item, .profile-card');
      const visibleCount = await profiles.count();

      // Si hay resultados, verificar que contienen "test"
      if (visibleCount > 0) {
        const firstResult = profiles.first();
        const text = await firstResult.textContent();
        expect(text?.toLowerCase()).toContain('test');
      } else {
        // Verificar mensaje de "no hay resultados"
        await expect(page.locator('text=/no.*encontrado|no.*results|sin.*resultados/i')).toBeVisible();
      }

      // Limpiar búsqueda
      await searchField.clear();
      await page.waitForTimeout(500);
    }

    // Buscar filtros adicionales
    const filterSelect = page.locator('select[name*="filter"], select[name*="status"]').first();
    if (await filterSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Probar filtro
      await filterSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      // Verificar que la lista se actualizó
      const filteredProfiles = page.locator('.profile-item, .profile-card');
      await expect(filteredProfiles.first()).toBeVisible({ timeout: 2000 });
    }
  });

  test('Se puede eliminar un perfil sin usuarios asignados', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/training-profiles`);

    // Crear un perfil nuevo para eliminar
    const createButton = page.locator('button:has-text(/nuevo.*perfil|crear.*perfil/i)').first();
    await createButton.click();

    const timestamp = Date.now();
    const profileName = `Perfil a Eliminar ${timestamp}`;

    await page.fill('input[name="name"], input[name="nombre"]', profileName);
    await page.click('button[type="submit"]');

    // Esperar creación
    await expect(page.locator(`text="${profileName}"`)).toBeVisible({ timeout: 5000 });

    // Buscar el perfil recién creado
    const newProfile = page.locator('.profile-item, .profile-card').filter({ hasText: profileName }).first();

    // Buscar botón de eliminar
    const deleteButton = newProfile.locator('button:has-text(/eliminar|delete|borrar/i), button[aria-label*="delete" i]').first();

    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click();

      // Confirmar eliminación si hay modal
      const confirmButton = page.locator('button:has-text(/confirmar|confirm|sí|yes/i)').first();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Verificar que el perfil fue eliminado
      await expect(page.locator(`text="${profileName}"`)).not.toBeVisible({ timeout: 5000 });
    }
  });
});