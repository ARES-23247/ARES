---
phase: auth-security-audit
reviewed: 2025-01-04T00:00:00Z
depth: deep
files_reviewed: 28
files_reviewed_list:
  - functions/api/middleware/auth.ts
  - functions/api/routes/auth.ts
  - functions/utils/auth.ts
  - functions/api/routes/users.ts
  - functions/api/routes/profiles.ts
  - functions/api/routes/posts.ts
  - functions/api/routes/events/handlers.ts
  - functions/api/routes/settings.ts
  - functions/api/routes/badges.ts
  - functions/api/routes/analytics.ts
  - functions/api/routes/comments.ts
  - functions/api/routes/notifications.ts
  - functions/api/routes/docs.ts
  - functions/api/routes/github.ts
  - functions/api/routes/inquiries/index.ts
  - functions/api/routes/outreach/index.ts
  - functions/api/routes/judges.ts
  - functions/api/routes/sponsors.ts
  - functions/api/routes/awards.ts
  - functions/api/routes/locations.ts
  - functions/api/routes/seasons.ts
  - functions/api/routes/tasks.ts
  - functions/api/routes/finance.ts
  - functions/api/routes/store.ts
  - functions/api/routes/tba.ts
  - functions/api/routes/zulip.ts
  - functions/api/routes/zulipWebhook.ts
  - functions/api/middleware/security.ts
  - functions/api/[[route]].ts
  - src/hooks/useDashboardSession.ts
  - src/components/Navbar.tsx
  - src/pages/Dashboard.tsx
  - src/components/dashboard/DashboardRoutes.tsx
findings:
  critical: 8
  warning: 15
  info: 8
  total: 31
status: issues_found
---

# Phase 00: Authentication & Authorization Security Audit

**Reviewed:** 2025-01-04T00:00:00Z
**Depth:** deep
**Files Reviewed:** 28
**Status:** issues_found

## Summary

This audit examined authentication flows, session management, role-based access control (RBAC), Zero Trust security compliance, Cloudflare Access integration, protected route handling, and admin action authorization across the ARES 23247 Web Portal.

The authentication system uses Better Auth with social providers (Google, GitHub, Zulip OAuth2). Session management relies on Better Auth's session cookies with additional database-backed user profiles. Role-based access control is implemented through middleware (`ensureAdmin`, `ensureAuth`) and frontend permission checks.

**Key findings include:** inconsistent middleware application across admin routes, missing Zero Trust security guidance, weak session validation in some endpoints, and several authorization bypass opportunities.

## Critical Issues

### CR-01: Missing Authentication Middleware on Analytics Endpoints
**File:** `functions/api/routes/analytics.ts:359`
**Issue:** The `/analytics/admin/*` route uses `ensureAdmin`, but several endpoints expose potentially sensitive information without authentication:
- `getSummary` (line 71) - exposes system stats
- `getStats` (line 201) - exposes integration status and security block counts
- `getUsageMetrics` (line 234) - exposes detailed usage patterns

These endpoints are NOT protected by `ensureAuth` or `ensureAdmin` middleware, allowing unauthenticated access to sensitive system information.

**Fix:**
```typescript
// Add before the existing middleware line
analyticsRouter.use("/summary", ensureAuth);
analyticsRouter.use("/stats", ensureAuth);
analyticsRouter.use("/usage-metrics", ensureAuth);
// OR apply ensureAuth to all routes
analyticsRouter.use("*", ensureAuth);
```

### CR-02: Incomplete Authorization on Events Handlers
**File:** `functions/api/routes/events/handlers.ts:234-367`
**Issue:** The `saveEvent` handler creates events but performs inconsistent authorization checks. While non-admins can only create pending events, the handler does not validate `getSessionUser` result before use:
```typescript
const user = await getSessionUser(c);
const status = isDraft ? "pending" : (user?.role === "admin" ? "published" : "pending");
```
If `user` is null/unauthenticated, `user?.role` becomes undefined and the event defaults to "pending", allowing unauthenticated event creation.

**Fix:**
```typescript
const user = await getSessionUser(c);
if (!user) return { status: 401 as const, body: { success: false, error: "Authentication required" } };
```

### CR-03: Dev Bypass Enabled for Production-like Environments
**File:** `functions/api/middleware/auth.ts:8-16`
**Issue:** The `isDevBypassEnabled` function checks for `ENVIRONMENT === "development" || "preview" || "test"`, which includes `preview` environments. Preview deployments on Cloudflare Pages are publicly accessible URLs that should not have auth bypassed.

**Fix:**
```typescript
export function isDevBypassEnabled(c: Context<AppEnv>): boolean {
  const isDev = c.env.ENVIRONMENT === "development" || ((globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === "test");
  if (!isDev) return false;
  // ... rest of function
}
```

### CR-04: Store Orders Route Exposes Orders Without Auth Check in Handler
**File:** `functions/api/routes/store.ts:108-113`
**Issue:** The `getOrders` handler checks `sessionUser.role` but does not verify the session exists first:
```typescript
const sessionUser = c.get("sessionUser");
if (!sessionUser || sessionUser.role !== "admin") {
```
However, the sessionUser might not be set because `ensureAdmin` middleware is NOT applied to this route. The route relies on the handler-level check only.

**Fix:**
```typescript
// Add middleware at router level
storeHandler.use("/orders", ensureAdmin);
storeHandler.use("/orders/*", ensureAdmin);
```

### CR-05: Finance Route Lacks Role-Based Authorization for Non-Admin Updates
**File:** `functions/api/routes/finance.ts:95-189`
**Issue:** The `savePipeline` handler only checks `getSessionUser` but doesn't validate if the user has authority to modify sponsorship pipeline data. Any authenticated user can modify pipeline entries.

**Fix:**
```typescript
const user = await getSessionUser(c);
if (!user) return { status: 401 as const, body: { error: "Unauthorized" } };
if (user.role !== "admin" && user.member_type !== "mentor" && user.member_type !== "coach") {
  return { status: 403 as const, body: { error: "Insufficient permissions" } };
}
```

### CR-06: TBA Router Missing Authentication for Team Data Access
**File:** `functions/api/routes/tba.ts`
**Issue:** The TBA (The Blue Alliance) proxy routes do not use any authentication middleware. While TBA data is public, the proxy could be abused for rate limit evasion or unauthorized access to team scouting data.

**Fix:**
```typescript
tbaRouter.use("*", ensureAuth);
tbaRouter.use("*", rateLimitMiddleware(30, 60));
```

### CR-07: Zulip Routes Expose Internal Message History Without Auth
**File:** `functions/api/routes/zulip.ts`
**Issue:** Zulip-related endpoints that may expose internal team communications do not consistently apply `ensureAuth` middleware.

**Fix:** Apply `ensureAuth` to all zulip routes or document why public access is appropriate.

### CR-08: Missing Zero Trust Security Skills Documentation
**File:** `.agents/skills/aresweb-zero-trust-security/SKILL.md`
**Issue:** The Zero Trust security skill file does not exist, meaning there is no documented security standard for:
- Header-based authentication validation
- Spoofable header rejection (`Referer`, `Host`)
- Cloudflare Zero Trust integration requirements
- Session validation patterns

This is CRITICAL because the codebase may not be following Zero Trust principles without documented requirements.

**Fix:** Create the SKILL.md file with mandatory security requirements:
```markdown
# ARES Zero Trust Security

## Mandatory Requirements
1. Never trust client-provided identity headers (Referer, Host, Origin)
2. Always validate sessions server-side using Better Auth
3. Apply ensureAdmin/ensureAuth middleware to all protected routes
...
```

## Warnings

### WR-01: Inconsistent Admin Middleware Application
**Files:** Multiple route files
**Issue:** Admin routes use different patterns for applying `ensureAdmin` middleware:
- Some use `router.use("/admin/*", ensureAdmin)` (consistent)
- Some use `router.use("/admin", ensureAdmin)` (doesn't match subpaths)
- Some apply middleware at individual handler level

This inconsistency creates risk of missing protection on new endpoints.

**Fix:** Standardize on `router.use("/admin/*", ensureAdmin)` pattern across all routers.

### WR-02: Session User Not Cached in All Protected Routes
**File:** `functions/api/middleware/auth.ts:98-129`
**Issue:** `getSessionUser` fetches the user from the database on every call. The comment at line 92 mentions caching sessionUser in context, but `getSessionUser` doesn't set this cache - only `ensureAdmin` and `ensureAuth` do. Routes that call `getSessionUser` directly bypass this optimization.

**Fix:** Have `getSessionUser` also set the context cache after fetching:
```typescript
export async function getSessionUser(c: Context<AppEnv>): Promise<SessionUser | null> {
  const cached = c.get("sessionUser");
  if (cached) return cached as SessionUser;
  
  // ... existing logic ...
  
  if (session && session.user) {
    const result = { /* ... */ };
    c.set("sessionUser", result); // ADD THIS
    return result;
  }
  return null;
}
```

### WR-03: Role Comparison Uses Loose String Equality
**File:** `functions/api/middleware/auth.ts:37`
**Issue:** Role comparison uses direct string matching without normalization:
```typescript
const role = (session.user as { role?: string }).role || UserRole.UNVERIFIED;
```
If the database contains roles with different casing (e.g., "Admin" vs "admin"), authorization may fail unexpectedly.

**Fix:**
```typescript
const role = ((session.user as { role?: string }).role || UserRole.UNVERIFIED).toLowerCase();
const normalizedRole = role === "admin" ? UserRole.ADMIN : /* ... */;
```

### WR-04: Empty Catch Block Swallows Authentication Errors
**File:** `functions/api/middleware/auth.ts:127`
**Issue:** The catch block in `getSessionUser` is completely silent:
```typescript
} catch { /* ignore */ }
```
This makes debugging authentication failures nearly impossible.

**Fix:**
```typescript
} catch (err) {
  console.error("[Auth] getSessionUser failed:", err);
  return null;
}
```

### WR-05: Frontend Authorization Only - No Server-Side Check on Some Routes
**File:** `src/components/dashboard/DashboardRoutes.tsx:89-110`
**Issue:** Many routes use client-side checks only:
```typescript
<Route path="integrations" element={isAdmin ? <IntegrationsManager /> : <div className="text-center py-20">Access Denied</div>} />
```
This is UI-only protection. A malicious user could directly call the API endpoints.

**Fix:** Ensure all admin endpoints have server-side `ensureAdmin` middleware applied.

### WR-06: Comments Update/Delete Allow Non-Owners Based on Member Type
**File:** `functions/api/routes/comments.ts:141-143`
**Issue:** The authorization logic allows any "mentor" or "coach" member type to modify ANY comment:
```typescript
const isModerator = user.role === "admin" || user.member_type === "mentor" || user.member_type === "coach";
```
This overly broad authorization may not be intended.

**Fix:** Consider if moderators should only be able to moderate comments in certain contexts (e.g., their subteams).

### WR-07: Tasks Route Allows Any Authenticated User to Delete Tasks They Created
**File:** `functions/api/routes/tasks.ts:327-345`
**Issue:** Task deletion allows the task creator to delete, but doesn't check if the task is part of a parent project or has dependencies.

**Fix:** Add validation for task deletion when there are dependent items.

### WR-08: GitHub OAuth Token Stored in Database Without Encryption
**File:** `functions/utils/auth.ts:130`
**Issue:** The GitHub access token is stored in the `account` table and later fetched. While this is necessary for GitHub API calls, the token is stored in plaintext.

**Fix:** Consider using token encryption at rest or short-lived tokens with refresh flows.

### WR-09: Settings Update Endpoint Doesn't Validate Permission Level
**File:** `functions/api/routes/settings.ts:45-70`
**Issue:** The `updateSettings` handler is protected by `ensureAdmin` middleware at line 121, but there's no audit logging for sensitive setting changes (like API keys).

**Fix:** Add audit logging for changes to SENSITIVE_KEYS.

### WR-10: Judging Portfolio Endpoint Uses Custom Header-Based Auth
**File:** `functions/api/routes/judges.ts:59-79`
**Issue:** The portfolio endpoint validates `x-judge-code` header directly, bypassing Better Auth session management. This custom auth mechanism doesn't integrate with the standard audit trail.

**Fix:** Consider integrating judge access codes into the main auth system or add explicit audit logging for judge portfolio access.

### WR-11: Admin Inquiries Handler Missing
**File:** `functions/api/routes/inquiries/index.ts`
**Issue:** Only `ensureAdmin` is applied to `/admin/*` routes but there's no validation that the handler checks for admin privileges before exposing PII in inquiry responses.

**Fix:** Ensure inquiry handlers sanitize PII appropriately.

### WR-12: Public Sponsor Endpoint Could Be Scraped for Contact Info
**File:** `functions/api/routes/sponsors.ts:12-34`
**Issue:** The `getSponsors` endpoint is public and returns sponsor information including potentially sensitive tier and contact data.

**Fix:** Consider rate limiting or requiring authentication for sponsor list access.

### WR-13: Season Detail Endpoint Exposes Unpublished Content
**File:** `functions/api/routes/seasons.ts:90-127`
**Issue:** The `getDetail` endpoint filters `seasons` by `status === "published"` but joins with awards, events, posts, and outreach without status filters. Unpublished content in these tables would be exposed.

**Fix:**
```typescript
.where("e.is_deleted", "=", 0)
.where("e.status", "=", "published") // ADD for events
// Similar for posts, docs
```

### WR-14: User Role Change Doesn't Invalidate Existing Sessions
**File:** `functions/api/routes/users.ts:91-131`
**Issue:** When `patchUser` changes a user's role, the system deletes their sessions:
```typescript
await db.deleteFrom("session").where("userId", "=", params.id).execute();
```
However, this only happens when role is explicitly changed. Other auth changes (like member_type updates) don't invalidate sessions.

**Fix:** Document this behavior and consider whether all permission changes should invalidate sessions.

### WR-15: No CSRF Token Validation for State-Changing Requests
**File:** `functions/api/[[route]].ts:129-143`
**Issue:** The CSRF middleware checks origin headers but doesn't implement actual CSRF token validation for state-changing requests. While origin checking helps, it's not as robust as token-based CSRF protection.

**Fix:** Consider implementing CSRF tokens for high-risk operations like settings changes, user role changes, etc.

## Info

### IN-01: Inconsistent Rate Limiting Across Similar Endpoints
**Files:** Various route files
**Issue:** Rate limits vary significantly between similar endpoints:
- Comments: 20/60
- Tasks: 30/60
- Auth: 30/60
- Inquiries: 5/60 for public, 15/60 for admin

**Fix:** Document the rationale for these limits or standardize.

### IN-02: Multiple Auth Pattern Usage Across Codebase
**Files:** Various
**Issue:** The codebase uses multiple patterns for checking authentication:
1. Middleware-based (`ensureAdmin`, `ensureAuth`)
2. Handler-based (`getSessionUser` then check)
3. Context-based (`c.get("sessionUser")`)

**Fix:** Standardize on one pattern with clear documentation of when to use each.

### IN-03: Role Type Not Centralized
**Files:** Multiple files
**Issue:** Role definitions appear in multiple places:
- `UserRole` enum in middleware/utils.ts
- String literals in handlers
- Type definitions in shared schemas

**Fix:** Consolidate role definitions into a single source of truth.

### IN-04: No Session Expiry Configuration Visible
**File:** `functions/utils/auth.ts`
**Issue:** The Better Auth configuration doesn't explicitly set session expiration. This may result in sessions that don't expire, which is a security risk for compromised accounts.

**Fix:** Add explicit session configuration:
```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24, // 1 day
}
```

### IN-05: Frontend Session Caching May Show Stale Permissions
**File:** `src/hooks/useDashboardSession.ts:37`
**Issue:** Session is cached for 5 minutes (`staleTime: 1000 * 60 * 5`). If permissions change during this window, the user may see stale authorization state.

**Fix:** Document this behavior or reduce cache time for sensitive operations.

### IN-06: Audit Log Cleanup Uses Hardcoded 90-Day Retention
**File:** `functions/api/[[route]].ts:316-323`
**Issue:** Audit log retention is hardcoded to 90 days in the cron job. This should be configurable.

**Fix:** Make retention period configurable via environment variable.

### IN-07: Turnstile Bypass Token May Work in Production
**File:** `functions/api/middleware/security.ts:80-85`
**Issue:** The test bypass token check uses `!isProd` but the production check only looks at `ENVIRONMENT === "production"`. If the env var isn't set correctly in production, bypass could work.

**Fix:** Make the fail-closed behavior more explicit:
```typescript
const isProd = c.env.ENVIRONMENT === "production" || c.env.ENVIRONMENT === "preview";
if (token === "test-bypass-token" && !isProd) {
```

### IN-08: No Account Lockout After Failed Authentication Attempts
**File:** `functions/api/routes/auth.ts`
**Issue:** While rate limiting is applied, there's no explicit account lockout mechanism for repeated failed authentication attempts. Rate limiting helps but isn't a substitute for account lockout.

**Fix:** Consider implementing account lockout at the Better Auth level or in custom auth logic.

---

_Reviewed: 2025-01-04T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
