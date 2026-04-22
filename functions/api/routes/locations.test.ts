/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { locationsRouter, adminLocationsRouter } from "./locations";
import { mockExecutionContext } from "../../../src/test/utils";

describe("Hono Backend - /locations Router", () => {
  let env: any;

  beforeEach(() => {
    vi.clearAllMocks();
    env = {
      DB: {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true }),
      } as any,
      DEV_BYPASS: "true",
    };
  });

  it("GET / - list locations", async () => {
    const mockLocs = [{ id: "1", name: "HQ", address: "123 Main" }];
    env.DB.all.mockResolvedValue({ results: mockLocs });

    const req = new Request("http://localhost/");
    const res = await locationsRouter.request(req, {}, env, mockExecutionContext);

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.locations).toHaveLength(1);
  });

  it("POST / - create location (admin)", async () => {
    const req = new Request("http://localhost/", {
      method: "POST",
      body: JSON.stringify({ name: "New", address: "Addr" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await adminLocationsRouter.request(req, {}, env, mockExecutionContext);

    expect(res.status).toBe(200);
  });
});
