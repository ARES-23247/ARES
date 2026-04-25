import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMedia } from "./useMedia";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { api } from "../api/client";

// Mock the API client
vi.mock("../api/client", () => ({
  api: {
    media: {
      adminList: {
        useQuery: vi.fn(),
      },
      upload: {
        useMutation: vi.fn(),
      },
      delete: {
        useMutation: vi.fn(),
      },
      move: {
        useMutation: vi.fn(),
      },
      syndicate: {
        useMutation: vi.fn(),
      },
    },
  },
}));

// Mock Sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe("useMedia hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Setup default mock returns
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.media.adminList.useQuery as any).mockReturnValue({ data: { body: { assets: [] } }, isLoading: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.media.upload.useMutation as any).mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.media.delete.useMutation as any).mockReturnValue({ mutate: vi.fn(), isPending: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.media.move.useMutation as any).mockReturnValue({ mutate: vi.fn(), isPending: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.media.syndicate.useMutation as any).mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should initialize with default states", () => {
    const { result } = renderHook(() => useMedia(), { wrapper });
    
    expect(result.current.assets).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("should call delete mutation when deleteAsset is called and confirmed", async () => {
    const mutate = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.media.delete.useMutation as any).mockReturnValue({ mutate, isPending: false });
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    const { result } = renderHook(() => useMedia(), { wrapper });
    
    result.current.deleteAsset("test-key");
    
    expect(confirmSpy).toHaveBeenCalled();
    expect(mutate).toHaveBeenCalledWith({ params: { key: "test-key" }, body: {} });
    
    confirmSpy.mockRestore();
  });

  it("should call move mutation when moveAsset is called", async () => {
    const mutate = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.media.move.useMutation as any).mockReturnValue({ mutate, isPending: false });

    const { result } = renderHook(() => useMedia(), { wrapper });
    
    result.current.moveAsset("test-key", "new-folder");
    
    expect(mutate).toHaveBeenCalledWith({ 
      params: { key: "test-key" }, 
      body: { folder: "new-folder" } 
    });
  });
});
