import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
    {
      command: 'node apps/api/dist/index.js',
      url: 'http://127.0.0.1:4000/health',
      reuseExistingServer: true,
      timeout: 60000
    },
    {
      command: 'npx vite --host 127.0.0.1 --port 5173 apps/web',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: true,
      timeout: 60000
    }
  ]
});
