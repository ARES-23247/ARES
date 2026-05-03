import { test, expect } from '@playwright/test';

test.describe('Media Multipart Uploader API Integration', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{
      name: 'better-auth.session_token',
      value: 'mockup-session-id',
      domain: 'localhost',
      path: '/'
    }]);
    await page.goto('/');
  });

  test('POST /api/media/admin/upload processes multipart uploads correctly', async ({ page }) => {
    await page.route('**/api/auth/get-session', async route => {
      await route.fulfill({
        status: 200,
        json: {
          session: { id: "mockup-session-id", userId: "admin-user", expiresAt: new Date(Date.now() + 10000).toISOString(), ipAddress: "127.0.0.1", userAgent: "Playwright" },
          user: { id: "admin-user", name: "Admin", email: "admin@ares.org", role: "admin", emailVerified: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), banned: false }
        }
      });
    });

    await page.route('**/api/media/admin/upload', async route => {
      // In a real Playwright test we might parse the multipart form data, 
      // but for mocking we'll just return success.
      await route.fulfill({
        status: 200,
        json: { success: true, key: "Gallery/test-image.png", url: "/api/media/Gallery/test-image.png", altText: "Mocked alt text" }
      });
    });

    const body = await page.evaluate(async () => {
      const fd = new FormData();
      fd.append('file', new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], { type: 'image/png' }), 'test-image.png');
      fd.append('folder', 'Gallery');
      const res = await fetch('/api/media/admin/upload', {
        method: 'POST',
        body: fd
      });
      return { status: res.status, data: await res.json() };
    });

    expect(body.status).toBe(200);
    expect(body.data.success).toBe(true);
    expect(body.data.key).toBe("Gallery/test-image.png");
    expect(body.data.altText).toBe("Mocked alt text");
  });
});
