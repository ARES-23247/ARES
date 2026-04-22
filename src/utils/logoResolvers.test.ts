import { describe, it, expect } from "vitest";
import { extractDomain, getLogoUrl } from "./logoResolvers";

describe("logoResolvers utility", () => {
  describe("extractDomain", () => {
    it("handles standard domains", () => {
      expect(extractDomain("github.com")).toBe("github.com");
    });

    it("strips http and https protocols", () => {
      expect(extractDomain("https://discord.com")).toBe("discord.com");
      expect(extractDomain("http://example.org")).toBe("example.org");
    });

    it("strips www subdomains", () => {
      expect(extractDomain("www.twitter.com")).toBe("twitter.com");
      expect(extractDomain("https://www.facebook.com")).toBe("facebook.com");
    });

    it("removes paths and query parameters", () => {
      expect(extractDomain("https://www.google.com/search?q=ares")).toBe("google.com");
      expect(extractDomain("example.net/path/to/resource")).toBe("example.net");
    });

    it("returns empty string for empty inputs", () => {
      expect(extractDomain("")).toBe("");
      expect(extractDomain(null as unknown as string)).toBe("");
    });
  });

  describe("getLogoUrl", () => {
    it("generates the correct Google Favicon URL", () => {
      expect(getLogoUrl("https://www.apple.com")).toBe("https://www.google.com/s2/favicons?domain=apple.com&sz=128");
    });

    it("returns empty string if domain is invalid", () => {
      expect(getLogoUrl("")).toBe("");
    });
  });
});
