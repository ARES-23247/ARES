# Phase 45: AI Copilot & RAG Chatbot Integration - Context

**Status:** ✅ Completed (2026-04-30)

<domain>
## Phase Boundary

Integrate a z.ai-powered RAG chatbot as a global overlay component across all pages of the ARES web portal. The chatbot provides team knowledge retrieval, PII scrubbing, session persistence via D1, and Turnstile-gated streaming to prevent abuse.
</domain>

<decisions>
## Implementation Decisions

### Architecture
- Global overlay: `GlobalRAGChatbot.tsx` renders as a fixed-position floating widget on all pages.
- Lazy loading: Component is loaded via `React.lazy()` with a `Suspense` boundary in `App.tsx` to prevent bundle initialization issues.
- Turnstile verification: Required before any message can be sent to prevent DoW (Denial of Wallet) attacks.
- PII scrubbing: All user input is sanitized before transmission to the AI backend.
- Session persistence: Chat sessions are persisted in Cloudflare D1 for continuity.

### UI/UX
- Floating action button (FAB) with `MessageSquare` icon in bottom-right corner.
- Expandable chat panel (w-96, h-[32rem]) with message bubbles.
- AI responses rendered as Markdown via `react-markdown`.
- Disabled input state while Turnstile verification is pending.

### WCAG Compliance
- `aria-label` on all interactive elements (open button, close button, send button, chat input).
- Contrast ratio ≥ 4.5:1 on all text (zinc-400 on zinc-900 background).
</decisions>

<code_context>
## Files Modified

- `src/components/ai/GlobalRAGChatbot.tsx` — Main chatbot component.
- `src/App.tsx` — Lazy-loads the chatbot with `React.lazy()` + `Suspense`.
</code_context>

<deferred>
## Deferred Ideas

- Multi-turn context window management (token budget tracking).
- Voice input support.
- Proactive suggestions based on page context.
</deferred>
