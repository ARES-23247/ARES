/**
 * Centralized storage keys for localStorage and sessionStorage.
 * Prevents typos and provides single source of truth for key names.
 */

export const STORAGE_KEYS = {
  // Judges Hub
  JUDGE_CODE: "ares_judge_code",

  // RAG Chatbot
  RAG_SESSION: "ares_rag_session",

  // Tutorial progress (dynamic key)
  TUTORIAL_PROGRESS: (title: string) => `tutorial-${title}-progress`,

  // Simulation Playground chat
  SIM_CHAT_PREFIX: "sim_chat_v2_",

  // Error boundary reload tracking
  ERROR_BOUNDARY_RELOAD: (componentName: string) =>
    `ares_error_reload_${componentName}`,

  // Simulation playground storage
  SIM_STORAGE_PREFIX: "sim_chat_v2_",
} as const;

// Helper function for building full storage keys
export function getSimChatKey(simId: string | null): string {
  return `${STORAGE_KEYS.SIM_STORAGE_PREFIX}${simId || 'new'}`;
}
