---
wave: 1
depends_on: []
files_modified:
  - src/components/Footer.tsx
  - src/components/Editor/RichTextEditor.tsx
  - src/components/MarkdownViewer.tsx
autonomous: true
---

# Phase 87 Plan

## 1. Footer Link Integration

<task id="1">
  <read_first>
    - src/components/Footer.tsx
  </read_first>
  <action>
    Add a `<Link to="/science-corner" ...>Science Corner</Link>` inside the `Footer` component, next to the Docs, Privacy, and Support Us links, matching the existing hover styles.
  </action>
  <acceptance_criteria>
    - `Footer.tsx` contains `to="/science-corner"`
    - Link is visible in the UI
  </acceptance_criteria>
</task>

## 2. Simulation Markdown Embed Support

<task id="2">
  <read_first>
    - src/components/MarkdownViewer.tsx
    - src/sims/simRegistry.json
  </read_first>
  <action>
    Extend the MarkdownViewer (and optionally the RichTextEditor) to parse a special tag or component (e.g. `<SimEmbed id="monte-hall" />`) and render the target simulation inline with adjustable physics/state props.
  </action>
  <acceptance_criteria>
    - Simulated components can be embedded via standard shortcode or markdown directive
    - The simulation renders within the blog/document article layout
  </acceptance_criteria>
</task>

## 3. Route & View Configuration

<task id="3">
  <read_first>
    - src/App.tsx
    - src/pages/ScienceCorner.tsx
  </read_first>
  <action>
    Ensure `/science-corner/:slug` correctly routes to a document viewer that utilizes the newly extended MarkdownViewer, allowing users to read the lesson text and interact with the embedded sim simultaneously.
  </action>
  <acceptance_criteria>
    - Route exists and resolves to a viewer
    - Document content with `Science Corner` category is loaded and rendered
  </acceptance_criteria>
</task>
