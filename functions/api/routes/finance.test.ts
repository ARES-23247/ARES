import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { mockExecutionContext } from "../../../src/test/utils";
import financeRouter from "./finance";

vi.mock("../middleware", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../middleware")>();
  return {
    ...actual,
    ensureAdmin: async (_c: unknown, next: () => Promise<void>) => next(),
    rateLimitMiddleware: () => async (_c: unknown, next: () => Promise<void>) => next(),
    logAuditAction: vi.fn().mockResolvedValue(true),
    getSessionUser: vi.fn().mockResolvedValue({ id: "admin-1", role: "admin", email: "admin@ares.org" }),
  };
});

describe("Hono Backend - /finance Router", () => {
  let mockDb: any;
  let testApp: Hono<any>;
  let env: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      execute: vi.fn(),
      executeTakeFirst: vi.fn().mockResolvedValue(null),
      insertInto: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onConflict: vi.fn().mockReturnThis(),
      doNothing: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
      transaction: vi.fn().mockReturnThis(),
    };

    // Correctly mock the Kysely transaction flow
    mockDb.transaction.mockReturnValue({
      execute: vi.fn().mockImplementation(async (callback) => {
        return await callback(mockDb);
      })
    });

    env = {
      DB: {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({}),
      },
      ARES_STORAGE: {
        delete: vi.fn().mockResolvedValue({}),
      },
      ENVIRONMENT: "test",
    };

    testApp = new Hono<any>();
    testApp.use("*", async (c: any, next: any) => {
      c.set("db", mockDb);
      await next();
    });
    testApp.route("/", financeRouter);
  });

  it("GET /summary - returns aggregated totals", async () => {
    // 1st executeTakeFirst: get latest season
    mockDb.executeTakeFirst.mockResolvedValueOnce({ start_year: 2024 });
    // 1st execute: get summary totals
    mockDb.execute.mockResolvedValueOnce([{ type: "income", total: 1000 }, { type: "expense", total: 400 }]);
    
    const res = await testApp.request("/summary", {}, env, mockExecutionContext);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.total_income).toBe(1000);
    expect(body.total_expenses).toBe(400);
    expect(body.balance).toBe(600);
  });

  it("POST /sponsorship - handles 'Secured' side-effects atomically", async () => {
    // 1st executeTakeFirst: get latest season (for list pipeline logic if called, but here it's POST)
    // Actually savePipeline calls executeTakeFirst for existing status check
    mockDb.executeTakeFirst.mockResolvedValueOnce({ status: "contacted" });
    mockDb.execute.mockResolvedValueOnce([]); // Success for batch
    
    const payload = {
      id: "lead-123",
      company_name: "Test Corp",
      status: "secured",
      estimated_value: 500,
      season_id: 2024
    };

    const res = await testApp.request("/sponsorship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }, env, mockExecutionContext);

    expect(res.status).toBe(200);
    expect(mockDb.insertInto).toHaveBeenCalledWith("sponsors");
    expect(mockDb.insertInto).toHaveBeenCalledWith("finance_transactions");
  });

  it("DELETE /transactions/:id - triggers R2 asset cleanup", async () => {
    // 1st executeTakeFirst: check for receipt
    mockDb.executeTakeFirst.mockResolvedValueOnce({ receipt_url: "https://ares-media.org/receipts/123.jpg" });
    mockDb.execute.mockResolvedValueOnce([]); // Success for delete

    const res = await testApp.request("/transactions/123", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    }, env, mockExecutionContext);

    expect(res.status).toBe(200);
    expect(env.ARES_STORAGE.delete).toHaveBeenCalledWith("receipts/123.jpg");
    expect(mockDb.deleteFrom).toHaveBeenCalledWith("finance_transactions");
  });
});
