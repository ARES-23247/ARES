---
name: aresweb-zero-trust-security
description: Institutionalizes absolute Zero Trust security principles and architectural audits for all ARESWEB Cloudflare D1/R2 endpoints. Expressly forbids authentication systems that rely on spoofable headers like Referer or Host.
---

# ARES 23247 Zero Trust Security Enforcement

This skill mandates absolute security strictness when architecting or maintaining Cloudflare Pages Functions, API routes, D1 database mutations, and R2 asset storage. The ARESWEB portal operates on the public edge and is heavily targeted; we rely on **Cloudflare Zero Trust Access** rather than application-layer authentication.

## 1. The Zero Trust Identity Rule
**Never trust `Host`, `Origin`, or `Referer` headers for authentication.**
These headers are fundamentally insecure and easily spoofable by an attacker using `curl` or Postman to bypass restrictions via the `.pages.dev` raw worker URL.

### ❌ Insecure Pattern (FORBIDDEN)
```typescript
// DANGEROUS: Bypasses authentication if a hacker injects "Referer: aresfirst.org"
const referer = c.req.header("referer") || "";
const isDashboard = referer.includes("aresfirst.org");

if (!email && !isDashboard) {
  return c.json({ error: "Unauthorized" }, 401);
}
```

### ✅ Secure Pattern (ENFORCED)
**Always require the cryptographic `cf-access-authenticated-user-email` OR `cf-access-jwt-assertion` header.**
Because Cloudflare Access acts as a reverse proxy, it automatically wipes any manually injected `cf-access` headers from unauthenticated public traffic. The only way these headers exist is if the user successfully passed the institutional login screen. 

*Critical Warning:* Some Identity Providers (like GitHub, depending on public profile settings) DO NOT pass an email address to Cloudflare Access. If no email is provided, Cloudflare ZERO TRUST drops the `cf-access-authenticated-user-email` header entirely, causing artificial 401 Unauthorized errors for fully logged-in users. You MUST fallback to checking `cf-access-jwt-assertion` to cryptographically verify their active session.

```typescript
// SECURE: Enforces that the request has mathematically passed Zero Trust
const url = new URL(c.req.url);
const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
const email = c.req.header("cf-access-authenticated-user-email");
const jwt = c.req.header("cf-access-jwt-assertion");

if (!email && !jwt && !isLocal) {
  return c.json({ error: "Strict Context: Unauthorized. Cloudflare Zero Trust authentication required." }, 401);
}
```

## 2. API Endpoint Audit Checklist
Before committing any new API endpoint (`POST`, `PUT`, `DELETE`, or sensitive `GET` routes), you must execute an internal audit verifying the following:

1. **Spoof Immunity:** The endpoint does not conditionally waive authentication based on origin domain requests.
2. **Localhost Isolation:** `url.hostname === "localhost"` is the *only* acceptable bypass, and it must validate the parsed URL hostname, NOT the `Host` header.
3. **D1 SQL Injection Protection:** All database parameters are safely bound using `.bind()` rather than raw string interpolation.
4. **Environment Isolation:** Ensure `.pages.dev` environments (which circumvent DNS-level Access Application rules) require strict header validation to protect against lateral bypasses.

## 3. SQL Binding Standards
Never inject user-controlled input directly into a D1 query string.

### ❌ Insecure (FORBIDDEN)
```typescript
await c.env.DB.prepare(`DELETE FROM posts WHERE slug = '${slug}'`).run();
```

### ✅ Secure (ENFORCED)
```typescript
await c.env.DB.prepare("DELETE FROM posts WHERE slug = ?").bind(slug).run();
```

## 4. API Proxy Mounting & Cloudflare Edge Routing Tables
When mounting internal or protected API routes (e.g., `/dashboard/api/*`), you **MUST** ensure the base path is explicitly whitelisted in `public/_routes.json`. 

**The 405 Method Not Allowed Edge Trap:**
Cloudflare Pages statically evaluates `public/_routes.json` to determine which paths hit the Functions (`functions/`) environment vs Cloudflare's static file cache.
1. If your protected API proxy (`/dashboard/api/*`) is NOT listed in the `include` array of `_routes.json`, Cloudflare assumes it maps to a static asset.
2. Cloudflare strictly rejects all mutating HTTP operations (`POST`, `PUT`, `DELETE`) against static URLs.
3. Your secure API requests will fail on the Edge Network with a completely opaque `405 Method Not Allowed`, bypassing your actual backend code entirely.

### ✅ Secure Routing Table
Always verify `public/_routes.json` captures your proxy mounts:
```json
{
  "version": 1,
  "include": [
    "/api/*",
    "/dashboard/api/*"
  ],
  "exclude": []
}
```

## Action Summary
Whenever you are operating within `functions/api/` or writing backend logic, you are to assume the posture of a strict Security Auditor. Assume all traffic is malicious unless cryptographically verified by Cloudflare JWTs. Never implicitly trust internal Edge networking routes without explicit definitions in `_routes.json`.
