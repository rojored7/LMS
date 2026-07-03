import { Page } from '@playwright/test';
import { SELECTORS } from '../selectors';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export class AdminDashboardPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto(`${BASE_URL}/admin`);
    await this.page.waitForLoadState('load');
  }

  getTotalUsers() {
    return this.page.locator(SELECTORS.admin.totalUsers);
  }

  getTotalCourses() {
    return this.page.locator(SELECTORS.admin.totalCourses);
  }

  getActiveEnrollments() {
    return this.page.locator(SELECTORS.admin.activeEnrollments);
  }

  getCompletionRate() {
    return this.page.locator(SELECTORS.admin.completionRate);
  }
}
