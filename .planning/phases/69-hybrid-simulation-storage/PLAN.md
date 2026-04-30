# Phase 69: Hybrid Simulation Storage Architecture

## 1. Goal

Implement a hybrid simulation storage architecture where "Official" templates are fetched from the ARES-23247/ARESLIB GitHub repository and user-created custom simulations are saved, retrieved, and managed in the Cloudflare D1 database.

## 2. Rationale

Currently, all simulation templates are hardcoded in `SimTemplates.ts`. This is difficult to maintain and prevents team members from creating and sharing custom simulation setups. A hybrid approach allows official robot code to serve as the single source of truth for standard templates while providing a dynamic database layer for student experimentation.

## 3. Assumptions & Context

- Users must be authenticated to save custom simulations to the database.
- Official templates will be stored in a `simulations/` directory on the GitHub repository.
- We will reuse the `githubFetcher` utility to traverse and fetch the GitHub files.

## 4. Implementation Steps

1.  **Database Migration**:
    -   Create `migrations/000X_create_simulations.sql`.
    -   Add `simulations` table to `shared/schemas/database.ts`. Include columns: `id`, `name`, `description`, `files`, `author_id`, `is_public`, `created_at`, `updated_at`.
2.  **API Routes**:
    -   Create `/functions/api/routes/simulations.ts`.
    -   Implement `GET /api/simulations` to merge GitHub templates and DB templates.
    -   Implement `POST /api/simulations` and `PUT /api/simulations/:id` to save user templates to D1.
3.  **Frontend Integration**:
    -   Delete `src/components/editor/SimTemplates.ts`.
    -   Update `SimulationPlayground.tsx` to fetch templates via `ts-rest` instead of the hardcoded object.
    -   Add a "Save Simulation" modal dialog in the editor.
    -   Update template selector to show visual badges (GitHub vs. Custom).

## 5. Verification Steps

1.  **Database**: Verify the migration applies successfully to D1.
2.  **API**: Test `GET /api/simulations` using Bruno/Postman to ensure the GitHub payloads match the expected shape.
3.  **Frontend**: Confirm templates load in the dropdown, modify a template, save it to the DB, and refresh to verify persistence.
