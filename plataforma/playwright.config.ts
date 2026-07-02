import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.join(__dirname, 'e2e/.auth');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15000,
    navigationTimeout: 45000,
    launchOptions: {
      args: ['--disable-web-security', '--no-sandbox'],
    },
  },

  projects: [
    // Setup project: runs auth setup once before other tests
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Main test project: depends on setup
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
