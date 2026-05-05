---
phase: frontend-security-audit
reviewed: 2025-01-04T15:00:00Z
depth: deep
files_reviewed: 156
files_reviewed_list:
  - src/components/CommandPalette.tsx
  - src/components/InteractiveTutorial.tsx
  - src/components/SimulationPlayground.tsx
  - src/components/Turnstile.tsx
  - src/components/AvatarEditor.tsx
  - src/components/ZulipThread.tsx
  - src/components/tools/TeamAnalysisCard.tsx
  - src/components/tools/ScoutingTool.tsx
  - src/components/ai/GlobalRAGChatbot.tsx
  - src/components/profile/SecuritySettings.tsx
  - src/components/profile/ContactForm.tsx
  - src/pages/JudgesHub.tsx
  - src/pages/PrintPortfolio.tsx
  - src/pages/Home.tsx
  - src/pages/EventDetail.tsx
  - src/pages/ProfilePage.tsx
  - src/pages/BlogPost.tsx
  - src/pages/Join.tsx
  - src/pages/BugReport.tsx
  - src/utils/security.ts
  - src/utils/auth-client.ts
  - src/utils/apiClient.ts
  - src/hooks/useExperimentState.ts
  - index.html
  - package.json
findings:
  critical: 6
  warning: 12
  info: 8
  total: 26
status: issues_found
---

# Frontend Security Audit Report

**Reviewed:** 2025-01-04
**Depth:** deep
**Files Reviewed:** 156
**Status:** issues_found

## Summary

A comprehensive security audit of the ARES 23247 frontend React components and pages revealed **26 findings** across critical, warning, and info severity levels. The codebase demonstrates strong security practices in many areas (DOMPurify usage, Better Auth integration, Turnstile CAPTCHA) but has several **critical vulnerabilities** requiring immediate remediation.

### Key Concerns:
- **Unsanitized markdown-to-HTML conversion** in two components creates XSS risk
- ** Judges Hub authentication token stored in localStorage** vulnerable to XSS theft
- ** Monaco Editor loaded from CDN without SRI** creates supply chain risk
- **Missing Content Security Policy** in index.html
- **URL parameters not validated** before API calls in multiple pages
- **Third-party CDN dependencies** loaded without integrity checks

---

## Critical Issues

### CR-01: Unsanitized Markdown-to-HTML Conversion in AI Analysis Components

**Files:**
- `src/components/tools/TeamAnalysisCard.tsx:217`
- `src/components/tools/ScoutingTool.tsx:454`

**Issue:** The custom `markdownToHtml()` function performs basic regex replacements without proper sanitization. While it only outputs a limited set of HTML tags, it does not sanitize the input content itself, allowing malicious markdown to inject arbitrary attributes or bypass the simple regex patterns.

```tsx
// Current vulnerable implementation:
function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    // ... more replacements
  return html;
}
```

**Impact:** If AI-generated analysis includes malicious markdown patterns (e.g., from prompt injection), attackers could inject arbitrary HTML attributes including event handlers like `onload="alert(1)"` or `onerror="maliciousCode()"`.

**Fix:**
```tsx
import DOMPurify from 'dompurify';

function markdownToHtml(md: string): string {
  // First, convert markdown to HTML
  let html = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$2</h2>")
    // ... rest of conversion
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'strong', 'em', 'p', 'ul', 'li'],
    ALLOWED_ATTR: ['class']
  });
}
```

---

### CR-02: Judges Hub Authentication Token Stored in localStorage

**File:** `src/pages/JudgesHub.tsx:63-73`

**Issue:** The judge access code is stored in `localStorage` which is accessible to any JavaScript running on the page, making it vulnerable to XSS token theft.

```tsx
localStorage.setItem("ares_judge_code", code);
// ...
const savedCode = localStorage.getItem("ares_judge_code");
```

**Impact:** If any XSS vulnerability exists on the page (or in any third-party script loaded), an attacker can steal the judge code and gain unauthorized access to the Judges Hub.

**Fix:**
```tsx
// Use sessionStorage instead (clears on browser close)
sessionStorage.setItem("ares_judge_code", code);

// Better: Store in an httpOnly cookie via the backend
// after successful authentication, then verify server-side
```

---

### CR-03: Monaco Editor CDN Dependency Without SRI

**File:** `src/components/SimulationPlayground.tsx:9-11`

**Issue:** Monaco Editor is loaded from CDN without Subresource Integrity (SRI) hash verification. The comment acknowledges this but it's still a production security gap.

```tsx
// Note: @monaco-editor/react doesn't support SRI for worker files.
loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" },
});
```

**Impact:** If the CDN is compromised or performs a supply chain attack, malicious JavaScript will be executed in user browsers. The comment in `index.html` (line 13) shows SRI is used for Font Awesome, but not for Monaco.

**Fix:**
```tsx
// 1. Vendor Monaco Editor locally instead of using CDN
// 2. Or add CSP header to restrict script sources
// 3. Use npm package with integrity-checked bundled files

// In vite.config.ts, add:
build: {
  rollupOptions: {
    external: ['monaco-editor'],
    output: {
      globals: { 'monaco-editor': 'monaco' }
    }
  }
}
```

---

### CR-04: Missing Content Security Policy in HTML

**File:** `index.html:1-20`

**Issue:** The main HTML file loads multiple external resources (Google Fonts, Font Awesome CDN, Cloudflare Turnstile) without a Content-Security-Policy meta tag or HTTP header.

```html
<link href="https://fonts.googleapis.com/css2?family=Inter..." rel="stylesheet" />
<link href="https://cdnjs.cloudflare.com/...font-awesome.min.css" 
      integrity="sha512-..." crossorigin="anonymous" />
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>
```

**Impact:** Without CSP, any XSS vulnerability can be exploited to load external scripts, exfiltrate data, or perform CSRF attacks.

**Fix:**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
  font-src https://fonts.gstatic.com https://cdnjs.cloudflare.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.dicebear.com;
">
```

---

### CR-05: URL Parameters Not Validated Before API Calls

**Files:**
- `src/pages/EventDetail.tsx:34`
- `src/pages/ProfilePage.tsx:47`
- `src/pages/BlogPost.tsx:31`
- `src/components/SimulationPlayground.tsx:107`

**Issue:** URL parameters from `useParams()` are used directly in API calls without validation or sanitization. An attacker could inject malicious IDs or path traversal characters.

```tsx
// In EventDetail.tsx:
const { id } = useParams<{ id: string }>();
const { data: eventRes } = api.events.getEvent.useQuery(["event", id], {
  params: { id: id || "" },  // No validation
});
```

**Impact:** Potential SQL injection (if backend doesn't validate), information disclosure through enumeration attacks, or injection attacks against backend APIs.

**Fix:**
```tsx
import { z } from 'zod';

const idSchema = z.string().uuid().or(z.string().regex(/^\d+$/));

const { id } = useParams<{ id: string }>();
const validatedId = idSchema.safeParse(id);

if (!validatedId.success) {
  return <div>Invalid ID format</div>;
}

api.events.getEvent.useQuery(["event", validatedId.data], {
  params: { id: validatedId.data },
});
```

---

### CR-06: Window Location Reload Exposes Sensitive Data in URL

**File:** `src/components/AvatarEditor.tsx:180`

**Issue:** After saving the avatar, the page performs `window.location.reload()` which may expose sensitive data in URL parameters or referer headers.

```tsx
const handleSave = async () => {
  // ...
  await authClient.updateUser({ image: currentUrl });
  window.location.reload();  // Full page reload
};
```

**Impact:** The currentUrl containing avatar parameters is logged in browser history and could leak in Referer headers to external links.

**Fix:**
```tsx
// Use React state management instead of page reload
const [saved, setSaved] = useState(false);
const handleSave = async () => {
  await authClient.updateUser({ image: currentUrl });
  setSaved(true);
  // Optionally queryClient.invalidateQueries() to refresh session data
};
```

---

## Warnings

### WR-01: react-markdown with rehype-raw May Allow Unsafe HTML

**File:** `package.json:142`

**Issue:** The application uses `rehype-raw` which allows HTML in markdown. If not properly configured with `rehype-sanitize`, this creates XSS risk.

```json
"rehype-raw": "^7.0.0",
"rehype-sanitize": "^6.0.0",
```

**Impact:** User-controlled markdown content could contain malicious HTML tags and attributes.

**Fix:** Verify that `rehype-sanitize` is always configured when using `rehype-raw`:
```tsx
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeRaw, rehypeSanitize]}
/>
```

---

### WR-02: Missing Input Type Validation in Bug Report Form

**File:** `src/pages/BugReport.tsx:10-27`

**Issue:** The `repoStr` state can be manipulated to point to arbitrary GitHub repositories, potentially redirecting users to malicious phishing sites.

```tsx
const [repoStr, setRepoStr] = useState(`${siteConfig.urls.githubOrg}/ARESWEB`);

const finalUrl = `https://github.com/${repoStr}/issues/new`;
window.open(finalUrl, '_blank', 'noopener,noreferrer');
```

**Impact:** Attackers could craft URLs that redirect users to lookalike GitHub phishing pages.

**Fix:**
```tsx
const ALLOWED_REPOS = [
  `${siteConfig.urls.githubOrg}/ARESWEB`,
  `${siteConfig.urls.githubOrg}/IntoTheDeep`
] as const;

<select
  value={repoStr}
  onChange={(e) => {
    const selected = e.target.value;
    if (ALLOWED_REPOS.includes(selected as any)) {
      setRepoStr(selected);
    }
  }}
>
```

---

### WR-03: Session ID Stored in sessionStorage Without Encryption

**File:** `src/components/ai/GlobalRAGChatbot.tsx:18-24`

**Issue:** The chatbot session ID is stored in plain sessionStorage. While better than localStorage, it's still readable by any script on the page.

```tsx
const [sessionId] = useState(() => {
  const existing = sessionStorage.getItem("ares_rag_session");
  if (existing) return existing;
  const newId = uuidv4();
  sessionStorage.setItem("ares_rag_session", newId);
  return newId;
});
```

**Impact:** Session hijacking if XSS vulnerability exists elsewhere.

**Fix:** Consider using httpOnly cookies for session management or rotate session IDs frequently.

---

### WR-04: Tutorial Progress Stored in localStorage with No Integrity Check

**File:** `src/components/InteractiveTutorial.tsx:55-57`

**Issue:** Tutorial progress is saved to localStorage without any integrity validation. Malicious scripts could modify progress to claim completion.

```tsx
localStorage.setItem(`tutorial-${title}-progress`, JSON.stringify(progressArray));
```

**Impact:** False completion tracking could bypass learning requirements or gamification systems.

**Fix:**
```tsx
// Add HMAC signature to stored data
import { hmac } from './crypto-utils';

const signedData = {
  progress: progressArray,
  signature: hmac(JSON.stringify(progressArray), SECRET_KEY)
};
localStorage.setItem(`tutorial-${title}-progress`, JSON.stringify(signedData));
```

---

### WR-05: Simulation Chat Messages Persisted Without Size Limit

**File:** `src/components/SimulationPlayground.tsx:108-125`

**Issue:** Chat messages are stored in localStorage without size limits, potentially leading to quota exceeded errors or denial of service.

```tsx
const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
  const stored = localStorage.getItem(`sim_chat_${idParam || 'new'}`);
  if (stored) return JSON.parse(stored);
  return [DEFAULT_MESSAGE];
});
```

**Impact:** localStorage quota (typically 5-10MB) could be exhausted, breaking other features.

**Fix:**
```tsx
const MAX_MESSAGES = 100;
const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
  const stored = localStorage.getItem(`sim_chat_${idParam || 'new'}`);
  if (stored) {
    const parsed = JSON.parse(stored);
    return parsed.slice(-MAX_MESSAGES); // Keep only recent messages
  }
  return [DEFAULT_MESSAGE];
});
```

---

### WR-06: useExperimentState Lacks Type Validation on localStorage Data

**File:** `src/hooks/useExperimentState.ts:12-15`

**Issue:** The hook parses localStorage data without runtime type validation, which could lead to type confusion vulnerabilities.

```tsx
const item = window.localStorage.getItem(key);
return item ? JSON.parse(item) : initialValue;
```

**Impact:** Malicious data in localStorage could cause runtime errors or unexpected behavior.

**Fix:**
```tsx
import { z } from 'zod';

export function useExperimentState<T extends z.ZodType>(
  key: string,
  schema: T,
  initialValue: z.infer<T>
) {
  const [storedValue] = useState(() => {
    const item = window.localStorage.getItem(key);
    if (!item) return initialValue;
    try {
      const parsed = JSON.parse(item);
      return schema.parse(parsed);
    } catch {
      return initialValue;
    }
  });
  // ...
}
```

---

### WR-07: Turnstile Test Bypass Exposed in Production Code

**File:** `src/components/Turnstile.tsx:82-87`

**Issue:** The Turnstile bypass for localhost/E2E tests is always enabled, not just in development mode.

```tsx
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const hasBypass = window.ARES_E2E_BYPASS;
if (isLocal || hasBypass) {
  setTimeout(() => onVerify("test-bypass-token"), 200);
  return;
}
```

**Impact:** While `isLocal` check provides some protection, `ARES_E2E_BYPASS` could potentially be set by malicious scripts in production if there's an XSS vulnerability.

**Fix:**
```tsx
const isDev = import.meta.env.DEV;
if ((isLocal && isDev) || hasBypass) {
  // Only bypass in development mode
}
```

---

### WR-08: Missing Error Handling in GlobalRAGChatbot Fetch

**File:** `src/components/ai/GlobalRAGChatbot.tsx:29-40`

**Issue:** The fetch request to restore chat history has incomplete error handling and doesn't validate response structure.

```tsx
fetch(`/api/ai/chat-session/${sessionId}`)
  .then(res => res.json())
  .then((data: unknown) => {
    const parsed = data as { messages?: { role: string; content: string }[] };
    if (parsed && parsed.messages && parsed.messages.length > 0) {
      setMessages(parsed.messages.map(m => ({
        role: m.role === "assistant" ? "ai" : (m.role as "ai" | "user"),
        content: m.content
      })));
    }
  })
```

**Impact:** Invalid API responses could crash the component or display corrupted messages.

**Fix:**
```tsx
const response = await fetch(`/api/ai/chat-session/${sessionId}`);
if (!response.ok) throw new Error('Failed to load chat');
const data = await response.json();

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  }))
});

const validated = schema.parse(data);
setMessages(validated.messages.map(m => ({...})));
```

---

### WR-09: Profile Contact Form Lacks Email Format Validation

**File:** `src/components/profile/ContactForm.tsx:20`

**Issue:** The contact email input doesn't validate email format client-side before submission.

```tsx
<input id="pe-contact-email" className={inputClass} 
  placeholder="Optional. Replaces login email." 
  value={profile.contact_email} 
  onChange={e => setProfile({...profile, contact_email: e.target.value})} 
/>
```

**Impact:** Invalid email addresses could be submitted, causing backend errors or data integrity issues.

**Fix:**
```tsx
<input
  id="pe-contact-email"
  type="email"
  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
  className={inputClass}
  value={profile.contact_email}
  onChange={e => setProfile({...profile, contact_email: e.target.value})}
/>
```

---

### WR-10: Security Settings 2FA QR Code Not Sanitized

**File:** `src/components/profile/SecuritySettings.tsx:150+`

**Issue:** The TOTP QR code data URL from the backend is displayed without sanitization validation.

```tsx
const { data, error } = await authClient.twoFactor.enable();
if (data) {
  setTwoFactorData({ qrCode: data.totpURI, secret: data.secret });
}

// Later rendered as:
<QRCodeSVG value={twoFactorData.qrCode} />
```

**Impact:** If the backend returns a malicious data URL or javascript: URL, it could execute arbitrary code.

**Fix:**
```tsx
const validateTotpUri = (uri: string) => {
  if (!uri.startsWith('otpauth://totp/')) {
    throw new Error('Invalid TOTP URI format');
  }
  return uri;
};

const { data } = await authClient.twoFactor.enable();
if (data) {
  setTwoFactorData({ 
    qrCode: validateTotpUri(data.totpURI), 
    secret: data.secret 
  });
}
```

---

### WR-11: CommandPalette Search Results Not Escaped in Snippets

**File:** `src/components/CommandPalette.tsx:325`

**Issue:** Search result snippets are sanitized, but the implementation should verify that all user-controlled content goes through sanitization.

```tsx
dangerouslySetInnerHTML={{__html: sanitizeHtml(res.snippet)}}
```

**Impact:** If `sanitizeHtml` is bypassed or misconfigured, XSS could occur.

**Fix:** Add regression test for XSS in search snippets and verify DOMPurify configuration.

---

### WR-12: Avatar Editor URL Parsing Could Fail on Malformed URLs

**File:** `src/components/AvatarEditor.tsx:43-51`

**Issue:** The `getParams()` function catches errors but returns empty URLSearchParams, potentially hiding invalid URL errors.

```tsx
const getParams = () => {
  try {
    if (!currentImage) return new URLSearchParams();
    const url = new URL(currentImage);
    return new URLSearchParams(url.search);
  } catch {
    return new URLSearchParams();
  }
};
```

**Impact:** Invalid avatar URLs could result in default avatar being used without user awareness.

**Fix:**
```tsx
const getParams = () => {
  try {
    if (!currentImage) return new URLSearchParams();
    const url = new URL(currentImage);
    // Validate it's from allowed domain
    if (!url.hostname.endsWith('dicebear.com')) {
      throw new Error('Invalid avatar source');
    }
    return new URLSearchParams(url.search);
  } catch {
    return null; // Return null to indicate error
  }
};

const parsedParams = getParams();
if (!parsedParams) {
  // Show error to user
}
```

---

## Info

### IN-01: console.error Statements in Production Code

**Files:** Multiple
- `src/components/tools/TeamAnalysisCard.tsx:29`
- `src/hooks/useExperimentState.ts:18`
- `src/components/SimulationPlayground.tsx:110`

**Issue:** `console.error` calls are present in production code, which could leak debugging information.

**Fix:** Use a logging library that disables in production or strip via build tool.

---

### IN-02: Missing ARIA Labels on Some Interactive Elements

**File:** `src/components/profile/ContactForm.tsx:12-24`

**Issue:** Checkboxes have visible labels but could benefit from explicit `aria-label` attributes for screen readers.

**Fix:**
```tsx
<input 
  type="checkbox" 
  checked={profile.show_phone} 
  onChange={e => setProfile({...profile, show_phone: e.target.checked})} 
  aria-label="Show phone number on public profile"
/>
```

---

### IN-03: Inconsistent Error Message Display

**Files:** Multiple components use different error display patterns (toast, inline error divs, alert).

**Fix:** Standardize on a single error display component for consistency.

---

### IN-04: Magic Numbers for localStorage Keys

**File:** Multiple files use string literals for localStorage keys.

**Fix:**
```tsx
const STORAGE_KEYS = {
  JUDGE_CODE: "ares_judge_code",
  RAG_SESSION: "ares_rag_session",
  TUTORIAL_PROGRESS: (title: string) => `tutorial-${title}-progress`
} as const;
```

---

### IN-05: DiceBear Avatar API Called Without Rate Limiting

**File:** `src/components/AvatarEditor.tsx:154`

**Issue:** Avatar images are generated on-demand without client-side rate limiting.

**Fix:** Implement debouncing for avatar regeneration requests.

---

### IN-06: External Links Inconsistently Use rel="noopener noreferrer"

**Finding:** Most external links correctly use `rel="noopener noreferrer"`, but automatic verification is recommended.

**Fix:** Create a reusable `ExternalLink` component that always includes the rel attribute.

---

### IN-07: Missing Loading States in Some API Calls

**Files:** `src/pages/ProfilePage.tsx:74-82`

**Issue:** API calls for points and history don't have loading states, causing potential layout shifts.

**Fix:** Add skeleton loaders or loading spinners.

---

### IN-08: Turnstile Site Key Exposed in Client-Side Code

**File:** `src/components/Turnstile.tsx:64`

**Issue:** The Turnstile site key is referenced from `siteConfig` which is bundled in client code. This is expected for Turnstile but worth documenting.

**Fix:** Document this in security architecture docs; consider using environment-specific keys.

---

## Recommendations

### Immediate Actions (Critical)
1. **Sanitize markdown-to-HTML output** in `TeamAnalysisCard.tsx` and `ScoutingTool.tsx`
2. **Move Judges Hub token** from localStorage to sessionStorage or httpOnly cookie
3. **Add Content-Security-Policy** meta tag or HTTP header
4. **Validate all URL parameters** before use in API calls
5. **Vendor Monaco Editor** or add CSP for CDN access
6. **Replace window.location.reload()** with React state updates

### Short-term Improvements (Warning)
1. Add runtime schema validation for all localStorage/sessionStorage access
2. Implement size limits for localStorage data storage
3. Add environment check to Turnstile bypass logic
4. Validate TOTP URI format before QR code rendering
5. Add email format validation to contact forms
6. Validate all GitHub repo paths in BugReport form

### Long-term Enhancements (Info)
1. Implement centralized error handling with user-friendly messages
2. Create design system for consistent loading states
3. Add automated security scanning to CI/CD pipeline
4. Document external security dependencies (Turnstile, Monaco)
5. Implement comprehensive ARIA labeling strategy

---

_Reviewed: 2025-01-04_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: deep_
