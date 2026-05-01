# Phase 1: Simulation Engine Fixes

## Goal
Resolve the critical AI and transpilation bugs blocking usage of the Simulation Playground.

## Approach
1. Modify `SIM_TEMPLATES` in `src/components/editor/SimTemplates.ts` to include a minimal `Blank Canvas`.
2. Intercept `SimulationPlayground.tsx`'s AI markdown parsing loop to merge new files over an `initialFiles` snapshot rather than compounding them over previous chunks.
3. Add `isTSX: true` to the Babel `typescript` preset configuration inside `compileCode` to correctly compile the non-null assertion `!` operator.
