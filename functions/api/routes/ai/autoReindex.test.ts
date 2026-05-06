import { describe, it, expect, vi, beforeEach } from "vitest";
import { triggerBackgroundReindex } from "./autoReindex";

// Mock ExecutionContext with waitUntil for fire-and-forget tasks
interface MockExecutionContext {
  waitUntil: ReturnType<typeof vi.fn>;
}

// Mock Cloudflare Workers AI binding
interface MockAI {
  run: ReturnType<typeof vi.fn>;
}

// Mock Vectorize binding
interface MockVectorize {
  upsert: ReturnType<typeof vi.fn>;
}

// Mock KV binding
interface MockKV {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
}

describe("triggerBackgroundReindex", () => {
  let mockExecutionCtx: MockExecutionContext;
  let mockDb: Record<string, unknown>;
  let mockAi: MockAI;
  let mockVectorize: MockVectorize;
  let mockKv: MockKV;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecutionCtx = { waitUntil: vi.fn() };
    mockDb = {};
    mockAi = { run: vi.fn() };
    mockVectorize = { upsert: vi.fn() };
    mockKv = { get: vi.fn(), put: vi.fn() };
  });

  it("no-ops when AI binding is undefined", () => {
    triggerBackgroundReindex(mockExecutionCtx as any, mockDb as any, undefined, mockVectorize as any);

    expect(mockExecutionCtx.waitUntil).not.toHaveBeenCalled();
  });

  it("no-ops when Vectorize binding is undefined", () => {
    triggerBackgroundReindex(mockExecutionCtx as any, mockDb as any, mockAi as any, undefined);

    expect(mockExecutionCtx.waitUntil).not.toHaveBeenCalled();
  });

  it("calls waitUntil with a promise when bindings are present", () => {
    triggerBackgroundReindex(mockExecutionCtx as any, mockDb as any, mockAi as any, mockVectorize as any);

    expect(mockExecutionCtx.waitUntil).toHaveBeenCalledTimes(1);
    expect(mockExecutionCtx.waitUntil).toHaveBeenCalledWith(expect.any(Promise));
  });

  it("does not throw when AI and Vectorize are present (fire-and-forget)", () => {
    expect(() => {
      triggerBackgroundReindex(mockExecutionCtx as any, mockDb as any, mockAi as any, mockVectorize as any);
    }).not.toThrow();
  });

  it("works without KV (optional parameter)", () => {
    triggerBackgroundReindex(mockExecutionCtx as any, mockDb as any, mockAi as any, mockVectorize as any);

    expect(mockExecutionCtx.waitUntil).toHaveBeenCalledTimes(1);
  });
});
