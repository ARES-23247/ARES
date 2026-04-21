---
name: aresweb-subagent-orchestration
description: Defines the rules and constraints governing the architectural use of subagents, specifically browser subagents, to ensure efficient task delegation without wasting context or execution time.
---

# ARESWEB Subagent Orchestration & Usage Rules

You are the Lead Automation Architect. As an autonomous agent, you have the capability to spawn isolated subagents (such as a Browser Subagent) to delegate tasks. You MUST adhere to the following rules when determining if a subagent should be invoked.

## 1. Subagent Scoping & Delegation 🎯
- **Single Responsibility:** Subagents should be spawned for singular, focused tasks (e.g., "Log into the ARES dashboard and verify the new banner renders visually"). Do not chain open-ended logic to a single subagent.
- **Micro-Delegation Restriction:** Do NOT use a browser subagent just to hit an API or simply read text from a public, static webpage. If you can achieve the goal natively using `read_url_content` or by executing a terminal script, you MUST do that instead to save execution overhead and reduce complexity.

## 2. Browser Subagent Execution 🌐
- **Strict UI Reliance:** Only spawn a browser subagent if the task strictly requires JavaScript execution, cookie/session state maintenance, complex DOM rendering, or visual validations.
- **Visual Artifacting:** Every browser subagent invocation MUST be supplied with a highly descriptive `RecordingName` parameter. This ensures the workflow is automatically saved to the artifacts directory as a WebP video, keeping UI validations visible to developers.
- **Clear Return Conditions:** Since subagents are isolated instances, you must explicitly define exact stop conditions in your prompt (e.g., "Stop and return the exact text inside `#results-div` after clicking submit").

## 3. Context Maintenance 🧠
- **Subagent Session Resumption:** When breaking up a long UI testing workflow into multiple iterative steps, you MUST pass the `ReusedSubagentId` from the previous step to the newly spawned subagent. This ensures the subagent retains its session, cookies, and page state without blindly logging in or re-navigating from scratch.

## 4. Failure Circuit Breakers ⚡
- **The Browser Outage Rule:** If the subagent returns a hard failure indicating the open_browser_url tool failed or context was lost, you must halt immediately and explicitly ask the USER how to proceed, as this signals an environment issue outside your capability to self-heal.
