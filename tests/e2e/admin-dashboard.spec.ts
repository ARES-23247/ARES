import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  // Mock the authentication session for the entire suite
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/get-session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            id: "mockup-session-id",
            userId: "admin-user",
            expiresAt: new Date(Date.now() + 10000000).toISOString(),
            ipAddress: "127.0.0.1",
            userAgent: "Playwright"
          },
          user: {
            id: "admin-user",
            name: "Admin User",
            email: "admin@ares.org",
            emailVerified: true,
            image: "https://api.dicebear.com/9.x/bottts/svg?seed=admin",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            role: "admin",
            banned: false
          }
        })
      });
    });

    await page.route('**/api/profile/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: "admin",
          memberType: "executive",
          permissions: ["manage_content", "manage_users"]
        })
      });
    });
  });

  test('Admin dashboard loads and displays authorized management hubs', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Ensure dashboard title is visible
    await expect(page.getByRole('heading', { name: /ARES/i }).first()).toBeVisible();
    
    // Verify user profile section rendered the mocked user
    await page.screenshot({ path: 'admin-dashboard.png', fullPage: true });
    console.log(await page.locator('body').innerText());
    await expect(page.getByText('Admin User')).toBeVisible();
    
    // Verify admin hubs are accessible
    await expect(page.getByText(/User Roles/i)).toBeVisible();
    await expect(page.getByText(/System Integrations/i)).toBeVisible();
  });
});
