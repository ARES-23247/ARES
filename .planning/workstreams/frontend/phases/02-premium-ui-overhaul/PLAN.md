# Phase 2: Premium UI Overhaul

## Goal
Add resizable panes and tabs for power users

## Approach
1. Install `react-resizable-panels` for smooth, accessible split-pane resizing.
2. Refactor the `SimulationPlayground.tsx` layout to use `<PanelGroup>` instead of static CSS grid layouts.
3. Modify the editor header to render a row of tabs for all files present in the `files` state, instead of a dropdown.
4. Add the ability to create a new file or delete a file via the tab interface.
