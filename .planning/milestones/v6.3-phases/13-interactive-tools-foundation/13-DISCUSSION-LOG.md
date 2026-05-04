# Phase 13 Discussion Log

**Date:** 2026-05-04
**Participants:** User, Agent

## Areas Discussed

### 1. Tool Architecture — Extend SimPlayground vs. New Framework
- **Options presented:** Extend existing SimPlayground (iframe sims) vs. standalone first-class pages
- **User decision:** Standalone pages. SimPlayground is for "vibe coding sims" only.
- **Rationale:** Tools like scouting need proper routing, state management, and API integration — not iframe sandboxing.

### 2. Scouting Tool Scope — Data & AI
- **Options presented:** Real-time event data, AI analysis, simple viewer, or full prediction engine
- **User decision:** TOA + FTC Events APIs combined with Z.ai GLM 5.1 for predictions and analysis. Start with AI predictions, eventually add real-time scouting data entry.
- **Rationale:** User wants deep analysis — not just a data viewer. AI-powered predictions are the differentiator.

### 3. Access Model — Public vs. Auth-Gated
- **Options presented:** Per-tool flag, separate sections, or mixed approach
- **User decision:** Per-tool `isPublic` flag. Scouting tool is private (auth-gated).
- **Agent recommendation accepted:** Auth-gate scouting for cost control (AI API spend) and competitive advantage (team intel).

### 4. Navigation & Discovery — Where Tools Live
- **Options presented:** Hub page, sidebar entries, dropdown menus, or categorized launcher
- **User decision:** Private tools get dashboard sidebar entries. Public tools go in header dropdown menus.
- **Rationale:** Consistent with existing dashboard patterns. No need for a separate tools hub initially.

## Deferred Ideas
- Real-time scouting data entry at events
- Alliance-pick strategy optimizer
- Historical trend analysis across seasons
- Public tool examples (kinematics calculators)
