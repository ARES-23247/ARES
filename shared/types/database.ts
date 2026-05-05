/**
 * Database type utilities for Kysely D1 integration.
 * Provides unwrapping of Generated<> wrappers and type-safe row operations.
 */

import type { DB, Generated } from "../schemas/database";
import type { Selectable, Insertable, Updateable } from "kysely";

/**
 * Unwraps Kysely's Generated<> wrapper for D1 auto-generated columns.
 *
 * Converts types like `id: Generated<string | null>` to `id: string`.
 * Provides the runtime type (what you actually get from queries).
 *
 * @example
 * type Sponsor = D1Row<"sponsors">; // { id: string, name: string, tier: string, ... }
 */
export type D1Row<T extends keyof DB> = Selectable<DB[T]>;

/**
 * Selectable row type for a given table.
 * Preserves Generated<> wrappers for use in database queries.
 */
export type SelectableRow<T extends keyof DB> = Selectable<DB[T]>;

/**
 * Insertable row type for a given table.
 * Use when creating new records (auto-generated columns optional).
 */
export type InsertableRow<T extends keyof DB> = Insertable<DB[T]>;

/**
 * Updateable row type for a given table.
 * Use when updating existing records (all columns optional).
 */
export type UpdateableRow<T extends keyof DB> = Updateable<DB[T]>;
