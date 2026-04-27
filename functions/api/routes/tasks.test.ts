import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { mockExecutionContext } from "../../../src/test/utils";
import tasksRouter from "./tasks";

vi.mock("../middleware", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../middleware")>();
  return {
    ...actual,
    ensureAuth: async (_c: unknown, next: () => Promise<void>) => next(),
    rateLimitMiddleware: () => async (_c: unknown, next: () => Promise<void>) => next(),
    getSessionUser: vi.fn(),
    getSocialConfig: vi.fn().mockResolvedValue({})
  };
});



vi.mock("../../utils/zulipSync", () => ({
  sendZulipMessage: vi.fn()
}));

import { getSessionUser } from "../middleware";
import { sendZulipMessage } from "../../utils/zulipSync";

describe("Hono Backend - /tasks Router", () => {
  let mockDb: any;
  let testApp: Hono<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      whereRef: vi.fn().mockReturnThis(),
      insertInto: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
      executeTakeFirst: vi.fn().mockResolvedValue(null),
      as: vi.fn().mockReturnThis(),
    };

    testApp = new Hono<any>();
    testApp.use("*", async (c: any, next: any) => {
      c.set("db", mockDb);
      c.set("executionCtx", mockExecutionContext);
      await next();
    });
    testApp.route("/", tasksRouter);
  });

  it("GET / - lists tasks", async () => {
    mockDb.execute.mockResolvedValueOnce([
      { 
        id: "task1", 
        title: "Test Task", 
        status: "todo", 
        priority: "high", 
        sort_order: 1, 
        created_by: "user1", 
        assignees_json: '[{"id":"user2","nickname":"Alice"}]' 
      }
    ]);

    const res = await testApp.request("/", {}, {}, mockExecutionContext);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.tasks).toHaveLength(1);
    expect(body.tasks[0].title).toBe("Test Task");
    expect(body.tasks[0].assignees).toHaveLength(1);
    expect(body.tasks[0].assignees[0].nickname).toBe("Alice");
  });

  it("GET / - handles db error", async () => {
    mockDb.execute.mockRejectedValueOnce(new Error("DB Error"));
    const res = await testApp.request("/", {}, {}, mockExecutionContext);
    expect(res.status).toBe(500);
  });

  it("GET / - filters by status", async () => {
    mockDb.execute.mockResolvedValueOnce([]);
    const res = await testApp.request("/?status=todo", {}, {}, mockExecutionContext);
    expect(res.status).toBe(200);
    expect(mockDb.where).toHaveBeenCalledWith("t.status", "=", "todo");
  });

  it("POST / - creates task with multiple assignees", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "student", nickname: "Creator" } as any);
    mockDb.execute.mockResolvedValueOnce([{ user_id: "user2", nickname: "Alice" }]); // For profiles fetch

    const res = await testApp.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        title: "New Task", 
        description: "Desc", 
        priority: "high",
        assignees: ["user2", "user3"]
      })
    }, {}, mockExecutionContext);

    expect(res.status).toBe(200);
    expect(mockDb.insertInto).toHaveBeenCalledWith("tasks");
    expect(mockDb.insertInto).toHaveBeenCalledWith("task_assignments");
    
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.task.title).toBe("New Task");
    expect(body.task.assignees).toBeDefined();
  });

  it("POST / - handles create error", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "student" } as any);
    mockDb.insertInto.mockImplementationOnce(() => { throw new Error("Create fail"); });

    const res = await testApp.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Task" })
    }, {}, mockExecutionContext);

    expect(res.status).toBe(500);
  });

  it("POST / - handles Zulip failure in create gracefully", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "student" } as any);
    mockDb.execute.mockResolvedValueOnce([]); // profiles
    mockDb.execute.mockResolvedValueOnce([{ email: "alice@test.com" }]); // user emails
    vi.mocked(sendZulipMessage).mockRejectedValueOnce(new Error("Zulip Down"));

    const res = await testApp.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Task", assignees: ["user2"] })
    }, {}, mockExecutionContext);

    expect(res.status).toBe(200);
  });

  it("PATCH /:id - updates task and assignments", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "admin" } as any);
    mockDb.executeTakeFirst.mockResolvedValueOnce({ id: "task1", created_by: "user2", title: "Task" });
    
    const res = await testApp.request("/task1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Task", assignees: ["user3"] })
    }, {}, mockExecutionContext);

    expect(res.status).toBe(200);
    expect(mockDb.updateTable).toHaveBeenCalledWith("tasks");
    expect(mockDb.deleteFrom).toHaveBeenCalledWith("task_assignments");
    expect(mockDb.insertInto).toHaveBeenCalledWith("task_assignments");
  });

  it("DELETE /:id - deletes task", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce({ id: "user1", role: "admin" } as any);
    mockDb.executeTakeFirst.mockResolvedValueOnce({ created_by: "user2" });
    
    const res = await testApp.request("/task1", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: "{}" }, {}, mockExecutionContext);
    expect(res.status).toBe(200);
    expect(mockDb.deleteFrom).toHaveBeenCalledWith("tasks");
  });
});
