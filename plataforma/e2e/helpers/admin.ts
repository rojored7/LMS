/**
 * Admin Helper Functions for E2E Tests
 * Funciones de ayuda para panel administrativo en tests E2E
 */

import { Page, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

/**
 * Navegar al panel de administración
 */
export async function navigateToAdminPanel(page: Page) {
  await page.goto(`${BASE_URL}/admin`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navegar a la lista de usuarios
 */
export async function navigateToUsersList(page: Page) {
  await navigateToAdminPanel(page);
  await page.click('a:has-text("Usuarios")');
  await page.waitForURL(/.*users/);
}

/**
 * Buscar usuario por email
 */
export async function searchUserByEmail(page: Page, email: string) {
  const searchInput = page.locator('input[placeholder*="Buscar"]').or(
    page.locator('input[name="search"]')
  );

  await searchInput.fill(email);
  await searchInput.press('Enter');
  await page.waitForTimeout(1000);
}

/**
 * Cambiar rol de usuario
 */
export async function changeUserRole(page: Page, email: string, newRole: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT') {
  await searchUserByEmail(page, email);

  // Click en el botón de editar del usuario
  const userRow = page.locator(`tr:has-text("${email}")`);
  await userRow.locator('button:has-text("Editar")').click();

  // Seleccionar nuevo rol
  const roleSelect = page.locator('select[name="role"]');
  await roleSelect.selectOption(newRole);

  // Guardar cambios
  await page.click('button:has-text("Guardar")');

  // Verificar confirmación
  await expect(page.locator('text=/actualizado.*exitosamente/i')).toBeVisible({ timeout: 5000 });
}

/**
 * Asignar training profile a usuario
 */
export async function assignTrainingProfile(page: Page, email: string, profileName: string) {
  await searchUserByEmail(page, email);

  const userRow = page.locator(`tr:has-text("${email}")`);
  await userRow.locator('button:has-text("Asignar perfil")').click();

  // Seleccionar perfil
  const profileSelect = page.locator('select[name="trainingProfile"]');
  await profileSelect.selectOption(profileName);

  await page.click('button:has-text("Asignar")');

  await expect(page.locator('text=/perfil.*asignado/i')).toBeVisible({ timeout: 5000 });
}

/**
 * Ver estadísticas del dashboard
 */
export async function getAdminStatistics(page: Page) {
  await navigateToAdminPanel(page);

  const stats = {
    totalUsers: await page.locator('[data-testid="total-users"]').textContent(),
    totalCourses: await page.locator('[data-testid="total-courses"]').textContent(),
    activeEnrollments: await page.locator('[data-testid="active-enrollments"]').textContent(),
    completionRate: await page.locator('[data-testid="completion-rate"]').textContent(),
  };

  return stats;
}

/**
 * Importar curso desde Markdown
 */
export async function importCourseFromMarkdown(page: Page, filePath: string) {
  await navigateToAdminPanel(page);
  await page.click('a:has-text("Importar curso")');

  // Subir archivo
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);

  // Configurar opciones de importación
  await page.fill('input[name="courseTitle"]', 'Test Course Import');
  await page.selectOption('select[name="difficulty"]', 'BEGINNER');

  // Importar
  await page.click('button:has-text("Importar")');

  // Esperar confirmación
  await expect(page.locator('text=/importado.*exitosamente/i')).toBeVisible({ timeout: 10000 });
}

/**
 * Ver logs de actividad
 */
export async function viewActivityLogs(page: Page, filterType?: string) {
  await navigateToAdminPanel(page);
  await page.click('a:has-text("Logs")');

  if (filterType) {
    const filterSelect = page.locator('select[name="activityType"]');
    await filterSelect.selectOption(filterType);
  }

  await page.waitForTimeout(1000);

  // Obtener logs visibles
  const logs = page.locator('[data-testid^="log-entry-"]');
  const logCount = await logs.count();

  const logEntries = [];
  for (let i = 0; i < Math.min(logCount, 10); i++) {
    const logText = await logs.nth(i).textContent();
    logEntries.push(logText);
  }

  return logEntries;
}

/**
 * Gestionar cursos (activar/desactivar)
 */
export async function manageCourse(page: Page, courseSlug: string, action: 'activate' | 'deactivate') {
  await navigateToAdminPanel(page);
  await page.click('a:has-text("Cursos")');

  const courseRow = page.locator(`tr:has-text("${courseSlug}")`);
  const actionButton = courseRow.locator(`button:has-text("${action === 'activate' ? 'Activar' : 'Desactivar'}")`);

  await actionButton.click();

  // Confirmar acción
  const confirmButton = page.locator('button:has-text("Confirmar")');
  if (await confirmButton.isVisible({ timeout: 2000 })) {
    await confirmButton.click();
  }

  await expect(page.locator(`text=/${action === 'activate' ? 'activado' : 'desactivado'}/i`)).toBeVisible();
}

/**
 * Ver reporte de progreso global
 */
export async function viewGlobalProgressReport(page: Page) {
  await navigateToAdminPanel(page);
  await page.click('a:has-text("Reportes")');
  await page.click('button:has-text("Progreso global")');

  await page.waitForSelector('.recharts-wrapper', { timeout: 5000 });

  // Verificar que los gráficos se cargan
  const charts = page.locator('.recharts-wrapper');
  const chartCount = await charts.count();

  return chartCount > 0;
}

/**
 * Exportar datos de usuarios
 */
export async function exportUsersData(page: Page, format: 'csv' | 'json' = 'csv') {
  await navigateToUsersList(page);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click(`button:has-text("Exportar ${format.toUpperCase()}")`)
  ]);

  return download;
}

/**
 * Crear nuevo training profile
 */
export async function createTrainingProfile(page: Page, profileData: {
  name: string;
  description: string;
  courses: string[];
}) {
  await navigateToAdminPanel(page);
  await page.click('a:has-text("Training Profiles")');
  await page.click('button:has-text("Nuevo perfil")');

  // Llenar formulario
  await page.fill('input[name="name"]', profileData.name);
  await page.fill('textarea[name="description"]', profileData.description);

  // Seleccionar cursos
  for (const course of profileData.courses) {
    await page.check(`input[value="${course}"]`);
  }

  await page.click('button:has-text("Crear perfil")');

  await expect(page.locator('text=/perfil.*creado/i')).toBeVisible({ timeout: 5000 });
}

/**
 * Ver métricas de un curso específico
 */
export async function viewCourseMetrics(page: Page, courseSlug: string) {
  await navigateToAdminPanel(page);
  await page.click('a:has-text("Cursos")');

  const courseRow = page.locator(`tr:has-text("${courseSlug}")`);
  await courseRow.locator('button:has-text("Métricas")').click();

  await page.waitForSelector('[data-testid="course-metrics"]', { timeout: 5000 });

  const metrics = {
    enrolledStudents: await page.locator('[data-testid="enrolled-students"]').textContent(),
    completionRate: await page.locator('[data-testid="completion-rate"]').textContent(),
    averageScore: await page.locator('[data-testid="average-score"]').textContent(),
  };

  return metrics;
}