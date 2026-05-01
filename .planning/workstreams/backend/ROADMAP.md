# Proposed Roadmap

**3 phases** | **3 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | D1 Database Architecture | Design and deploy the database schema for simulation persistence | BE-01 | 1 |
| 2 | Persistence API Layer | Implement the Hono endpoints for CRUD operations on simulations | BE-02 | 2 |
| 3 | AI Multi-File RAG Integration | Enable the AI assistant to read full project trees | BE-03 | 1 |

### Phase Details

**Phase 1: D1 Database Architecture**
Goal: Design and deploy the database schema for simulation persistence
Requirements: BE-01
Success criteria:
1. SQL schema for `Simulations` table is created and applied via wrangler.

**Phase 2: Persistence API Layer**
Goal: Implement the Hono endpoints for CRUD operations on simulations
Requirements: BE-02
Success criteria:
1. POST and GET endpoints operate successfully against local D1.
2. React frontend can save active files to the DB.

**Phase 3: AI Multi-File RAG Integration**
Goal: Enable the AI assistant to read full project trees
Requirements: BE-03
Success criteria:
1. z.AI calls embed the complete `Record<string, string>` structure of files instead of just the active tab.
