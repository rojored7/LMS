import { Page, expect } from '@playwright/test';
import { SELECTORS } from '../selectors';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export class CourseCatalogPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto(`${BASE_URL}/courses`);
    await this.page.waitForLoadState('load');
  }

  async getCourseCards() {
    return this.page.locator(SELECTORS.courses.card);
  }

  async getFirstCourseCard() {
    return this.page.locator(SELECTORS.courses.card).first();
  }

  async searchCourse(term: string) {
    await this.page.fill(SELECTORS.courses.searchInput, term);
    await this.page.waitForTimeout(500);
  }

  async filterByLevel(level: string) {
    await this.page.selectOption(SELECTORS.courses.levelFilter, level);
    await this.page.waitForTimeout(300);
  }

  async clickCourseCard(index = 0) {
    await this.page.locator(SELECTORS.courses.card).nth(index).click();
    await this.page.waitForLoadState('load');
  }

  async enrollInCourse(index = 0) {
    await this.page
      .locator(SELECTORS.courses.card)
      .nth(index)
      .locator(SELECTORS.courses.enrollButton)
      .click();
  }

  async getCatalogContainer() {
    return this.page.locator(SELECTORS.courses.catalog);
  }

  async getCourseGrid() {
    return this.page.locator(SELECTORS.courses.grid);
  }
}
