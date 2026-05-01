# Phase 39: Documentation Refactor Context

## Goal
Audit, rewrite, and upgrade the documentation UI/content to match areslib standards.

## Analysis
The existing documentation system relied on D1 for content, but lacked a seed for local development. The UI components (`CodeBlock`, `DocsSidebar`) were functional but required hydration optimization (`Prism` to `PrismAsync`) and mobile backdrop overlays. The brand enforcement (red/gold/marble/obsidian) was present but required verification.

## Decisions
1. Create a `050_seed_documentation.sql` D1 migration to insert high-quality, 8th-grade readability docs covering ARESLib features.
2. Upgrade `react-syntax-highlighter` from `Prism` to `PrismAsync` to prevent main-thread blocking and hydration issues.
3. Inject an `AnimatePresence` backdrop overlay into `DocsSidebar.tsx` to fix mobile responsiveness.
4. Verify `DocsMarkdownRenderer.tsx` aligns with strict geometric and color brand tokens (`ares-red`, `ares-gold`, `hero-card` constraints).
