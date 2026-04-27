import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchBlob, uploadFile, fetchJson } from "./apiClient";

describe("apiClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  describe("fetchBlob", () => {
    it("returns blob on success", async () => {
      const mockBlob = new Blob(["test"], { type: "text/plain" });
      fetchMock.mockResolvedValueOnce({ ok: true, blob: async () => mockBlob });
      
      const res = await fetchBlob("/test");
      expect(res).toBe(mockBlob);
      expect(fetchMock).toHaveBeenCalledWith("/test", expect.objectContaining({ credentials: "include" }));
    });

    it("throws on non-ok status", async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(fetchBlob("/test")).rejects.toThrow("HTTP error! status: 404");
    });
  });

  describe("uploadFile", () => {
    it("uploads file and returns json", async () => {
      const mockRes = { success: true };
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => mockRes });
      
      const formData = new FormData();
      formData.append("file", new Blob(["test"]), "test.txt");
      
      const res = await uploadFile("/upload", formData);
      expect(res).toEqual(mockRes);
      expect(fetchMock).toHaveBeenCalledWith("/upload", expect.objectContaining({
        method: "POST",
        body: formData,
        credentials: "include"
      }));
    });

    it("throws error with json message if available", async () => {
      fetchMock.mockResolvedValueOnce({ 
        ok: false, 
        status: 400, 
        json: async () => ({ error: "Bad Request" }) 
      });
      
      await expect(uploadFile("/upload", new FormData())).rejects.toThrow("Bad Request");
    });

    it("throws fallback error if json lacks error field", async () => {
      fetchMock.mockResolvedValueOnce({ 
        ok: false, 
        status: 500, 
        json: async () => ({}) 
      });
      
      await expect(uploadFile("/upload", new FormData())).rejects.toThrow("HTTP error! status: 500");
    });
  });

  describe("fetchJson", () => {
    it("returns json on success", async () => {
      const mockRes = { data: "test" };
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => mockRes });
      
      const res = await fetchJson("/data");
      expect(res).toEqual(mockRes);
      expect(fetchMock).toHaveBeenCalledWith("/data", expect.objectContaining({
        headers: { "Content-Type": "application/json" }
      }));
    });

    it("throws error with zod issues array parsed", async () => {
      fetchMock.mockResolvedValueOnce({ 
        ok: false, 
        status: 400, 
        json: async () => ({ 
          error: { issues: [{ path: ["username"], message: "Required" }] }
        }) 
      });
      
      await expect(fetchJson("/data")).rejects.toThrow("username: Required");
    });

    it("throws error with object message field", async () => {
      fetchMock.mockResolvedValueOnce({ 
        ok: false, 
        status: 401, 
        json: async () => ({ 
          error: { message: "Unauthorized" }
        }) 
      });
      
      await expect(fetchJson("/data")).rejects.toThrow("Unauthorized");
    });

    it("throws error with string error field", async () => {
      fetchMock.mockResolvedValueOnce({ 
        ok: false, 
        status: 403, 
        json: async () => ({ error: "Forbidden", details: "Check permissions" }) 
      });
      
      await expect(fetchJson("/data")).rejects.toThrow("Forbidden: Check permissions");
    });

    it("throws error with top level message field", async () => {
      fetchMock.mockResolvedValueOnce({ 
        ok: false, 
        status: 404, 
        json: async () => ({ message: "Not Found" }) 
      });
      
      await expect(fetchJson("/data")).rejects.toThrow("Not Found");
    });

    it("falls back to status text and body text", async () => {
      fetchMock.mockResolvedValueOnce({ 
        ok: false, 
        status: 500, 
        statusText: "Internal Server Error",
        json: async () => { throw new Error("not json"); },
        text: async () => "Plain text error"
      });
      
      await expect(fetchJson("/data")).rejects.toThrow("API Error [500]: Internal Server Error - Plain text error");
    });
  });
});
