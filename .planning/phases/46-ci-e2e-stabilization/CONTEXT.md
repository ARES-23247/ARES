# Phase 46: CI/CD E2E Pipeline Stabilization - Context

**Status:** ✅ Completed (2026-04-30)

<domain>
## Phase Boundary

Resolve all CI pipeline failures preventing green builds on GitHub Actions. Three distinct failure modes were identified and fixed:

1. **Wrangler remote proxy errors** — CI tried to connect to Cloudflare edge APIs without proper authentication/permissions.
2. **Circular chunk TDZ crash** — `ReferenceError: Cannot access 'Vo' before initialization` in production builds on Linux.
3. **Pa11y WCAG violations** — 48 accessibility errors (3 per page × 16 pages) from the new GlobalRAGChatbot.
</domain>

<decisions>
## Implementation Decisions

### CI Environment Isolation (wrangler.ci.toml)
- **Strategy**: Runtime config swap — `mv wrangler.toml wrangler.prod.toml && cp wrangler.ci.toml wrangler.toml`.
- **Rationale**: `wrangler pages dev` does NOT support `--config` flag for custom config paths. The only way to use a different config in CI is to physically replace the file.
- **What's removed in CI**: AI bindings, Vectorize bindings — these require remote Cloudflare API access that isn't available/needed in E2E smoke tests.

### Circular Chunk Dependency Fix (vite.config.ts)
- **Root cause**: `manualChunks` split `react-syntax-highlighter` into a `syntax` chunk and `react-markdown`/`rehype-*` into a `markdown` chunk. These packages share internal dependencies, creating a circular chunk dependency: `syntax → markdown → syntax`.
- **Symptom**: On Linux CI (GitHub Actions), Rollup resolved the circular in a way that caused a Temporal Dead Zone (TDZ) violation. On Windows, it happened to work by luck due to different module resolution order.
- **Fix**: Merged `syntax`, `syntax-highlight`, and `markdown` into a single `markdown` chunk, eliminating the circular dependency entirely.
- **Diagnostic**: Build output `Circular chunk: syntax -> markdown -> syntax` confirmed the root cause.

### Cross-Platform Path Normalization (vite.config.ts)
- **Fix**: Added `const normalizedId = id.replace(/\\/g, '/')` at the top of `manualChunks` to ensure consistent path matching across Windows (`\`) and Linux (`/`).
- **Impact**: Prevents different chunking decisions on different OSes.

### Hidden Source Maps
- **Added**: `sourcemap: 'hidden'` to Vite build config.
- **Purpose**: Allows CI diagnostic step to decode minified variable names (like `Vo`) from source maps without exposing maps to production users.
- **CI Step**: Added "Diagnose TDZ error source" step that greps source maps for minified names and prints nearby original names.

### Admin Dashboard Layout Fix (AdminUsers.tsx)
- Removed virtualized scrolling (`useRef`, fixed-height containers) in favor of native browser scrolling.
- Eliminated "frame-within-a-frame" layout inconsistency in the admin dashboard.

### GlobalRAGChatbot Lazy Loading (App.tsx)
- Changed from eager `import` to `React.lazy()` with `Suspense` boundary.
- Prevents the chatbot's heavy dependencies (react-markdown, uuid, turnstile) from causing module hoisting issues in the main bundle.

### Pa11y WCAG Fixes (GlobalRAGChatbot.tsx)
- Boosted placeholder text contrast from `text-zinc-500` (3.67:1) to `text-zinc-400` (≥4.5:1).
- Added `aria-label="Ask ARES Knowledge Bot a question"` to the chat input field.
- These fixes resolved all 48 pa11y errors across 16 pages.
</decisions>

<code_context>
## Files Modified

- `.github/workflows/ci.yml` — Wrangler config swap + sourcemap diagnostic step.
- `vite.config.ts` — Merged chunks, normalized paths, enabled hidden sourcemaps.
- `src/App.tsx` — Lazy-loaded GlobalRAGChatbot.
- `src/components/AdminUsers.tsx` — Removed virtualized scrolling, unused `useRef`.
- `src/components/ai/GlobalRAGChatbot.tsx` — WCAG contrast fix + aria-label.
- `wrangler.ci.toml` — Isolated CI config without AI/Vectorize bindings.
- `playwright.config.ts` — Removed unsupported `--local` flag.
</code_context>

<specifics>
## Key Learnings

1. **Circular chunk warnings are critical** — Rollup's `Circular chunk: X -> Y -> X` warning directly causes TDZ crashes on some platforms. Always check build output for these.
2. **manualChunks path separators** — Vite module IDs may use OS-native separators. Always normalize with `.replace(/\\/g, '/')`.
3. **Wrangler Pages doesn't support `--config`** — Must use file-swap strategy for CI-specific configs.
4. **Lazy load heavy components** — Any component pulling in large dependency trees (react-markdown, three.js, etc.) should be `React.lazy()` loaded to prevent initialization order issues.
5. **Pa11y catches global overlays** — Components rendered on every page (like a chatbot FAB) create N×errors if they have WCAG violations. Fix once, fix everywhere.
</specifics>

<deferred>
## Deferred Ideas

- Remove CI sourcemap diagnostic step once pipeline stability is confirmed over 5+ green runs.
- Investigate splitting the `markdown` chunk further once circular deps are mapped with `madge`.
- Add `BETTER_AUTH_SECRET` CI secret to suppress auth fallback warnings.
</deferred>
