import { Page } from '@playwright/test';
import { SELECTORS } from '../selectors';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export class CourseLearningPage {
  constructor(private page: Page) {}

  async navigate(slug: string) {
    await this.page.goto(`${BASE_URL}/courses/${slug}/learn`);
    await this.page.waitForLoadState('load');
  }

  getSidebar() {
    return this.page.locator(SELECTORS.learning.sidebar);
  }

  getModuleItem(moduleId: string) {
    return this.page.locator(SELECTORS.learning.moduleItem(moduleId));
  }

  getLessonItem(lessonId: string) {
    return this.page.locator(SELECTORS.learning.lessonItem(lessonId));
  }

  getQuizItem(quizId: string) {
    return this.page.locator(SELECTORS.learning.quizItem(quizId));
  }

  getLabItem(labId: string) {
    return this.page.locator(SELECTORS.learning.labItem(labId));
  }

  async clickNextLesson() {
    await this.page.locator(SELECTORS.learning.nextLessonButton).click();
    await this.page.waitForLoadState('load');
  }

  async clickPrevLesson() {
    await this.page.locator(SELECTORS.learning.prevLessonButton).click();
    await this.page.waitForLoadState('load');
  }

  async markComplete() {
    const btn = this.page.locator(SELECTORS.learning.markCompleteButton);
    if (await btn.isVisible({ timeout: 2000 })) {
      await btn.click();
    }
  }

  getLessonContent() {
    return this.page.locator(SELECTORS.learning.lessonContent);
  }

  getProgressBar() {
    return this.page.locator(SELECTORS.learning.progressBar);
  }
}
