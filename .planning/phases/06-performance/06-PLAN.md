# Phase 6: Performance

## Goal
Implement code splitting & lazy loading for major application routes, apply code splitting to heavy dependencies (Monaco, TipTap, Babel) to stay under 1MB chunks, and integrate a bundle analyzer.

## Implementation Steps

### 1. Integrate Bundle Analyzer
- **Target**: `package.json`, `vite.config.ts`
- **Action**: Install `rollup-plugin-visualizer`. Import and add `visualizer({ emitFile: true, filename: "stats.html" })` to Vite plugins so we can monitor chunk sizes.

### 2. Update Code Splitting (Vite)
- **Target**: `vite.config.ts`
- **Action**: Update `manualChunks` to isolate:
  - `monaco-editor` and `@monaco-editor/react` -> `monaco`
  - `monaco-vim` -> `monaco-vim`
  - `@babel/standalone` -> `babel`
  - `z.ai` or other AI libs -> `ai`

### 3. Implement Lazy Loading
- **Target**: `src/App.tsx` (or route definitions)
- **Action**: Replace standard static imports with `React.lazy()` for heavy top-level page components (e.g., `SimulationSandbox`, `SponsorshipBoardPage`, `MarkdownEditorPage`, etc.).
- **Action**: Wrap main `<Routes>` or layout content in a `<Suspense>` boundary with a fallback loader.

## Verification
- Run `npm run build` to verify `stats.html` is generated and no chunk warnings above 1MB occur.
- Verify the app loads properly in the dev server.
