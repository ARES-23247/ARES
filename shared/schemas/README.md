# Schema Conventions

## IN-12: Null vs Optional Handling Conventions

This document establishes clear conventions for using `.nullable()`, `.optional()`, and `.nullish()` in Zod schemas.

### Core Principles

1. **`.optional()`** - Use when a field can be omitted from the request/response entirely
   - Example: Optional query parameter or request field
   - Transforms `undefined` to the value, but omits the field if not provided

2. **`.nullable()`** - Use when a field can explicitly be `null`
   - Example: Database column that allows NULL values
   - Use when the API contract explicitly distinguishes between "not provided" and "null"

3. **`.nullish()`** - Use when both `.optional()` and `.nullable()` are needed
   - Example: Field can be omitted, or explicitly set to null
   - Equivalent to `.optional().nullable()`

### Field-Specific Conventions

#### Text Fields
- **Required fields**: `z.string().min(1, "Field is required")`
- **Optional text**: `z.string().max(255).optional()`
- **Nullable text (database)**: `z.string().max(255).nullable()`
- **Optional or nullable**: Use `.optional()` for API inputs, `.nullable()` for database models
- **Empty strings**: Prefer empty string `""` over `null` for optional text fields

#### Boolean Fields
- **Required boolean**: Use `sqliteBooleanSchema` from `booleanSchema.ts`
- **Optional boolean**: Use `optionalSqliteBooleanSchema` from `booleanSchema.ts`
- **Nullable boolean**: Use `nullableSqliteBooleanSchema` from `booleanSchema.ts`

#### Date Fields
- **Required date**: `isoDateSchema` from `commonSchemas.ts`
- **Optional date**: `optionalIsoDateSchema` from `commonSchemas.ts`

#### UUID Fields
- **Required UUID**: `commonSchemas.uuid`
- **Optional UUID**: `commonSchemas.optionalUuid`

#### JSON Fields (stored as strings)
- **Required JSON array**: `stringArrayJsonSchema` from `jsonSchemas.ts`
- **Optional JSON array**: `optionalStringArrayJsonSchema` from `jsonSchemas.ts`

### API Contract Patterns

#### Request Body (Input)
- Use `.optional()` for fields that clients can omit
- Avoid `.nullable()` unless explicitly needed for API semantics
- Empty string `""` is preferred over `null` for text fields

#### Response Body (Output)
- Use `.nullable()` for database fields that can be NULL
- Use `.optional()` for computed fields that may not be present
- Be consistent with the database schema

#### Query Parameters
- Use `.optional()` for optional parameters
- Use `.default()` for parameters with fallback values

### Examples

```typescript
import { z } from "zod";
import { commonSchemas } from "./commonSchemas";
import { sqliteBooleanSchema, nullableSqliteBooleanSchema } from "./booleanSchema";
import { optionalStringArrayJsonSchema } from "./jsonSchemas";

// User profile schema
export const userProfileSchema = z.object({
  // Required fields
  id: commonSchemas.uuid,
  name: commonSchemas.name,

  // Optional text (can be omitted, sends empty string if not provided)
  bio: commonSchemas.description,

  // Nullable text (database NULL allowed)
  avatar_url: z.string().url().nullable().optional(),

  // Boolean (SQLite compatible)
  is_active: sqliteBooleanSchema,

  // Optional boolean
  show_email: optionalSqliteBooleanSchema,

  // JSON array stored as string
  subteams: optionalStringArrayJsonSchema,
});
```

### Migration Guide

When updating existing schemas:

1. **Check database schema**: Does the column allow NULL?
   - If yes: Use `.nullable()` or `nullableXxxSchema`
   - If no: Use required schema or `.optional()`

2. **Check API semantics**: Do we need to distinguish "not provided" from "null"?
   - If yes: Use `.nullable()` for explicit null values
   - If no: Use `.optional()` only

3. **Prefer consistency**: Once a pattern is established for a field type, use it consistently across all schemas

### Related Files

- `booleanSchema.ts` - SQLite-compatible boolean schemas
- `commonSchemas.ts` - Pre-configured common field schemas
- `jsonSchemas.ts` - JSON column validation schemas
- `errorSchema.ts` - Standardized error response schemas
