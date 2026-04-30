# Phase 59: Real-Time Telemetry & Data Inspector

## Goal
Add a telemetry panel to the simulation pane capable of graphing real-time variables (velocity, PID error, outputs) using a custom `useTelemetry` hook.

## Steps
1. **Telemetry Protocol (`postMessage`)**:
   - In `SimPreviewFrame.tsx`, inject a global `window.aresTelemetry(key, value)` function that sends a `postMessage` to the parent window with `{ type: "TELEMETRY", key, value, timestamp }`.
   - Implement `export function useTelemetry(key, value)` in the simulated environment. We can inject this as a virtual file `areslib.js` or directly into the global scope. Let's inject a virtual module `areslib` so users can `import { useTelemetry } from "areslib";`.

2. **Telemetry State Management**:
   - In `SimulationPlayground.tsx` (or a subcomponent), add an event listener for `message`.
   - Maintain a state `telemetryData: Record<string, {time: number, value: number}[]>`. Keep the last ~100 points per key.

3. **Telemetry UI Panel**:
   - Create a `TelemetryPanel.tsx` component that renders below the Live Preview or as a collapsible overlay.
   - For each telemetry key, render a simple SVG sparkline or Canvas graph of the recent values.

4. **Template Update**:
   - Update the "Elevator System" template in `SimTemplates.ts` to use `import { useTelemetry } from "areslib";` and graph `PID Error` and `Elevator Height`.

## Automated Execution
Executing immediately.
