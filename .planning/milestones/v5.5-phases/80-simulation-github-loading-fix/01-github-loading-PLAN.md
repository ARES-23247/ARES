# Phase 80: Simulation GitHub Loading Fix Plan

## Goal
Restore the ability to load existing simulations directly from the GitHub repository.

## Proposed Changes

### 1. `SimulationPlayground.tsx`
- **MODIFY** `SimulationPlayground.tsx`
  - Add state variables to track loading state for GitHub sims (`isLoadingGithubSims`, `githubSims`).
  - Create a new function `fetchGithubSims` that fetches `simRegistry.json` from `https://raw.githubusercontent.com/ARES-23247/ARESWEB/main/src/sims/simRegistry.json`.
  - Create a new function `handleLoadGithubSim` that fetches the specific `.tsx` file content from `raw.githubusercontent.com` and updates the `files` state (simulating a loaded project).
  - Update the "Library dropdown" to include a new section or a new button for "Load from GitHub". We will display the fetched `githubSims` directly below the database sims, or add a toggle.
  
## Verification Plan
1. Start `npm run dev`.
2. Navigate to Simulation Playground.
3. Click "Open", then "Fetch from GitHub".
4. Ensure it successfully retrieves the list of simulations and loads the selected file correctly into the Monaco editor.
