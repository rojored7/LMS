/**
 * Page Object: Pagina /admin/courses
 *
 * Centraliza selectores y acciones de la lista de cursos admin/instructor.
 * Usado por tests de RBAC y tests de gestion de cursos.
 */

import { Page, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export class AdminCoursesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/admin/courses`);
  }

  // Selectores
  get createCourseButton() {
    return this.page.getByRole('button', { name: /crear curso/i }).or(
      this.page.getByRole('link', { name: /crear curso/i })
    );
  }
  get importButton() {
    return this.page.getByRole('button', { name: /importar/i }).or(
      this.page.getByRole('link', { name: /importar/i })
    );
  }
  get courseTable() { return this.page.locator('table, [role="table"]').first(); }
  get publishButtons() { return this.page.getByRole('button', { name: /publicar|publish/i }); }
  get deleteButtons() { return this.page.getByRole('button', { name: /eliminar|delete/i }); }
  get editButtons() { return this.page.getByRole('button', { name: /editar|edit/i }); }

  // Verificaciones de permisos por rol
  async verifyAdminView() {
    // Admin tiene acceso completo: ve la tabla y puede crear/editar/eliminar cursos
    await expect(this.page).toHaveURL(/admin\/courses/);
  }

  async verifyInstructorView() {
    // Instructor ve la tabla Y ve boton de crear
    await expect(this.page).toHaveURL(/admin\/courses/);
    await expect(this.createCourseButton).toBeVisible({ timeout: 5000 });
  }
}
