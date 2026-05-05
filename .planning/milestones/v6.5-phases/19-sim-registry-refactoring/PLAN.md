# Phase 19: Sim Registry Refactoring

## Objective
Reorganize all 21 simulation components into a scalable subfolder structure with automated registration and admin UI for sim management.

## Context
See [CONTEXT.md](./CONTEXT.md) for full background on maintainability issues with the previous flat structure.

## Tasks

### 1. Reorganize Sims into Subfolders
**Action:** Move each sim file to its own subfolder with `index.tsx`

**Examples:**
- `src/sims/SwerveSim.tsx` → `src/sims/swerve/index.tsx`
- `src/sims/MonteHall.tsx` → `src/sims/montyhall/index.tsx` (fix spelling)

**Files affected:** All 21 sim files

### 2. Update simRegistry.json Paths
**File:** `src/sims/simRegistry.json`
- Update all `path` fields from `"./SwerveSim"` to `"./swerve"`
- Fix `"Monte Hall Paradox Simulation"` → `"Monty Hall Problem"`
- Fix `"id": "MonteHall"` → `"MontyHall"`

### 3. Create Auto-Generation Script
**File:** `scripts/generate-sim-registry.ts`
- Read `simRegistry.json`
- Generate lazy imports for all sims
- Generate `SIM_COMPONENTS` mapping object
- Output to `src/components/generated/sim-registry.ts`

### 4. Update Component Imports
**Files:**
- `src/components/docs/DocsMarkdownRenderer.tsx`
- `src/components/TiptapRenderer.tsx`
- `src/components/SimulationPlayground.tsx`

Replace manual lazy imports with:
```typescript
import { SIM_COMPONENTS, SIM_TAG_NAMES } from "../generated/sim-registry";
```

### 5. Create Admin UI
**File:** `src/components/SimManager.tsx`
- Visual grid of all registered sims
- Add/Edit/Delete functionality
- Copy-to-clipboard for generated JSON
- Setup instructions display

### 6. Add to Dashboard Routes
**Files:**
- `src/components/dashboard/DashboardRoutes.tsx` — Add `/dashboard/sims` route
- `src/components/dashboard/DashboardSidebar.tsx` — Add navigation button

### 7. Update Build Process
**File:** `package.json`
- Add `"generate:sims": "tsx scripts/generate-sim-registry.ts"` script
- Update `"build"` script to run `generate:sims` first

### 8. Fix Internal Sim Imports
**Files:**
- `src/sims/field/index.tsx` — Fix `"./field/FieldData"` → `"./FieldData"`
- `src/sims/performance/index.tsx` — Fix `"./performance/LogParser"` → `"./LogParser"`
- `src/sims/performance/index.tsx` — Fix CSS path to parent folder
- `src/sims/troubleshooting/index.tsx` — Fix CSS path to parent folder

### 9. Update ESLint Config
**File:** `eslint.config.js`
- Add `"src/components/generated/**"` to ignores

## Verification
- ✅ Build succeeds: `npm run build`
- ✅ All 21 sims accessible in markdown via lowercase tags
- ✅ Sim Manager UI accessible at `/dashboard/sims` (admin only)
- ✅ Adding new sim only requires updating `simRegistry.json` and running build

## Commits
- `9cb94af` — refactor(sims): reorganize all sims into subfolder structure
- `7bcaaa0` — fix(sims): rename Monte Hall to Monty Hall and add auto-registration
