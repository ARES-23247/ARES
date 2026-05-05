# ARESWEB Comprehensive Code Review Report

**Reviewed:** 2026-05-04
**Depth:** Deep
**Files Reviewed:** 85+ source files across functions/api and src
**Status:** Issues Found

## Summary

This comprehensive audit of the ARES 23247 web portal codebase examined security vulnerabilities, type safety issues, code quality problems, and potential runtime errors. The application uses React + TypeScript frontend with Cloudflare Workers backend (Hono framework) and D1 database.

**Overall Assessment:** The codebase demonstrates strong security awareness with many protective measures in place (rate limiting, CSRF protection, input sanitization), but contains several security vulnerabilities and type safety issues that should be addressed before production deployment.

## Critical Issues

### CR-01: Unsanitized HTML from Zulip Messages (XSS Vulnerability)

**File:** `src/components/ZulipThread.tsx:123`
**Severity:** BLOCKER

**Issue:** Zulip message content is rendered directly using `dangerouslySetInnerHTML` without sanitization. Zulip messages can contain arbitrary HTML from external users, creating a stored XSS vulnerability.

```tsx
<div 
  className="prose prose-sm prose-invert max-w-none text-marble/80 prose-p:my-1 prose-a:text-ares-cyan prose-a:no-underline hover:prose-a:underline"
  dangerouslySetInnerHTML={{ __html: msg.content }} 
/>
```

**Impact:** Attackers who can post to Zulip can inject malicious scripts that execute in the context of aresfirst.org, potentially stealing session tokens, performing actions on behalf of users, or accessing sensitive data.

**Fix:**
```tsx
import { sanitizeHtml } from '../utils/security';

<div 
  className="prose prose-sm prose-invert max-w-none text-marble/80 prose-p:my-1 prose-a:text-ares-cyan prose-a:no-underline hover:prose-a:underline"
  dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.content) }} 
/>
```

---

### CR-02: Hardcoded HTML in Home.tsx Without Sanitization (XSS)

**File:** `src/pages/Home.tsx:91`
**Severity:** BLOCKER

**Issue:** Card content containing HTML anchor tags is rendered via `dangerouslySetInnerHTML` without sanitization.

```tsx
<p className="text-marble/70 text-base leading-relaxed mb-8 flex-grow" dangerouslySetInnerHTML={{ __html: card.body }} />
```

The `card.body` values are defined in the same file and contain HTML:
```tsx
body: "We share our mission with everyone. From the Spark! Center to local labs, we bring <a href='https://www.firstinspires.org/' target='_blank' rel='noopener noreferrer' class='hover:text-ares-red transition-colors underline decoration-ares-red/30 underline-offset-4'><em>FIRST</em></a> to all of West Virginia.",
```

While currently the content is hardcoded, this pattern is unsafe and could lead to XSS if the data source changes to dynamic content.

**Fix:**
```tsx
import { sanitizeHtml } from '../utils/security';

// In the component:
<p className="text-marble/70 text-base leading-relaxed mb-8 flex-grow" dangerouslySetInnerHTML={{ __html: sanitizeHtml(card.body) }} />
```

---

### CR-03: Missing Origin Validation on Message Event Handler

**File:** `src/components/editor/SimPreviewFrame.tsx:21-28`
**Severity:** BLOCKER

**Issue:** The `handleMessage` callback accepts messages from any origin without validation. Combined with `postMessage` calls using `'*'` as target, this creates a potential for cross-frame attacks.

```tsx
const handleMessage = useCallback((event: MessageEvent) => {
  if (event.data?.type === "sim-error") {
    setRuntimeError(event.data.message);
  }
  if (event.data?.type === "sim-ready") {
    setRuntimeError(null);
  }
}, []);
```

**Impact:** Malicious sites could embed the ARES simulation playground and send fake error messages or interfere with the simulation state.

**Fix:**
```tsx
const handleMessage = useCallback((event: MessageEvent) => {
  // Verify message comes from same origin
  if (event.origin !== window.location.origin) return;
  
  if (event.data?.type === "sim-error") {
    setRuntimeError(event.data.message);
  }
  if (event.data?.type === "sim-ready") {
    setRuntimeError(null);
  }
}, []);
```

Also update all `postMessage` calls to use specific origin instead of `'*'`.

---

### CR-04: Excessive Type Assertions Masking Type Errors

**Files:** Multiple (584 occurrences of `as any` across 68 files)
**Severity:** BLOCKER (for type safety)

**Issue:** Widespread use of `as any` type assertions throughout the codebase defeats TypeScript's type checking, potentially hiding runtime type errors.

Examples:
- `functions/api/routes/posts.ts:413`: `await captureHistory(c, slug, current);` - throws error, caught with `as any`
- `functions/api/routes/store.ts:49-50`: Stripe initialization with `@ts-expect-error`
- `functions/api/routes/zulip.ts:34,69,100,etc`: Multiple `as any` casts on response bodies

**Impact:** Type safety is compromised, making it easier for bugs to reach production.

**Fix:** Create proper type definitions for API contracts, database responses, and third-party libraries. Replace `as any` with proper types or type guards.

---

### CR-05: Rate Limit Bypass in Non-Production Environments

**File:** `functions/api/middleware/security.ts:119-122, 153-155`
**Severity:** BLOCKER

**Issue:** Rate limiting is completely disabled in non-production environments:

```typescript
export const rateLimitMiddleware = (limit = 15, windowSeconds = 60) => {
  return async (c: Context<AppEnv>, next: Next) => {
    // SEC-03: Bypass rate limiting in local dev/test if DEV_BYPASS is enabled
    if (c.env.DEV_BYPASS === "true" || c.env.DEV_BYPASS === "1" || c.env.ENVIRONMENT !== "production") {
      return await next();
    }
    // ... rate limiting code
  };
};
```

This means staging, preview, and development deployments have no rate limiting protection.

**Fix:** Only bypass when explicitly authenticated as localhost with proper environment validation:

```typescript
const isLocalDev = c.env.ENVIRONMENT === "development" && 
                   (c.req.header("Host") || "").includes("localhost");

if (isLocalDev && c.env.DEV_BYPASS === "true") {
  return await next();
}
```

---

## Warnings

### WR-01: Unused Code and Imports

**Files:** Multiple
**Severity:** WARNING

**Issue:** Many files contain unused imports and variables, increasing bundle size unnecessarily.

Examples:
- `src/components/SimulationPlayground.tsx:484-500`: `_handleDeleteSim` function defined but never called
- `functions/api/routes/posts.ts:338`: `warnings` variable collected but unused in most paths
- Multiple test files with commented-out code

**Fix:** Remove unused code or configure linter to catch these issues automatically.

---

### WR-02: Inconsistent Error Handling in AI Streaming

**File:** `functions/api/routes/ai/index.ts`
**Severity:** WARNING

**Issue:** Empty catch blocks that silently ignore errors:

```typescript
} catch (_e) { /* ignore */ }
```

Lines: 143, 191, 287, 355, 432, 483, 798, 853

**Impact:** Debugging becomes difficult when errors are silently discarded.

**Fix:** At minimum, log the error:

```typescript
} catch (e) {
  console.error("[AI] Stream parsing error:", e);
}
```

---

### WR-03: Missing Null Checks Before Array Operations

**File:** `functions/api/routes/posts.ts:266-273`
**Severity:** WARNING

**Issue:** Slug generation doesn't handle edge cases where title might be empty or contain only special characters:

```typescript
let slug = body.title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");
```

If `body.title` results in an empty string after sanitization, `slug` will be empty, causing database errors.

**Fix:**
```typescript
let slug = body.title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "") || "untitled-" + Date.now();
```

---

### WR-04: SQL Injection Risk in FTS Search

**File:** `functions/api/[[route]].ts:220-223`
**Severity:** WARNING

**Issue:** While basic sanitization is performed, the FTS5 query construction could be more robust:

```typescript
const qClean = q.replace(/[^a-zA-Z0-9\s]/g, "").trim();
if (!qClean) return c.json({ results: [] });
const ftsQ = `${qClean}*`;
```

**Fix:** Add additional validation for FTS-specific operators:
```typescript
const qClean = q.replace(/[^a-zA-Z0-9\s]/g, "").trim();
// Prevent FTS query injection via special operators
if (!qClean || qClean.length > 100) return c.json({ results: [] });
const ftsQ = qClean.replace(/\*/g, '') + '*'; // Only allow trailing wildcard
```

---

### WR-05: Missing Authorization Check on Simulation Routes

**File:** `functions/api/routes/simulations.ts:89-205`
**Severity:** WARNING

**Issue:** The POST endpoint for saving simulations only checks if user is authenticated (`ensureAuth`), not if they own the simulation being updated:

```typescript
simulationsRouter.post("/", ensureAuth, async (c) => {
  // ... saves simulation to GitHub
});
```

**Impact:** Any authenticated user could potentially overwrite another user's simulation if the ID is guessable.

**Fix:** Implement ownership verification or use IDs that include user identifiers.

---

### WR-06: Hardcoded CDN Dependencies in Simulation Preview

**File:** `src/components/editor/SimPreviewFrame.tsx:57-58, 131-133`
**Severity:** WARNING

**Issue:** Simulation preview depends on external CDNs:
- `https://cdn.tailwindcss.com`
- `https://cdn.jsdelivr.net/npm/html2canvas@1.4.1`
- `https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2` (in SimulationPlayground.tsx)

**Impact:** If these CDNs are compromised or unavailable, the simulation playground breaks.

**Fix:** Vendor these dependencies locally or implement proper Subresource Integrity (SRI) checks.

---

### WR-07: Sensitive Data Exposure in Error Messages

**File:** `functions/api/routes/auth.ts:30`
**Severity:** WARNING

**Issue:** Stack traces exposed in development mode:

```typescript
stack: (c.env as any).ENVIRONMENT === "development" ? err.stack : undefined
```

While this is conditional on development mode, ensure this is truly never exposed in production.

**Fix:** Add additional verification that the request is from localhost:
```typescript
const isDev = c.env.ENVIRONMENT === "development" && 
              (c.req.header("CF-Connecting-IP") === "127.0.0.1" || 
               c.req.header("Host")?.includes("localhost"));

stack: isDev ? err.stack : undefined
```

---

### WR-08: Missing Content-Type Validation on JSON Endpoints

**Files:** Multiple route handlers
**Severity:** WARNING

**Issue:** Many POST/PUT endpoints don't validate `Content-Type: application/json` before parsing body, which could lead to parsing errors or unexpected behavior.

**Fix:** Add middleware to validate content types:
```typescript
app.use("/*", async (c, next) => {
  if (["POST", "PUT", "PATCH"].includes(c.req.method)) {
    const contentType = c.req.header("Content-Type");
    if (contentType && !contentType.includes("application/json") && 
        !contentType.includes("multipart/form-data") &&
        !contentType.includes("application/x-www-form-urlencoded")) {
      return c.json({ error: "Unsupported content type" }, 415);
    }
  }
  await next();
});
```

---

### WR-09: Incomplete Validation in settings.ts

**File:** `functions/api/routes/settings.ts:52-54`
**Severity:** WARNING

**Issue:** The check for masked secrets only looks for prefix, but what if someone submits a value that's exactly 4 dots?

```typescript
if (SENSITIVE_KEYS.has(key) && typeof value === 'string' && value.startsWith('••••')) {
  continue;
}
```

**Fix:** Use a more robust pattern:
```typescript
if (SENSITIVE_KEYS.has(key) && typeof value === 'string' && /^•+$/.test(value)) {
  continue;
}
```

---

### WR-10: Missing Length Validation on Various Input Fields

**Files:** Multiple
**Severity:** WARNING

**Issue:** While `MAX_INPUT_LENGTHS` is defined and used in some places, many endpoints don't validate input lengths before database operations, potentially leading to database errors or DoS.

Examples:
- `functions/api/routes/simulations.ts:96`: No validation on `name` length
- `functions/api/routes/users.ts:94-95`: No validation on `role` or `member_type` values

**Fix:** Add comprehensive input validation using a validation schema (Zod is already a dependency).

---

## Info

### IN-01: Console.log Statements in Production Code

**Files:** Multiple (30+ occurrences found)
**Severity:** INFO

**Issue:** Debug console statements present throughout the codebase. While using a production build will remove many (via dead code elimination), explicit console statements in production code can leak information.

**Fix:** Use a logging utility that respects environment:
```typescript
const log = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? console.log 
  : () => {};
```

---

### IN-02: Inconsistent Naming Conventions

**Files:** Multiple
**Severity:** INFO

**Issue:** Mixed naming conventions across the codebase:
- `cf_email` vs `userEmail`
- `db` vs `database`
- `c` for Context vs `ctx`

**Fix:** Adopt consistent naming conventions and document in style guide.

---

### IN-03: Missing JSDoc Comments on Public Functions

**Files:** Multiple utility files
**Severity:** INFO

**Issue:** Many utility functions lack documentation, making code harder to maintain.

**Fix:** Add JSDoc comments to all exported functions.

---

### IN-04: Large Files Exceeding Maintainability Thresholds

**Files:** 
- `src/components/SimulationPlayground.tsx` (1180+ lines)
- `functions/api/routes/posts.ts` (616 lines)

**Severity:** INFO

**Issue:** These files are difficult to navigate and maintain.

**Fix:** Split into smaller, focused modules with clear responsibilities.

---

## Positive Security Findings

The following security practices were observed and should be maintained:

1. **CSRF Protection**: Properly implemented with origin validation
2. **Rate Limiting**: Both KV-based and D1-based rate limiting for sensitive endpoints
3. **Input Sanitization**: `sanitizeHtml` utility function defined and used in many places
4. **Authentication**: Cloudflare Zero Trust with proper header validation
5. **Secret Masking**: Settings endpoint properly masks sensitive keys
6. **Audit Logging**: Comprehensive audit action logging
7. **SQL Injection Prevention**: Consistent use of Kysely parameterized queries
8. **Turnstile Integration**: CAPTCHA verification on sensitive endpoints

## Recommendations by Priority

### Immediate (Before Next Production Release):
1. Fix CR-01: Sanitize Zulip message content (XSS vulnerability)
2. Fix CR-02: Sanitize hardcoded HTML in Home.tsx
3. Fix CR-03: Add origin validation to postMessage handlers
4. Fix CR-05: Review rate limiting bypass logic

### Short Term (Next Sprint):
1. Address CR-04: Reduce `as any` usage through proper typing
2. Review and fix WR-01 through WR-05
3. Implement WR-08: Content-Type validation middleware

### Long Term:
1. Address remaining warnings (WR-06 through WR-10)
2. Clean up info-level issues (IN-01 through IN-04)
3. Consider security audit of third-party dependencies

---

_Reviewed: 2026-05-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: Deep_
