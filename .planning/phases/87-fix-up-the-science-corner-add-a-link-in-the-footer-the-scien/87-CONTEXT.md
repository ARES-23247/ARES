# Phase 87: fix-up-the-science-corner-add-a-link-in-the-footer-the-scien - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix up the Science Corner: add a footer link, ensure simulations work seamlessly within a blog/document format, and establish how the physics engine is exposed for educational lessons.
</domain>

<decisions>
## Implementation Decisions

### Content Storage Architecture
- **D-01:** Reuse the existing Simulation Registry and Blog/Document schemas. We will NOT build a separate `ScienceLesson` table. Instead, we will leverage the existing Tiptap editor and Markdown ecosystem to embed "regular" simulations directly inside textual articles.

### Physics Engine Integration
- **D-02:** Keep the simulation components sandboxed, but expose educational "knobs" (e.g., gravity, friction, mass variables) as standard React props that can be passed into the embedded simulation shortcode/component. We will not expose the raw engine instance to the document layer.

### Discoverability & Navigation
- **D-03:** Add the missing "Science Corner" link to the Footer component (next to Docs, Privacy, etc.) to fulfill the phase requirement, while leaving the existing Navbar link intact.

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/Footer.tsx`: Target for the new navigation link.
- `src/sims/simRegistry.json`: Target for ensuring existing sims are properly exported for embedding.
- `src/components/SimulationPlayground.tsx`: Established mechanism for loading simulation code.

### Established Patterns
- ARESWEB relies heavily on Markdown and Tiptap for rich text processing.
- Simulations currently run in sandboxed contexts.

### Integration Points
- Implement a custom Markdown/Tiptap node capable of parsing an `<EmbedSim id="monte-hall" initialProps={{...}} />` tag.
- Footer navigation links.
</code_context>

<specifics>
## Specific Ideas

- Focus on creating a seamless authoring experience so that non-programmers can write Markdown articles and inject interactive physics sandboxes at specific points.
</specifics>

<deferred>
## Deferred Ideas

- None.
</deferred>
