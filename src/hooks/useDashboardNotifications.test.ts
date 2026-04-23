/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "../test/utils";
import { useDashboardNotifications } from "./useDashboardNotifications";
import { server } from "../test/mocks/server";
import { http, HttpResponse } from "msw";

describe("useDashboardNotifications Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch pending counts on mount when authorized", async () => {
    const mockSession: any = { 
      authenticated: true,
      user: { role: "admin", member_type: "mentor" }
    };
    const mockPermissions: any = { 
      isAuthorized: true, 
      canSeeInquiries: true 
    };

    // Setup MSW handlers for the various list endpoints
    server.use(
      http.get("*/api/inquiries", () => {
        return HttpResponse.json({ inquiries: [{ status: "pending" }, { status: "resolved" }] });
      }),
      http.get("*/api/admin/posts/list", () => {
        return HttpResponse.json({ posts: [{ status: "pending" }] });
      }),
      http.get("*/api/admin/events", () => {
        return HttpResponse.json({ events: [] });
      }),
      http.get("*/api/admin/docs", () => {
        return HttpResponse.json({ docs: [] });
      })
    );

    const { result } = renderWithProviders(() => useDashboardNotifications(mockSession, mockPermissions));
    
    // We need to wait for the state updates. 
    // Since this hook doesn't use React Query, but raw fetch + useEffect/useState, 
    // we use Vitest's waitFor or just a small delay if needed, but renderWithProviders uses Testing Library's renderHook.
    
    await vi.waitFor(() => {
      expect(result.current.pendingInquiriesCount).toBe(1);
      expect(result.current.pendingPostsCount).toBe(1);
    });
  });

  it("should allow manager to see inquiries", async () => {
    const mockSession: any = { 
      authenticated: true,
      user: { role: "manager", member_type: "mentor" }
    };
    const mockPermissions: any = { 
      isAuthorized: true, 
      canSeeInquiries: true 
    };

    server.use(
      http.get("*/api/inquiries", () => {
        return HttpResponse.json({ inquiries: [{ status: "pending" }] });
      })
    );

    const { result } = renderWithProviders(() => useDashboardNotifications(mockSession, mockPermissions));
    
    await vi.waitFor(() => {
      expect(result.current.pendingInquiriesCount).toBe(1);
    });
  });

  it("should not fetch when not authorized", async () => {
    const mockSession: any = { 
      authenticated: true,
      user: { role: "unverified", member_type: "student" }
    };
    const mockPermissions: any = { 
      isAuthorized: false, 
      canSeeInquiries: false 
    };

    const { result } = renderWithProviders(() => useDashboardNotifications(mockSession, mockPermissions));
    
    // Values should remain at 0
    expect(result.current.pendingInquiriesCount).toBe(0);
    expect(result.current.pendingPostsCount).toBe(0);
  });

  it("should handle null results from endpoints", async () => {
    const mockSession: any = { 
      authenticated: true,
      user: { role: "admin" }
    };
    const mockPermissions: any = { isAuthorized: true, canSeeInquiries: true };

    server.use(
      http.get("*/api/admin/docs/list", () => {
        return HttpResponse.json({ docs: null });
      })
    );

    const { result } = renderWithProviders(() => useDashboardNotifications(mockSession, mockPermissions));
    
    await vi.waitFor(() => {
      expect(result.current.pendingDocsCount).toBe(0);
    });
  });

  it("should cover arrow functions in filters", async () => {
    const mockSession: any = { authenticated: true, user: { role: "admin" } };
    const mockPermissions: any = { isAuthorized: true, canSeeInquiries: true };

    server.use(
      http.get("*/api/inquiries", () => HttpResponse.json({ inquiries: [{ status: "pending" }] })),
      http.get("*/api/admin/posts/list", () => HttpResponse.json({ posts: [{ status: "pending", is_deleted: 0 }] })),
      http.get("*/api/admin/events", () => HttpResponse.json({ events: [{ status: "pending", is_deleted: 0 }] })),
      http.get("*/api/admin/docs/list", () => HttpResponse.json({ docs: [{ status: "pending", is_deleted: 0 }] }))
    );

    const { result } = renderWithProviders(() => useDashboardNotifications(mockSession, mockPermissions));
    
    await vi.waitFor(() => {
      expect(result.current.pendingInquiriesCount).toBe(1);
      expect(result.current.pendingPostsCount).toBe(1);
      expect(result.current.pendingEventsCount).toBe(1);
      expect(result.current.pendingDocsCount).toBe(1);
    });
  });

  it("should handle null results from all endpoints", async () => {
    const mockSession: any = { authenticated: true, user: { role: "admin" } };
    const mockPermissions: any = { isAuthorized: true, canSeeInquiries: true };

    server.use(
      http.get("*/api/inquiries", () => HttpResponse.json({ inquiries: null })),
      http.get("*/api/admin/posts/list", () => HttpResponse.json({ posts: null })),
      http.get("*/api/admin/events", () => HttpResponse.json({ events: null })),
      http.get("*/api/admin/docs/list", () => HttpResponse.json({ docs: null }))
    );

    const { result } = renderWithProviders(() => useDashboardNotifications(mockSession, mockPermissions));
    
    await vi.waitFor(() => {
      expect(result.current.pendingInquiriesCount).toBe(0);
      expect(result.current.pendingPostsCount).toBe(0);
      expect(result.current.pendingEventsCount).toBe(0);
      expect(result.current.pendingDocsCount).toBe(0);
    });
  });
});
