# Phase 33 Validation Strategy

## Core Principles
1. **Verification by Observable Truth:** Tests must assert against DOM state, console outputs, or file system presence.
2. **Strict Grep Criteria:** Automation must use exact matches, not loose regex or natural language.
3. **Purity of State:** Database or global state mutations must be cleaned up in teardown.

## Validation Dimensions

### Dimension 1: Build & Type Safety
*   **Command:** `npx tsc --noEmit && npx vite build`
*   **Acceptance:** Exit code `0`

### Dimension 2: Lint & Style
*   **Command:** `npx eslint "src/**/*.{ts,tsx}" --max-warnings 0`
*   **Acceptance:** Exit code `0`

### Dimension 3: Unit / Integration Tests
*   **Command:** `npx vitest run --passWithNoTests`
*   **Acceptance:** Exit code `0`

### Dimension 4: DOM / Component Contracts
*   **Command:** grep for `<MonacoDiffEditor` and `<MonacoEditor` conditionally rendered in `SimulationPlayground.tsx`
*   **Acceptance:** Both components must exist and be conditionally rendered based on `pendingAiChanges`.

### Dimension 5: Event / Data Flow
*   **Command:** grep for `pendingAiChanges` handling in `useSimulationChat.ts` and `SimulationPlayground.tsx`
*   **Acceptance:** `setPendingAiChanges` must be called with complete files at the END of the stream, and NOT during the stream.

### Dimension 6: Error / Edge Case Handling
*   **Command:** Check reject flow.
*   **Acceptance:** Rejecting must clear `pendingAiChanges` without modifying `files`.

### Dimension 7: Performance / Security
*   **Command:** Ensure `<MonacoDiffEditor>` uses the lazy-loaded instance.
*   **Acceptance:** Avoid synchronous loading of monaco in the main bundle.

### Dimension 8: Nyquist Gate
*   **Criterion:** All prior 7 dimensions must pass before this phase is considered DONE.
