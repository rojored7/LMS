import { Page } from '@playwright/test';
import { SELECTORS } from '../selectors';

export class QuizTakerPage {
  constructor(private page: Page) {}

  getContainer() {
    return this.page.locator(SELECTORS.quiz.container);
  }

  async startQuiz() {
    const startBtn = this.page.locator(SELECTORS.quiz.startButton);
    if (await startBtn.isVisible({ timeout: 3000 })) {
      await startBtn.click();
    }
  }

  async answerQuestion(questionIndex: number, optionIndex = 0) {
    const question = this.page.locator(SELECTORS.quiz.question(questionIndex + 1));
    const options = question.locator(SELECTORS.quiz.optionInput);
    await options.nth(optionIndex).click();
  }

  async answerAllQuestions(optionIndex = 0) {
    const options = this.page.locator(SELECTORS.quiz.optionInput);
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      await options.nth(i).click().catch(() => {});
      await this.page.waitForTimeout(200);
    }
  }

  async submitQuiz() {
    await this.page.locator(SELECTORS.quiz.submitButton).click();
    await this.page.waitForTimeout(2000);
  }

  getResults() {
    return this.page.locator(SELECTORS.quiz.resultContainer);
  }

  getScore() {
    return this.page.locator(SELECTORS.quiz.score);
  }

  async retry() {
    await this.page.locator(SELECTORS.quiz.retryButton).click();
  }
}
