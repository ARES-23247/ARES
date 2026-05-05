# Authentication Patterns Documentation

This document standardizes authentication and authorization patterns used across the ARES 23247 Web Portal codebase.

## Authentication Patterns

### 1. Middleware-Based Authentication (Preferred)

Use middleware for route-level authentication:

```typescript
import { ensureAuth, ensureAdmin } from "../middleware/auth";

// Apply to all routes in a router
router.use("*", ensureAuth);

// Apply to specific route patterns
router.use("/admin/*", ensureAdmin);
router.use("/sensitive/*", ensureAuth);
```

**When to use:**
- All API routes that require authentication
- Admin endpoints that require role-based access
- Routes that handle sensitive data

**Benefits:**
- Centralized authentication logic
- Consistent error handling
- Automatic session caching in context

### 2. Handler-Based Authentication

For fine-grained control within a handler:

```typescript
const user = await getSessionUser(c);
if (!user) {
  return { status: 401 as const, body: { error: "Unauthorized" } };
}
if (user.role !== "admin") {
  return { status: 403 as const, body: { error: "Forbidden" } };
}
```

**When to use:**
- Complex authorization logic (e.g., resource ownership checks)
- Conditional access based on multiple factors
- Custom role checks beyond admin/user

### 3. Context-Based Authentication

Access cached session data after middleware has run:

```typescript
const sessionUser = c.get("sessionUser");
if (!sessionUser) {
  // Handle unauthenticated state
}
```

**When to use:**
- Inside handlers after middleware has already authenticated
- When you need session data but don't need to re-authenticate

## Rate Limiting Standards

The following rate limits are applied across similar endpoints:

| Endpoint Type | Limit | Window | Rationale |
|---------------|-------|--------|-----------|
| Authentication (`/auth/*`) | 30 req | 60 sec | Prevents brute force attacks |
| Comments (`/comments/*`) | 20 req | 60 sec | Prevents spam while allowing discussion |
| Tasks (`/tasks/*`) | 30 req | 60 sec | Allows normal task management |
| Inquiries (public) | 5 req | 60 sec | Strict limit for public contact form |
| Inquiries (admin) | 15 req | 60 sec | Higher limit for authenticated admins |

## Role Definitions

Role definitions are centralized in `functions/api/middleware/utils.ts`:

```typescript
export const UserRole = {
  ADMIN: "admin",
  AUTHOR: "author",
  UNVERIFIED: "unverified",
} as const;
```

**Roles:**
- `admin`: Full system access, can manage users and settings
- `author`: Can create and manage content (posts, events, docs)
- `unverified`: New users pending verification

**Member Types (from user profiles):**
- `student`: Student member
- `mentor`: Adult mentor
- `coach`: Team coach
- `parent`: Parent volunteer
- `alumnus`: Alumni member

## Session Configuration

Sessions use Better Auth with the following configuration:

- **Expiration**: 7 days (configurable via Better Auth)
- **Update Age**: 1 day (session refresh interval)
- **Storage**: Database-backed (D1 session table)

## Security Best Practices

### 1. Never Trust Client Headers
Always validate sessions server-side. Headers like `Referer` and `Host` can be spoofed.

### 2. Apply Middleware Before Route Handlers
Order matters - middleware runs before handlers:

```typescript
// Correct
router.use("/admin/*", ensureAdmin);
router.get("/admin/users", getUsersHandler);

// Incorrect - handler runs without middleware
router.get("/admin/users", ensureAdmin, getUsersHandler);
```

### 3. Use Standard Route Patterns
- Use `/*` wildcard for subpaths: `/admin/*` not `/admin`
- Apply middleware at router level, not per-handler
- Document any deviations from standard patterns

### 4. Account Lockout Considerations
While rate limiting provides basic protection, the following should be considered for enhanced security:
- Implement account lockout after N failed attempts
- Add exponential backoff for repeated failures
- Notify users of suspicious login attempts

## Environment Variables

### Security-Related

| Variable | Required | Description |
|----------|----------|-------------|
| `BETTER_AUTH_SECRET` | Yes | Secret for Better Auth session signing |
| `BETTER_AUTH_URL` | Yes | Base URL for Better Auth endpoints |
| `TURNSTILE_SECRET_KEY` | Recommended | Cloudflare Turnstile for CAPTCHA |
| `ENVIRONMENT` | Yes | One of: `production`, `preview`, `development`, `test` |
| `AUDIT_LOG_RETENTION_DAYS` | No | Days to retain audit logs (default: 90) |

## Common Pitfalls

### 1. Missing Wildcard in Middleware Path
```typescript
// Wrong - won't match /admin/users
router.use("/admin", ensureAdmin);

// Correct - matches all /admin/* routes
router.use("/admin/*", ensureAdmin);
```

### 2. Checking Role Without Authentication
```typescript
// Wrong - no authentication check
if (sessionUser.role === "admin") { ... }

// Correct - middleware ensures auth
router.use("/admin/*", ensureAdmin);
// Handler can now safely check role
```

### 3. Forgetting to Handle Null Session
```typescript
// Wrong - assumes session exists
const user = c.get("sessionUser");
if (user.role === "admin") { ... }

// Correct - handle missing session
const user = c.get("sessionUser");
if (!user || user.role !== "admin") { ... }
```
