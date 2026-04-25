---
name: aresweb-failure-exposure
description: Enforces championship-grade error reporting and diagnostic visibility across the ARES Web Portal, ensuring that technical failures are never "silent" and always surface actionable data (like HTTP status codes) to administrators and developers.
---

# ARES 23247 Failure Exposure & Diagnostic Protocol

To maintain a championship-tier production environment, the ARES Web Portal must be resilient AND diagnosable. This skill dictates how failures should be handled and presented to ensure rapid remediation by team members.

## 1. The "No Silent Failure" Rule
Technical failures (network errors, API rejections, database crashes) must **NEVER** fail silently with a generic message like "Something went wrong." 

When an operation fails, you must capture the most granular data possible and present it in a secondary diagnostic layer.

### 1a. The "No Fake Success" Rule
A particularly dangerous variant of silent failure is **catch blocks that return HTTP 200 with empty data** (e.g., `catch { return { status: 200, body: { docs: [] } } }`). This makes the frontend believe the request succeeded with zero results, when in reality the database query or upstream call crashed. The developer sees an empty list with no error indicator, making the root cause nearly impossible to find.

- ❌ **BANNED**: `catch { return { status: 200 as const, body: { items: [] } }; }`
- ✅ **AUTHORIZED**: `catch (e) { console.error("HANDLER_NAME ERROR", e); return { status: 500 as const, body: { error: "Failed to fetch items" } }; }`

All `catch` blocks in API route handlers MUST log the error with `console.error` AND return a non-2xx status code so that the frontend's `isError` flags activate properly.

## 2. Mandatory HTTP Status Exposure
All `fetch` calls or API mutations in the Dashboard must verify the `response.ok` status. If a request fails, the UI must display the numeric HTTP status code and the status text.

- ❌ **BANNED**: `throw new Error("Failed to load")`
- ✅ **AUTHORIZED**: `if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)`

## 3. Visual Treatment of Diagnostics
Diagnostic data (error codes, internal messages, stack traces) must be clearly separated from user-facing instructions using technical styling.

- **Typography**: Always use `font-mono` (the monospace stack) for status codes and internal error strings.
- **Opacity**: Use subtle opacities (e.g., `/80`) for diagnostic text to keep the primary UI clean while still providing detail.
- **Color**: Diagnostic errors must use `ares-red` backgrounds (`bg-ares-red/10`) and borders to signal urgency.

## 4. Protected Route Failure Context
Because the ARES Dashboard is protected by rigorous Better Auth session validation, many failures are actually authentication rejections (401/403). 

- If an error is an `HTTP 401`, the UI should explicitly suggest checking their session and logging in again.
- Backend middleware (`ensureAdmin`) must return structured JSON errors describing *why* access was denied (e.g., "Forbidden: Requires author privileges").

## 5. Backend Logging Parity
Every error returned to the client must also be logged on the edge using `console.error`. 
- Include the request path, the user email (if available via the active session object), and the specific error message.
- This ensures that Cloudflare Logpush or real-time logs capture the failure for remote debugging.

## 6. Execution
Whenever you are building or refactoring API-connected components, you must verify that the error states satisfy these requirements. If you find a component with a "lazy" error state, rewrite it to include a diagnostic breakdown before finalizing your work.

## 7. Scalability vs. Diagnostic Visibility (waitUntil)
To maintain immediate response times on the Cloudflare Edge, non-critical background tasks (social syndication, calendar batching, Zulip alerts) MUST be offloaded using `c.executionCtx.waitUntil()`.

- **Requirement**: Any task wrapped in `waitUntil` must include its own internal error handling (`.catch()` or `try/catch`) to ensure failures are logged to the backend console even if they cannot be bubbled to the UI.
- **Critical Path Rule**: Only use `await` for mutations that directly affect the primary database record being saved (e.g., the D1 SQL insert). If the database save succeeds, return a success response to the user and offload the "side effects" to the background.
- ✅ **AUTHORIZED**: `c.executionCtx.waitUntil( dispatchSocials(...).catch(err => console.error(err)) )`
- ❌ **BANNED**: Using `await` on slow external APIs (Zulip, BlueSky, Google) inside the main request lifecycle, which blocks the user interface.
