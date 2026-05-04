---
phase: 07-integration-verification-resilience
reviewed: 2026-05-04T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - tests/e2e/collaboration.spec.ts
  - src/components/editor/CollaborativeEditorRoom.tsx
  - partykit/server.ts
  - wrangler.toml
findings:
  critical: 10
  warning: 6
  info: 0
  total: 16
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-05-04
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed PartyKit collaborative editing integration including the React component (`CollaborativeEditorRoom.tsx`), PartyKit server (`partykit/server.ts`), E2E tests (`collaboration.spec.ts`), and configuration (`wrangler.toml`). 

**Critical findings identified:**

1. **Memory leaks in reconnection logic** - old WebSocket providers are never destroyed when creating new ones, causing accumulating connections
2. **Infinite reconnection loop** - useEffect and attemptReconnect create a circular trigger pattern
3. **Missing D1 await** - database operations may not complete before response
4. **Base64 encoding failure on large documents** - spread operator will fail on documents >~65KB
5. **Missing useEffect dependencies** - stale closures and incorrect state values

## Critical Issues

### CR-01: Memory leak on reconnection - provider never destroyed

**File:** `src/components/editor/CollaborativeEditorRoom.tsx:118-141`

**Issue:** When `attemptReconnect` creates a new `YPartyKitProvider`, the previous provider instance is never destroyed. This accumulates WebSocket connections and event listeners on each reconnection attempt.

```typescript
// Lines 118-141 - BROKEN CODE
reconnectTimeoutRef.current = setTimeout(() => {
  const newProvider = new YPartyKitProvider(host, roomId, ydoc);
  // ... setup handlers ...
  // Old provider from line 58 is NEVER destroyed!
}, delay);
```

The same issue exists in `handleManualReconnect` (lines 157-180).

**Fix:** Track the current provider and destroy it before creating a new one:

```typescript
// Add ref to track current provider
const providerRef = useRef<any>(null);

// In attemptReconnect:
reconnectTimeoutRef.current = setTimeout(() => {
  // Destroy old provider first
  if (providerRef.current) {
    providerRef.current.destroy();
  }

  const newProvider = new YPartyKitProvider(host, roomId, ydoc);
  providerRef.current = newProvider;
  // ... rest of setup ...
}, delay);

// Also update initial useEffect (line 58) to store the provider
```

### CR-02: Infinite reconnection loop due to useEffect trigger

**File:** `src/components/editor/CollaborativeEditorRoom.tsx:144-149`

**Issue:** The useEffect at lines 144-149 calls `attemptReconnect` whenever `reconnectAttempt > 0`. The `attemptReconnect` function increments `reconnectAttempt` on connection-error (line 136). This creates an immediate re-trigger cycle:

1. reconnectAttempt becomes 1
2. useEffect runs, calls attemptReconnect
3. New provider fails to connect
4. connection-error fires, sets reconnectAttempt to 2
5. useEffect runs again immediately (infinite loop)

**Fix:** Remove the automatic re-trigger useEffect. The `attemptReconnect` function should schedule its own next attempt:

```typescript
// DELETE lines 144-149 entirely

// Modify attemptReconnect to recursively schedule next attempt on failure:
newProvider.on("connection-error", () => {
  const nextAttempt = reconnectAttempt + 1;
  setReconnectAttempt(nextAttempt);

  if (nextAttempt < MAX_RECONNECT_ATTEMPTS) {
    // Schedule next attempt directly from here
    const nextDelay = RECONNECT_DELAYS[nextAttempt];
    reconnectTimeoutRef.current = setTimeout(() => {
      attemptReconnect();
    }, nextDelay);
  } else {
    setIsReconnecting(false);
  }
});
```

### CR-03: D1 database operations not awaited

**File:** `partykit/server.ts:61-70`

**Issue:** The `run()` call on the prepared D1 statement returns a Promise but is not awaited. In Cloudflare Workers, D1 operations are async and must be awaited to ensure completion.

```typescript
// Line 70 - BROKEN CODE
.bind(this.room.id, base64)
.run(); // Not awaited!
```

**Fix:** Await the run() call:

```typescript
await db
  .prepare(`
    INSERT INTO document_snapshots (room_id, state, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(room_id) DO UPDATE SET
      state = excluded.state,
      updated_at = CURRENT_TIMESTAMP
  `)
  .bind(this.room.id, base64)
  .run();
```

### CR-04: Base64 encoding fails on large documents

**File:** `partykit/server.ts:33,59`

**Issue:** Using `String.fromCharCode(...state)` with spread operator on a `Uint8Array` will fail for documents larger than ~65KB because `String.fromCharCode` has a maximum argument limit (varies by engine, typically 65536).

```typescript
// Line 33 - BROKEN for large documents
const binary = Uint8Array.from(atob(result.state), c => c.charCodeAt(0));

// Line 59 - BROKEN for large documents  
const base64 = btoa(String.fromCharCode(...state));
```

**Fix:** Use a loop-based approach:

```typescript
// For decoding (line 33):
const binaryStr = atob(result.state);
const binary = new Uint8Array(binaryStr.length);
for (let i = 0; i < binaryStr.length; i++) {
  binary[i] = binaryStr.charCodeAt(i);
}

// For encoding (line 59):
const base64 = btoa(String.fromCharCode.apply(null, Array.from(state)));
// OR better, use a chunking approach for very large documents
```

### CR-05: Missing useEffect dependencies causes stale closures

**File:** `src/components/editor/CollaborativeEditorRoom.tsx:104`

**Issue:** The useEffect dependency array only includes `[roomId, host]` but the effect uses `ydoc`, `onDocLoaded`, and `attemptReconnect`. When these change, the effect doesn't re-run, causing it to operate on stale values.

```typescript
// Line 104 - BROKEN CODE
}, [roomId, host]); // Missing: ydoc, onDocLoaded, attemptReconnect
```

**Fix:** Add all non-ref dependencies:

```typescript
}, [roomId, host, ydoc, onDocLoaded, attemptReconnect]);
```

Note: Adding `attemptReconnect` will require fixing the infinite loop issue in CR-02 first, otherwise the dependency cycle will cause infinite re-renders.

### CR-06: Stale closure in connection-error handler

**File:** `src/components/editor/CollaborativeEditorRoom.tsx:135-141`

**Issue:** The `connection-error` handler reads `reconnectAttempt` from closure. By the time the async connection fails, `reconnectAttempt` may have changed, causing incorrect increment logic.

```typescript
// Lines 135-141 - BROKEN CODE
newProvider.on("connection-error", () => {
  setReconnectAttempt(prev => prev + 1); // This is correct (uses functional update)
  if (reconnectAttempt + 1 >= MAX_RECONNECT_ATTEMPTS) { // BUG: reads stale closure value
    setIsReconnecting(false);
  }
});
```

**Fix:** Use functional state update consistently:

```typescript
newProvider.on("connection-error", () => {
  setReconnectAttempt(prev => {
    const next = prev + 1;
    if (next >= MAX_RECONNECT_ATTEMPTS) {
      setIsReconnecting(false);
    }
    return next;
  });
});
```

### CR-07: Race condition in timeout handler

**File:** `src/components/editor/CollaborativeEditorRoom.tsx:60-64`

**Issue:** Between the check `if (synced && timeoutRef.current)` and `clearTimeout(timeoutRef.current)`, another execution path could have already cleared or nullified the timeout. This is a check-then-act race condition.

```typescript
// Lines 60-64 - POTENTIAL RACE CONDITION
newProvider.on("synced", (synced: boolean) => {
  if (synced && timeoutRef.current) { // Check
    clearTimeout(timeoutRef.current); // Act - may be null here!
    timeoutRef.current = null;
  }
```

**Fix:** Use a try-finally pattern or capture the reference:

```typescript
newProvider.on("synced", (synced: boolean) => {
  if (synced) {
    const timeout = timeoutRef.current;
    if (timeout) {
      clearTimeout(timeout);
      timeoutRef.current = null;
    }
    // ... rest of handler
  }
});
```

### CR-08: Manual reconnect creates orphaned providers

**File:** `src/components/editor/CollaborativeEditorRoom.tsx:157-180`

**Issue:** The `handleManualReconnect` function creates a new provider without destroying the existing one from `provider` state. Same memory leak as CR-01.

```typescript
// Lines 157-180 - BROKEN CODE
const handleManualReconnect = useCallback(() => {
  setReconnectAttempt(0);
  setIsReconnecting(true);
  const delay = RECONNECT_DELAYS[0];
  reconnectTimeoutRef.current = setTimeout(() => {
    const newProvider = new YPartyKitProvider(host, roomId, ydoc);
    // Never destroys old provider from 'provider' state!
```

**Fix:** Same as CR-01 - track and destroy previous provider.

### CR-09: Missing room_id validation allows potential abuse

**File:** `partykit/server.ts:27-28`

**Issue:** While SQL injection is prevented via parameterized queries, there's no validation on `this.room.id` format. Malicious users could create room IDs with extremely long strings or special characters, potentially causing database issues or bypassing intended scoping.

```typescript
// Line 27-29 - NO VALIDATION
const result = await db
  .prepare("SELECT state FROM document_snapshots WHERE room_id = ?")
  .bind(this.room.id) // No validation of room.id format
  .first<{ state: string }>();
```

**Fix:** Add validation:

```typescript
// Validate room ID format before database operations
const roomId = this.room.id;
if (!/^[a-zA-Z0-9_-]{1,100}$/.test(roomId)) {
  throw new Error(`Invalid room_id format: ${roomId}`);
}
```

### CR-10: Missing error propagation in snapshot loading

**File:** `partykit/server.ts:40-43`

**Issue:** When snapshot loading fails, the error is logged but `null` is returned. This silently fails to load existing data, potentially causing data loss without the user knowing.

```typescript
// Lines 40-43 - SILENT FAILURE
} catch (err) {
  console.error(`[PartyKit] Failed to load snapshot for room ${this.room.id}:`, err);
  return null; // Silent failure - document starts empty
}
```

**Fix:** Propagate error context:

```typescript
} catch (err) {
  console.error(`[PartyKit] Failed to load snapshot for room ${this.room.id}:`, err);
  // Consider throwing if this is a critical error, or at minimum
  // track the failure for monitoring/debugging
  return null;
}
```

At minimum, add telemetry/logging aggregation for this failure case.

## Warnings

### WR-01: Unused parameter `_initialContent`

**File:** `src/components/editor/CollaborativeEditorRoom.tsx:268`

**Issue:** The `_initialContent` parameter is destructured but never used. The underscore prefix suggests it was intentionally marked as unused, but if it was meant to initialize the Yjs document, that functionality is missing.

```typescript
// Line 268
export function CollaborativeEditorRoom({
  roomId,
  children,
  _initialContent,  // Never used
  onDocLoaded,
}: {
  roomId: string;
  children: React.ReactNode;
  _initialContent?: string;  // Unused parameter
  onDocLoaded?: (ydoc: Y.Doc) => void;
})
```

**Fix:** Either implement the functionality or remove the parameter:

```typescript
// Option 1: Remove it
export function CollaborativeEditorRoom({
  roomId,
  children,
  onDocLoaded,
}: {
  roomId: string;
  children: React.ReactNode;
  onDocLoaded?: (ydoc: Y.Doc) => void;
}) {

// Option 2: Implement it
const [ydoc] = useState<Y.Doc>(() => {
  const doc = new Y.Doc();
  if (_initialContent) {
    // Apply initial content to doc
    Y.applyUpdate(doc, Uint8Array.from(atob(_initialContent), c => c.charCodeAt(0)));
  }
  return doc;
});
```

### WR-02: Unsafe `any` type for provider

**File:** `src/components/editor/CollaborativeEditorRoom.tsx:47`

**Issue:** Provider state is typed as `any`, losing type safety.

```typescript
// Line 47
const [provider, setProvider] = useState<any>(undefined);
```

**Fix:** Use proper type from y-partykit:

```typescript
import type { PartyKitProvider } from "y-partykit/provider";

const [provider, setProvider] = useState<PartyKitProvider | undefined>(undefined);
```

### WR-03: Unbounded ESLint disable

**File:** `src/components/editor/CollaborativeEditorRoom.tsx:1`

**Issue:** `/* eslint-disable */` at the top of the file disables ALL ESLint rules without justification.

**Fix:** Either remove it or specify which rules need disabling and why:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any -- PartyKit provider types are incomplete */
```

### WR-04: Flaky test selector

**File:** `tests/e2e/collaboration.spec.ts:153`

**Issue:** Using `.first()` on a text selector is fragile. If there are multiple "Test Task" elements, `.first()` may click the wrong one.

```typescript
// Line 153
await page.getByText('Test Task').first().click();
```

**Fix:** Use a more specific selector:

```typescript
await page.getByRole('button', { name: 'Test Task' }).click();
// Or add a test-id to the element:
await page.getByTestId('task-test-task-id').click();
```

### WR-05: Duplicate database_id in wrangler.toml

**File:** `wrangler.toml:8,23`

**Issue:** Both the main `d1_databases` binding and `partykit_d1_databases` use the same `database_id`. While this might be intentional (sharing the same DB), it's confusing and could lead to unexpected behavior.

```toml
# Line 8
[[d1_databases]]
binding = "DB"
database_id = "24d5e2b3-5ad5-4e17-9c73-76b9a0030d16"

# Line 23
[[partykit_d1_databases]]
binding = "PK_DB"
database_id = "24d5e2b3-5ad5-4e17-9c73-76b9a0030d16"  # Same ID
```

**Fix:** Add a comment explaining the sharing or use separate databases:

```toml
# PartyKit shares the main D1 database for document snapshots
[[partykit_d1_databases]]
binding = "PK_DB"
database_name = "ares-db"
database_id = "24d5e2b3-5ad5-4e17-9c73-76b9a0030d16"  # Shared with main DB binding
```

### WR-06: Missing cleanup on unmount during reconnection

**File:** `src/components/editor/CollaborativeEditorRoom.tsx:95-103`

**Issue:** The cleanup function clears timeouts and destroys the initial provider, but if a reconnection is in progress (with its own timeout and provider), those are not cleaned up.

```typescript
// Lines 95-103
return () => {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }
  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current);
  }
  newProvider.destroy();  // Only destroys the initial provider
};
```

**Fix:** Track all created providers and destroy them all:

```typescript
// Add ref to track all providers
const providersRef = useRef<Set<any>>(new Set());

// When creating providers, add to set
providersRef.current.add(newProvider);

// In cleanup:
return () => {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }
  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current);
  }
  // Destroy ALL providers
  providersRef.current.forEach(p => p.destroy());
  providersRef.current.clear();
};
```

---

_Reviewed: 2026-05-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
