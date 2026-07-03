import { Page } from '@playwright/test';
import { SELECTORS } from '../selectors';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export class CourseDetailPage {
  constructor(private page: Page) {}

  async navigate(slug: string) {
    await this.page.goto(`${BASE_URL}/courses/${slug}`);
    await this.page.waitForLoadState('load');
  }

  async enroll() {
    const btn = this.page.locator(SELECTORS.courses.enrollButton);
    await btn.waitFor({ timeout: 5000 });
    await btn.click();
  }

  async continueLearning() {
    await this.page.locator(SELECTORS.courses.continueButton).click();
    await this.page.waitForLoadState('load');
  }

  async getModuleCount() {
    const el = this.page.locator(SELECTORS.courses.moduleCount);
    const text = await el.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '0');
  }

  getDetail() {
    return this.page.locator('[data-testid="course-detail"]');
  }
}
