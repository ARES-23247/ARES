import { faker } from "@faker-js/faker";
import type { D1Row } from "../../../shared/types/database";

/**
 * Mock Outreach factory matching OutreachLogs table schema.
 * Returns D1Row<"outreach_logs"> type for compile-time schema validation.
 */
export const createMockOutreach = (overrides?: Partial<D1Row<"outreach_logs">>): D1Row<"outreach_logs"> => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  title: faker.company.catchPhrase(),
  date: faker.date.future().toISOString(),
  hours: faker.number.int({ min: 1, max: 8 }),
  cf_email: faker.internet.email(),
  event_id: null,
  impact_summary: faker.lorem.paragraph(),
  is_deleted: 0,
  is_mentoring: faker.datatype.boolean() ? 1 : 0,
  location: faker.location.streetAddress(),
  mentored_team_number: null,
  mentor_count: null,
  mentor_hours: null,
  metadata: null,
  people_reached: faker.number.int({ min: 1, max: 100 }),
  season_id: null,
  students_count: faker.number.int({ min: 1, max: 20 }),
  created_at: faker.date.recent().toISOString(),
  ...overrides,
});

/**
 * Mock Sponsor factory matching Sponsors table schema.
 * Returns D1Row<"sponsors"> type for compile-time schema validation.
 */
export const createMockSponsor = (overrides?: Partial<D1Row<"sponsors">>): D1Row<"sponsors"> => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  tier: faker.helpers.arrayElement(["platinum", "gold", "silver", "bronze"]),
  logo_url: faker.image.url(),
  website_url: faker.internet.url(),
  created_at: faker.date.recent().toISOString(),
  is_active: 1,
  ...overrides,
});

/**
 * Mock Award factory matching Awards table schema.
 * Returns D1Row<"awards"> type for compile-time schema validation.
 */
export const createMockAward = (overrides?: Partial<D1Row<"awards">>): D1Row<"awards"> => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  title: faker.commerce.productName() + " Award",
  event_name: faker.company.catchPhrase(),
  date: "2024",
  description: faker.lorem.sentence(),
  icon_type: faker.helpers.arrayElement(["trophy", "medal", "ribbon", "star"]),
  created_at: faker.date.recent().toISOString(),
  is_deleted: 0,
  season_id: null,
  ...overrides,
});

/**
 * Mock Inquiry factory matching Inquiries table schema.
 * Returns D1Row<"inquiries"> type for compile-time schema validation.
 */
export const createMockInquiry = (overrides?: Partial<D1Row<"inquiries">>): D1Row<"inquiries"> => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  type: faker.helpers.arrayElement(["general", "sponsorship", "media", "technical"]),
  status: faker.helpers.arrayElement(["new", "contacted", "resolved", "closed"]),
  created_at: faker.date.recent().toISOString(),
  is_deleted: 0,
  metadata: null,
  notes: null,
  zulip_message_id: null,
  ...overrides,
});
