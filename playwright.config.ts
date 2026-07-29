import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: process.env['BASE_URL'] ?? 'http://localhost:4200',
    trace: 'on-first-retry',
  },

  projects: [
    // Regular tests — run across all browsers
    {
      name: 'chromium',
      testDir: './tests',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testDir: './tests',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testDir: './tests',
      use: { ...devices['Desktop Safari'] },
    },

    // Doc screenshot tests — Chromium only, output goes to docs/
    {
      name: 'doc-tests',
      testDir: './doc-tests',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
