import { describe, it, expect, vi, beforeEach } from "vitest";
import adminSeasonsRouter from "./admin";

const mockExecutionContext = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
};

vi.mock("../../middleware", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../middleware")>();
  return {
    ...actual,
    ensureAdmin: async (c: unknown, next: () => Promise<void>) => next(),
    logAuditAction: vi.fn().mockResolvedValue(undefined),
  };
});

describe("Seasons Admin Router", () => {
  let mockDb: Record<string, ReturnType<typeof vi.fn>>;
  let env: { DB: unknown };

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({ results: [] }),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({ success: true }),
    };
    env = { DB: mockDb };
    vi.clearAllMocks();
  });

  it("GET / should return all seasons", async () => {
    const mockSeasons = [{ id: "2024-2025", challenge_name: "INTO THE DEEP", status: "published" }];
    mockDb.all.mockResolvedValueOnce({ results: mockSeasons });

    const req = new Request("http://localhost/");
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);

    expect(res.status).toBe(200);
    const body = await res.json() as { seasons: Record<string, unknown>[] };
    expect(body.seasons).toHaveLength(1);
  });

  it("GET / should return empty list on DB error", async () => {
    mockDb.all.mockRejectedValueOnce(new Error("DB Error"));
    const req = new Request("http://localhost/");
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);
    expect(res.status).toBe(200);
    const body = await res.json() as { seasons: Record<string, unknown>[] };
    expect(body.seasons).toHaveLength(0);
  });

  it("GET / should handle null results from DB", async () => {
    mockDb.all.mockResolvedValueOnce({ results: null });
    const req = new Request("http://localhost/");
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);
    expect(res.status).toBe(200);
    const body = await res.json() as { seasons: Record<string, unknown>[] };
    expect(body.seasons).toHaveLength(0);
  });

  it("POST / should create a new season with optional fields missing", async () => {
    const payload = {
      id: "2025-2026",
      challenge_name: "NEW CHALLENGE",
      status: "published"
      // optional fields missing
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

  it("POST / should update an existing season with all fields", async () => {
    const payload = {
      id: "2024-2025",
      challenge_name: "UPDATED CHALLENGE",
      robot_name: "Robo",
      robot_image: "img",
      robot_description: "desc",
      robot_cad_url: "url",
      summary: "sum",
      start_date: "2024",
      end_date: "2025",
      status: "published"
    };
    mockDb.first.mockResolvedValueOnce({ id: "2024-2025" });

    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);

    expect(res.status).toBe(200);
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("UPDATE seasons SET"));
  });

  it("POST / should update an existing season with optional fields missing", async () => {
    const payload = {
      id: "2024-2025",
      challenge_name: "UPDATED CHALLENGE",
      status: "published"
    };
    mockDb.first.mockResolvedValueOnce({ id: "2024-2025" });

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
    const payload = { id: "2025-2026" }; // Missing challenge_name
    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);

    expect(res.status).toBe(400);
  });

  it("POST / should handle DB errors", async () => {
    const payload = { id: "2025-2026", challenge_name: "TEST" };
    mockDb.first.mockRejectedValueOnce(new Error("DB Error"));
    const req = new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);
    expect(res.status).toBe(500);
  });

  it("DELETE /:id should soft-delete a season", async () => {
    const req = new Request("http://localhost/2024-2025", { method: "DELETE" });
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);

    expect(res.status).toBe(200);
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("UPDATE seasons SET is_deleted = 1"));
  });

  it("DELETE /:id should handle DB errors", async () => {
    mockDb.run.mockRejectedValueOnce(new Error("DB Error"));
    const req = new Request("http://localhost/2024-2025", { method: "DELETE" });
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);
    expect(res.status).toBe(500);
  });

  it("GET /:id should return season details for admin", async () => {
    mockDb.first.mockResolvedValueOnce({ id: "2024-2025", challenge_name: "TEST" });
    const req = new Request("http://localhost/2024-2025");
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);

    expect(res.status).toBe(200);
    const body = await res.json() as { season: { id: string } };
    expect(body.season.id).toBe("2024-2025");
  });

  it("GET /:id should return 404 if not found", async () => {
    mockDb.first.mockResolvedValueOnce(null);
    const req = new Request("http://localhost/2024-2025");
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);
    expect(res.status).toBe(404);
  });

  it("GET /:id should handle DB errors", async () => {
    mockDb.first.mockRejectedValueOnce(new Error("DB Error"));
    const req = new Request("http://localhost/2024-2025");
    const res = await adminSeasonsRouter.request(req, {}, env, mockExecutionContext);
    expect(res.status).toBe(500);
  });
});
