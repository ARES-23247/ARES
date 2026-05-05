# Phase 23: React Three Fiber (R3F) & Sim Component Typings - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Strictly type React context providers, 3D meshes, refs, and simulation component props.

</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
All implementation choices are at the agent's discretion — pure infrastructure/typing phase. The R3F components in `src/components/editor/physics/index.tsx` use `any` for props. RobotViewer.tsx is already properly typed.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RobotViewer.tsx` — properly typed with `THREE.Mesh` refs and useFrame
- `physics/index.tsx` — `PhysicsWorld` and `SwerveModule` need typed props
- `physics/index.ts` — barrel export for THREE, R3F, Drei

### Integration Points
- `src/components/editor/SimPreviewFrame.tsx` — uses physics components in sandboxed iframe

</code_context>

<specifics>
## Specific Ideas

Replace `any` props with explicit interfaces for `PhysicsWorld` and `SwerveModule`.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
