import "@testing-library/jest-dom";
import { server } from "./mocks/server";
import { beforeEach, afterEach } from "vitest";

// Start MSW Server
beforeEach(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

// Reset handlers after each test to ensure test isolation
afterEach(() => {
  server.resetHandlers();
  server.close();
});

export { server };

// Mock jsdom missing methods
const scrollTo = () => {};
window.scrollTo = scrollTo;

// Mock Cloudflare-specific globals
(globalThis as any).caches = {
  default: {
    match: () => Promise.resolve(undefined),
    put: () => Promise.resolve(undefined),
    delete: () => Promise.resolve(undefined),
  },
  open: () => Promise.resolve(undefined),
};

// Mock ExecutionContext for Hono request testing
export const mockExecutionContext = {
  waitUntil: (promise: Promise<unknown>) => promise,
  passThroughOnException: () => {},
};
