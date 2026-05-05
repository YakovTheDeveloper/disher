import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const BACKEND_PORT = 3101;
const BACKEND_HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/health`;
const CONFIG_DIR = fileURLToPath(new URL('.', import.meta.url));
const BACKEND_DIR = path.resolve(CONFIG_DIR, '..', 'disher-backend-3.0');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  expect: {
    timeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  // Two servers: Vite (frontend) at 4173 + standalone backend at 3101 (HTTP,
  // REQUIRE_EMAIL_VERIFICATION=true). Backend is a separate port from the dev
  // backend (3100) so the user's `pnpm run dev:backend` can stay running
  // alongside `pnpm run test:e2e` without conflict.
  webServer: [
    {
      command: 'pnpm run dev:e2e',
      cwd: CONFIG_DIR,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'pnpm run dev:e2e',
      cwd: BACKEND_DIR,
      url: BACKEND_HEALTH_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
