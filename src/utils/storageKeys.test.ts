import { describe, it, expect } from "vitest";
import { STORAGE_KEYS, getSimChatKey } from "./storageKeys";

describe("storageKeys", () => {
  describe("STORAGE_KEYS", () => {
    it("should have all required static keys", () => {
      expect(STORAGE_KEYS.JUDGE_CODE).toBe("ares_judge_code");
      expect(STORAGE_KEYS.RAG_SESSION).toBe("ares_rag_session");
      expect(STORAGE_KEYS.SIM_CHAT_PREFIX).toBe("sim_chat_v2_");
      expect(STORAGE_KEYS.SIM_STORAGE_PREFIX).toBe("sim_chat_v2_");
    });

    it("should have TUTORIAL_PROGRESS function key", () => {
      const key = STORAGE_KEYS.TUTORIAL_PROGRESS("my-tutorial");
      expect(key).toBe("tutorial-my-tutorial-progress");
    });

    it("should have ERROR_BOUNDARY_RELOAD function key", () => {
      const key = STORAGE_KEYS.ERROR_BOUNDARY_RELOAD("MyComponent");
      expect(key).toBe("ares_error_reload_MyComponent");
    });
  });

  describe("getSimChatKey", () => {
    it("should return key with simId when provided", () => {
      const key = getSimChatKey("sim-123");
      expect(key).toBe("sim_chat_v2_sim-123");
    });

    it("should return key with 'new' when simId is null", () => {
      const key = getSimChatKey(null);
      expect(key).toBe("sim_chat_v2_new");
    });

    it("should return key with 'new' when simId is empty string (falsy check)", () => {
      const key = getSimChatKey("");
      // Empty string is falsy, so defaults to 'new'
      expect(key).toBe("sim_chat_v2_new");
    });

    it("should handle special characters in simId", () => {
      const key = getSimChatKey("sim-with_special.chars");
      expect(key).toBe("sim_chat_v2_sim-with_special.chars");
    });
  });
});
