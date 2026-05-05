import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, RenderHookOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ModalProvider } from "../contexts/ModalContext";
import { vi } from "vitest";
import type { MockExecutionContext, MockExpressionBuilder } from "./types";

// We mock the confirm globally for tests that use the provider to avoid blocking
vi.mock("../contexts/ModalContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../contexts/ModalContext")>();
  return {
    ...actual,
    useModal: () => ({
      confirm: async () => true, // Auto-confirm
      prompt: async () => "test-prompt-value",
    }),
  };
});

// Mock hooks that are used in almost every dashboard test
// (Removed global mock as it interferes with testing the hook itself)

// Mock ExecutionContext for Hono request testing
export const mockExecutionContext: MockExecutionContext = {
  waitUntil: vi.fn((promise: Promise<unknown>) => promise),
  passThroughOnException: vi.fn(),
  props: {},
};

/**
 * Awaits all promises passed to `mockExecutionContext.waitUntil` so far,
 * allowing background tasks in edge functions to finish before test assertions.
 */
export async function flushWaitUntil() {
  const calls = mockExecutionContext.waitUntil.mock.calls as unknown as ReadonlyArray<readonly [Promise<unknown>]>;
  const promises = calls.map((call) => call[0]);
  mockExecutionContext.waitUntil.mockClear();
  await Promise.all(promises);
}

/**
 * Creates a unified, chainable Kysely ExpressionBuilder mock
 * which avoids coverage drops from missing internal builder methods.
 */
export function createMockExpressionBuilder(): MockExpressionBuilder {
  const fnAs = vi.fn().mockReturnThis();
  const ebMock = {
    or: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    val: vi.fn().mockReturnThis(),
    fn: {
      count: vi.fn().mockReturnValue(fnAs),
      sum: vi.fn().mockReturnValue(fnAs),
      max: vi.fn().mockReturnValue(fnAs),
      min: vi.fn().mockReturnValue(fnAs),
      coalesce: vi.fn().mockReturnValue(fnAs),
      as: fnAs,
    },
    case: Object.assign(
      vi.fn().mockReturnThis(),
      {
        when: vi.fn().mockReturnThis(),
        and: vi.fn().mockReturnThis(),
        then: vi.fn().mockReturnThis(),
        else: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis(),
      }
    ),
    selectFrom: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
  } as MockExpressionBuilder;

  return ebMock;
}

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

export function renderWithProviders<Result, Props>(
  render: (initialProps: Props) => Result,
  options?: RenderHookOptions<Props>
) {
  const testQueryClient = createTestQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter>
        <ModalProvider>
          {children}
        </ModalProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return renderHook(render, { wrapper: Wrapper, ...options });
}
