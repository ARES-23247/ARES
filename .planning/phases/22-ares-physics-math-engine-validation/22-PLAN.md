# Phase 22: ARES Physics & Math Engine Validation - Plan

**Status:** Approved
**Created:** 2026-05-05

## Goal
Provide explicit struct definitions for physics engines (Dyn4j, Matter.js) and generic math visualizers.

## Strategy
The build is already clean (`tsc --noEmit` = 0 errors). The engines already have typed interfaces. Work focuses on:
1. Replace `unknown` in `Dyn4jEngine.tsx` props with explicit state struct
2. Resolve `@ts-expect-error` in `field/index.tsx` by adding proper OrbitControls typing
3. Ensure all engine `initialState` props have matching typed interfaces

## Execution Steps

### 1. Type Dyn4jEngine State
- Replace `initialState?: unknown` with explicit `Dyn4jState` interface
- Add typed `onStateChange` callback to match emitted state shape

### 2. Fix Three.js OrbitControls Import
- Check if `@types/three` covers OrbitControls (it does in modern versions)
- If possible, remove the `@ts-expect-error` and use proper import path

### 3. Verify
- Run `npx tsc --noEmit` globally
- Ensure 0 errors
- Ensure no new `@ts-expect-error` directives added

## Verification Plan
1. Global TSC compilation passes with 0 errors.
2. No `@ts-expect-error` directives remain in the engine/sim files.
