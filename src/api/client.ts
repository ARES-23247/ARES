import { initQueryClient } from "@ts-rest/react-query";
import { apiContract } from "@shared/schemas/contracts";

export { fetchBlob, uploadFile, fetchJson } from "../utils/apiClient";

export const api = initQueryClient(apiContract, {
  baseUrl: "/api",
  baseHeaders: {
    "Content-Type": "application/json",
  },
  api: async (args) => {
    // ts-rest appends trailing slashes for root contract paths (path: "/"),
    // e.g. /api/events/ instead of /api/events, causing Hono 404s.
    const normalizedPath = args.path.length > 1 && args.path.endsWith("/")
      ? args.path.replace(/\/+$/, "")
      : args.path;
    
    const res = await fetch(normalizedPath, {
      method: args.method,
      headers: args.headers,
      body: args.body,
    });
    
    let body;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    
    return {
      status: res.status,
      body,
      headers: res.headers,
    };
  }
});

