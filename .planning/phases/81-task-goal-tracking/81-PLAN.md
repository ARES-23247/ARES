# Phase 81: Task & Goal Tracking
---
wave: 1
depends_on: []
files_modified:
  - src/components/TaskBoardPage.tsx
  - src/components/command/ProjectBoardKanban.tsx
  - src/components/command/TaskEditDrawer.tsx
  - src/components/command/TaskEditModal.tsx
  - src/api/routers/tasks.ts
  - schema.sql
autonomous: true
---

## Goal
Upgrade the existing Project Management Kanban board to meet the Phase 81 Context decisions: Liveblocks real-time syncing, full-screen mode, slide-out drawer editing, and multiple assignees/subteam tagging.

<schema_push_requirement>
**[BLOCKING] Schema Push Required**

This phase modifies schema-relevant files (`schema.sql`). The planner MUST include
a `[BLOCKING]` task that runs the database schema push command AFTER all schema file
modifications are complete but BEFORE verification.

- ORM detected: Kysely (raw SQL)
- Push command: `npm run db:setup:local && npm run db:generate-types`
</schema_push_requirement>

## Tasks

<task>
<read_first>
- schema.sql
- src/api/routers/tasks.ts
</read_first>
<action>
Modify `schema.sql` to ensure the `tasks` table supports `subteam` (TEXT) and multiple assignees (either via a junction table `task_assignees` or a JSON array field if preferred for simplicity). Update the backend `tasks.ts` Hono router to handle these new fields for list, create, and update operations.
</action>
<acceptance_criteria>
- `schema.sql` contains a mechanism for multiple assignees and `subteam` column.
- `src/api/routers/tasks.ts` validates and queries the new fields.
</acceptance_criteria>
</task>

<task>
<read_first>
- package.json
</read_first>
<action>
Execute the database schema push command to apply changes locally and generate Kysely types:
`npm run db:setup:local && npm run db:generate-types`
</action>
<acceptance_criteria>
- The command executes successfully and exits with code 0.
- `src/db/types.ts` (or equivalent) reflects the new schema fields.
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/TaskBoardPage.tsx
</read_first>
<action>
Add Liveblocks integration to `TaskBoardPage.tsx` using the existing Liveblocks RoomProvider. Wrap the Kanban board in a room (e.g., `room-tasks-global`) so users can see presence (cursors/avatars) of other team members viewing the board. Add a Fullscreen toggle button that uses a state variable to apply fixed fullscreen CSS classes to the board container.
</action>
<acceptance_criteria>
- `src/components/TaskBoardPage.tsx` imports and uses Liveblocks room/presence hooks.
- A fullscreen toggle button exists and correctly expands the board layout.
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/command/ProjectBoardKanban.tsx
- src/components/command/TaskEditModal.tsx
</read_first>
<action>
Replace the `TaskEditModal` with a new `TaskEditDrawer` component (slide-out side panel) using Framer Motion or standard CSS translations. The drawer should allow editing the task's title, description, priority, subteam, and assignees. Update `ProjectBoardKanban.tsx` to mount the drawer instead of the modal.
</action>
<acceptance_criteria>
- `TaskEditDrawer.tsx` is created and implemented as a side panel.
- `ProjectBoardKanban.tsx` renders `TaskEditDrawer` when a task is clicked.
</acceptance_criteria>
</task>
