/**
 * Page Object: Pagina de Login
 *
 * Centraliza todos los selectores del formulario de login.
 * Si el UI cambia (label, placeholder, etc.), se edita aqui
 * y todos los tests que usen este POM se actualizan automaticamente.
 */

import { Page, expect } from '@playwright/test';
import { SELECTORS } from '../selectors';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/login`);
  }

  // Selectores - editar aqui cuando cambie el UI
  get emailInput() { return this.page.locator('[name="email"]'); }
  get passwordInput() { return this.page.locator('[name="password"]'); }
  get submitButton() { return this.page.locator('button[type="submit"]'); }
  get forgotPasswordLink() { return this.page.getByRole('link', { name: /olvid|forgot/i }); }
  get registerLink() { return this.page.getByRole('link', { name: /registr|sign up/i }); }
  get errorMessage() { return this.page.locator('[role="alert"], .text-red-500, .text-red-600').first(); }

  // Acciones
  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async loginAs(email: string, password: string) {
    await this.goto();
    await this.fillCredentials(email, password);
    await this.submit();
  }

  async login(email: string, password: string) {
    await this.page.fill(SELECTORS.auth.emailInput, email);
    await this.page.fill(SELECTORS.auth.passwordInput, password);
    await this.page.click(SELECTORS.auth.submitButton);
  }

  async loginAndWait(email: string, password: string) {
    await this.goto();
    await this.login(email, password);
    await this.page.waitForURL(/\/(admin|dashboard|courses)/, { timeout: 30000 });
  }

  // Verificaciones
  async verifyFormElements() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async verifyError(text?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (text) {
      await expect(this.errorMessage).toContainText(text);
    }
  }
}
