import { test, expect } from '@playwright/test';

/**
 * E2E tests for PartyKit real-time collaboration across all editor surfaces.
 * Tests verify:
 * - INT-01: All four editors (Blog, Docs, Events, Tasks) display 'Live' badge when PartyKit connects
 * - INT-02: Multi-user concurrent editing syncs changes between browser contexts in real-time
 * - INT-03: Document changes persist across page reloads via PartyKit's built-in persistence
 */

test.describe('Collaboration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication session exactly like kanban.spec.ts
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

    await page.route('**/profile/me', async route => {
      await route.fulfill({
        status: 200,
        json: {
          user_id: "admin-user",
          nickname: "Admin User",
          first_name: "Admin",
          last_name: "User",
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

    await page.context().addCookies([{
      name: 'better-auth.session_token',
      value: 'mockup-session-id',
      domain: 'localhost',
      path: '/'
    }]);

    await page.addInitScript(() => {
      Object.assign(window, { __PLAYWRIGHT_TEST__: true });
    });

    // Mock Posts API to return sample content
    // BlogEditor calls: /api/posts/admin/:slug
    await page.route('**/api/posts/admin/**', async route => {
      await route.fulfill({
        status: 200,
        json: {
          post: {
            slug: 'test-post',
            title: 'Collaboration Test',
            ast: '{"type":"doc","content":[{"type":"paragraph"}]}',
            thumbnail: '',
            published_at: '',
            season_id: null,
          }
        }
      });
    });

    // Mock Docs API to return sample content
    // DocsEditor calls: /api/docs/admin/:slug/detail
    await page.route('**/api/docs/admin/**/detail', async route => {
      await route.fulfill({
        status: 200,
        json: {
          doc: {
            id: 'test-doc',
            title: 'Test Doc',
            ast: '{"type":"doc","content":[{"type":"paragraph"}]}',
          }
        }
      });
    });

    // Mock Events API to return sample content
    // EventEditor calls: /api/events/admin/:id
    await page.route('**/api/events/admin/**', async route => {
      await route.fulfill({
        status: 200,
        json: {
          event: {
            id: 'test-event-id',
            title: 'Test Event',
            description: '{"type":"doc","content":[{"type":"paragraph"}]}',
          }
        }
      });
    });

    // Mock Tasks API to return sample content
    await page.route('**/api/tasks*', async route => {
      await route.fulfill({
        status: 200,
        json: {
          tasks: [{
            id: 'test-task-id',
            title: 'Test Task',
            description: '{"type":"doc","content":[{"type":"paragraph"}]}',
          }]
        }
      });
    });
  });

  test('INT-01: All editors display Live badge when connected', async ({ page }) => {
    // Test BlogEditor - route is /dashboard/blog/:slug
    await page.goto('/dashboard/blog/test-post');
    await expect(page.locator('.bg-emerald-500\\/10').filter({ hasText: 'Live' })).toBeVisible({ timeout: 15000 });

    // Test DocsEditor - route is /dashboard/docs/:slug
    await page.goto('/dashboard/docs/test-doc');
    await expect(page.locator('.bg-emerald-500\\/10').filter({ hasText: 'Live' })).toBeVisible({ timeout: 15000 });

    // Test EventEditor - route is /dashboard/event/:id
    await page.goto('/dashboard/event/test-event-id');
    await expect(page.locator('.bg-emerald-500\\/10').filter({ hasText: 'Live' })).toBeVisible({ timeout: 15000 });

    // Test TaskDetailsModal - navigate to tasks, click on test task to open modal
    await page.goto('/dashboard/tasks');
    // Click on the test task to open modal
    await page.getByText('Test Task').first().click();
    // Wait for modal and verify Live badge
    await expect(page.locator('.bg-emerald-500\\/10').filter({ hasText: 'Live' })).toBeVisible({ timeout: 15000 });
  });

  test('INT-02: Multi-user concurrent editing syncs correctly', async ({ browser }) => {
    // Create two separate browser contexts (simulating two users)
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();

    const user1Page = await user1Context.newPage();
    const user2Page = await user2Context.newPage();

    // Setup auth for both contexts
    for (const context of [user1Context, user2Context]) {
      await context.addCookies([{
        name: 'better-auth.session_token',
        value: 'mockup-session-id',
        domain: 'localhost',
        path: '/'
      }]);
      await context.addInitScript(() => {
        Object.assign(window, { __PLAYWRIGHT_TEST__: true });
      });
    }

    // Mock Posts API for user1
    await user1Page.route('**/api/auth/get-session', async route => {
      await route.fulfill({
        status: 200,
        json: {
          session: {
            id: "mockup-session-id",
            userId: "admin-user",
            expiresAt: new Date(Date.now() + 10000000).toISOString(),
          },
          user: {
            id: "admin-user",
            name: "Admin User",
            email: "admin@ares.org",
            role: "admin"
          }
        }
      });
    });

    await user1Page.route('**/profile/me', async route => {
      await route.fulfill({
        status: 200,
        json: {
          user_id: "admin-user",
          nickname: "Admin User",
          first_name: "Admin",
          last_name: "User",
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

    await user1Page.route('**/api/posts/admin/**', async route => {
      await route.fulfill({
        status: 200,
        json: {
          post: {
            slug: 'test-post',
            title: 'Collaboration Test',
            ast: '{"type":"doc","content":[{"type":"paragraph"}]}',
            thumbnail: '',
            published_at: '',
            season_id: null,
          }
        }
      });
    });

    // Same routes for user2
    await user2Page.route('**/api/auth/get-session', async route => {
      await route.fulfill({
        status: 200,
        json: {
          session: {
            id: "mockup-session-id",
            userId: "admin-user",
            expiresAt: new Date(Date.now() + 10000000).toISOString(),
          },
          user: {
            id: "admin-user",
            name: "Admin User",
            email: "admin@ares.org",
            role: "admin"
          }
        }
      });
    });

    await user2Page.route('**/profile/me', async route => {
      await route.fulfill({
        status: 200,
        json: {
          user_id: "admin-user",
          nickname: "Admin User",
          first_name: "Admin",
          last_name: "User",
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

    await user2Page.route('**/api/posts/admin/**', async route => {
      await route.fulfill({
        status: 200,
        json: {
          post: {
            slug: 'test-post',
            title: 'Collaboration Test',
            ast: '{"type":"doc","content":[{"type":"paragraph"}]}',
            thumbnail: '',
            published_at: '',
            season_id: null,
          }
        }
      });
    });

    // Both users navigate to the same blog post editor
    await user1Page.goto('/dashboard/blog/test-post');
    await user2Page.goto('/dashboard/blog/test-post');

    // Wait for Live badges on both
    await expect(user1Page.locator('.bg-emerald-500\\/10').filter({ hasText: 'Live' })).toBeVisible();
    await expect(user2Page.locator('.bg-emerald-500\\/10').filter({ hasText: 'Live' })).toBeVisible();

    // User 1 types text
    const user1Editor = user1Page.locator('.ProseMirror');
    await user1Editor.click();
    await user1Editor.type('User 1 was here');

    // Verify User 2 sees the text (within reasonable timeout for sync)
    await expect(user2Page.locator('.ProseMirror')).toContainText('User 1 was here', { timeout: 5000 });

    // User 2 types additional text
    const user2Editor = user2Page.locator('.ProseMirror');
    await user2Editor.type(' - User 2 too');

    // Verify User 1 sees both texts
    await expect(user1Page.locator('.ProseMirror')).toContainText('User 1 was here - User 2 too', { timeout: 5000 });

    // Cleanup
    await user1Context.close();
    await user2Context.close();
  });

  test('INT-03: Document changes persist across page reloads', async ({ page }) => {
    // Mock Docs API for persistence test
    await page.route('**/api/docs/admin/persistence-test/detail', async route => {
      await route.fulfill({
        status: 200,
        json: {
          doc: {
            id: 'persistence-test',
            title: 'Persistence Test',
            ast: '{"type":"doc","content":[{"type":"paragraph"}]}',
          }
        }
      });
    });

    // Navigate to a doc editor - route is /dashboard/docs/:slug
    await page.goto('/dashboard/docs/persistence-test');

    // Wait for Live badge
    await expect(page.locator('.bg-emerald-500\\/10').filter({ hasText: 'Live' })).toBeVisible({ timeout: 15000 });

    // Type content
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.type('Persistent content that survives reload');

    // Verify text is present
    await expect(editor).toContainText('Persistent content');

    // Reload the page
    await page.reload();

    // Wait for Live badge again
    await expect(page.locator('.bg-emerald-500\\/10').filter({ hasText: 'Live' })).toBeVisible({ timeout: 15000 });

    // Verify content persisted
    await expect(editor).toContainText('Persistent content that survives reload', { timeout: 5000 });
  });
});
