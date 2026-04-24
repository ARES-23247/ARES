/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import adminSeasonsRouter from "./admin";

const mockExecutionContext = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
} as any;

vi.mock("../../middleware", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../middleware")>();
  return {
    ...actual,
    ensureAdmin: async (c: unknown, next: () => Promise<void>) => next(),
    logAuditAction: vi.fn().mockResolvedValue(undefined),
  };
});

describe("Seasons Admin Router", () => {
  let mockDb: Record<string, any>;
  let env: { DB: any };
  let lastSql = "";

  beforeEach(() => {
    lastSql = "";
    mockDb = {
      prepare: vi.fn().mockImplementation((sql: string) => {
        lastSql = sql;
        return mockDb;
      }),
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockImplementation(async () => {
        if (lastSql.includes("PRAGMA table_info")) {
          return { results: [
            { name: 'start_year' }, { name: 'end_year' }, { name: 'challenge_name' }, 
            { name: 'status' }, { name: 'is_deleted' }, { name: 'album_url' }, { name: 'album_cover' }
          ] };
        }
        return { results: [] };
      }),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({ success: true }),
    };
    env = { DB: mockDb };
    vi.clearAllMocks();
  });

  it("GET / should return all seasons", async () => {
    const mockSeasons = [{ start_year: 2024, end_year: 2025, challenge_name: "INTO THE DEEP", status: "published" }];
    mockDb.all.mockImplementation(async () => {
      if (lastSql.includes("PRAGMA")) return { results: [{ name: 'start_year' }] };
      return { results: mockSeasons };
    });

    const req = new Request("http://localhost/");
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);

    expect(res.status).toBe(200);
    const body = await res.json() as { seasons: Record<string, unknown>[] };
    expect(body.seasons).toHaveLength(1);
  });

  it("GET / should return empty list on DB error", async () => {
    mockDb.all.mockImplementation(async () => {
      if (lastSql.includes("PRAGMA")) return { results: [{ name: 'start_year' }] };
      throw new Error("DB Error");
    });
    const req = new Request("http://localhost/");
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);
    expect(res.status).toBe(200);
    const body = await res.json() as { seasons: Record<string, unknown>[] };
    expect(body.seasons).toHaveLength(0);
  });

  it("POST / should create a new season", async () => {
    const payload = {
      start_year: 2025,
      end_year: 2026,
      challenge_name: "NEW CHALLENGE",
      status: "published",
      album_url: "https://photos.app.goo.gl/test",
      album_cover: "https://r2.ares.org/cover.jpg"
    };
    mockDb.first.mockResolvedValueOnce(null);

    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);

    expect(res.status).toBe(200);
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO seasons"));
  });

  it("POST / should update an existing season", async () => {
    const payload = {
      start_year: 2024,
      end_year: 2025,
      challenge_name: "UPDATED CHALLENGE",
      status: "published"
    };
    mockDb.first.mockResolvedValueOnce({ start_year: 2024 });

    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);

    expect(res.status).toBe(200);
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("UPDATE seasons SET"));
  });

  it("POST / should fail validation on missing fields", async () => {
    const payload = { start_year: 2025 }; // Missing challenge_name
    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);

    expect(res.status).toBe(400);
  });

  it("DELETE /:id should soft-delete a season", async () => {
    const req = new Request("http://localhost/2024", { method: "DELETE" });
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);

    expect(res.status).toBe(200);
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("UPDATE seasons SET is_deleted = 1"));
  });

  it("GET /:id should return season details", async () => {
    mockDb.first.mockImplementation(async () => {
      if (lastSql.includes("SELECT")) return { start_year: 2024, challenge_name: "TEST" };
      return null;
    });
    const req = new Request("http://localhost/2024");
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);

    expect(res.status).toBe(200);
    const body = await res.json() as { season: { start_year: number } };
    expect(body.season.start_year).toBe(2024);
  });

  it("GET /:id should return 404 if not found", async () => {
    mockDb.first.mockResolvedValueOnce(null);
    const req = new Request("http://localhost/2024");
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);
    expect(res.status).toBe(404);
  });
});
