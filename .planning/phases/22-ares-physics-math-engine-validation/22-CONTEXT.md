# Phase 22: ARES Physics & Math Engine Validation - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Provide explicit struct definitions for physics engines (Dyn4j, Matter.js) and generic math visualizers.

</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
All implementation choices are at the agent's discretion — pure infrastructure/typing phase. The engine components already have TypeScript interfaces (`MatterEngineProps`, `Dyn4jEngineProps`, `CustomCanvasEngineProps`). The sims directory contains 21 simulation modules with only 1 type bypass (`@ts-expect-error` in `field/index.tsx` for three.js).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MatterEngine.tsx` — already typed with `Matter.Engine`, `Matter.Render` refs
- `Dyn4jEngine.tsx` — stub with `Record<string, unknown>` state
- `CustomCanvasEngine.tsx` — typed with explicit `{ x: number; y: number }` state
- `HybridSimulationWrapper.tsx` — wrapper using `useExperimentState` with `z.any()` schema

### Established Patterns
- All engine components use `React.FC<Props>` pattern with explicit interfaces
- State persistence via `useExperimentState` hook with Zod validation
- Canvas-based rendering with `useRef` and `requestAnimationFrame`

### Integration Points
- `src/sims/` — 21 simulation modules, each self-contained
- `src/components/SimulationPlayground.tsx` — AI-powered simulation IDE
- Single `@ts-expect-error` in `src/sims/field/index.tsx` for Three.js examples

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Existing interfaces compile cleanly (`tsc --noEmit` exits 0).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 22-ares-physics-math-engine-validation*
*Context gathered: 2026-05-05*
