# Phase 80: improve-sim-sandbox-error-messages - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary
Fixing AI multi-turn conversational logic and improving error handling in the Simulation Sandbox.
</domain>

<decisions>
## Implementation Decisions

### Error Presentation
- **Inline Messages**: Errors will be presented inline within the chat history as system/error messages to preserve conversational context.

### Error Detail Level
- **Full Details Exposed**: The UI will expose the full technical details, including exact API error codes and stack traces, directly to the user for easier debugging.

### Fallback Behavior
- **Auto-Retry**: The system will automatically attempt 1-2 background retries on transient failures (like network timeouts or rate limits) before finally presenting the inline error to the user.

### Multi-turn State Management
- **Local Storage**: Conversational history will be persisted in Local Storage. This provides survival across page refreshes without needing backend synchronization.
</decisions>

<canonical_refs>
## Canonical References
No external specs — requirements fully captured in decisions above.
</canonical_refs>

<specifics>
## Specific Ideas
- Ensure that inline error messages still allow the user to easily read the preceding context.
- Ensure Local Storage state management clears cleanly when a user intentionally starts a new session or clears the sandbox.
</specifics>

<deferred>
## Deferred Ideas
None.
</deferred>

---

*Phase: 80-improve-sim-sandbox-error-messages*
*Context gathered: 2026-05-01 via interactive discuss-phase*
