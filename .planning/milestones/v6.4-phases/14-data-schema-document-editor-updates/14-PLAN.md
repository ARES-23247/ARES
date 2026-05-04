# Phase 14: Data Schema & Document Editor Updates - Plan

## 1. Overview
We will add three visibility columns (`display_in_areslib`, `display_in_math_corner`, `display_in_science_corner`) to the `docs` table. We will also update the Document Editor (`DocsEditor.tsx`) to allow users with Editor/Admin privileges to set these visibility options when saving documents.

## 2. Proposed Changes

### Database Migration
[NEW] `migrations/057_add_document_visibility_flags.sql`
- Add `display_in_areslib` (INTEGER DEFAULT 0)
- Add `display_in_math_corner` (INTEGER DEFAULT 0)
- Add `display_in_science_corner` (INTEGER DEFAULT 0)
- Update existing documents: `UPDATE docs SET display_in_areslib = 1;`

### Schema Definition
[MODIFY] `schema.sql`
- Add the three visibility columns to the `docs` table definition.

### Backend Data Schemas
[MODIFY] `shared/schemas/docSchema.ts`
- Add `displayInAreslib` (z.boolean()), `displayInMathCorner`, and `displayInScienceCorner` to the Zod schema. Defaults should be `false` (or `true` for areslib if missing on existing but we handle this via DB).

[MODIFY] `functions/api/routes/docs.ts`
- Map the incoming JSON booleans to SQLite `1` or `0` in the `INSERT`/`UPDATE` statements for saving documents.
- Ensure the API returns these fields in the `SELECT` statements for the admin/editor endpoints.

### Frontend UI Updates
[MODIFY] `src/components/DocsEditor.tsx`
- Add UI checkboxes for "Areslib Visibility", "Math Corner Visibility", and "Science Corner Visibility" under the Document Settings panel.
- Ensure the state is correctly mapped between the DB response (`display_in_areslib`) and the frontend form values (`displayInAreslib`).

## 3. Verification Plan
- **Automated Tests**: Run existing API and component tests to ensure no regressions. Update `docs.test.ts` if necessary.
- **Manual Verification**: Run `npm run dev` and navigate to the Document Editor. Ensure the checkboxes are visible, can be toggled, and correctly persist to the D1 local database upon saving. Check that existing documents load with the "Areslib" box checked.
