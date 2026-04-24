import { initQueryClient } from "@ts-rest/react-query";
import { apiContract } from "../schemas/contracts";

export { fetchBlob, uploadFile, fetchJson } from "../utils/apiClient";

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  console.log("TS-REST FETCH:", input);
  return originalFetch(input, init);
};

export const api = initQueryClient(apiContract, {
  baseUrl: "/api",
  baseHeaders: {
    "Content-Type": "application/json",
  },
  api: async (args) => {
    const originalFetch = globalThis.fetch;
    // ts-rest appends trailing slashes for root contract paths (path: "/"),
    // e.g. /api/events/ instead of /api/events, causing Hono 404s.
    const normalizedPath = args.path.length > 1 && args.path.endsWith("/")
      ? args.path.replace(/\/+$/, "")
      : args.path;
    console.log("ts-rest fetching:", normalizedPath);
    const res = await originalFetch(normalizedPath, {
      method: args.method,
      headers: args.headers,
      body: args.body as any,
    });
    
    let body;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    
    console.log("ts-rest response body:", body);
    
    return {
      status: res.status,
      body,
      headers: res.headers,
    };
  }
});

