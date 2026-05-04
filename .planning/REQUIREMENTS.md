# Milestone v6.4 Requirements

## 1. Document Schema & Editor
- [ ] **DOCS-01**: Modify the Document database schema (D1) to include three new boolean fields: `display_in_areslib`, `display_in_math_corner`, and `display_in_science_corner`.
- [ ] **DOCS-02**: Add 3 toggle checkboxes in the Document Editor UI to allow authors to select any combination of these display locations.

## 2. Math Corner
- [ ] **MATH-01**: Create a new Math Corner section/page in the application, styled consistently with the existing Science Corner.
- [ ] **MATH-02**: Dynamically fetch and display documents on the Math Corner that have the `display_in_math_corner` flag enabled.

## 3. Existing Hub Updates (Science & areslib)
- [ ] **SCI-01**: Update the existing Science Corner to dynamically fetch and display documents that have the `display_in_science_corner` flag enabled.
- [ ] **ARES-01**: Update the existing areslib viewer to dynamically fetch and display documents that have the `display_in_areslib` flag enabled.

---

## Out of Scope
- Migrating non-document content types (like calendar events or tasks) into these hubs.
- Automatic or AI-based categorization of documents into these hubs (relies purely on manual checkbox selection).

## Traceability

| Requirement | Phase |
|-------------|-------|
| DOCS-01 | Phase 14: Data Schema & Document Editor Updates |
| DOCS-02 | Phase 14: Data Schema & Document Editor Updates |
| MATH-01 | Phase 15: Math Corner Foundation & Hub Integrations |
| MATH-02 | Phase 15: Math Corner Foundation & Hub Integrations |
| SCI-01 | Phase 15: Math Corner Foundation & Hub Integrations |
| ARES-01 | Phase 15: Math Corner Foundation & Hub Integrations |

