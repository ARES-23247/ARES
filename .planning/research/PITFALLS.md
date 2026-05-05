# Domain Pitfalls: Eliminating TypeScript `any` Violations at Scale

**Domain:** TypeScript Strict Type Migration
**Researched:** 2026-05-05
**Context:** ARESWEB v6.7 — Eliminating 983 `@typescript-eslint/no-explicit-any` violations

## Critical Pitfalls

Mistakes that cause rewrites, test failures, or introduce new bugs during `any` elimination.

### Pitfall 1: Over-Genericizing Types

**What goes wrong:** Creating overly complex generic types to avoid `any`, making code harder to understand and maintain.

**Why it happens:**
- Treating generics as a "better any" without understanding constraints
- Fear of repeating type definitions (DRY taken too far)
- Attempting to make types "reusable" for hypothetical future cases

**Consequences:**
```typescript
// BAD: Over-genericized, cognitive overload
type DataProcessor<T, U extends keyof T, V = unknown> = (
  data: T,
  key: U,
  transformer: (value: T[U]) => V
) => V;

// GOOD: Specific, readable, maintainable
type SponsorLogoProcessor = (sponsor: Sponsor, size: 'thumb' | 'full') => string;
```

- Increased compilation time (complex generics slow TypeScript compiler)
- Cognitive load for new developers
- Type inference failures leading back to `any` usage
- Error messages become incomprehensible (multi-line generic constraint errors)

**Prevention:**
- **Favor specific types over generic ones** — DRY is for logic, not types
- **The 3-use rule:** Only create generics if you have 3+ concrete use cases
- **Type aliases > complex generics** — `SponsorLogo` is clearer than `Extract<T, 'logo'>`
- **Measure complexity:** If a type definition requires comments to explain, it's too complex

**Detection:**
- Generic type parameters > 2 letters is a smell (e.g., `<TData, TKey, TValue, TResult>`)
- Nested conditional types (`T extends U ? V : W`)
- Type definitions spanning > 5 lines

**Phase to address:** Phase 2 (Shared Type Creation) — Establish patterns early.

---

### Pitfall 2: Breaking Runtime Behavior with Overly Strict Types

**What goes wrong:** TypeScript types are compile-time only. Overly strict types can mask runtime issues or incorrectly constrain valid data.

**Why it happens:**
- Assuming TypeScript types enforce runtime validation (they don't)
- Using exact literals where unions are needed
- Confusing "type narrowing" with "runtime validation"

**Consequences:**
```typescript
// BAD: Type claims only these values exist
type EventCategory = 'meeting' | 'competition' | 'outreach';

function getEventCategory(raw: string): EventCategory {
  // TypeScript says this is exhaustive. It's not.
  // Runtime bug if DB has 'fundraiser' category.
  return raw as EventCategory;
}

// GOOD: Acknowledge runtime reality
type EventCategory = 'meeting' | 'competition' | 'outreach' | 'other';

function getEventCategory(raw: string): EventCategory {
  const valid: EventCategory[] = ['meeting', 'competition', 'outreach'];
  return valid.includes(raw as EventCategory) ? raw as EventCategory : 'other';
}
```

- Silent data corruption (values coerced to wrong types)
- Type errors appear at runtime only
- Database schema drift from TypeScript types

**Prevention:**
- **Use Zod for runtime boundaries** — API inputs, D1 results, external APIs
- **Treat types as documentation, not validation**
- **Prefer unions with fallback values** — `| 'other'`, `| null`, `| unknown`
- **Never use `as` without runtime checks** — Unless you control both sides

**Detection:**
- Using `as` without type guards or Zod parsing
- Functions accepting `string` but returning narrowed type without validation
- Empty catch blocks after type assertions

**Phase to address:** Phase 1 (Foundation) — Establish Zod integration before eliminating `any`.

---

### Pitfall 3: Test Brittleness from Over-Typed Mocks

**What goes wrong:** Making test mocks too strict causes tests to break when implementation details change, not when behavior breaks.

**Why it happens:**
- Mocking every property of an object
- Using exact types for test data instead of partial shapes
- Confusing "type safety in tests" with "good tests"

**Consequences:**
```typescript
// BAD: Brittle — breaks when new fields added
const mockSponsor: Sponsor = {
  id: 1,
  name: 'Test',
  logo_url: 'test.png',
  level: 'gold',
  // ... 20 more required fields
  created_at: new Date(),
  updated_at: new Date(),
};

// GOOD: Flexible — only what's needed for this test
const mockSponsor = {
  id: 1,
  name: 'Test',
} as Partial<Sponsor>;

// OR: Use type-safe factory
const createMockSponsor = (overrides?: Partial<Sponsor>): Sponsor => ({
  id: 1,
  name: 'Test Sponsor',
  logo_url: '',
  level: 'bronze',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});
```

- Tests fail for irrelevant reasons (new optional fields added)
- "Mock bloat" — tests longer than production code
- Developers avoid adding new fields to avoid test updates

**Prevention:**
- **Use `Partial<T>` for test mocks** — Only assert what matters
- **Create factory functions** — `createMockX(overrides)` pattern
- **Keep test types intentionally looser** — Tests verify behavior, not types
- **`as unknown as T` is OK in tests** — With documentation

**Detection:**
- Test file > 2x length of implementation file
- Mock objects with > 10 properties
- Tests requiring updates when adding optional fields

**Phase to address:** Phase 4 (Test Files) — Handle tests separately from production code.

---

### Pitfall 4: Circular Dependencies Through Shared Types

**What goes wrong:** Creating shared types that import from each other, causing TypeScript compilation issues and module dependency cycles.

**Why it happens:**
- Extracting types to "shared" files without planning
- Types referencing domain models that reference back to types
- Utility types that depend on domain-specific types

**Consequences:**
```typescript
// BAD: Circular reference
// types/sponsors.ts
import type { Task } from './tasks';
export interface Sponsor { tasks: Task[]; }

// types/tasks.ts
import type { Sponsor } from './sponsors';
export interface Task { sponsor: Sponsor; }

// Error: Type parameter has a circular constraint
```

- `TS2313: Type parameter has a circular constraint` errors
- Incremental compilation breaks
- Hard to reason about what depends on what

**Prevention:**
- **Layer types by domain** — Don't share across unrelated domains
- **String identifiers > object references** — Use `sponsorId: string` not `sponsor: Sponsor`
- **Utility types must be domain-agnostic** — Move up to `types/util.ts`
- **Barrel exports (index.ts) can hide cycles** — Be careful with re-exports

**Detection:**
- Import statements that form loops (check manually)
- Files importing from `types/*` that import back from domain
- Two domain files both importing from each other's type files

**Phase to address:** Phase 2 (Shared Type Creation) — Design type architecture first.

---

### Pitfall 5: Wholesale `unknown` Replacement

**What goes wrong:** Running find-replace `any` → `unknown` creates different problems. `unknown` requires type guards before every use.

**Why it happens:**
- Using codemods without manual review
- Treating `unknown` as "strict mode" without understanding implications
- Legacy script like `fix-any.mjs` that blindly replaces

**Consequences:**
```typescript
// BAD: any → unknown replacement
function processValue(value: unknown) {
  // Error: Object is of type 'unknown'
  console.log(value.id);
  return value.toUpperCase();
}

// What happens: Now need type guards everywhere
if (typeof value === 'object' && value !== null && 'id' in value) {
  console.log(value.id);
}
// Code becomes 3x longer, not safer
```

- Introduces 100s of new errors that must be fixed
- Doesn't address the root problem (missing types)
- Creates false sense of security

**Prevention:**
- **Never run blind find-replace** — Each `any` needs context-specific handling
- **Prefer concrete types over `unknown`** — `unknown` is for truly dynamic data
- **Replace with actual types** — Create the proper type, don't punt to `unknown`
- **Audit the fix script** — `scripts/fix-any.mjs` should be used with manual review

**Detection:**
- CI shows `unknown` appearing in error messages instead of proper types
- Functions with `unknown` parameters that don't narrow before use
- Type assertions `as X` immediately after receiving `unknown`

**Phase to address:** All phases — Each `any` replacement should be intentional.

---

## Moderate Pitfalls

### Pitfall 6: Performance Impact of Complex Generic Constraints

**What goes wrong:** Complex generic type constraints slow down TypeScript compiler and IDE autocomplete.

**Symptoms:**
- Language server becomes unresponsive
- `tsc --noEmit` takes > 30 seconds
- Autocomplete delays > 2 seconds

**Prevention:**
- Profile types if performance degrades
- Break complex types into simpler steps
- Use type aliases to cache intermediate computations

**Phase to address:** Phase 2 — If compilation becomes slow.

---

### Pitfall 7: Missing Legitimate `any` Use Cases

**What goes wrong:** Eliminating all `any` without recognizing cases where it's actually appropriate.

**Legitimate `any` use cases:**

1. **External library integration** — When library types are missing or wrong
2. **Third-party API responses** — Until proper types are created
3. **Test mocks and fixtures** — With justification comments
4. **Bridging incompatible types** — `as unknown as X` for system boundaries
5. **Error handling** — Unknown error types from external systems

**Example of appropriate `any`:**
```typescript
// Third-party library without types
import poorlyTypedLib from 'poorly-typed-lib';
const result = poorlyTypedLib.process(data) as ProcessedData;
// Note: Document this and file issue for library types

// Cloudflare Workers fetch API (until types exist)
export interface Env {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Cloudflare AI types are evolving
  AI: any;
}
```

**Prevention:**
- Require justification comments for remaining `any` after cleanup
- Document why `any` is necessary in each case
- Create GitHub issues for external libraries needing types

**Phase to address:** Phase 6 (Final Validation) — Review remaining `any` with justification.

---

## Minor Pitfalls

### Pitfall 8: Ignoring ESLint Disable Comments

**What goes wrong:** Removing `eslint-disable` comments without fixing the underlying issue.

**Prevention:**
- Audit each disable comment before removal
- Many disables exist for valid reasons (PartyKit, Hono types, Kysely)
- Keep disables with proper justifications

**Phase to address:** All phases — Review disables contextually.

---

### Pitfall 9: Type Drift from Database Schema

**What goes wrong:** TypeScript types drift from actual D1 database schema over time.

**Prevention:**
- Use Kysely's generated types where possible
- Run schema sync validation in CI
- Consider using Kysely Codegen for type generation

**Phase to address:** Phase 1 — Establish Kysely type generation.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Foundation | Type drift from D1 schema | Generate types from Kysely, validate against migrations |
| Phase 2: Shared Types | Circular dependencies, over-genericizing | Layer types by domain, limit generic parameters |
| Phase 3: Big Files | Breaking runtime behavior | Keep Zod validation in place, test heavily |
| Phase 4: Test Files | Over-typed mocks | Use `Partial<T>`, factory functions, allow looser test types |
| Phase 5: Frontend | Tiptap/PartyKit incomplete types | Keep selective `any` with justification |
| Phase 6: Final Validation | Removing legitimate `any` | Document remaining `any` use cases |

---

## Anti-Patterns to Avoid

### The "Type Punishment" Anti-Pattern

Creating types that are correct but punish future developers:

```typescript
// DON'T DO THIS
type ExtractReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => infer R ? R : never;

// DO THIS INSTEAD
// Just use the actual type, or let TypeScript infer it
```

### The "False Security" Anti-Pattern

```typescript
// DON'T DO THIS — Type is safe but runtime is not
function getConfig(key: 'api_url' | 'db_url'): string {
  return process.env[key] ?? ''; // Runtime error if key missing
}

// DO THIS INSTEAD
function getConfig(key: 'api_url' | 'db_url'): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing config: ${key}`);
  return value;
}
```

### The "Mock Overload" Anti-Pattern

```typescript
// DON'T DO THIS — Tests as maintenance burden
const mockDb: Database = {
  users: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  posts: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  // ... 50 more lines
};

// DO THIS INSTEAD
const mockDb = {
  users: { create: vi.fn() }
} as Partial<Database>;
```

---

## Validation Checklist

Before declaring `any` elimination complete:

- [ ] No blind `any` → `unknown` replacements
- [ ] Each remaining `any` has justification comment
- [ ] Tests still pass (no false positives from over-typing)
- [ ] Runtime behavior unchanged
- [ ] No circular type dependencies introduced
- [ ] Generic types are simple (≤2 type parameters)
- [ ] Test mocks use `Partial<T>` or factories
- [ ] D1/Kysely types validated against schema
- [ ] External library gaps documented
- [ ] CI enforces no new `any` violations

---

## Sources

- [TypeScript anti-patterns - Tomasz Ducin](https://ducin.dev/typescript-anti-patterns) — Over-genericity and anti-patterns
- [Fixing TypeScript Strict Mode Errors in Large Codebases - Loke.dev](https://loke.dev/blog/fixing-typescript-strict-mode-errors) — Migration strategies
- [The Fatal TypeScript Patterns - Medium](https://medium.com/@sohail_saifi/the-fatal-typescript-patterns-that-make-senior-developers-question-your-experience-8d7f10a3be42) — Patterns that indicate inexperience
- [Migrating large codebase to TypeScript - Marek Urbanowicz](https://marekurbanowicz.medium.com/migrating-large-codebase-to-typescript-do-it-right-from-the-beginning-7109a80b2a3d) — Gradual migration approach
- [TypeScript Strict Mode: Why Your Team Should Enable It - Wolf-tech.io](https://wolf-tech.io/blog/typescript-strict-mode-why-your-team-should-enable-it-and-how-to-survive-the-transition) — Common migration mistakes
- [Use Cases for `any` in TypeScript - Medium](https://medium.com/codex/use-cases-for-any-in-typescript-495ddca5385d) — Legitimate `any` use cases
- [Reddit: Is mocking everything everywhere bad practice?](https://www.reddit.com/r/typescript/comments/1ei9f4a/is_it_me_or_mocking_everything_everywhere_in/) — Test mocking anti-patterns
- [How to Properly Mock Typed Variables in Unit Tests](https://dev.to/catherineisonline/how-to-properly-mock-typed-variables-in-unit-tests-with-typescript-4k81) — Type-safe mocking strategies
- [TypeScript Performance and Type Optimization - Medium](https://medium.com/@an.chmelev/typescript-performance-and-type-optimization-in-large-scale-projects-18e62bd37cfb) — Generic performance impact
- [Is circular type reference bad? - Stack Overflow](https://stackoverflow.com/questions/63501426/is-circular-type-reference-a-bad-thing-to-do-in-typescript) — Circular dependency issues
