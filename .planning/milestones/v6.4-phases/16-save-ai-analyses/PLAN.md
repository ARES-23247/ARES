# Phase 16: Save AI Scouting Analyses

## Context
The user requested the ability to save AI-generated FTC Scout analyses so they don't have to be regenerated repeatedly, which saves LLM tokens and provides faster retrieval of past insights.

## Tasks

### 1. Database Schema Update
- [ ] Create `migrations/058_add_scouting_analyses.sql` with a `scouting_analyses` table to hold generated markdown.
- [ ] Manually add `scouting_analyses` to the `DB` interface in `shared/schemas/database.ts` so Kysely typechecks pass.

### 2. Backend Persistence
- [ ] Update `functions/api/routes/scouting/analyze.ts` to automatically save successful GLM-5.1 generations into the `scouting_analyses` table using D1 via Kysely.
- [ ] Create `functions/api/routes/scouting/analyses.ts` to allow GET requests filtering by `teamNumber` or `eventKey`.
- [ ] Register the new `/analyses` route in `functions/api/routes/scouting/index.ts`.

### 3. Frontend Integration
- [ ] Update `src/lib/scouting-api.ts` to expose `getSavedAnalyses()`.
- [ ] Update `TeamAnalysisCard.tsx` to automatically query and display previous analyses upon mount.
- [ ] Add a "Regenerate Analysis" or "Update Analysis" button to allow explicitly replacing old analyses if newer data is available.

### 4. Verification
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run test`.

## Open Questions
- Should previous analyses be completely overwritten, or should we keep multiple analyses as a history? (Decision: Overwrite or keep a small list? Since it's by `seasonKey`, maybe just keep the latest one per mode/team/event/season to prevent clutter, unless instructed otherwise. We'll implement an UPSERT based on mode/team/event/season).
