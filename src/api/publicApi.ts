import { InquiryPayload } from "../schemas/inquirySchema";
import { CommentPayload } from "../schemas/commentSchema";
import { fetchJson } from "../utils/apiClient";

export const publicApi = {
  // --- INQUIRIES ---
  submitInquiry: async (payload: InquiryPayload) => {
    return fetchJson<{ success?: boolean }>("/api/inquiries", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // --- COMMENTS ---
  submitComment: async (targetType: string, targetId: string, payload: CommentPayload) => {
    return fetchJson<{ success?: boolean }>(`/api/comments/${targetType}/${targetId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateComment: async (commentId: string, payload: CommentPayload) => {
    return fetchJson<{ success?: boolean }>(`/api/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteComment: async (commentId: string) => {
    return fetchJson<{ success?: boolean }>(`/api/comments/${commentId}`, {
      method: "DELETE",
    });
  },

  // --- DATA FETCHERS (Generic GET wrapper) ---
  get: async <T>(url: string, options?: RequestInit): Promise<T> => {
    return fetchJson<T>(url, { method: "GET", ...options });
  },
  request: async <T>(url: string, options?: RequestInit): Promise<T> => {
    return fetchJson<T>(url, options);
  },

  // --- DOCS ---
  submitDocsFeedback: async (slug: string, isHelpful: boolean, turnstileToken: string, comment?: string) => {
    return fetchJson<{ success?: boolean }>(`/api/docs/${slug}/feedback`, {
      method: "POST",
      body: JSON.stringify({ isHelpful, comment, turnstileToken }),
    });
  },

  // --- JUDGES ---
  judgesLogin: async (code: string, turnstileToken: string) => {
    return fetchJson<{ success: boolean, error?: string }>("/api/judges/login", {
      method: "POST",
      body: JSON.stringify({ code, turnstileToken }),
    });
  },

  // --- ANALYTICS ---
  trackAnalytics: async (endpoint: string, payload: unknown) => {
    return fetchJson<{ success?: boolean }>(`/api/analytics/${endpoint}`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};
