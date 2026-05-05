# Phase 24: ESLint Lockdown & CI Validation

## Goal
Enable `@typescript-eslint/no-explicit-any` globally and validate types via TSC without bypassing.

## Proposed Changes

### `eslint.config.js`
- **[MODIFY]** Change `@typescript-eslint/no-explicit-any` from `"warn"` to `"error"`.
- **[MODIFY]** Remove the `files: ["functions/api/routes/**/*.{ts,tsx}"]` exemption block entirely.

### Codebase Type Strictness
- **[MODIFY]** Replace `any` usages with specific types (e.g., `unknown`, `Record<string, unknown>`, generic parameters, or correct Domain models).
- **[MODIFY]** Remove all `// eslint-disable-next-line @typescript-eslint/no-explicit-any` and `/* eslint-disable @typescript-eslint/no-explicit-any */` comments.
- **[MODIFY]** Fix resulting `tsc` errors by implementing proper type narrowing or casting.

## Verification Plan
### Automated Tests
- Run `npm run lint` and expect 0 errors.
- Run `npx tsc --noEmit` and expect 0 errors.

## Known Challenges
- The codebase currently has 983 instances of explicit `any` across 75 files.
- Blindly replacing `any` with `unknown` results in ~2500 TS compilation errors due to lost property access.
- We will execute as much type stabilization as possible within the constraints. If the structural changes are too vast for one cycle, we will halt and request human intervention as per the Three-Strike rule.
