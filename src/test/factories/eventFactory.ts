import { faker } from "@faker-js/faker";
import type { D1Row } from "~/shared/types/database";

/**
 * Mock Event factory matching Events table schema.
 * Returns D1Row<"events"> type for compile-time schema validation.
 *
 * Note: description is a JSON string in the database representing rich content.
 */
export const createMockEvent = (overrides?: Partial<D1Row<"events">>): D1Row<"events"> => {
  return {
    id: faker.string.uuid(),
    title: faker.company.catchPhrase(),
    date_start: faker.date.future().toISOString(),
    date_end: faker.date.future().toISOString(),
    location: faker.location.streetAddress(),
    description: JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: faker.lorem.paragraph() }] }],
    }),
    cover_image: faker.image.url(),
    category: faker.helpers.arrayElement(["internal", "outreach", "external"]),
    is_potluck: faker.datatype.boolean() ? 1 : 0,
    is_volunteer: faker.datatype.boolean() ? 1 : 0,
    is_deleted: 0,
    status: "published",
    published_at: faker.date.recent().toISOString(),
    content_draft: null,
    gcal_event_id: null,
    meeting_notes: null,
    original_start_time: null,
    parent_event_id: null,
    recurrence_rule: null,
    recurring_exception: 0,
    recurring_group_id: null,
    revision_of: null,
    rrule: null,
    season_id: null,
    tba_event_key: null,
    updated_at: faker.date.recent().toISOString(),
    zulip_stream: null,
    zulip_topic: null,
    ...overrides,
  };
};

/**
 * Mock Location factory matching Locations table schema.
 * Returns D1Row<"locations"> type for compile-time schema validation.
 */
export const createMockLocation = (overrides?: Partial<D1Row<"locations">>): D1Row<"locations"> => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  address: faker.location.streetAddress(),
  maps_url: null,
  is_deleted: 0,
  ...overrides,
});
