import { Page } from '@playwright/test';
import { SELECTORS } from '../selectors';

export class LabExecutorPage {
  constructor(private page: Page) {}

  getExecutor() {
    return this.page.locator(SELECTORS.lab.executor);
  }

  async typeCode(code: string) {
    // Monaco editor uses contenteditable, NOT standard textarea
    // Use keyboard API instead of .fill()
    const editor = this.page.locator(SELECTORS.lab.monacoEditor);
    await editor.waitFor({ timeout: 10000 });
    await editor.click();
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.type(code);
    await this.page.waitForTimeout(500);
  }

  async runCode() {
    await this.page.locator(SELECTORS.lab.runButton).click();
    // Wait for result (can take up to 30s with Docker)
    await this.page.locator(SELECTORS.lab.terminalOutput).waitFor({ timeout: 35000 });
  }

  getOutput() {
    return this.page.locator(SELECTORS.lab.terminalOutput);
  }

  getStatus() {
    return this.page.locator(SELECTORS.lab.labStatus);
  }

  async submitLab() {
    const submitBtn = this.page.locator(SELECTORS.lab.submitLabButton);
    if (await submitBtn.isVisible({ timeout: 2000 })) {
      await submitBtn.click();
    }
  }

  async selectLanguage(language: string) {
    const langSelect = this.page.locator(SELECTORS.lab.languageSelector);
    if (await langSelect.isVisible({ timeout: 2000 })) {
      await langSelect.selectOption(language);
    }
  }
}
