# Milestone v5.5 (Backend) Requirements

## Simulation Infrastructure
- [ ] **BE-01**: **D1 Schema Finalization**: Define the Cloudflare D1 SQL schema required to permanently store saved simulations, including linking simulations to user accounts and tracking visibility (public vs. private).
- [ ] **BE-02**: **Simulation Persistence API**: Build the Hono API routes (`POST /api/simulations`, `GET /api/simulations/:id`, `PATCH /api/simulations/:id`) to allow the React frontend to persist file trees and configurations to the database.
- [ ] **BE-03**: **Multi-File Context RAG**: Implement the backend systems required to inject a simulation's entire file tree as context when querying z.AI, ensuring the LLM understands the state of all files in a project, not just the active one.
