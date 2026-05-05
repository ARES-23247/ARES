import { faker } from "@faker-js/faker";
import type { D1Row } from "~/shared/types/database";

/**
 * Mock User factory for testing.
 * Uses domain interface matching DashboardSession user shape.
 */
export interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

export const createMockUser = (overrides?: Partial<MockUser>): MockUser => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  image: faker.image.avatar(),
  role: faker.helpers.arrayElement(["admin", "author", "unverified"]),
  ...overrides,
});

/**
 * Mock User Profile factory matching UserProfiles table schema.
 * Returns D1Row<"user_profiles"> type for compile-time schema validation.
 */
export const createMockProfile = (overrides?: Partial<D1Row<"user_profiles">>): D1Row<"user_profiles"> => ({
  user_id: faker.string.uuid(),
  nickname: faker.person.firstName(),
  bio: faker.lorem.sentence(),
  member_type: faker.helpers.arrayElement(["student", "coach", "mentor", "parent"]),
  show_on_about: 1,
  leadership_role: faker.helpers.arrayElement([null, "Captain", "Lead Engineer"]),
  rookie_year: "2023",
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  contact_email: faker.internet.email(),
  phone: faker.phone.number(),
  pronouns: faker.helpers.arrayElement(["he/him", "she/her", "they/them", null]),
  tshirt_size: faker.helpers.arrayElement(["XS", "S", "M", "L", "XL", "XXL", null]),
  grade_year: faker.helpers.arrayElement(["2024", "2025", "2026", "2027", null]),
  subteams: JSON.stringify(["Software", "Hardware"]),
  colleges: null,
  employers: null,
  show_email: 0,
  show_phone: 0,
  favorite_food: null,
  favorite_robot_mechanism: null,
  fun_fact: null,
  favorite_first_thing: null,
  pre_match_superstition: null,
  dietary_restrictions: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  parents_name: null,
  parents_email: null,
  students_name: null,
  students_email: null,
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

/**
 * Mock Badge factory matching Badges table schema.
 * Returns D1Row<"badges"> type for compile-time schema validation.
 */
export const createMockBadge = (overrides?: Partial<D1Row<"badges">>): D1Row<"badges"> => ({
  id: faker.string.uuid(),
  name: faker.commerce.productAdjective() + " Badge",
  description: faker.lorem.sentence(),
  icon: "award",
  color_theme: faker.helpers.arrayElement(["red", "gold", "bronze", "blue", "green"]),
  created_at: faker.date.recent().toISOString(),
  ...overrides,
});

/**
 * Mock Comment factory matching Comments table schema.
 * Returns D1Row<"comments"> type for compile-time schema validation.
 */
export const createMockComment = (overrides?: Partial<D1Row<"comments">>): D1Row<"comments"> => ({
  id: faker.string.uuid(),
  content: faker.lorem.sentence(),
  user_id: faker.string.uuid(),
  target_id: faker.string.uuid(),
  target_type: faker.helpers.arrayElement(["post", "doc", "event"]),
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  is_deleted: 0,
  zulip_message_id: null,
  ...overrides,
});
