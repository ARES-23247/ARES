# Phase 60: Visual AI Feedback Loop

## Goal
Hook up html2canvas to capture iframe screenshots and pass visual context to the z.ai model, enabling V0-style iterative UI and visual physics adjustments.

## Steps
1. **Backend Extension**: 
   - Modify `/api/ai/liveblocks-copilot` in `functions/api/routes/ai/index.ts` to accept an `imageUrl` property.
   - If `imageUrl` is present, construct a multi-part `content` array for the user message containing both the text context and the image (parsing the `data:image/png;base64,...` format).

2. **Iframe Integration**:
   - Inject the `html2canvas` CDN script into `SimPreviewFrame.tsx` `srcdoc`.
   - Inject an event listener into the iframe to handle `ARES_REQUEST_SCREENSHOT`, execute `html2canvas(document.body)`, and send back `ARES_SCREENSHOT` with the `dataUrl`.

3. **Frontend UI**:
   - Add a screenshot attachment state `attachedImage` in `SimulationPlayground.tsx`.
   - Add a "Capture Context" button to the chat input area.
   - Show a thumbnail of the captured image if `attachedImage` is set.
   - Include `imageUrl` in the POST request to `/api/ai/liveblocks-copilot` when sending a prompt.

## Automated Execution
Executing immediately.
