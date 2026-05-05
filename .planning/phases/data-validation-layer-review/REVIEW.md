---
phase: data-validation-layer-review
reviewed: 2025-01-04T18:00:00Z
depth: deep
files_reviewed: 48
files_reviewed_list:
  - shared/schemas/contracts/index.ts
  - shared/schemas/contracts/userContract.ts
  - shared/schemas/contracts/postContract.ts
  - shared/schemas/contracts/mediaContract.ts
  - shared/schemas/contracts/commentContract.ts
  - shared/schemas/contracts/inquiryContract.ts
  - shared/schemas/contracts/settingsContract.ts
  - shared/schemas/contracts/docContract.ts
  - shared/schemas/contracts/eventContract.ts
  - shared/schemas/contracts/financeContract.ts
  - shared/schemas/contracts/taskContract.ts
  - shared/schemas/contracts/outreachContract.ts
  - shared/schemas/contracts/badgeContract.ts
  - shared/schemas/contracts/locationContract.ts
  - shared/schemas/contracts/awardContract.ts
  - shared/schemas/contracts/entityContract.ts
  - shared/schemas/contracts/aiContract.ts
  - shared/schemas/contracts/tbaContract.ts
  - shared/schemas/contracts/judgeContract.ts
  - shared/schemas/contracts/notificationContract.ts
  - shared/schemas/contracts/seasonContract.ts
  - shared/schemas/contracts/sponsorContract.ts
  - shared/schemas/contracts/zulipContract.ts
  - shared/schemas/contracts/pointsContract.ts
  - shared/schemas/contracts/storeContract.ts
  - shared/schemas/contracts/socialQueueContract.ts
  - shared/schemas/database.ts
  - shared/schemas/postSchema.ts
  - shared/schemas/commentSchema.ts
  - shared/schemas/docSchema.ts
  - shared/schemas/eventSchema.ts
  - shared/schemas/financeSchema.ts
  - shared/schemas/outreachSchema.ts
  - shared/schemas/locationSchema.ts
  - functions/api/routes/users.ts
  - functions/api/routes/posts.ts
  - functions/api/routes/comments.ts
  - functions/api/routes/profiles.ts
  - functions/api/routes/locations.ts
  - functions/api/routes/awards.ts
  - functions/api/routes/tasks.ts
  - functions/api/routes/settings.ts
  - functions/api/routes/inquiries/handlers.ts
  - functions/api/routes/outreach/handlers.ts
  - functions/api/routes/events/handlers.ts
  - functions/api/routes/media/handlers.ts
  - functions/api/middleware/utils.ts
  - functions/api/middleware/security.ts
  - functions/api/routes/_profileUtils.ts
findings:
  critical: 8
  warning: 15
  info: 12
  total: 35
status: issues_found
---

# Phase: Data Validation Layer Review

**Reviewed:** 2025-01-04T18:00:00Z
**Depth:** deep
**Files Reviewed:** 48
**Status:** issues_found

## Summary

This review examined the data validation layer focusing on Zod schemas, input sanitization, type safety (`as any` usage), API contract enforcement, request/response validation, database query parameter sanitization, and file upload validation.

**Overall Assessment:** The codebase has a strong foundation with Zod schemas defining API contracts, ts-rest for type safety, and Kysely for SQL injection protection. However, there are several **critical security gaps** and **type safety issues** that require immediate attention.

### Key Strengths
- Comprehensive Zod schema definitions for API contracts
- Kysely ORM provides SQL injection protection for parameterized queries
- Centralized input length validation via `MAX_INPUT_LENGTHS`
- Good use of enum validation for roles and status values
- FormData upload validation with magic byte checking

### Critical Concerns
- Multiple FTS search queries with potential SQL injection via template literal interpolation
- Extensive `as any` usage bypassing type safety
- Inconsistent validation between contract definitions and route handlers
- Missing Zod validation in several route handlers

---

## Critical Issues

### CR-01: SQL Injection Risk in FTS Search Queries

**File:** `functions/api/routes/posts.ts:55-56`
**Issue:** Full-text search queries use template literal interpolation without sanitization.

```typescript
AND f.posts_fts MATCH ${q}
ORDER BY f.rank LIMIT ${limit} OFFSET ${offset}
```

**Impact:** An attacker could inject malicious SQLite FTS syntax. While Kysely's `sql` template function should escape values, the `MATCH` operator in SQLite FTS has specific syntax requirements that could be exploited if `q` contains special characters.

**Also affected:** `functions/api/routes/events/handlers.ts:27-28`

**Fix:**
```typescript
// Sanitize FTS query - remove quotes and special characters
const sanitizeFtsQuery = (query: string): string => {
  // Remove double quotes, backslashes, and other FTS special chars
  return query.replace(/["\\\^\*\-\:]/g, ' ').trim().split(/\s+/).filter(Boolean).join(' ');
};

const cleanQ = sanitizeFtsQuery(String(q || ''));
const results = await sql<{...}>`
  SELECT ...
  FROM posts_fts f
  JOIN posts p ON f.slug = p.slug
  WHERE p.is_deleted = 0 AND p.status = 'published'
  AND f.posts_fts MATCH ${cleanQ}
  ORDER BY f.rank LIMIT ${Number(limit) || 10} OFFSET ${Number(offset) || 0}
`.execute(db);
```

---

### CR-02: Missing Zod Validation in Location Routes

**File:** `functions/api/routes/locations.ts:54-81`
**Issue:** The `save` handler accepts arbitrary input without Zod schema validation before database insertion.

```typescript
save: async ({ body }: { body: any }, c: Context<AppEnv>) => {
  const db = c.get("db") as Kysely<DB>;
  const id = body.id || crypto.randomUUID();
  
  await db.insertInto("locations")
    .values({
      id,
      name: body.name,        // No validation
      address: body.address,  // No validation
      maps_url: body.maps_url || null,
    })
```

**Impact:** Malicious input could bypass schema constraints, potentially leading to database integrity issues or injection attacks.

**Fix:**
```typescript
import { locationSchema } from "../../../shared/schemas/contracts/locationContract";

save: async ({ body }: { body: any }, c: Context<AppEnv>) => {
  const validationResult = locationSchema.safeParse(body);
  if (!validationResult.success) {
    return { 
      status: 400 as const, 
      body: { error: "Invalid input: " + validationResult.error.issues.map(i => i.message).join(", ") } 
    };
  }
  
  const db = c.get("db") as Kysely<DB>;
  const validatedData = validationResult.data;
  // ... use validatedData instead of body
```

---

### CR-03: Unsafe `as any` Type Assertion in User Profile Update

**File:** `functions/api/routes/profiles.ts:107`
**Issue:** Type assertion completely bypasses type checking for profile updates.

```typescript
await upsertProfile(c as any, user.id, body as any);
```

**Impact:** The `upsertProfile` function performs critical security checks (like preventing self-escalation of member_type), but `as any` bypasses TypeScript's ability to verify the contract is being followed correctly.

**Fix:**
```typescript
// First validate against the schema
const validationResult = updateUserProfileSchema.safeParse(body);
if (!validationResult.success) {
  return { 
    status: 400 as const, 
    body: { error: "Invalid profile data" } 
  };
}

await upsertProfile(c, user.id, validationResult.data);
```

---

### CR-04: Missing Validation in Outreach Save Handler

**File:** `functions/api/routes/outreach/handlers.ts:136-196`
**Issue:** Direct database insertion without schema validation.

```typescript
save: async (input: any, c: any) => {
  const { body } = input;
  // ... no validation
  await db.updateTable("outreach_logs")
    .set({
      title: body.title,              // Not validated
      date: body.date,                // Not validated
      hours: body.hours_logged,       // Not validated
      // ... more fields
    })
```

**Impact:** Invalid data types, missing required fields, or malicious input could corrupt the database.

**Fix:**
```typescript
import { outreachSchema } from "../../../shared/schemas/outreachSchema";

save: async (input: any, c: any) => {
  const { body } = input;
  const validationResult = outreachSchema.safeParse(body);
  if (!validationResult.success) {
    return { 
      status: 400 as const, 
      body: { error: "Invalid outreach data" } 
    };
  }
  // ... use validationResult.data
```

---

### CR-05: Settings Update Missing Input Type Validation

**File:** `functions/api/routes/settings.ts:45-70`
**Issue:** Settings values are typed as `string` but could be any type at runtime.

```typescript
updateSettings: async ({ body }: { body: any }, c: Context<AppEnv>) => {
  const entries = Object.entries(body) as [string, string][];
  for (const [key, value] of entries) {
    // Only checks if value starts with '••••', not actual type validation
    if (SENSITIVE_KEYS.has(key) && typeof value === 'string' && value.startsWith('••••')) {
      continue;
    }
```

**Impact:** Non-string values could be stored, breaking downstream parsing. An attacker could potentially inject objects or arrays.

**Fix:**
```typescript
const settingsSchema = z.record(z.string(), z.string().max(10000));

updateSettings: async ({ body }: { body: any }, c: Context<AppEnv>) => {
  const validationResult = settingsSchema.safeParse(body);
  if (!validationResult.success) {
    return { 
      status: 400 as const, 
      body: { success: false, error: "Invalid settings format" } 
    };
  }
  // ... proceed with validated data
```

---

### CR-06: Media Upload Accepts Any File Without Size Limits

**File:** `functions/api/routes/media/handlers.ts:142-173`
**Issue:** File upload only checks magic bytes but doesn't enforce meaningful size limits.

```typescript
const isLarge = file.size > 10 * 1024 * 1024;
// ... processes file regardless, just uses different code path
if (isLarge) {
  await c.env.ARES_STORAGE.put(key, file.stream(), ...);
}
```

**Impact:** While R2 has hard limits, the application accepts arbitrarily large files, potentially leading to:
- Excessive storage costs
- DoS through large file uploads
- Memory exhaustion during processing

**Fix:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_FOR_AI = 2.5 * 1024 * 1024; // 2.5MB for AI processing

if (file.size > MAX_FILE_SIZE) {
  return { status: 413, body: { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` } };
}

if (!isValidImage(headerBuffer)) {
  return { status: 400, body: { error: "Invalid file type. Only standard images are supported." } };
}
```

---

### CR-07: Missing Content-Type Validation on FormData Endpoints

**File:** `functions/api/routes/media/handlers.ts:142-147`
**Issue:** The upload handler doesn't verify that the request actually contains FormData before accessing `formData.file`.

```typescript
const formData = body as any;
const file = formData.file as File;
const folder = (formData.folder as string) || "Library";
```

**Impact:** Malformed requests could cause runtime errors or undefined behavior.

**Fix:**
```typescript
const formData = body as FormData;
const file = formData.get("file") as File | null;
const folder = formData.get("folder") as string | null;

if (!file || !(file instanceof File)) {
  return { status: 400, body: { error: "No valid file uploaded" } };
}

if (folder && typeof folder !== 'string') {
  return { status: 400, body: { error: "Invalid folder name" } };
}
```

---

### CR-08: Comment Content Length Validation Bypass

**File:** `functions/api/routes/comments.ts:67-74`
**Issue:** Trim operation occurs before length check, allowing arbitrarily long content with only whitespace.

```typescript
const content = body.content.trim();

if (!content) {
  return { status: 400 as const, body: { error: "Comment content is required" } as any };
}
if (content.length > MAX_INPUT_LENGTHS.comment) {
  return { status: 400 as const, body: { error: "Comment is too long" } as any };
}
```

**Impact:** An attacker could submit a comment with millions of characters followed by a single non-whitespace character, bypassing the intent of the length limit.

**Fix:**
```typescript
const rawContent = body.content;
const content = rawContent.trim();

if (!content) {
  return { status: 400 as const, body: { error: "Comment content is required" } as any };
}
// Check original length, not trimmed length
if (rawContent.length > MAX_INPUT_LENGTHS.comment) {
  return { status: 400 as const, body: { error: `Comment exceeds ${MAX_INPUT_LENGTHS.comment} character limit` } as any };
}
```

---

## Warnings

### WR-01: Inconsistent Zod Schema Usage in Route Handlers

**Files:** Multiple route files
**Issue:** Many route handlers don't call `.safeParse()` on incoming data despite having Zod schemas defined.

**Examples:**
- `functions/api/routes/awards.ts:44` - `saveAward` doesn't validate against schema
- `functions/api/routes/tasks.ts:92` - `create` doesn't validate input
- `functions/api/routes/tasks.ts:221` - `update` doesn't validate input

**Impact:** Schema definitions exist but aren't enforced at runtime, creating a false sense of security.

**Fix:** Ensure all route handlers validate input against their schemas:
```typescript
const saveX = async ({ body }: { body: any }, c: Context<AppEnv>) => {
  const result = xSchema.safeParse(body);
  if (!result.success) {
    return { status: 400, body: { error: "Invalid input", details: result.error.flatten() } };
  }
  // ... proceed with result.data
};
```

---

### WR-02: PostSchema Uses `z.any()` for AST Field

**File:** `shared/schemas/postSchema.ts:7`
**Issue:** The `ast` field accepts any type without validation.

```typescript
ast: z.record(z.string().max(255), z.any()), // JSON AST from Tiptap
```

**Impact:** Malformed AST structures could cause downstream errors in rendering or storage.

**Fix:**
```typescript
// Define a more specific schema for Tiptap AST nodes
const tiptapNodeSchema = z.object({
  type: z.string(),
  content: z.array(z.lazy(() => tiptapNodeSchema)).optional(),
  attrs: z.record(z.unknown()).optional(),
  marks: z.array(z.unknown()).optional(),
  text: z.string().optional(),
});

ast: z.record(z.string().max(255), tiptapNodeSchema),
```

---

### WR-03: Missing URL Validation in Finance Transaction Receipt

**File:** `shared/schemas/financeSchema.ts:27`
**Issue:** URL validation allows empty string but contract requires `nullable()`.

```typescript
receipt_url: z.string().url().nullable().optional().or(z.literal("")),
```

**Impact:** The `.or(z.literal(""))` creates ambiguity - both empty strings and nulls are allowed, potentially causing inconsistency.

**Fix:**
```typescript
receipt_url: z.string().url().nullable().optional(),
```

Then handle empty strings in the route handler:
```typescript
const receiptUrl = body.receipt_url || null;
```

---

### WR-04: Award ID Type Coercion Without Validation

**File:** `functions/api/routes/awards.ts:52,85`
**Issue:** Using `as any` to coerce string IDs to numbers for database.

```typescript
.where("id", "=", Number(id) as any).executeTakeFirst();
.where("id", "=", Number(finalId) as any).execute();
```

**Impact:** If `id` is not a valid numeric string, `Number()` returns `NaN`, causing the query to fail silently or match unexpected rows.

**Fix:**
```typescript
const numericId = Number(id);
if (isNaN(numericId) || numericId <= 0) {
  return { status: 400, body: { error: "Invalid award ID" } };
}
await db.selectFrom("awards").select("id").where("id", "=", numericId).executeTakeFirst();
```

---

### WR-05: Task Assignee Array Not Validated

**File:** `shared/schemas/contracts/taskContract.ts:55`
**Issue:** Assignees array accepts any strings without user ID validation.

```typescript
assignees: z.array(z.string()).optional(),
```

**Impact:** Invalid user IDs could be stored, causing foreign key issues or dangling references.

**Fix:**
```typescript
assignees: z.array(z.string().uuid()).optional(),
```

And validate that users exist in the handler:
```typescript
if (body.assignees && body.assignees.length > 0) {
  const existingUsers = await db
    .selectFrom("user")
    .select("id")
    .where("id", "in", body.assignees)
    .execute();
    
  if (existingUsers.length !== body.assignees.length) {
    return { status: 400, body: { error: "One or more assignee IDs are invalid" } };
  }
}
```

---

### WR-06: Date String Formats Not Validated

**File:** `shared/schemas/eventSchema.ts:6-7`
**Issue:** Date fields accept any string without ISO 8601 format validation.

```typescript
dateStart: z.string().min(1, "Start date is required").max(255),
dateEnd: z.string().max(255).optional(),
```

**Impact:** Invalid date formats could cause parsing errors in date calculations or calendar synchronization.

**Fix:**
```typescript
const isoDateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: "Invalid ISO 8601 date format" }
);

dateStart: isoDateSchema.min(1, "Start date is required"),
dateEnd: isoDateSchema.optional(),
```

---

### WR-07: Missing Email Format Validation in Inquiry Schema

**File:** `shared/schemas/contracts/inquiryContract.ts:21`
**Issue:** Email validation exists but is only in `inquiryInputSchema`, not consistently enforced.

```typescript
email: z.string().email(),
```

**Impact:** While Zod validates this, the error message doesn't guide users on proper format.

**Fix:**
```typescript
email: z.string()
  .min(1, "Email is required")
  .email("Please enter a valid email address (e.g., user@example.com)")
  .max(320, "Email is too long"),
```

---

### WR-08: Slug Format Validation Not Enforced

**File:** `shared/schemas/docSchema.ts:4`
**Issue:** Slug has regex validation but other schemas don't validate slug format consistently.

```typescript
slug: z.string().min(1, "Slug is required").max(255).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
```

**Impact:** Different entities have different slug validation rules, leading to inconsistency.

**Fix:** Create a shared slug validator:
```typescript
// shared/schemas/validators.ts
export const slugSchema = z.string()
  .min(1, "Slug is required")
  .max(255, "Slug is too long")
  .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens");

export const slugWithUnderscoreSchema = z.string()
  .min(1, "Slug is required")
  .max(255)
  .regex(/^[a-z0-9-_]+$/, "Slug must contain only lowercase letters, numbers, hyphens, and underscores");
```

---

### WR-09: Numeric Coercion Without Range Validation

**File:** `shared/schemas/contracts/outreachContract.ts:12-14`
**Issue:** Numeric fields use coercion but don't validate ranges.

```typescript
students_count: z.number(),
hours_logged: z.number(),
reach_count: z.number(),
```

**Impact:** Negative numbers or unreasonably large values could be accepted.

**Fix:**
```typescript
students_count: z.number().int().min(0).max(1000),
hours_logged: z.number().min(0).max(24),
reach_count: z.number().int().min(0).max(1000000),
```

---

### WR-10: Maps URL Format Not Validated

**File:** `shared/schemas/contracts/locationContract.ts:10`
**Issue:** Maps URL accepts any string without URL validation.

```typescript
maps_url: z.string().optional().nullable(),
```

**Impact:** Invalid URLs could be stored and later cause frontend errors.

**Fix:**
```typescript
maps_url: z.string().url("Invalid maps URL format").optional().nullable().or(z.literal("")),
```

---

### WR-11: Member Type Enum Not Enforced in Profile Contract

**File:** `shared/schemas/contracts/userContract.ts:204`
**Issue:** Response schema allows any string for member_type.

```typescript
member_type: z.string(),
```

**Impact:** Inconsistent member_type values could break frontend filtering logic.

**Fix:**
```typescript
member_type: MemberTypeEnum,
```

---

### WR-12: Missing Sanitization of Meeting Notes

**File:** `shared/schemas/eventSchema.ts:18`
**Issue:** Meeting notes accept long strings without HTML/script sanitization.

```typescript
meetingNotes: z.string().max(200000).optional(),
```

**Impact:** If notes are ever displayed as HTML, XSS vulnerabilities could be introduced.

**Fix:**
```typescript
// Define a sanitization function or use a library like DOMPurify
import { sanitizeHtml } from '../../utils/sanitize';

meetingNotes: z.string().max(200000).optional().transform(async (val) => {
  if (!val) return val;
  return sanitizeHtml(val, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
}),
```

---

### WR-13: Category Enum Not Validated Against Allowed Values

**File:** `shared/schemas/eventSchema.ts:11`
**Issue:** Category has default but doesn't use enum validation.

```typescript
category: z.enum(["internal", "outreach", "external"]).default("internal"),
```

**Impact:** The enum is good, but response schemas use `z.string()` allowing inconsistent values.

**Fix:** Use consistent enum types:
```typescript
// Define shared enum
export const EventCategoryEnum = z.enum(["internal", "outreach", "external"]);

// In request schema
category: EventCategoryEnum.default("internal"),

// In response schema
category: EventCategoryEnum.nullable().optional(),
```

---

### WR-14: API Contract Uses `z.any()` for Error Responses

**File:** `shared/schemas/contracts/mediaContract.ts:36-37,52`
**Issue:** Error responses use `z.array(z.any())` which provides no type safety.

```typescript
500: z.object({
  error: z.string(),
  media: z.array(z.any()),
}),
```

**Impact:** Error responses could have inconsistent structure, making client-side error handling unreliable.

**Fix:**
```typescript
500: z.object({
  error: z.string(),
  media: z.array(r2ObjectSchema).optional(),
}),
```

---

### WR-15: Badge Leaderboard Returns Inconsistent Types

**File:** `shared/schemas/contracts/badgeContract.ts:104`
**Issue:** `badge_count` can be number or string.

```typescript
badge_count: z.number().or(z.string()),
```

**Impact:** Client code must handle both types, increasing complexity and potential for bugs.

**Fix:**
```typescript
badge_count: z.number(),
```

And ensure the handler returns a number:
```typescript
badge_count: Number(badgeCount),
```

---

## Info

### IN-01: Widespread `as any` Usage Reduces Type Safety

**Files:** Multiple (76 occurrences found)

**Issue:** The codebase uses `as any` extensively, bypassing TypeScript's type checking.

**Examples:**
- `functions/api/routes/locations.ts:12` - `const locationsTsRestRouter: any = s.router(...)`
- `functions/api/routes/locations.ts:28` - `body: { locations: locations as any[] }`
- `functions/api/routes/users.ts:134` - `await upsertProfile(c as any, params.id, body as any);`
- `functions/api/routes/media/handlers.ts:145` - `const formData = body as any;`

**Impact:** While this may be convenient for complex types or migrations, it:
- Reduces the effectiveness of TypeScript's static analysis
- Makes refactoring riskier
- Can hide actual bugs that would be caught by the type system

**Recommendation:** Gradually replace `as any` with proper type definitions or `unknown` with type guards.

---

### IN-02: Inconsistent Error Response Shapes

**Files:** Multiple contracts

**Issue:** Error responses aren't standardized across endpoints.

**Examples:**
- `{ error: z.string() }`
- `{ success: z.boolean(), error: z.string() }`
- `{ error: z.string(), details: z.unknown() }`

**Impact:** Client code must handle multiple error formats, increasing complexity.

**Recommendation:** Create a standardized error schema:
```typescript
// shared/schemas/errorSchema.ts
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

export const notFoundResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});
```

---

### IN-03: Duplicate Schema Definitions

**Files:** Multiple

**Issue:** Some schemas are defined both in `/shared/schemas/` and in contracts.

**Examples:**
- `commentSchema` exists in both `shared/schemas/commentSchema.ts` and `shared/schemas/contracts/commentContract.ts`

**Impact:** DRY violation - changes must be made in multiple places.

**Recommendation:** Import schemas from a single source:
```typescript
// In contract files
import { commentInputSchema } from "../commentSchema";

export const commentContract = c.router({
  submit: {
    method: "POST",
    body: commentInputSchema,
    // ...
  },
});
```

---

### IN-04: Generated Database Schema File

**File:** `shared/schemas/database.ts`

**Issue:** The database schema is auto-generated by kysely-codegen with a comment "Please do not edit it manually."

**Impact:** While this is good practice, it means the TypeScript types may not match actual validation rules enforced in Zod schemas.

**Recommendation:** Add a script to verify that Zod schemas are compatible with database types:
```typescript
// scripts/verify-schema-compatibility.ts
// Compare Zod schema definitions with kysely types
// Warn if required fields don't match, types are incompatible, etc.
```

---

### IN-05: Missing Pagination Input Validation

**File:** `functions/api/middleware/utils.ts:211-216`

**Issue:** Pagination helper accepts numeric strings without proper validation.

```typescript
export function parsePagination(c: Context<AppEnv>, defaultLimit = 50, maxLimit = 200) {
  const limit = Math.min(Number(c.req.query("limit") || String(defaultLimit)), maxLimit);
  const offset = Math.max(Number(c.req.query("offset") || "0"), 0);
  const cursor = c.req.query("cursor") || null;
  return { limit, offset, cursor };
}
```

**Impact:** `Number("abc")` returns `NaN`, which could cause unexpected behavior.

**Recommendation:**
```typescript
const parsePositiveInt = (val: string | undefined, fallback: number): number => {
  if (!val) return fallback;
  const num = Number(val);
  return isNaN(num) || !Number.isInteger(num) || num < 0 ? fallback : num;
};

export function parsePagination(c: Context<AppEnv>, defaultLimit = 50, maxLimit = 200) {
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), defaultLimit), maxLimit);
  const offset = parsePositiveInt(c.req.query("offset"), 0);
  const cursor = c.req.query("cursor") || null;
  return { limit, offset, cursor };
}
```

---

### IN-06: Inconsistent Boolean Type Handling

**Files:** Multiple

**Issue:** Some fields use `z.number()` for booleans (SQLite style) while others use `z.boolean()`.

**Examples:**
- `is_deleted` often treated as number (0/1)
- `show_on_about` uses `z.union([z.number(), z.boolean()])`

**Impact:** Inconsistent handling requires type coercion throughout the codebase.

**Recommendation:** Create a consistent boolean schema that handles both:
```typescript
// shared/schemas/booleanSchema.ts
export const sqliteBooleanSchema = z.union([
  z.boolean(),
  z.number().int().min(0).max(1),
]).transform((val) => val === true || val === 1);

export const nullableSqliteBooleanSchema = sqliteBooleanSchema.nullable();
```

---

### IN-07: Magic Number in Sanitization

**File:** `functions/api/routes/outreach/handlers.ts:70`

**Issue:** Magic number `200` for description truncation.

```typescript
description: r.description ? (r.description.length > 200 ? r.description.substring(0, 200) + "..." : r.description) : null,
```

**Impact:** Inconsistent with `MAX_INPUT_LENGTHS.description` which is 50000.

**Recommendation:**
```typescript
const SNIPPET_LENGTH = 200;
// Or use a constant from middleware/utils.ts
```

---

### IN-08: Unused `validateLength` Function

**File:** `functions/api/middleware/utils.ts:135-141`

**Issue:** The `validateLength` function exists but is inconsistently used across route handlers.

**Recommendation:** Create Zod refinements that use this function:
```typescript
export const createMaxLengthSchema = (maxLength: number, fieldName?: string) => {
  return z.string().max(maxLength, `${fieldName || 'Field'} exceeds maximum length of ${maxLength}`);
};

// Usage
title: createMaxLengthSchema(MAX_INPUT_LENGTHS.title, "Title"),
```

---

### IN-09: Missing Request ID Tracing

**Files:** All route handlers

**Issue:** There's no correlation ID passed through requests, making debugging validation issues difficult.

**Recommendation:** Add request ID middleware:
```typescript
export async function requestIdMiddleware(c: Context<AppEnv>, next: Next) {
  const id = c.req.header("X-Request-ID") || crypto.randomUUID();
  c.set("requestId", id);
  c.header("X-Request-ID", id);
  await next();
}
```

---

### IN-10: JSON Column Types Not Explicitly Validated

**Files:** Multiple

**Issue:** JSON columns (like `subteams`, `colleges`) are stored as strings but not validated to be valid JSON before storage.

**Recommendation:** Add JSON validation schemas:
```typescript
export const jsonArraySchema = <T extends z.ZodType>(itemSchema: T) => 
  z.string().transform((val, ctx) => {
    try {
      const parsed = JSON.parse(val);
      return z.array(itemSchema).parse(parsed);
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid JSON array format",
      });
      return z.NEVER;
    }
  });

// Usage
subteams: jsonArraySchema(z.string()).optional(),
```

---

### IN-11: Missing File Extension Validation

**File:** `functions/api/routes/media/handlers.ts:10-38`

**Issue:** While magic bytes are validated, file extensions aren't checked or normalized.

**Recommendation:** Validate and normalize file extensions:
```typescript
const EXTENSION_MAP: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

const validExtension = EXTENSION_MAP[file.type];
if (!validExtension) {
  return { status: 400, body: { error: "Unsupported image type" } };
}

const key = folder ? `${folder}/${file.name}${validExtension}` : `${file.name}${validExtension}`;
```

---

### IN-12: Inconsistent Null vs Optional Handling

**Files:** Multiple schemas

**Issue:** Some fields use `.nullable()` while others use `.optional()`, and some use both inconsistently.

**Example:**
```typescript
location: z.string().max(255).optional(),
vs
location: z.string().nullable().optional(),
vs
location: z.string().nullish(),
```

**Impact:** Confusing API contract - clients don't know whether to send `null`, omit the field, or send empty string.

**Recommendation:** Establish clear conventions:
- Use `.optional()` for fields that can be omitted
- Use `.nullable()` for fields that explicitly accept `null`
- Use `.nullish()` (optional + nullable) only when truly both
- Prefer empty string over `null` for text fields

---

_Reviewed: 2025-01-04T18:00:00Z_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: deep_
