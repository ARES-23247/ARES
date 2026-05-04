import { initQueryClient } from "@ts-rest/react-query";
import { apiContract } from "@shared/schemas/contracts";

export { fetchBlob, uploadFile, fetchJson } from "../utils/apiClient";

export const api = initQueryClient(apiContract, {
  baseUrl: "/api",
  baseHeaders: {},
  api: async (args) => {
    // ts-rest appends trailing slashes for root contract paths (path: "/"),
    // e.g. /api/events/ instead of /api/events, causing Hono 404s.
    // Also handles /api/tasks/?parent_id=null → /api/tasks?parent_id=null
    const normalizedPath = args.path.replace(/\/+(\?|$)/, '$1');
    
    // Don't set Content-Type for FormData — the browser must auto-generate
    // the multipart/form-data boundary. For all other requests, use JSON.
    const headers = new Headers(args.headers);
    if (!(args.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(normalizedPath, {
      method: args.method,
      headers,
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

