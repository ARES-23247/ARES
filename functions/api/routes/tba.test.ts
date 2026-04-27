import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { mockExecutionContext } from "../../../src/test/utils";
import tbaRouter from "./tba";

describe("Hono Backend - /tba Router", () => {
  let mockDb: any;
  let testApp: Hono<any>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue({ value: "test-api-key" }),
    };

    testApp = new Hono<any>();
    testApp.use("*", async (c: any, next: any) => {
      c.set("db", mockDb);
      c.set("executionCtx", mockExecutionContext);
      await next();
    });
    testApp.route("/", tbaRouter);

    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("GET /rankings/:eventKey - fetches rankings from TBA", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rankings: [{ team_key: "frc123", rank: 1 }] })
    });

    const res = await testApp.request("/rankings/2023test", {}, {}, mockExecutionContext);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.rankings).toHaveLength(1);
    expect(body.rankings[0].team_key).toBe("frc123");
  });

  it("GET /rankings/:eventKey - returns 400 for invalid eventKey", async () => {
    const res = await testApp.request("/rankings/invalid-key!", {}, {}, mockExecutionContext);
    expect(res.status).toBe(400);
  });

  it("GET /rankings/:eventKey - handles missing API key", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(null);
    const res = await testApp.request("/rankings/2023testMissing", {}, {}, mockExecutionContext);
    expect(res.status).toBe(500);
  });

  it("GET /matches/:eventKey - fetches matches from TBA", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        { time: 200, key: "m2" },
        { time: 100, key: "m1" }
      ])
    });

    const res = await testApp.request("/matches/2023testMatches", {}, {}, mockExecutionContext);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.matches).toHaveLength(2);
    expect(body.matches[0].key).toBe("m1"); // Sorted by time
  });

  it("GET /matches/:eventKey - returns 400 for invalid eventKey", async () => {
    const res = await testApp.request("/matches/invalid_key", {}, {}, mockExecutionContext);
    expect(res.status).toBe(400);
  });

  it("GET /matches/:eventKey - handles external API error without cache", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    const res = await testApp.request("/matches/2023testError", {}, {}, mockExecutionContext);
    expect(res.status).toBe(500);
  });

  it("GET /ftc-events/:season/:eventCode/:type - fetches FTC events", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: [{ code: "test" }] })
    });

    const res = await testApp.request("/ftc-events/2023/TEST/matches", {}, {}, mockExecutionContext);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.events).toHaveLength(1);
  });

  it("GET /ftc-events/:season/:eventCode/:type - handles API error", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    const res = await testApp.request("/ftc-events/2023/TEST2/matches", {}, {}, mockExecutionContext);
    expect(res.status).toBe(500);
  });
});
