---
wave: 1
depends_on: []
files_modified:
  - src/hooks/useExperimentState.ts
  - src/components/science-corner/engines/MatterEngine.tsx
  - src/components/science-corner/engines/CustomCanvasEngine.tsx
  - src/components/science-corner/engines/Dyn4jEngine.tsx
  - src/components/science-corner/HybridSimulationWrapper.tsx
  - src/routes/science-corner/index.tsx
  - src/routes/science-corner/lesson/[id].tsx
autonomous: true
---

# Phase 82: Science Corner & Sandbox Expansion

## Goal
Implement a standalone, public-facing "Science Corner" that supports persistent browser-based experiment state and a triple-engine hybrid simulation architecture (matter.js, Canvas, Dyn4j).

## Tasks

<task>
<id>82-1</id>
<title>Create State Persistence Hook</title>
<read_first>
- src/hooks/useExperimentState.ts
</read_first>
<action>
Create `src/hooks/useExperimentState.ts`.
Implement a React hook `useExperimentState<T>(key: string, initialValue: T)` that wraps `localStorage`.
It must serialize state to JSON on update and parse JSON on initial load.
It should handle window definition checks (SSR compatibility) by falling back to `initialValue` if `typeof window === 'undefined'`.
</action>
<acceptance_criteria>
- `src/hooks/useExperimentState.ts` exists.
- Contains `export function useExperimentState`.
- Contains `window.localStorage.getItem` and `window.localStorage.setItem`.
</acceptance_criteria>
</task>

<task>
<id>82-2</id>
<title>Implement Hybrid Engines</title>
<read_first>
- package.json
- src/components/science-corner/engines/MatterEngine.tsx
- src/components/science-corner/engines/CustomCanvasEngine.tsx
- src/components/science-corner/engines/Dyn4jEngine.tsx
</read_first>
<action>
1. Install `matter-js` and `@types/matter-js` using standard npm commands.
2. Create `src/components/science-corner/engines/MatterEngine.tsx`. Accept `initialState` and `onStateChange` props. Initialize a simple Matter.js engine and render it to a referenced `div`.
3. Create `src/components/science-corner/engines/CustomCanvasEngine.tsx`. Accept `initialState` and `onStateChange`. Render an HTML `<canvas>` element with a 2d context reference.
4. Create `src/components/science-corner/engines/Dyn4jEngine.tsx`. Accept `initialState` and `onStateChange`. Stub the wrapper for existing Dyn4j telemetry rendering.
</action>
<acceptance_criteria>
- `package.json` contains `"matter-js"`.
- `MatterEngine.tsx` contains `import Matter from 'matter-js'`.
- `CustomCanvasEngine.tsx` contains `<canvas ref=`.
- `Dyn4jEngine.tsx` exists and exports the component.
</acceptance_criteria>
</task>

<task>
<id>82-3</id>
<title>Create Hybrid Simulation Wrapper</title>
<read_first>
- src/components/science-corner/HybridSimulationWrapper.tsx
- src/components/science-corner/engines/MatterEngine.tsx
- src/components/science-corner/engines/CustomCanvasEngine.tsx
- src/components/science-corner/engines/Dyn4jEngine.tsx
</read_first>
<action>
Create `src/components/science-corner/HybridSimulationWrapper.tsx`.
Accept props: `engineType: 'matter' | 'canvas' | 'dyn4j'`, `experimentId: string`.
Use `useExperimentState(experimentId, defaultState)` to load state.
Switch on `engineType` to conditionally render `MatterEngine`, `CustomCanvasEngine`, or `Dyn4jEngine`, passing the state and state setter down as props.
</action>
<acceptance_criteria>
- `HybridSimulationWrapper.tsx` contains `switch (engineType)`.
- It imports all three engines.
- It calls `useExperimentState`.
</acceptance_criteria>
</task>

<task>
<id>82-4</id>
<title>Create Public Routing and Pages</title>
<read_first>
- src/routes/science-corner/index.tsx
- src/routes/science-corner/lesson/[id].tsx
</read_first>
<action>
1. Create `src/routes/science-corner/index.tsx`. This should be a public landing page featuring a mock grid of 3 available lessons.
2. Create `src/routes/science-corner/lesson/[id].tsx`. This dynamic route extracts the `id` from URL params, maps it to a mock lesson config (e.g. `lesson-1` -> `engineType: 'matter'`), and renders `HybridSimulationWrapper` for that lesson.
Ensure these routes bypass the dashboard authentication layout.
</action>
<acceptance_criteria>
- `index.tsx` exists and renders a list/grid of lessons.
- `[id].tsx` exists and renders `<HybridSimulationWrapper>`.
</acceptance_criteria>
</task>

## Verification

### Automated
- `npx tsc --noEmit` completes without `matter-js` or component prop errors.

### Manual
- Start dev server.
- Navigate to `/science-corner`.
- Click a lesson.
- Interact with the simulation to update state.
- Refresh the page and confirm state persists.

## must_haves
- Science Corner routes must be accessible without login.
- `useExperimentState` must save and load from `localStorage`.
- The hybrid wrapper must support all three engine types (matter, canvas, dyn4j).
