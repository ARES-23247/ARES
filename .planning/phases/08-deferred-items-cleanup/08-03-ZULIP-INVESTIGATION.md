# Zulip Account Sync Investigation

**Investigation Date:** 2026-05-04
**Investigator:** Automated Execution Agent (08-03)
**Status:** In Progress

---

## Executive Summary

This document captures findings from the investigation of Zulip account sync between ARESWEB and aresfirst.zulipchat.com. The purpose is to ensure all team members have linked Zulip accounts for team communication.

**Overall Status:** Investigation in progress

---

## Current State

### Existing Zulip Integration Components

#### 1. Backend Utilities (`functions/utils/zulipSync.ts`)

**Purpose:** Core Zulip API interaction layer

**Available Functions:**
- `sendZulipMessage()` - Send messages to Zulip streams or private messages
- `updateZulipMessage()` - Edit existing Zulip messages
- `deleteZulipMessage()` - Delete Zulip messages
- `sendZulipAlert()` - Send administrative alerts to leadership stream

**Authentication Method:** Basic Auth (email + API key)
- Credentials: `ZULIP_BOT_EMAIL` + `ZULIP_API_KEY` from environment
- Base URL: `https://aresfirst.zulipchat.com/api/v1` (configurable via `ZULIP_URL`)
- Retry logic: Uses `p-retry` with 3 retries for sends, 2 for updates/deletes
- Timeout: 5 seconds per request

**Observation:** The `zulipSync.ts` file does NOT contain `auditMissingUsers` or `inviteUsers` functions. These are implemented directly in the route handler instead.

---

#### 2. API Routes (`functions/api/routes/zulip.ts`)

**Purpose:** HTTP endpoints for Zulip integration

**Available Endpoints:**

| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/presence` | `getPresence` | Get Zulip team presence status (admin only) |
| POST | `/message` | `sendMessage` | Send a message to Zulip (auth required) |
| GET | `/topic` | `getTopicMessages` | Get messages for a specific topic |
| GET | `/invites/audit` | `auditMissingUsers` | Audit ARESWEB users against Zulip directory |
| POST | `/invites/send` | `inviteUsers` | Send Zulip invitations to specified emails |

**Audit Endpoint Details (`auditMissingUsers`):**
- Fetches all users from Zulip `/api/v1/users` endpoint
- Filters active, non-bot users
- Compares against ARESWEB database (excludes unverified users)
- Returns list of ARESWEB user emails not found in Zulip
- Error handling includes Zulip API failures and invalid data responses

**Invite Endpoint Details (`inviteUsers`):**
- Sends batch invitations (10 emails per batch)
- Adds users to default streams
- Uses `include_realm_default_subscriptions: true`
- Returns count of successfully invited users
- Handles partial failures gracefully

**Middleware:**
- `/presence` - `ensureAdmin` (admin-only access)
- `/invites/*` - `ensureAdmin` (admin-only access)
- `/message` - `ensureAuth` (authenticated users)

---

#### 3. Contract Definition (`shared/schemas/contracts/zulipContract.ts`)

**Purpose:** TypeScript contract for type-safe API calls using ts-rest

**Defined Contract Methods:**

```typescript
{
  getPresence: {
    method: "GET",
    path: "/presence",
    responses: { 200, 500 }
  },
  sendMessage: {
    method: "POST",
    path: "/message",
    body: { stream, topic, content }
    responses: { 200, 500 }
  },
  getTopicMessages: {
    method: "GET",
    path: "/topic",
    query: { stream, topic }
    responses: { 200, 403, 500 }
  },
  auditMissingUsers: {
    method: "GET",
    path: "/invites/audit",
    responses: { 200, 500 }
  },
  inviteUsers: {
    method: "POST",
    path: "/invites/send",
    body: { emails: string[] }
    responses: { 200, 500 }
  }
}
```

**Status:** Contract is fully defined and matches the route implementations.

---

#### 4. Admin UI (`src/components/AdminUsers.tsx`)

**Purpose:** Admin interface for user management and Zulip audit

**Zulip-Related Features:**

1. **Audit Button (lines 283-291):**
   - Label: "Audit Zulip"
   - Icon: Users icon (with loading spinner)
   - Triggers: `auditMutation.mutate({})`
   - Color: ARES red (action color)

2. **Audit Mutation (lines 134-144):**
   - Calls: `api.zulip.auditMissingUsers.useMutation`
   - Success: Shows modal with missing emails
   - Error: Displays toast error

3. **Invite Mutation (lines 146-153):**
   - Calls: `api.zulip.inviteUsers.useMutation`
   - Success: Toast with invited count, closes modal
   - Error: Displays toast error

4. **Zulip Audit Modal (lines 448-494):**
   - Shows count of missing users
   - Lists missing emails in scrollable area
   - "Send [N] Zulip Invites" button if users are missing
   - Shows "All ARESWEB users are already in Zulip!" if zero missing

5. **Direct Zulip Link (lines 222-229):**
   - Each user row has a "Message on Zulip" button
   - Opens direct message to user on Zulip
   - Link format: `https://aresfirst.zulipchat.com/#narrow/pm-with/{email}`

---

## Contract vs Implementation Gap Analysis

| Contract Method | Route Handler | Status | Notes |
|-----------------|---------------|--------|-------|
| `getPresence` | `getPresence` | Match | Returns presence + userNames |
| `sendMessage` | `sendMessage` | Match | Sends attributed messages |
| `getTopicMessages` | `getTopicMessages` | Match | Fetches topic messages |
| `auditMissingUsers` | `auditMissingUsers` | Match | Returns missingEmails array |
| `inviteUsers` | `inviteUsers` | Match | Sends invitations in batches |

**Result:** No gaps found. All contract methods are implemented correctly.

---

## Investigation Approach

Based on the code audit:

1. **All required endpoints exist** - audit and invite functionality is fully implemented
2. **Admin UI is wired** - Audit button triggers the mutation and displays results
3. **Error handling is in place** - Zulip API failures are caught and reported

**Next Step:** Manual verification is required to:
- Confirm the endpoints work with production Zulip credentials
- Verify actual sync status (how many users are missing)
- Test the invite flow if needed

---

## Required Actions

1. Manual audit via Admin Panel (Task 4) - requires admin authentication
2. Document actual audit results (Task 5)
3. Create fix plan if gaps are found (Task 5)

---

## Notes

- Zulip credentials are stored in Cloudflare environment variables (`ZULIP_BOT_EMAIL`, `ZULIP_API_KEY`)
- The bot must have admin privileges to fetch `delivery_email` (otherwise falls back to `email`)
- Default streams are automatically included in invitations
- Batch size of 10 prevents rate limit issues
