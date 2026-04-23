/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import awardsRouter from "./awards";

// Mock ExecutionContext for Hono request testing
const mockExecutionContext = {
  waitUntil: vi.fn((promise) => promise),
  passThroughOnException: vi.fn(),
};

vi.mock("../middleware", () => ({
  ensureAdmin: vi.fn().mockImplementation(async (_c: unknown, next: () => Promise<void>) => await next()),
  getSessionUser: vi.fn().mockResolvedValue({ role: "admin", email: "admin@test.com" }),
  getSocialConfig: vi.fn().mockResolvedValue({}),
  logAuditAction: vi.fn().mockResolvedValue(true),
  parsePagination: vi.fn().mockReturnValue({ limit: 50, offset: 0 }),
  MAX_INPUT_LENGTHS: { name: 200, generic: 5000 }
}));

describe("Hono Backend - /awards Router", () => {
  let env: Record<string, unknown>;
  let lastSql = "";

  beforeEach(() => {
    vi.clearAllMocks();
    lastSql = "";
    
    // Create a chainable mock for DB.prepare
    const dbMock: any = {
      prepare: vi.fn().mockImplementation((sql: string) => {
        lastSql = sql;
        return dbMock;
      }),
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockImplementation(async () => {
        if (lastSql.includes("PRAGMA table_info")) {
          return { results: [{ name: 'id' }, { name: 'title' }, { name: 'year' }, { name: 'season_id' }] };
        }
        return { results: [] };
      }),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({ success: true }),
    };
    
    env = { DB: dbMock, ENVIRONMENT: "test", DEV_BYPASS: "true" };
  });

  it("GET / should list all awards", async () => {
    const mockAwards = [{ id: "a1", title: "Award" }];
    const db = env.DB as any;
    db.all.mockImplementation(async () => {
      if (lastSql.includes("PRAGMA")) {
        return { results: [{ name: 'id' }, { name: 'season_id' }] };
      }
      return { results: mockAwards };
    });

    const req = new Request("http://localhost/");
    const res = await awardsRouter.request(req, {}, env as any, mockExecutionContext as any);
    expect(res.status).toBe(200);
    const data = await res.json() as { awards: any[] };
    expect(data.awards).toHaveLength(1);
  });

  it("POST / should create new award", async () => {
    const payload = { title: "New Award", year: 2024 };
    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const res = await awardsRouter.request(req, {}, env as any, mockExecutionContext as any);
    expect(res.status).toBe(200);
  });

  it("POST / should update existing award", async () => {
    const db = env.DB as any;
    db.first.mockResolvedValue({ id: "a1" }); // Mock that it exists

    const payload = { id: "a1", title: "Updated Award", year: "2024" };
    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const res = await awardsRouter.request(req, {}, env as any, mockExecutionContext as any);
    expect(res.status).toBe(200);
  });

  it("DELETE /:id should soft-delete an award", async () => {
    const req = new Request("http://localhost/a1", { method: "DELETE" });
    const res = await awardsRouter.request(req, {}, env as any, mockExecutionContext as any);
    expect(res.status).toBe(200);
  });
});
