import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  testDir: './test',
  testMatch: '*.spec.mjs',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 3,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:48164', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    { command: 'node scripts/serve.mjs --port 48164', url: 'http://127.0.0.1:48164', reuseExistingServer: false },
    { command: 'node scripts/serve.mjs --site --port 48165', url: 'http://127.0.0.1:48165/htmlplus/', reuseExistingServer: false },
  ],
});
