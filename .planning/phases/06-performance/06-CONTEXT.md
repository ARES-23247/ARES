# Phase 6: Performance - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Mode:** Auto-generated (Autonomous execution per user constraints)

<domain>
## Phase Boundary

Code splitting & lazy loading: Implement lazy loading for major routes, apply code splitting to heavy dependencies (Monaco, TipTap) to stay under 1MB chunks, and integrate a bundle analyzer.
</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
All implementation choices are at the agent's discretion — pure infrastructure phase executed autonomously. Use `React.lazy` for routes, Vite dynamic imports for heavy libraries, and `rollup-plugin-visualizer` for bundle analysis.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Vite configuration (`vite.config.ts`)
- React Router (`src/App.tsx` or `src/main.tsx`)

### Established Patterns
- Component architecture in `src/components/`
- Standard Vite/Rollup build pipeline

### Integration Points
- `vite.config.ts` build options (`rollupOptions.output.manualChunks`)
- Application entry points for Suspense boundaries
</code_context>

<specifics>
## Specific Ideas

No specific user constraints. Prioritize Vite/Rollup native optimizations.
</specifics>

<deferred>
## Deferred Ideas

None.
</deferred>
