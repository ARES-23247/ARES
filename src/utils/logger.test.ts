import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
  let originalDev: boolean;
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    // Store original DEV value
    originalDev = import.meta.env.DEV;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("debug", () => {
    it("should log debug messages in DEV mode", () => {
      vi.stubEnv("DEV", true);
      logger.debug("test message", { foo: "bar" });
      expect(consoleLogSpy).toHaveBeenCalledWith("[DEBUG] test message", { foo: "bar" });
      vi.unstubEnv("DEV");
    });

    it("should not log debug messages in production", () => {
      vi.stubEnv("DEV", false);
      logger.debug("test message");
      expect(consoleLogSpy).not.toHaveBeenCalled();
      vi.unstubEnv("DEV");
    });
  });

  describe("info", () => {
    it("should log info messages in DEV mode", () => {
      vi.stubEnv("DEV", true);
      logger.info("info message");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] info message");
      vi.unstubEnv("DEV");
    });

    it("should not log info messages in production", () => {
      vi.stubEnv("DEV", false);
      logger.info("info message");
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      vi.unstubEnv("DEV");
    });
  });

  describe("warn", () => {
    it("should log warn messages in DEV mode", () => {
      vi.stubEnv("DEV", true);
      logger.warn("warn message");
      expect(consoleWarnSpy).toHaveBeenCalledWith("[WARN] warn message");
      vi.unstubEnv("DEV");
    });

    it("should not log warn messages in production", () => {
      vi.stubEnv("DEV", false);
      logger.warn("warn message");
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      vi.unstubEnv("DEV");
    });
  });

  describe("error", () => {
    it("should log error with details in DEV mode", () => {
      vi.stubEnv("DEV", true);
      logger.error("error message", { stack: "trace" });
      expect(consoleErrorSpy).toHaveBeenCalledWith("[ERROR] error message", { stack: "trace" });
      vi.unstubEnv("DEV");
    });

    it("should log error without details in production", () => {
      vi.stubEnv("DEV", false);
      logger.error("error message", { stack: "trace" });
      expect(consoleErrorSpy).toHaveBeenCalledWith("[ERROR] error message");
      expect(consoleErrorSpy).not.toHaveBeenCalledWith("[ERROR] error message", { stack: "trace" });
      vi.unstubEnv("DEV");
    });

    it("should always log errors even in production", () => {
      vi.stubEnv("DEV", false);
      logger.error("error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith("[ERROR] error message");
      vi.unstubEnv("DEV");
    });
  });
});
