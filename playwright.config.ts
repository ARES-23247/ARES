import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: process.env.CI ? 30_000 : 60_000,
  use: {
    baseURL: process.env.CI ? 'http://localhost:8788' : 'http://localhost:5173',
    trace: 'on-first-retry',
    navigationTimeout: 15_000,
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.CI 
    ? {
        command: 'cross-env CLOUDFLARE_API_TOKEN=dummy npx wrangler pages dev dist --binding DEV_BYPASS=true --binding ENVIRONMENT=test',
        url: 'http://localhost:8788',
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : [
        {
          command: 'npm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: true,
        },
        {
          command: 'npx wrangler pages dev --binding DEV_BYPASS=true --binding ENVIRONMENT=test',
          url: 'http://localhost:8788',
          reuseExistingServer: true,
        }
      ],
});
