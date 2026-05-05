# Phase 19: Sim Registry Refactoring - Context

**Gathered:** 2026-05-04
**Status:** Completed
**Source:** Direct Implementation

<domain>
## Phase Boundary

The simulation system in ARESWEB had grown organically with 21+ simulators stored as individual TypeScript files in `src/sims/`. This structure presented several maintainability issues:

1. **No multi-file support** - Each sim was constrained to a single file, limiting complexity
2. **Manual registration** - Adding new sims required updating lazy imports in 3 separate files
3. **Fragile naming** - Monte Hall was misspelled ("Monte" not "Monty")
4. **No admin UI** - Sim management required terminal usage

This phase reorganizes all sims into subfolders (each with `index.tsx`), creates an auto-generation script, and adds a web-based management UI.
</domain>

<decisions>
## Implementation Decisions

### Folder Structure
- Each sim gets its own subfolder: `src/sims/{simname}/index.tsx`
- CSS files remain in parent `src/sims/` for shared sims (TroubleshootingWizard.css, PerformanceDashboard.css)
- `simRegistry.json` becomes the single source of truth

### Auto-Generation
- Build script `scripts/generate-sim-registry.ts` reads `simRegistry.json`
- Generates `src/components/generated/sim-registry.ts` with all lazy imports
- Runs automatically during `npm run build`

### Admin UI
- New `/dashboard/sims` route (admin only)
- Provides visual interface for add/edit/delete sims
- Generates copy-paste ready JSON for manual updates
- Shows setup instructions for each sim
</decisions>

<canonical_refs>
## Canonical References

### Core Files
- `src/sims/simRegistry.json` — Source of truth for all sims
- `scripts/generate-sim-registry.ts` — Auto-generation script
- `src/components/generated/sim-registry.ts` — Generated lazy imports
- `src/components/SimManager.tsx` — Admin UI component
- `src/components/docs/DocsMarkdownRenderer.tsx` — Markdown renderer using generated registry
- `src/components/TiptapRenderer.tsx` — Rich text editor using generated registry
</canonical_refs>

<specifics>
## Specific Ideas

- Tag names in markdown are lowercase IDs: `<montyhall />` for MontyHall sim
- Internal sim imports use relative paths: `import("../../sims/montyhall")`
- The generated file is ESLint-ignored to prevent linting noise
</specifics>

<deferred>
## Deferred Ideas

- Server-side API endpoint for direct file writing (requires security considerations)
- Hot-reload of sim registry without full rebuild
</deferred>
