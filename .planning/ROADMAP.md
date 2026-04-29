# Proposed Roadmap

**3 phases** | **6 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 08 | Version History UI & Rollbacks | Build the interface to view and restore historical document snapshots. | VER-01, VER-02, VER-03 | 3 |
| 09 | Contributor Tracking Backend | Track all unique users who contribute to a document. | CON-01 | 2 |
| 10 | Public Avatar Stack & YPP | Display a dynamic avatar stack of student contributors on public pages. | CON-02, CON-03 | 3 |

### Phase Details

**Phase 08: Version History UI & Rollbacks**
Goal: Build the interface to view and restore historical document snapshots.
Requirements: VER-01, VER-02, VER-03
Success criteria:
1. User can click a "History" button in the editor to see a list of timestamps/snapshots.
2. User can select a snapshot and preview its content.
3. User can click "Restore", which updates the database `content_draft` with the snapshot data.

**Phase 09: Contributor Tracking Backend**
Goal: Track all unique users who contribute to a document.
Requirements: CON-01
Success criteria:
1. Database schema tracks `contributors` (either via a new table or array column).
2. Liveblocks webhooks or publish actions successfully record the IDs of users who edited the document.

**Phase 10: Public Avatar Stack & YPP**
Goal: Display a dynamic avatar stack of student contributors on public pages.
Requirements: CON-02, CON-03
Success criteria:
1. Blog posts, events, and docs display an overlapping UI component of user avatars.
2. The component successfully fetches user details (avatar, nickname).
3. The component explicitly excludes any user whose role is not a student (e.g., mentor, coach, admin).
