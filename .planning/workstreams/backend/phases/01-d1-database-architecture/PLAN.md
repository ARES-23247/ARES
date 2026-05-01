# Phase 1: D1 Database Architecture

## Goal
Design and deploy the database schema for simulation persistence

## Approach
1. Modify `schema.sql` to include a `simulations` table, linking it to the BetterAuth `user` table.
2. The table will store the simulation `id`, `user_id`, `name`, `files_json` (stringified file tree), and `is_public` boolean.
3. Run `npm run db:setup:local` to apply the schema to the local D1 emulator.
4. Run `npm run db:generate-types` to update the Kysely typescript definitions.
