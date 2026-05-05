import { z } from "zod";

/**
 * Standard slug validator for URLs and identifiers
 * Only lowercase letters, numbers, and hyphens
 */
export const slugSchema = z.string()
  .min(1, "Slug is required")
  .max(255, "Slug is too long")
  .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens");

/**
 * Extended slug validator that also allows underscores
 * Useful for internal identifiers that may use underscores
 */
export const slugWithUnderscoreSchema = z.string()
  .min(1, "Slug is required")
  .max(255, "Slug is too long")
  .regex(/^[a-z0-9-_]+$/, "Slug must contain only lowercase letters, numbers, hyphens, and underscores");
