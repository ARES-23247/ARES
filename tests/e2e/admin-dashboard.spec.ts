import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Admin Dashboard', () => {
  // Mock the authentication session for the entire suite
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/get-session', async route => {
      await route.fulfill({
        status: 200,
        json: {
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
        }
      });
    });

    await page.route('**/api/profile/me', async route => {
      await route.fulfill({
        status: 200,
        json: {
          user_id: "admin-user",
          nickname: "Admin User",
          member_type: "mentor",
          auth: {
            id: "admin-user",
            email: "admin@ares.org",
            name: "Admin User",
            image: "https://api.dicebear.com/9.x/bottts/svg?seed=admin",
            role: "admin"
          }
        }
      });
    });

    // Add a fake cookie to ensure better-auth doesn't short circuit
    await page.context().addCookies([{
      name: 'better-auth.session_token',
      value: 'mockup-session-id',
      domain: 'localhost',
      path: '/'
    }]);
  });

  test('Admin dashboard loads and displays authorized management hubs', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Ensure dashboard title is visible
    await expect(page.getByRole('heading', { name: /ARES/i }).first()).toBeVisible();
    
    // Verify user profile section rendered the mocked user
    await page.screenshot({ path: 'admin-dashboard.png', fullPage: true });
    await expect(page.getByText('Admin User', { exact: true }).first()).toBeVisible();
    
    // Verify admin hubs are accessible
    await expect(page.getByText(/User Roles/i)).toBeVisible();
    await expect(page.getByText(/System Integrations/i)).toBeVisible();

    // ── Accessibility Audit ───────────────────────────────────────────
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
