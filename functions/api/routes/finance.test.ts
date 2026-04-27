import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { Kysely } from "kysely";

// Mock middleware BEFORE importing the router
vi.mock("../middleware", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../middleware")>();
  return {
    ...actual,
    ensureAdmin: async (c: any, next: any) => next(),
    rateLimitMiddleware: () => (c: any, next: any) => next(),
    logAuditAction: vi.fn(),
    getSessionUser: vi.fn().mockResolvedValue({ id: "user-123" }),
  };
});

import financeRouter from "./finance";

const mockEnv = {
  DB: {} as any,
  ARES_STORAGE: {
    delete: vi.fn().mockResolvedValue(undefined),
  } as any,
  DEV_BYPASS: "true",
};

const mockExecutionContext = {
  waitUntil: vi.fn(),
} as any;

describe("Hono Backend - /finance Router", () => {
  let testApp: Hono<any>;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
      executeTakeFirst: vi.fn().mockResolvedValue(null),
      insertInto: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
      transaction: vi.fn().mockReturnThis(),
    };
    
    // Support transaction callback
    mockDb.execute.mockImplementation(async (cb: any) => {
      if (typeof cb === 'function') return cb(mockDb);
      return [];
    });

    testApp = new Hono<any>();
    testApp.use("*", async (c, next) => {
      c.set("db", mockDb as unknown as Kysely<any>);
      await next();
    });
    testApp.route("/", financeRouter);
  });

  describe("GET /summary", () => {
    it("returns correct totals for a season", async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ start_year: 2024 });
      mockDb.execute.mockResolvedValueOnce([{ type: "income", total: 1000 }, { type: "expense", total: 400 }]);
      
      const res = await testApp.request("/summary", {}, mockEnv, mockExecutionContext);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.total_income).toBe(1000);
      expect(body.total_expenses).toBe(400);
    });

    it("handles no transactions found", async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ start_year: 2024 });
      mockDb.execute.mockResolvedValueOnce([]);
      
      const res = await testApp.request("/summary", {}, mockEnv, mockExecutionContext);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.total_income).toBe(0);
    });
  });

  describe("GET /sponsorship", () => {
    it("lists pipeline", async () => {
      mockDb.execute.mockResolvedValueOnce([{ id: "lead-1", company_name: "Test Corp", status: "potential", estimated_value: 500 }]);
      const res = await testApp.request("/sponsorship", {}, mockEnv, mockExecutionContext);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.pipeline[0].company_name).toBe("Test Corp");
    });
  });

  describe("POST /sponsorship", () => {
    const payload = {
      company_name: "Big Sponsor",
      status: "secured",
      estimated_value: 1000,
      season_id: 2024
    };

    it("handles 'secured' side-effects atomically", async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ status: "potential" });
      mockDb.execute.mockResolvedValueOnce({ id: "new-id" });

      const res = await testApp.request("/sponsorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, mockEnv, mockExecutionContext);

      const body = await res.json() as any;
      console.log("DEBUG: response body", body);
      expect(res.status).toBe(200);
      expect(mockDb.insertInto).toHaveBeenCalledWith("sponsors");
      expect(mockDb.insertInto).toHaveBeenCalledWith("finance_transactions");
    });

    it("idempotent when already 'secured'", async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ status: "secured" });
      
      const res = await testApp.request("/sponsorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: "123" })
      }, mockEnv, mockExecutionContext);
      expect(res.status).toBe(200);
      expect(mockDb.insertInto).not.toHaveBeenCalledWith("sponsors");
    });
  });

  describe("DELETE /sponsorship/:id", () => {
    it("deletes pipeline item", async () => {
      const res = await testApp.request("/sponsorship/123", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      }, mockEnv, mockExecutionContext);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /transactions", () => {
    it("lists transactions", async () => {
      mockDb.execute.mockResolvedValueOnce([{ id: "1", amount: 100, type: "income", category: "Donation", date: "2024-01-01" }]);
      const res = await testApp.request("/transactions", {}, mockEnv, mockExecutionContext);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.transactions[0].amount).toBe(100);
    });
  });

  describe("POST /transactions", () => {
    const payload = {
      type: "expense",
      amount: 50,
      category: "Hardware",
      date: "2024-01-10"
    };

    it("saves existing transaction", async () => {
      const res = await testApp.request("/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: "tx-1" })
      }, mockEnv, mockExecutionContext);
      expect(res.status).toBe(200);
      expect(mockDb.updateTable).toHaveBeenCalledWith("finance_transactions");
    });

    it("creates new transaction", async () => {
      const res = await testApp.request("/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, mockEnv, mockExecutionContext);
      expect(res.status).toBe(200);
      expect(mockDb.insertInto).toHaveBeenCalledWith("finance_transactions");
    });
  });

  describe("DELETE /transactions/:id", () => {
    it("triggers R2 asset cleanup", async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ receipt_url: "https://storage.com/receipts/123.jpg" });
      mockDb.execute.mockResolvedValueOnce([]);
      const res = await testApp.request("/transactions/123", { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      }, mockEnv, mockExecutionContext);
      expect(res.status).toBe(200);
      expect(mockEnv.ARES_STORAGE.delete).toHaveBeenCalledWith("receipts/123.jpg");
    });
  });
});
