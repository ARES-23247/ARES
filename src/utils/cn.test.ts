import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn utility", () => {
  it("merges standard tailwind strings", () => {
    expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
  });

  it("handles conditional class objects", () => {
    expect(cn("px-2", { "bg-blue-500": true, "hidden": false })).toBe("px-2 bg-blue-500");
  });

  it("resolves tailwind style conflicts utilizing tailwind-merge", () => {
    expect(cn("px-2 px-4")).toBe("px-4");
    expect(cn("bg-red-500", "bg-blue-600")).toBe("bg-blue-600");
    // tailwind-merge allows overriding complex classes
    expect(cn("p-4 pb-2")).toBe("p-4 pb-2");
  });

  it("filters out falsy values", () => {
    expect(cn("flex", null, undefined, false, 0, "", "items-center")).toBe("flex items-center");
  });
});
