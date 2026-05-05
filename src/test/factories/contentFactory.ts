import { faker } from "@faker-js/faker";
import type { D1Row } from "../../../shared/types/database";

/**
 * Mock Media interface for R2-stored media files.
 * Media doesn't have a direct DB table; stored in R2 with metadata in MediaTags.
 */
export interface MockMedia {
  key: string;
  url: string;
  size: number;
  type: string;
  folder: string;
  uploaded_at: string;
}

/**
 * Mock Post factory matching Posts table schema.
 * Returns D1Row<"posts"> type for compile-time schema validation.
 *
 * Note: ast is a JSON string representing TipTap document structure.
 * Posts table uses slug as the primary identifier (no separate id column).
 */
export const createMockPost = (overrides?: Partial<D1Row<"posts">>): D1Row<"posts"> => ({
  slug: faker.helpers.slugify(faker.company.catchPhrase().toLowerCase()),
  title: faker.company.catchPhrase(),
  snippet: faker.lorem.sentence(),
  ast: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: faker.lorem.paragraph() }] }] }),
  author: faker.person.fullName(),
  date: faker.date.recent().toISOString(),
  cf_email: faker.internet.email(),
  content_draft: null,
  is_deleted: 0,
  is_portfolio: 0,
  published_at: faker.date.recent().toISOString(),
  revision_of: null,
  season_id: null,
  status: "published",
  thumbnail: null,
  updated_at: faker.date.recent().toISOString(),
  zulip_stream: null,
  zulip_topic: null,
  ...overrides,
});

/**
 * Mock Doc factory matching Docs table schema.
 * Returns D1Row<"docs"> type for compile-time schema validation.
 *
 * Note: content is a JSON string representing rich text.
 * Docs table uses slug as the primary identifier (no separate id column).
 */
export const createMockDoc = (overrides?: Partial<D1Row<"docs">>): D1Row<"docs"> => ({
  slug: faker.helpers.slugify(faker.commerce.productName().toLowerCase()),
  title: faker.commerce.productName(),
  description: faker.lorem.sentence(),
  content: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: faker.lorem.paragraph() }] }] }),
  category: faker.helpers.arrayElement(["software", "hardware", "business", "outreach"]),
  status: "published",
  cf_email: faker.internet.email(),
  is_deleted: 0,
  is_executive_summary: 0,
  is_portfolio: 0,
  content_draft: null,
  revision_of: null,
  display_in_areslib: 1,
  display_in_math_corner: 0,
  display_in_science_corner: 0,
  sort_order: 0,
  updated_at: faker.date.recent().toISOString(),
  zulip_stream: null,
  zulip_topic: null,
  ...overrides,
});

/**
 * Mock Media factory for R2-stored files.
 * Returns MockMedia interface type.
 *
 * Media files are stored in R2, not D1. This factory generates test data
 * matching the shape returned by the media API.
 */
export const createMockMedia = (overrides?: Partial<MockMedia>): MockMedia => ({
  key: faker.system.fileName(),
  url: faker.image.url(),
  size: faker.number.int({ min: 1000, max: 10000000 }),
  type: "image/png",
  folder: "gallery",
  uploaded_at: faker.date.recent().toISOString(),
  ...overrides,
});
