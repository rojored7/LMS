/**
 * Auth Setup for Playwright
 * Logs in once per role and saves cookies/storage state.
 * All tests can reuse these states to avoid hitting login rate limits.
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export const AUTH_FILES = {
  admin: path.join(__dirname, '.auth/admin.json'),
  instructor: path.join(__dirname, '.auth/instructor.json'),
  student: path.join(__dirname, '.auth/student.json'),
};

async function loginAndSave(page: any, email: string, password: string, authFile: string, redirectPattern: RegExp) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('load');
  // Wait for login form to be interactive
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(redirectPattern, { timeout: 30000 });
  await page.context().storageState({ path: authFile });
}

setup('authenticate admin', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILES.admin), { recursive: true });
  await loginAndSave(page, 'admin@ciber.com', 'Admin123!', AUTH_FILES.admin, /\/(admin|dashboard)/);
});

setup('authenticate instructor', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILES.instructor), { recursive: true });
  await loginAndSave(page, 'instructor@test.com', 'Test123!', AUTH_FILES.instructor, /\/(instructor|admin|dashboard|courses)/);
});

setup('authenticate student', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILES.student), { recursive: true });
  await loginAndSave(page, 'student@ciber.com', 'Student123!', AUTH_FILES.student, /\/(dashboard|courses)/);
});
