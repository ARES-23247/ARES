---
wave: 1
depends_on: []
files_modified:
  - src/pages/TechStack.tsx
autonomous: true
---

# Phase 37: Tech Stack UI Polish

## 1. Polish TechStack.tsx and Add Missing Tech Cards

<read_first>
- src/pages/TechStack.tsx
- src/components/RobotViewer.tsx
</read_first>

<action>
Modify `src/pages/TechStack.tsx` to apply elite styling and add missing technologies:
1. Import `RobotViewer` at the top: `import RobotViewer from "../components/RobotViewer";`.
2. Uncomment the `<RobotViewer />` component in the 3D Hardware Visualization section.
3. Upgrade the styling of the 12 existing `.hero-card` elements in the grid. Add `group transition-all duration-500 hover:-translate-y-2` to the card container, and apply a subtle colored glow on hover depending on the card's accent color (e.g., `hover:border-ares-cyan/50 hover:shadow-[0_0_30px_rgba(0,255,255,0.1)]` for cyan cards, replacing with gold/red/bronze equivalents). Add `transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3` to the icon wrapper `div`s.
4. Add two new cards to the grid (making it 14 cards total):
   - **Cloudflare Turnstile**: Describe the privacy-first bot protection used across forms. Icon: `ShieldCheck`. Accent Color: `ares-cyan`. Cost: `Free Tier`.
   - **Playwright E2E**: Describe the End-to-End testing infrastructure that simulates user behavior. Icon: `CheckCircle`. Accent Color: `ares-red`. Cost: `Open Source`.
5. Ensure the new cards also receive the elite hover styling.
</action>

<acceptance_criteria>
- `src/pages/TechStack.tsx` contains `import RobotViewer from "../components/RobotViewer";`
- `src/pages/TechStack.tsx` renders `<RobotViewer />`
- `src/pages/TechStack.tsx` contains a card with "Cloudflare Turnstile"
- `src/pages/TechStack.tsx` contains a card with "Playwright E2E"
- The `.hero-card` elements include `hover:-translate-y-2`
- The file compiles without TypeScript errors.
</acceptance_criteria>
