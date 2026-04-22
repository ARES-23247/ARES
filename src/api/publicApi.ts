import { InquiryPayload } from "../schemas/inquirySchema";
import { CommentPayload } from "../schemas/commentSchema";

// Generic JSON fetcher with error handling
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    // Include credentials for comments or other logged-in public actions
    credentials: "include",
  });
  
  if (!res.ok && res.status !== 207) {
    let errorMessage = `HTTP error! status: ${res.status}`;
    try {
      const errorData = await res.json() as any;
      if (errorData.error) {
        if (typeof errorData.error === "string") {
          errorMessage = errorData.error;
        } else if (typeof errorData.error === "object") {
          if (errorData.error.issues && Array.isArray(errorData.error.issues)) {
            errorMessage = errorData.error.issues.map((i: any) => `${i.path ? i.path.join('.') + ': ' : ''}${i.message}`).join(", ");
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          } else {
            errorMessage = JSON.stringify(errorData.error);
          }
        }
      } else if (errorData.message && typeof errorData.message === "string") {
        errorMessage = errorData.message;
      }
    } catch {
      // Ignored
    }
    throw new Error(errorMessage);
  }
  
  return res.json() as Promise<T>;
}

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
