import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendZulipMessage } from "./zulip";
import type { AppEnv } from "../api/middleware/utils";

describe("sendZulipMessage", () => {
  const mockEnv: AppEnv["Bindings"] = {
    ZULIP_URL: "https://zulip.example.com",
    ZULIP_BOT_EMAIL: "bot@example.com",
    ZULIP_API_KEY: "secret-api-key",
  } as unknown as AppEnv["Bindings"];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false if environment variables are missing", async () => {
    const env = {} as AppEnv["Bindings"];
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    const result = await sendZulipMessage(env, "general", "topic", "hello");
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith("[Zulip] Missing required environment variables.");
  });

  it("returns true on successful message", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
    } as unknown as Response);

    const result = await sendZulipMessage(mockEnv, "general", "topic", "hello");
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("returns false and logs error on non-ok response", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue("Bad Request"),
    } as unknown as Response);

    const result = await sendZulipMessage(mockEnv, "general", "topic", "hello");
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith("[Zulip] Failed to send message:", 400, "Bad Request");
  });

  it("returns false and logs error on exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockError = new Error("Network error");
    global.fetch = vi.fn().mockRejectedValueOnce(mockError);

    const result = await sendZulipMessage(mockEnv, "general", "topic", "hello");
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith("[Zulip] Exception sending message:", mockError);
  });
});
