# Phase 35: Local SEO & Public Discovery - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish a strong search presence for "robotics in Morgantown" to increase local visibility and traffic for the ARESWEB platform. This phase focuses entirely on public-facing elements: structured data, meta tags, sitemap generation, and localized content on the About page.

</domain>

<decisions>
## Implementation Decisions

### Structured Data (Schema.org)
- **D-01:** Implement `Organization` and `LocalBusiness` (or a relevant sub-type for educational/robotics) schema on the Home and About pages.
- **D-02:** Ensure the address and geographic location (Morgantown, WV) are prominently structured to capture local search queries.

### Meta Tags and Headers
- **D-03:** Update the document `<head>` for all public routes to include geographically targeted title tags and meta descriptions (e.g., "ARES 23247 - FIRST Tech Challenge Robotics in Morgantown, WV").
- **D-04:** Ensure OpenGraph and Twitter card metadata also reflects local identity.

### Sitemap Generation
- **D-05:** Generate an automated `sitemap.xml` driven by the D1 database (for dynamic public posts/documents).
- **D-06:** Register the dynamic sitemap endpoint via a Hono route (e.g., `/sitemap.xml`).

### the agent's Discretion
- Best specific Schema.org type to use for a FIRST Robotics team.
- Exact copy/wording for the updated meta descriptions.

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above. 

</canonical_refs>

<specifics>
## Specific Ideas

- The user explicitly requested to target the keywords "robotics in Morgantown".
- We need to ensure that the content updates do not break our accessibility and design guidelines.

</specifics>

<deferred>
## Deferred Ideas

- Mobile PWA Enhancements (Scheduled for Phase 36)
- Hardware & Inventory Tracking (Scheduled for Phase 37)

</deferred>

---

*Phase: 35-local-seo*
*Context gathered: 2026-05-05*
