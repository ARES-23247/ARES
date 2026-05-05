# Phase 32: Final Validation - Context

**Created:** 2026-05-05
**Status:** Planning

## Objective

Enable ESLint `@typescript-eslint/no-explicit-any` enforcement as an error, remove the API router override, and document all remaining legitimate `any` uses with justification comments.

## User Decisions

### Locked Decisions

**D-01:** ESLint `@typescript-eslint/no-explicit-any` must be changed from "warn" to "error" in `eslint.config.js`

**D-02:** API router override (`files: ["functions/api/routes/**/*.{ts,tsx}"]`) must be removed from `eslint.config.js`

**D-03:** Generated files directory (`src/components/generated/**`) must remain excluded from ESLint

**D-04:** All remaining `any` uses must have inline justification comments following the standard format

**D-05:** Legitimate `any` use categories are: External Library Type Gap, System Boundary Type, Test Mock

## Dependencies

**Phase 30 (Test Types)** must complete first — provides typed test infrastructure that should eliminate most test-related `any` violations

**Phase 31 (Frontend Components)** must complete first — provides component type utilities that eliminate frontend `any` violations

## Success Criteria

1. `eslint.config.js` has `"@typescript-eslint/no-explicit-any": "error"`
2. `eslint.config.js` has no API router override block
3. `src/components/generated/**` remains in ignores
4. Zero `any` violations without inline justification comments
5. All justification comments follow format: `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- [Category]: [Reason]`
6. Final violation count documented in phase summary

## Known Legitimate `any` Uses

Based on RESEARCH.md analysis, the following `any` uses are legitimate and should be preserved with justifications:

### External Library Type Gaps
- TipTap suggestion types (src/components/editor/core/extensions.ts)
- PartyKit provider types (src/components/editor/CollaborativeEditorRoom.tsx)
- Monaco Editor callbacks (src/components/SimulationPlayground.tsx)

### System Boundary Types
- Cloudflare Workers AI types (functions/api/middleware/utils.ts)

### Generated Code
- src/components/generated/sim-registry.ts (excluded via directory ignore)

## Constraints

1. Do NOT add new `any` violations
2. Do NOT remove legitimate `any` uses without proper typing
3. Do NOT change generated file exclusion pattern
4. All changes must be backwards compatible (no runtime behavior changes)

## Questions for User

None — All decisions are locked from RESEARCH.md requirements.
