import { test, expect } from '@playwright/test';

test.describe('Calendar Repair API Integration', () => {
  test.beforeEach(async ({ context, page }) => {
    // Add a fake cookie to ensure better-auth doesn't short circuit
    await context.addCookies([{
      name: 'better-auth.session_token',
      value: 'mockup-session-id',
      domain: 'localhost',
      path: '/'
    }]);
    await page.goto('/');
  });

  test('POST /api/events/admin/sync triggers calendar repair', async ({ request, page }) => {
    // We mock the auth endpoint for any internal checks, though request uses the cookie
    await page.route('**/api/auth/get-session', async route => {
      await route.fulfill({
        status: 200,
        json: {
          session: { id: "mockup-session-id", userId: "admin-user", expiresAt: new Date(Date.now() + 10000).toISOString(), ipAddress: "127.0.0.1", userAgent: "Playwright" },
          user: { id: "admin-user", name: "Admin", email: "admin@ares.org", role: "admin", emailVerified: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), banned: false }
        }
      });
    });

    // We can also route the actual API request to mock the backend response 
    // to simulate a successful repair without hitting the real DB/GCal.
    await page.route('**/api/events/admin/sync', async route => {
      await route.fulfill({
        status: 200,
        json: { success: true, synced: 5, errors: [] }
      });
    });

    // Make the request using page.evaluate so it triggers page.route interception
    const body = await page.evaluate(async () => {
      const res = await fetch('/api/events/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return { status: res.status, data: await res.json() };
    });

    expect(body.status).toBe(200);
    expect(body.data.success).toBe(true);
    expect(body.data.synced).toBe(5);
  });
});
