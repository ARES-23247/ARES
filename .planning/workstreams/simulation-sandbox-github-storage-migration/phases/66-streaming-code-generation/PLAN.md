---
phase: 66
title: Streaming Code Generation (IDE-like Experience)
status: planned
---

# Phase 66: Streaming Code Generation (IDE-like Experience)

## Objective
Upgrade the z.AI simulation assistant in `SimulationPlayground.tsx` to provide a premium, IDE-like experience. The AI will stream markdown-fenced code blocks directly into the Monaco Editor character-by-character, replacing the fragile all-at-once JSON payload mechanism.

## Proposed Implementation

### 1. Update System Prompt
Change the system prompt to explicitly request markdown code blocks: "When modifying code, output complete updated files using markdown code blocks with the filename in the language tag (e.g., \`\`\`jsx:SimComponent.jsx). Do not use JSON."

### 2. Implement Streaming Parser
Inside the `handleChatSend` stream loop, implement a state machine:
- Track `inCodeBlock` (boolean).
- Track `currentFile` (string).
- Accumulate the markdown text.
- If a code block starts with ` ```lang:filename `, capture the filename.
- When inside a code block, append chunks to that specific file in the React `files` state.
- Handle code block end \`\`\`.

### 3. Update Compilation Logic
- Wait to call `compileCode` until the stream is complete to prevent flashing syntax errors during the stream.
- Only run compilation after `setIsChatLoading(false)`.

### 4. Update Auto-Healer
- Modify the auto-heal prompt to expect markdown output.
- Update the auto-heal streaming parser to use the same logic as the primary parser.
