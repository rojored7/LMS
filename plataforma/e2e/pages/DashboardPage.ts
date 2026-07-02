import { Page } from '@playwright/test';
import { SELECTORS } from '../selectors';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export class DashboardPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto(`${BASE_URL}/dashboard`);
    await this.page.waitForLoadState('networkidle');
  }

  getRoot() {
    return this.page.locator(SELECTORS.dashboard.root);
  }

  getEnrolledCoursesGrid() {
    return this.page.locator(SELECTORS.dashboard.enrolledCoursesGrid);
  }

  getCourseProgress() {
    return this.page.locator(SELECTORS.dashboard.courseProgress).first();
  }
}
