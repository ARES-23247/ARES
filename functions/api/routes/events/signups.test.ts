import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import signupsRouter from "./signups";

vi.mock("../../middleware", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../middleware")>();
  return {
    ...actual,
    ensureAuth: async (_c: unknown, next: () => Promise<void>) => next(),
    ensureAdmin: async (_c: unknown, next: () => Promise<void>) => next(),
    turnstileMiddleware: () => async (_c: unknown, next: () => Promise<void>) => next(),
    getSessionUser: vi.fn(),
  };
});

import { getSessionUser } from "../../middleware";

describe("Hono Backend - /events/:id/signups Router", () => {
  let mockDb: any;
  let testApp: Hono<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      insertInto: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onConflict: vi.fn().mockReturnThis(),
      columns: vi.fn().mockReturnThis(),
      doUpdateSet: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
    };

    testApp = new Hono<any>();
    testApp.use("*", async (c: any, next: any) => {
      c.set("db", mockDb);
      await next();
    });
    testApp.route("/", signupsRouter);
  });

  describe("GET /:id/signups", () => {
    it("returns signups and dietary summary for verified user", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "student" } as any);
      
      mockDb.execute
        .mockResolvedValueOnce([{ user_id: "user2", nickname: "Bob", dietary_restrictions: '["Vegetarian"]' }]) // signups
        .mockResolvedValueOnce([{ dietary_restrictions: '["Vegetarian"]' }]) // event dietary
        .mockResolvedValueOnce([{ dietary_restrictions: '["Vegetarian", "Vegan"]' }]); // team dietary

      const res = await testApp.request("/evt1/signups");
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.signups).toHaveLength(1);
      expect(body.signups[0].nickname).toBe("Bob");
      expect(body.dietary_summary["Vegetarian"]).toBe(1);
      expect(body.team_dietary_summary["Vegan"]).toBe(1);
    });

    it("returns empty signups for unverified user", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "unverified" } as any);
      const res = await testApp.request("/evt1/signups");
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.signups).toEqual([]);
      expect(body.dietary_summary).toBeNull();
    });

    it("handles DB error", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "student" } as any);
      mockDb.execute.mockRejectedValueOnce(new Error("DB Error"));
      const res = await testApp.request("/evt1/signups");
      expect(res.status).toBe(500);
    });
  });

  describe("POST /:id/signups", () => {
    it("saves signup", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "student" } as any);
      const res = await testApp.request("/evt1/signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bringing: "Snacks", prep_hours: 2 })
      });
      expect(res.status).toBe(200);
      expect(mockDb.insertInto).toHaveBeenCalledWith("event_signups");
      expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user1", bringing: "Snacks" }));
    });

    it("returns 403 for unverified user", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "unverified" } as any);
      const res = await testApp.request("/evt1/signups", { method: "POST" });
      expect(res.status).toBe(403);
    });

    it("returns 500 on DB error", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "student" } as any);
      mockDb.execute.mockRejectedValueOnce(new Error("DB error"));
      const res = await testApp.request("/evt1/signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      expect(res.status).toBe(500);
    });
  });

  describe("DELETE /:id/signups/me", () => {
    it("deletes user signup", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "student" } as any);
      const res = await testApp.request("/evt1/signups/me", { method: "DELETE" });
      expect(res.status).toBe(200);
      expect(mockDb.deleteFrom).toHaveBeenCalledWith("event_signups");
    });

    it("returns 500 on DB error", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "student" } as any);
      mockDb.execute.mockRejectedValueOnce(new Error("DB Error"));
      const res = await testApp.request("/evt1/signups/me", { method: "DELETE" });
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /:id/signups/me/attendance", () => {
    it("updates own attendance", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "student" } as any);
      const res = await testApp.request("/evt1/signups/me/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attended: true })
      });
      expect(res.status).toBe(200);
      expect(mockDb.insertInto).toHaveBeenCalledWith("event_signups");
    });

    it("returns 401 for unverified", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "unverified" } as any);
      const res = await testApp.request("/evt1/signups/me/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attended: true })
      });
      expect(res.status).toBe(401);
    });
    
    it("returns 500 on DB error", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "student" } as any);
      mockDb.execute.mockRejectedValueOnce(new Error("DB Error"));
      const res = await testApp.request("/evt1/signups/me/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attended: true })
      });
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /:id/signups/:userId/attendance", () => {
    it("updates user attendance as admin", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "admin", role: "admin" } as any);
      const res = await testApp.request("/evt1/signups/user2/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attended: false })
      });
      expect(res.status).toBe(200);
      expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user2", attended: 0 }));
    });

    it("returns 500 on DB error", async () => {
      vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "admin", role: "admin" } as any);
      mockDb.execute.mockRejectedValueOnce(new Error("DB Error"));
      const res = await testApp.request("/evt1/signups/user2/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attended: true })
      });
      expect(res.status).toBe(500);
    });
  });
});
