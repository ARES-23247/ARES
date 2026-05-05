# Phase 23: R3F & Sim Component Typings — Plan

**Status:** Approved
**Created:** 2026-05-05

## Goal
Strictly type React context providers, 3D meshes, refs, and simulation component props.

## Execution Steps

### 1. Type PhysicsWorld and SwerveModule
- Add `PhysicsWorldProps` interface: `children`, `cameraPos`, `bg`
- Add `SwerveModuleProps` interface: `position`, `rotation`, `wheelSpeed`
- Remove `as [number, number, number]` casts where types now enforce tuples

### 2. Verify
- `npx tsc --noEmit` → 0 errors

## Verification Plan
1. Global TSC pass with 0 errors.
2. No `any` props in R3F components.
