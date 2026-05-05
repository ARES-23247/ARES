---
phase: 02-code-review-command
reviewed: 2026-05-04T18:30:00Z
depth: deep
files_reviewed: 25
files_reviewed_list:
  - src/sims/simRegistry.json
  - src/components/SimManager.tsx
  - functions/api/routes/simulations.ts
  - src/sims/bee/index.tsx
  - src/sims/battleship/index.tsx
  - src/sims/greatbee/index.tsx
  - src/sims/untitled/index.tsx
  - src/sims/armkg/index.tsx
  - src/sims/swerve/index.tsx
  - src/sims/field/index.tsx
  - src/sims/field/FieldData.ts
  - src/sims/performance/index.tsx
  - src/sims/performance/LogParser.ts
  - src/sims/flywheelkv/index.tsx
  - src/sims/sysid/index.tsx
  - src/sims/fault/index.tsx
  - src/sims/elevatorpid/index.tsx
  - src/sims/physics/index.tsx
  - src/sims/vision/index.tsx
  - src/sims/troubleshooting/index.tsx
  - src/sims/sotm/index.tsx
  - src/sims/statemachine/index.tsx
  - src/sims/auto/index.tsx
  - src/sims/powershedding/index.tsx
  - src/sims/zeroallocation/index.tsx
  - src/sims/montyhall/index.tsx
  - src/components/SimulationPlayground.tsx
  - src/components/editor/SimPreviewFrame.tsx
  - src/components/science-corner/HybridSimulationWrapper.tsx
findings:
  critical: 5
  warning: 8
  info: 12
  total: 25
status: issues_found
---

# Phase 02: Code Review Report - Simulation System Security Audit

**Reviewed:** 2026-05-04T18:30:00Z  
**Depth:** deep  
**Files Reviewed:** 25  
**Status:** issues_found

## Executive Summary

A comprehensive security audit of the simulation system (`src/sims/`) and related components revealed **5 CRITICAL**, **8 WARNING**, and **12 INFO** level findings. The most significant concerns involve:

1. **Dynamic code execution** in user-generated simulations via `SimPreviewFrame`
2. **Unsafe PostMessage handling** with wildcard origin validation
3. **File upload parsing vulnerabilities** in WPILog processing
4. **Missing input validation** in simulation registry operations
5. **localStorage-based state persistence** without encryption

## Critical Issues

### CR-01: Unsafe PostMessage Origin Validation in SimPreviewFrame

**File:** `src/components/editor/SimPreviewFrame.tsx:23-24, 239, 244`  
**Severity:** CRITICAL

**Issue:** The PostMessage event handler validates `event.origin` against `window.location.origin`, but the iframe code uses template literals that inject the origin at build time. This creates a race condition where:

1. If the page is served from different origins (e.g., during development vs production)
2. The origin check can be bypassed if `window.location.origin` is manipulated via DNS rebinding or origin confusion attacks
3. The screenshot request handler on line 239-248 accepts postMessage without type validation beyond checking origin

**Current Code:**
```typescript
// Line 21-34
const handleMessage = useCallback((event: MessageEvent) => {
  if (event.origin !== window.location.origin) {
    console.warn('SimPreviewFrame: rejected message from unexpected origin:', event.origin);
    return;
  }
  // ...
}, []);
```

**Impact:** Attackers could potentially:
- Send malicious messages to the parent window if origin check is bypassed
- Inject fake telemetry data
- Trigger screenshots unexpectedly
- Exfiltrate data from the sandboxed iframe

**Fix:**
```typescript
// Use allowlist approach with multiple acceptable origins
const ALLOWED_ORIGINS = new Set([
  window.location.origin,
  'https://ares-23247.org', // Production domain
  process.env.VITE_ALLOWED_ORIGIN,
].filter(Boolean));

const handleMessage = useCallback((event: MessageEvent) => {
  if (!ALLOWED_ORIGINS.has(event.origin)) {
    console.warn('SimPreviewFrame: rejected message from unexpected origin:', event.origin);
    return;
  }
  
  // Validate message structure strictly
  if (!event.data || typeof event.data !== 'object') return;
  
  const allowedTypes = ['sim-error', 'sim-ready', 'ARES_TELEMETRY', 'ARES_SCREENSHOT', 'sim-console'];
  if (!allowedTypes.includes(event.data?.type)) return;
  
  // Sanitize data before processing
  if (event.data.type === 'ARES_TELEMETRY') {
    const { key, value } = event.data;
    if (typeof key !== 'string' || typeof value !== 'number') return;
    // Continue processing...
  }
}, []);
```

---

### CR-02: Wildcard PostMessage Target for Screenshot Request

**File:** `src/components/SimulationPlayground.tsx:1096-1099`  
**Severity:** CRITICAL

**Issue:** The screenshot capture function sends postMessage with `'*'` as the target origin, completely bypassing same-origin policy protections.

**Current Code:**
```typescript
const iframe = document.querySelector('iframe');
if (iframe && iframe.contentWindow) {
  iframe.contentWindow.postMessage({ type: 'ARES_REQUEST_SCREENSHOT' }, '*');
}
```

**Impact:** 
- Any iframe on the page (including malicious third-party iframes) could intercept this message
- Cross-origin communication could be triggered from unexpected contexts
- Potential data leakage if other iframes respond with sensitive data

**Fix:**
```typescript
const iframe = document.querySelector('iframe');
if (iframe && iframe.contentWindow) {
  // Only send to known sandboxed iframe origin
  iframe.contentWindow.postMessage(
    { type: 'ARES_REQUEST_SCREENSHOT' }, 
    window.location.origin
  );
}
```

---

### CR-03: Unsafe WPILog Parsing Without Size Limits

**File:** `src/sims/performance/LogParser.ts:74-134`  
**Severity:** CRITICAL

**Issue:** The `parseWPILog` function processes binary data without proper bounds checking or size limits on array allocations. The entry count estimation on line 78 could lead to massive array allocations.

**Current Code:**
```typescript
// Line 78-80
const entryCount = Math.floor(arrayBuffer.byteLength / 100); // Rough estimate

for (let i = 0; i < Math.min(entryCount, 10000); i++) {
  const offset = i * 100;
  if (offset + 20 > arrayBuffer.byteLength) break;
```

**Impact:**
- A malicious 10MB file could try to parse 100,000+ entries before the 10,000 limit
- Each iteration creates new objects without validation of the array length read from the binary data
- The `arrLength` on line 110 is used directly without validation against reasonable bounds
- DoS via memory exhaustion

**Fix:**
```typescript
// Add strict limits before any processing
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB hard limit
const MAX_ENTRIES = 5000;
const MAX_ARRAY_LENGTH = 100;

if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
  throw new Error(`File too large: ${arrayBuffer.byteLength} bytes (max ${MAX_FILE_SIZE})`);
}

const entryCount = Math.min(
  Math.floor(arrayBuffer.byteLength / 100),
  MAX_ENTRIES
);

for (let i = 0; i < entryCount; i++) {
  const offset = i * 100;
  if (offset + 20 > arrayBuffer.byteLength) break;
  
  // ... existing code ...
  
  case 3: { // number array
    const arrLength = Math.min(dataView.getUint8(offset + 10), MAX_ARRAY_LENGTH);
    value = new Array(arrLength).fill(0).map((_, j) =>
      dataView.getFloat64(offset + 11 + j * 8, true)
    );
    // Validate we don't read past buffer
    if (offset + 11 + arrLength * 8 > arrayBuffer.byteLength) {
      throw new Error(`Array data exceeds buffer bounds at entry ${i}`);
    }
    break;
  }
}
```

---

### CR-04: Unescaped User Input in AI Chat Context Injection

**File:** `src/components/SimulationPlayground.tsx:554-589`  
**Severity:** CRITICAL

**Issue:** The AI system prompt includes user-controlled content (files, chat messages) directly without proper escaping, enabling prompt injection attacks.

**Current Code:**
```typescript
const systemContext = `You are a z.AI simulation code assistant...
CURRENT FILES:
\`\`\`json
${filesJson}
\`\`\`

USER REQUEST: ${msg}`;
```

**Impact:**
- Attacker could inject system prompts to manipulate AI behavior
- Could exfiltrate data from other simulations or system context
- Could bypass the "single file" constraint to generate multi-file exploits

**Fix:**
```typescript
import DOMPurify from 'dompurify'; // or similar sanitization

// Sanitize file content before inclusion
const sanitizedFilesJson = JSON.stringify(files, (key, value) => {
  if (typeof value === 'string') {
    // Limit string length and remove control characters
    return value
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control chars
      .slice(0, 10000); // Max 10KB per string
  }
  return value;
}, 2);

const sanitizedMsg = msg
  .replace(/[\x00-\x1F\x7F]/g, '')
  .slice(0, 5000);

const systemContext = `You are a z.AI simulation code assistant...
CURRENT FILES:
\`\`\`json
${sanitizedFilesJson}
\`\`\`

USER REQUEST: ${sanitizedMsg}`;
```

---

### CR-05: localStorage Usage Without Encryption for Sensitive Data

**File:** `src/components/SimulationPlayground.tsx:105-126`  
**Severity:** CRITICAL

**Issue:** Chat messages containing potentially sensitive simulation code and AI interactions are stored in localStorage without encryption.

**Current Code:**
```typescript
const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
  try {
    const idParam = new URLSearchParams(window.location.search).get("simId");
    const stored = localStorage.getItem(`sim_chat_${idParam || 'new'}`);
    if (stored) return JSON.parse(stored);
  } catch (e) { console.error(e); }
  return [DEFAULT_MESSAGE];
});

// ...
useEffect(() => {
  localStorage.setItem(`sim_chat_${simId || 'new'}`, JSON.stringify(chatMessages));
}, [chatMessages, simId]);
```

**Impact:**
- Any XSS vulnerability (even in a different origin via shared localStorage)
- Physical access to device exposes all chat history
- Browser extensions can read this data
- No data minimization or retention policy

**Fix:**
```typescript
// Use sessionStorage with encryption for sensitive data
import { encrypt, decrypt } from './crypto-utils';

const STORAGE_PREFIX = 'sim_chat_enc_';

const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
  try {
    const idParam = new URLSearchParams(window.location.search).get("simId");
    const key = `${STORAGE_PREFIX}${idParam || 'new'}`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const decrypted = decrypt(stored);
      return JSON.parse(decrypted);
    }
  } catch (e) { console.error(e); }
  return [DEFAULT_MESSAGE];
});

useEffect(() => {
  try {
    const encrypted = encrypt(JSON.stringify(chatMessages));
    const key = `${STORAGE_PREFIX}${simId || 'new'}`;
    sessionStorage.setItem(key, encrypted);
    
    // Implement retention: only keep last 50 messages
    if (chatMessages.length > 50) {
      setChatMessages(prev => prev.slice(-50));
    }
  } catch (e) {
    console.error('Failed to encrypt chat history:', e);
  }
}, [chatMessages, simId]);
```

---

## Warnings

### WR-01: Missing Content Security Policy for iframe Sandbox

**File:** `src/components/editor/SimPreviewFrame.tsx:270`  
**Severity:** WARNING

**Issue:** The iframe uses `sandbox="allow-scripts allow-same-origin"` but doesn't restrict other potentially dangerous permissions like `allow-forms`, `allow-popups`, or `allow-top-navigation`.

**Current Code:**
```tsx
<iframe
  ref={iframeRef}
  title="Simulation Preview"
  sandbox="allow-scripts allow-same-origin"
  className="flex-1 w-full h-full bg-[#0d1117] border-0 rounded-b-lg"
/>
```

**Fix:**
```tsx
<iframe
  ref={iframeRef}
  title="Simulation Preview"
  sandbox="allow-scripts allow-same-origin allow-forms"
  // Note: Intentionally NOT allowing:
  // - allow-top-navigation (prevents redirecting parent)
  // - allow-popups (prevents opening new windows)
  // - allow-modals (prevents blocking user interaction)
  referrerPolicy="no-referrer"
  className="flex-1 w-full h-full bg-[#0d1117] border-0 rounded-b-lg"
/>
```

---

### WR-02: Unvalidated External Script Loading in Monaco Editor

**File:** `src/components/SimulationPlayground.tsx:9-11`  
**Severity:** WARNING

**Issue:** Monaco Editor is loaded from CDN with SRI only on the main script, but worker files (which Monaco loads dynamically) have no integrity verification.

**Current Code:**
```typescript
loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" },
});
```

**Impact:**
- CDN compromise could inject malicious worker code
- Workers run with same-origin privileges
- Comment acknowledges this issue but doesn't implement mitigation

**Fix:**
```typescript
// Consider vendoring Monaco for production
const MONACO_VERSION = "0.52.2";

if (import.meta.env.PROD) {
  // Use local vendored copy in production
  loader.config({
    paths: { vs: `/vendor/monaco-editor/${MONACO_VERSION}/min/vs` }
  });
} else {
  // Development: use CDN with Subresource Integrity where possible
  loader.config({
    paths: { vs: `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs` }
  });
}

// Add CSP headers for worker scripts:
// Content-Security-Policy: script-src 'self' https://cdn.jsdelivr.net; worker-src 'self' blob:
```

---

### WR-03: GitHub Username Spoofing in Simulation Author Check

**File:** `functions/api/routes/simulations.ts:46-48`  
**Severity:** WARNING

**Issue:** Ownership verification relies solely on GitHub commit author email comparison, which can be spoofed.

**Current Code:**
```typescript
const authorEmail = commits[0]?.author?.email;
return authorEmail === sessionUser.email;
```

**Impact:**
- Users can set their git config to use any email
- Commits can be forged to appear from another user
- Unauthorized modification/deletion possible

**Fix:**
```typescript
// Use GitHub's verified identity via commit signature or API authorship
async function canModifySimulation(c: any, simId: string): Promise<boolean> {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser) return false;

  if (sessionUser.role === "admin") return true;

  try {
    const db = c.get("db");
    const config = await db.selectFrom("settings").selectAll().execute();
    const patSetting = config.find((s: any) => s.key === "GITHUB_PAT");
    const pat = patSetting?.value || c.env.GITHUB_PAT;

    if (!pat) return false;

    const headers: Record<string, string> = {
      "User-Agent": "ARES-Cloudflare-Worker",
      "Authorization": `Bearer ${pat}`,
      "Accept": "application/vnd.github.v3+json"
    };

    // Get full commit details with verification
    const path = `src/sims/${simId}.tsx`;
    const url = `https://api.github.com/repos/ARES-23247/ARESWEB/commits?path=${path}&per_page=1`;

    const res = await fetch(url, { headers });
    if (!res.ok) return false;

    const commits = await res.json();
    if (!commits || commits.length === 0) return false;

    // Check multiple factors for ownership
    const commit = commits[0];
    const authorEmail = commit.author?.email;
    const verified = commit.commit?.verification?.verified;
    const committerLogin = commit.committer?.login;

    // Primary: match by email AND either verified commit OR committer matches session user's GitHub login
    if (authorEmail === sessionUser.email) {
      if (verified) return true;
      
      // Secondary check: verify committer identity via GitHub API
      if (committerLogin) {
        const userRes = await fetch(`https://api.github.com/user/${committerLogin}`, { headers });
        if (userRes.ok) {
          const userData = await userRes.json();
          // Only allow if committer's primary email matches session user
          const emailsRes = await fetch(`https://api.github.com/user/emails`, { 
            headers: { ...headers, "Authorization": `Bearer ${sessionUser.github_token}` }
          });
          if (emailsRes.ok) {
            const emails = await emailsRes.json();
            const hasMatchingEmail = emails.some((e: any) => 
              e.email === sessionUser.email && e.verified
            );
            if (hasMatchingEmail && committerLogin === userData.login) return true;
          }
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}
```

---

### WR-04: Race Condition in Simulation Registry Auto-Registration

**File:** `functions/api/routes/simulations.ts:221-256`  
**Severity:** WARNING

**Issue:** When saving a new simulation, the code checks if the sim exists in the registry, then adds it. Between the GET and PUT, another request could add the same sim, causing a race.

**Current Code:**
```typescript
if (!sha) {
  const regUrl = `https://api.github.com/repos/ARES-23247/ARESWEB/contents/src/sims/simRegistry.json`;
  const regGetRes = await fetch(regUrl, { headers });
  if (regGetRes.ok) {
    const regJson = (await regGetRes.json()) as any;
    const regSha = regJson.sha;
    const regContentStr = decodeURIComponent(escape(atob(regJson.content)));
    try {
      const registry = JSON.parse(regContentStr);
      
      if (!registry.simulators.some((s: any) => s.id === simIdStr)) {
        // RACE: Another request could add simIdStr here
        registry.simulators.push({ ... });
        
        // PUT with old SHA will fail if concurrent modification occurred
        await fetch(regUrl, { /* ... */ });
      }
    }
  }
}
```

**Impact:**
- Concurrent saves could corrupt registry
- Lost updates
- Duplicate entries possible

**Fix:**
```typescript
if (!sha) {
  const regUrl = `https://api.github.com/repos/ARES-23247/ARESWEB/contents/src/sims/simRegistry.json`;
  
  // Implement retry logic for concurrent modifications
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const regGetRes = await fetch(regUrl, { headers });
    if (!regGetRes.ok) break;
    
    const regJson = (await regGetRes.json()) as any;
    const regSha = regJson.sha;
    const regContentStr = decodeURIComponent(escape(atob(regJson.content)));
    
    try {
      const registry = JSON.parse(regContentStr);
      
      if (!registry.simulators.some((s: any) => s.id === simIdStr)) {
        registry.simulators.push({
          id: simIdStr,
          name: name || simIdStr,
          path: `./${simIdStr}`,
          requiresContext: false
        });
        
        const newRegContent = JSON.stringify(registry, null, 2);
        const newRegBase64 = btoa(unescape(encodeURIComponent(newRegContent)));
        
        const regPutRes = await fetch(regUrl, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            message: `feat(sims): register ${simIdStr} in simRegistry.json`,
            content: newRegBase64,
            sha: regSha
          })
        });
        
        if (regPutRes.ok) {
          break; // Success
        } else if (regPutRes.status === 409 && attempt < maxRetries - 1) {
          // Conflict - retry with fresh data
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
          continue;
        } else {
          console.error("[Simulations] Registry update failed:", await regPutRes.text());
          break;
        }
      }
    } catch (e) {
      console.error("[Simulations] Registry update failed:", e);
      if (attempt === maxRetries - 1) throw e;
    }
  }
}
```

---

### WR-05: Missing Input Length Validation in Simulation Save

**File:** `functions/api/routes/simulations.ts:6-9`  
**Severity:** WARNING

**Issue:** The Zod schema validates file content as strings up to 500KB, but doesn't validate the number of files or total payload size.

**Current Code:**
```typescript
const saveSimulationSchema = z.object({
  name: z.string().max(100).optional(),
  files: z.record(z.string(), z.string().max(500000)), // 500KB max per file
});
```

**Impact:**
- User could submit thousands of 500KB files
- Total payload could exceed memory limits
- Base64 encoding in upload adds 33% overhead

**Fix:**
```typescript
const MAX_FILES = 10;
const MAX_TOTAL_SIZE = 2 * 1024 * 1024; // 2MB total

const saveSimulationSchema = z.object({
  name: z.string().max(100).optional(),
  files: z.record(z.string(), z.string().max(500000)).refine(
    (files) => {
      const fileCount = Object.keys(files).length;
      if (fileCount > MAX_FILES) {
        throw new Error(`Too many files: ${fileCount} (max ${MAX_FILES})`);
      }
      
      const totalSize = Object.values(files).reduce((sum, content) => sum + content.length, 0);
      if (totalSize > MAX_TOTAL_SIZE) {
        throw new Error(`Total size too large: ${totalSize} bytes (max ${MAX_TOTAL_SIZE})`);
      }
      
      // Validate filename patterns to prevent path traversal
      for (const filename of Object.keys(files)) {
        if (!/^[a-zA-Z0-9_\-\.]+\.(tsx?|jsx?|json)$/.test(filename)) {
          throw new Error(`Invalid filename: ${filename}`);
        }
      }
      
      return true;
    },
    { message: "Files validation failed" }
  ),
});

// Also validate in route handler
const { name, files } = validationResult.data;
const totalSize = Object.values(files).reduce((sum, f) => sum + f.length, 0);
if (totalSize > MAX_TOTAL_SIZE) {
  return c.json({ error: `Payload too large: ${totalSize} bytes` }, 413);
}
```

---

### WR-06: Canvas Event Handler Memory Leaks

**File:** Multiple simulation files (e.g., `src/sims/bee/index.tsx:585-624`, `src/sims/physics/index.tsx:215-250`)  
**Severity:** WARNING

**Issue:** Canvas event handlers are added in useEffect but the cleanup functions may not properly remove all listeners, especially for mouseleave events.

**Current Code:**
```typescript
// Example from bee/index.tsx
useEffect(() => {
  // ...
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mouseleave", handleMouseUp);

  return () => {
    // Cleanup missing removeEventListener for mousedown, mousemove
    cancelAnimationFrame(animationFrameId);
  };
}, [tagCount, yawRate, tiltVal]);
```

**Impact:**
- Memory leaks on component unmount
- Multiple event handlers stack up if dependencies change frequently
- Performance degradation over time

**Fix:**
```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const handleMouseDown = (e: MouseEvent) => { /* ... */ };
  const handleMouseMove = (e: MouseEvent) => { /* ... */ };
  const handleMouseUp = () => { /* ... */ };
  
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mouseleave", handleMouseUp);

  return () => {
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("mouseleave", handleMouseUp);
    cancelAnimationFrame(animationFrameId);
  };
}, [tagCount, yawRate, tiltVal]);
```

---

### WR-07: Unbounded Array Growth in History Buffers

**File:** Multiple simulation files (e.g., `src/sims/montyhall/index.tsx:24-27`, `src/sims/bee/index.tsx:39`)  
**Severity:** WARNING

**Issue:** Several simulations use arrays for history that grow without bounds. While some use `.slice(-N)` to limit growth, others rely on implicit assumptions.

**Current Code:**
```typescript
// montyhall/index.tsx - Good example with slice
const [history, setHistory] = useState<RoundResult[]>([]);

// In auto-simulate:
setHistory(prev => [...prev, { /* ... */ }]); // No bound check in some paths

// bee/index.tsx - Uses slice in render loop but not validated
const fwHist: {v: number, s: number}[] = [];
// ...
fwHist.push({v: fwVel, s: curSet});
if(fwHist.length > 250) fwHist.shift(); // Good
```

**Impact:**
- Long-running simulations could consume excessive memory
- Auto-simulate feature could run indefinitely

**Fix:**
```typescript
// Add constant limits
const MAX_HISTORY = 1000;

setHistory(prev => {
  const newHistory = [...prev, { /* ... */ }];
  return newHistory.slice(-MAX_HISTORY);
});

// For auto-simulate, add explicit stop conditions
const [autoRunning, setAutoRunning] = useState(false);
const [maxRounds, setMaxRounds] = useState(10000);

useEffect(() => {
  if (!autoRunning) return;
  if (history.length >= maxRounds) {
    setAutoRunning(false);
    return;
  }
  // ...
}, [autoRunning, history.length, maxRounds]);
```

---

### WR-08: Missing Validation in Simulation ID Parameter

**File:** `functions/api/routes/simulations.ts:94-99, 266-276`  
**Severity:** WARNING

**Issue:** The `/:id` parameter is used directly in GitHub API URLs without validation, allowing potential path traversal or injection.

**Current Code:**
```typescript
simulationsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  
  if (!id.startsWith("github:")) {
    return c.json({ error: "Simulation not found" }, 404);
  }
  
  const simId = id.replace("github:", "");
  // No validation of simId format before using in URL
  const ghRes = await fetch(`https://api.github.com/repos/ARES-23247/ARESWEB/contents/src/sims/${simId}.tsx`, { headers });
```

**Impact:**
- Path traversal via `../` in simId
- Information disclosure from GitHub repo
- Potential injection of other API endpoints

**Fix:**
```typescript
const SIM_ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;

simulationsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  
  if (!id.startsWith("github:")) {
    return c.json({ error: "Simulation not found" }, 404);
  }
  
  const simId = id.replace("github:", "");
  
  // Validate simId format
  if (!SIM_ID_PATTERN.test(simId)) {
    return c.json({ error: "Invalid simulation ID" }, 400);
  }
  
  // Ensure no path traversal
  if (simId.includes('..') || simId.includes('/') || simId.includes('\\')) {
    return c.json({ error: "Invalid simulation ID" }, 400);
  }
  
  // Enforce .tsx extension explicitly
  const filename = `${simId}.tsx`;
  const ghRes = await fetch(`https://api.github.com/repos/ARES-23247/ARESWEB/contents/src/sims/${filename}`, { headers });
```

---

## Info

### IN-01: Unused Variables in Performance Parsing

**File:** `src/sims/performance/LogParser.ts:323`  
**Severity:** INFO

**Issue:** The `avgTime` variable is calculated but never used in bottleneck severity calculation.

**Fix:**
```typescript
const avgTime = stats.average;
bottlenecks.push({
  category,
  metric: `${category} Loop Time`,
  avgTimeMs: avgTime / 1000,
  maxTimeMs: maxTime / 1000,
  percentOfTotal: 0,
  severity: calculateSeverity(avgTime), // Uses avgTime correctly
});
```

---

### IN-02: Magic Numbers in Physics Simulations

**Files:** Multiple simulation files  
**Severity:** INFO

**Issue:** Hardcoded physics constants without clear units or comments.

**Examples:**
- `src/sims/armkg/index.tsx:43` - `const GRAVITY_PULL = -0.6 * cosTheta;`
- `src/sims/swerve/index.tsx:70` - `armVel *= 0.85;` (friction coefficient)
- `src/sims/elevatorpid/index.tsx:63` - `velocity *= 0.88;`

**Fix:**
```typescript
// Define constants with documentation
const PHYSICS = {
  GRAVITY_ACCEL: 9.81, // m/s^2
  AIR_RESISTANCE_COEFF: 0.85, // Dimensionless damping factor
  MOTOR_EFFICIENCY: 0.88, // Output/input ratio
  DT: 0.02, // 20ms timestep (50Hz)
} as const;

// Use in code
velocity *= PHYSICS.MOTOR_EFFICIENCY;
```

---

### IN-03: Inconsistent Error Handling in useEffect

**Files:** Multiple simulation files  
**Severity:** INFO

**Issue:** Some useEffect blocks have try-catch while others don't, leading to potential unhandled promise rejections.

**Fix:**
```typescript
useEffect(() => {
  let cancelled = false;
  
  async function loadAndRender() {
    try {
      // ... code ...
    } catch (error) {
      if (!cancelled) {
        console.error('Simulation error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }
  
  loadAndRender();
  
  return () => {
    cancelled = true;
  };
}, []);
```

---

### IN-04: Missing Loading States for Remote Sim Loading

**File:** `src/components/SimulationPlayground.tsx:400-446`  
**Severity:** INFO

**Issue:** The `handleLoadSim` function doesn't provide loading feedback during GitHub fetch operations.

**Fix:**
```typescript
const [isLoadingSim, setIsLoadingSim] = useState(false);

const handleLoadSim = async (id: string) => {
  setIsLoadingSim(true);
  try {
    const res = await fetch(`/api/simulations/${id}`);
    // ... rest of code ...
  } catch (e) {
    console.error("[SimPlayground] Load failed:", e);
    const { toast } = await import("sonner");
    toast.error("Failed to load simulation");
  } finally {
    setIsLoadingSim(false);
  }
};
```

---

### IN-05: Duplicate Code Between Simulations

**Files:** `src/sims/bee/index.tsx` and `src/sims/greatbee/index.tsx`  
**Severity:** INFO

**Issue:** These files are identical code duplication.

**Fix:** Extract to shared component:
```typescript
// src/sims/shared/BeeSimulation.tsx
export function createBeeSimulation(config: {
  flowerCount: number;
  beeCount: number;
  speed: number;
}) {
  return function BeeSim() {
    // ... shared implementation ...
  };
}

// src/sims/bee/index.tsx
export default createBeeSimulation({ flowerCount: 12, beeCount: 3, speed: 1 });

// src/sims/greatbee/index.tsx  
export default createBeeSimulation({ flowerCount: 20, beeCount: 5, speed: 1.5 });
```

---

### IN-06: Missing Accessibility Labels on Range Sliders

**Files:** Multiple simulation files  
**Severity:** INFO

**Issue:** Some range inputs have `aria-label` while others don't.

**Fix:** Ensure all interactive elements have labels:
```typescript
<input 
  type="range" 
  min="0" 
  max="5" 
  step="0.1" 
  value={vx} 
  onChange={e => setVx(parseFloat(e.target.value))} 
  aria-label="Forward velocity in meters per second"
  style={{ width: '100%' }} 
/>
```

---

### IN-07: Unsafe parseInt Without Base Argument

**Files:** Multiple simulation files  
**Severity:** INFO

**Issue:** `parseInt` calls don't specify radix 10, which can cause issues with leading-zero numbers.

**Fix:**
```typescript
// Before
parseInt(e.target.value)

// After
parseInt(e.target.value, 10)
Number(e.target.value)
parseFloat(e.target.value)
```

---

### IN-08: Inline Styles Instead of CSS Classes

**Files:** Most simulation files  
**Severity:** INFO

**Issue:** Heavy use of inline styles makes theming and maintenance difficult.

**Fix:** Consider CSS modules or styled-components for better maintainability.

---

### IN-09: Commented-Out Debug Code

**File:** `src/components/SimulationPlayground.tsx:94-101`  
**Severity:** INFO

**Issue:** eslint-disable-next-line comments indicate potential code quality issues.

**Fix:**
```typescript
// Instead of disabling eslint, properly type the refs
interface MonacoEditorInstance {
  getValue(): string;
  getModel(): monaco.editor.ITextModel;
}

const editorRef = useRef<MonacoEditorInstance | null>(null);
```

---

### IN-10: Large Number of State Variables in Some Components

**File:** `src/components/SimulationPlayground.tsx:64-116`  
**Severity:** INFO

**Issue:** 20+ useState variables could be consolidated with useReducer.

**Fix:**
```typescript
interface SimState {
  files: Record<string, string>;
  activeFile: string;
  compiledFiles: Record<string, string>;
  compileError: string | null;
  isCompiling: boolean;
  // ... other fields
}

type SimAction = 
  | { type: 'SET_FILES'; files: Record<string, string> }
  | { type: 'SET_ACTIVE_FILE'; file: string }
  | { type: 'COMPILE_START' }
  | { type: 'COMPILE_SUCCESS'; files: Record<string, string> }
  | { type: 'COMPILE_ERROR'; error: string };

function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case 'SET_FILES':
      return { ...state, files: action.files };
    // ...
  }
}

const [state, dispatch] = useReducer(simReducer, initialState);
```

---

### IN-11: Missing TypeScript Strict Mode Annotations

**Files:** Multiple simulation files  
**Severity:** INFO

**Issue:** Some functions lack explicit return type annotations.

**Fix:**
```typescript
// Before
function getSplinePoint(pts: Point[], t: number): Point {

// After (already correct in this case, but check others)
function getSplinePoint(pts: Point[], t: number): Point {
  // Ensure all return paths are typed
}
```

---

### IN-12: Hardcoded GitHub Repository References

**Files:** `functions/api/routes/simulations.ts`, `src/components/SimulationPlayground.tsx:388`  
**Severity:** INFO

**Issue:** Repository owner/name is hardcoded in multiple places.

**Fix:**
```typescript
// env.ts
export const GITHUB_REPO = {
  owner: process.env.GITHUB_REPO_OWNER || 'ARES-23247',
  repo: process.env.GITHUB_REPO_NAME || 'ARESWEB',
  branch: process.env.GITHUB_BRANCH || 'main',
};

// Usage
const repoUrl = `https://api.github.com/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.repo}`;
```

---

## Summary Statistics

| Severity | Count | Files Affected |
|----------|-------|----------------|
| Critical | 5 | SimPreviewFrame.tsx, SimulationPlayground.tsx, LogParser.ts, simulations.ts |
| Warning | 8 | SimPreviewFrame.tsx, SimulationPlayground.tsx, simulations.ts, multiple sim files |
| Info | 12 | Multiple simulation files |

## Recommendations

1. **Immediate (Critical):**
   - Fix PostMessage origin validation to use allowlist approach
   - Remove wildcard target for screenshot requests
   - Add bounds checking to WPILog parser
   - Implement AI prompt sanitization
   - Encrypt localStorage data

2. **Short-term (Warnings):**
   - Implement proper GitHub ownership verification
   - Add input validation for simulation IDs
   - Fix event handler cleanup in canvas simulations
   - Add Content Security Policy for iframes

3. **Long-term (Info):**
   - Consolidate duplicate simulation code
   - Migrate inline styles to CSS modules
   - Implement comprehensive error boundaries
   - Add accessibility audit

---

_Reviewed: 2026-05-04T18:30:00Z_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: deep_
