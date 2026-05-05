# ARES Zero Trust Security

## Mandatory Requirements

### 1. Never Trust Client-Provided Identity Headers
**CRITICAL:** Never rely on spoofable HTTP headers for authentication or authorization decisions.

**Forbidden Headers for Auth:**
- `Referer` - Easily spoofed, varies by browser/network
- `Host` - Can be manipulated via DNS poisoning or proxy requests
- `Origin` - Not secure for authorization decisions
- `X-Forwarded-For` - User-supplied, not verified
- Any other client-controlled header

**Example - PROHIBITED:**
```typescript
// DON'T DO THIS - Referer can be spoofed
const referer = c.req.header("Referer");
if (referer?.includes("aresweb.org")) {
  // Grant access - INSECURE!
}
```

### 2. Always Validate Sessions Server-Side
Use Better Auth for all authentication decisions. The session must be verified on the server using the Better Auth API.

**Required Pattern:**
```typescript
import { getAuth } from "../../utils/auth";

const auth = getAuth(c.env.DB, c.env, c.req.url);
const session = await auth.api.getSession({
  headers: c.req.raw.headers,
});

if (!session || !session.user) {
  return c.json({ error: "Unauthorized" }, 401);
}
```

### 3. Apply Middleware to All Protected Routes
Every protected route MUST use one of these middleware functions:

- `ensureAuth` - For routes requiring any authenticated user
- `ensureAdmin` - For routes requiring admin/author privileges

**Required at router level:**
```typescript
import { ensureAuth, ensureAdmin } from "../middleware";

// Apply to specific routes
analyticsRouter.use("/summary", ensureAuth);
analyticsRouter.use("/stats", ensureAuth);

// Apply to all admin routes
analyticsRouter.use("/admin/*", ensureAdmin);
```

### 4. Cloudflare Zero Trust Integration
When using Cloudflare Access for external authentication:

**Required Headers:**
- `cf-access-authenticated-user-email` - Verified email from Cloudflare Access
- `cf-access-jwt-assertion` - JWT token from Cloudflare Access

**Validation Pattern:**
```typescript
const cfEmail = c.req.header("cf-access-authenticated-user-email");
if (!cfEmail) {
  return c.json({ error: "Unauthorized" }, 401);
}
// Still verify against Better Auth for internal permission checks
```

### 5. Session Validation Patterns
Always check for session existence and validity before using user data:

**Proper Handler Pattern:**
```typescript
const user = await getSessionUser(c);
if (!user) {
  return { status: 401 as const, body: { error: "Authentication required" } };
}
// Now safe to use user.role, user.id, etc.
```

### 6. Role-Based Access Control (RBAC)
Roles are enforced server-side only:

**Role Hierarchy:**
- `admin` - Full system access, including user management
- `author` - Content creation and publishing (but not user management)
- `verified` - Standard authenticated user
- `unverified` - New user, limited access

**Additional Authorization:**
- `member_type` - `mentor` or `coach` grants admin-like privileges for most routes

### 7. Dev Bypass Restrictions
Authentication bypass is ONLY allowed in true local development:

**Allowed Environments:**
- `ENVIRONMENT === "development"` AND localhost hostname
- `NODE_ENV === "test"` for automated testing

**NOT Allowed:**
- `ENVIRONMENT === "preview"` - Preview deployments are public!
- Any production or staging environment

### 8. Audit Logging
All sensitive actions must be logged:

```typescript
import { logAuditAction } from "../middleware";

await logAuditAction(c, "DELETE", "events", eventId, `Deleted event: ${title}`);
```

## Security Checklist

Before committing any code that touches authentication or authorization:

- [ ] No decision is made based on `Referer`, `Host`, or `Origin` headers
- [ ] All protected routes use `ensureAuth` or `ensureAdmin` middleware
- [ ] Handler-level checks verify user existence before using user data
- [ ] Cloudflare Access headers are supplemental, not the primary auth
- [ ] Sensitive actions are logged via `logAuditAction`
- [ ] Dev bypass only applies to `development` environment with localhost
- [ ] Admin routes include role checks beyond just middleware

## Common Pitfalls

### Pitfall 1: Handler-Only Auth
```typescript
// WRONG - No middleware, handler checks only
getOrders: async (_, c) => {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser || sessionUser.role !== "admin") {
    return { status: 401, body: { error: "Unauthorized" } };
  }
  // ...
}
```

**Correct approach:**
```typescript
// RIGHT - Middleware at router level
storeHandler.use("/orders", ensureAdmin);
storeHandler.use("/orders/*", ensureAdmin);
```

### Pitfall 2: Optional Chaining on User Role
```typescript
// WRONG - Allows unauthenticated access
const status = isDraft ? "pending" : (user?.role === "admin" ? "published" : "pending");
```

**Correct approach:**
```typescript
// RIGHT - Explicit auth check
const user = await getSessionUser(c);
if (!user) return { status: 401, body: { error: "Authentication required" } };
const status = isDraft ? "pending" : (user.role === "admin" ? "published" : "pending");
```

### Pitfall 3: Assuming Middleware Set Context
```typescript
// WRONG - May fail if route lacks middleware
const user = c.get("sessionUser");
if (!user) return unauthorized();
```

**Correct approach:**
```typescript
// RIGHT - Use getSessionUser which handles both cases
const user = await getSessionUser(c);
if (!user) return unauthorized();
```

## Testing Security

When testing authentication changes:
1. Test with no authentication (expect 401)
2. Test with unverified user (expect 403 for admin routes)
3. Test with verified user (expect access to non-admin routes)
4. Test with admin user (expect full access)
5. Test that spoofing headers doesn't bypass auth

---

**Last Updated:** 2026-05-04
**Version:** 1.0.0
**Applies To:** All authentication and authorization code in the ARES 23247 Web Portal
