import "@testing-library/jest-dom";
import { server } from "./mocks/server";

// Start MSW Server
server.listen({ onUnhandledRequest: "warn" });

// Reset handlers after each test to ensure test isolation
// Note: Test isolation handled by individual test suites

export { server };

// Mock jsdom missing methods
const scrollTo = () => {};
window.scrollTo = scrollTo;

// Mock Cloudflare-specific globals
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
