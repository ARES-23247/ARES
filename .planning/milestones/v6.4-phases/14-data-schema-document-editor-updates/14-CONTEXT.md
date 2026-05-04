# Phase 14: Data Schema & Document Editor Updates - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Update the D1 database schema and Document Editor UI to support visibility checkboxes.

</domain>

<decisions>
## Implementation Decisions

### Schema Migration & Defaults
- **Existing Docs**: Set `display_in_areslib` to `true` for all existing documents so current content stays exactly where it is. Default the other flags to `false`.
- **New Docs Default**: Default to `false` for all 3 flags — require explicit opt-in for hub visibility.
- **State Conflict**: If a doc is marked "Draft", hide it from all hubs regardless of these 3 checkboxes.

### Editor UI Integration
- **UI Placement**: Add the 3 checkboxes to the **Document Settings / Metadata panel** (where title/slug are set).
- **Permissions**: Any user with "Editor" or "Admin" role can check these boxes.
- **Visual Feedback**: Show a small badge in the document list (e.g., "Areslib", "Math", "Science") to easily see where a doc is published.

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
