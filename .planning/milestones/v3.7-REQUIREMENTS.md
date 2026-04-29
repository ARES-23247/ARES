# Requirements

## [x] REQ-1: Resolve AgendaViewList CSS Conflicts
The `AgendaViewList.tsx` component contains conflicting Tailwind display utilities.
- **[x] AC-1**: Remove conflicting `block` or `flex` classes so only one display type is applied.

## [x] REQ-2: Resolve PresenceAvatars CSS Conflicts
The `PresenceAvatars.tsx` component contains conflicting Tailwind display utilities.
- **[x] AC-1**: Remove conflicting `inline-block` or `flex` classes so only one display type is applied.

## [x] REQ-3: Suppress Tailwind IDE Warnings
The `index.css` file raises "Unknown at rule" warnings in standard IDE CSS validators.
- **[x] AC-1**: Ensure VSCode/IDE correctly ignores or recognizes `@tailwind` and `@apply` rules, potentially by adding a `.vscode/settings.json` rule or standard PostCSS/Tailwind configuration.
