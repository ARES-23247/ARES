---
name: aresweb-social-manager
description: Defines the architecture and constraints for the ARESWEB Social Media Manager, including the social queue schema, scheduling lifecycle, and syndication hooks.
---

# ARESWEB Social Media Manager Architecture

This skill defines the technical constraints, schema behaviors, and architectural patterns of the ARESWEB Social Media Manager. Agents must adhere to these rules when interacting with social queuing, cron dispatching, or frontend syndication.

## Core Principles
1. **Asynchronous Dispatch**: Social posts are never dispatched immediately during an API request. All posts are inserted into the `social_queue` and dispatched by the Cloudflare Worker cron trigger.
2. **Platform Agnosticism**: The core queuing system supports multiple targets. Currently defined platforms must be serialized as JSON arrays (e.g., `["zulip", "instagram"]`).
3. **Cross-Entity Syndication**: Events, blogs, and robot mechanisms can syndicate content directly to the social queue via their respective `linked_type` and `linked_id` associations.

## Database Schema (`social_queue`)
The `social_queue` table powers the entire system.
- `id` (string): Primary key, UUIDv4.
- `content` (string): The plaintext or markdown content of the post.
- `platforms` (string): JSON stringified array of platform identifiers.
- `scheduled_for` (string): ISO-8601 timestamp for when the post should be dispatched.
- `status` (string): Enum state. Valid values: `pending`, `processing`, `completed`, `failed`, `cancelled`.
- `created_by` (string, nullable): User ID of the post author.
- `linked_type` (string, nullable): The type of entity this post represents (e.g., `event`, `blog`).
- `linked_id` (string, nullable): The UUID of the associated entity.
- `media_urls` (string, nullable): JSON stringified array of absolute media URLs attached to the post.
- `analytics` (string, nullable): JSON object storing post-dispatch metrics (e.g., likes, retweets, views).
- `error_message` (string, nullable): Trace or error output if `status` === `failed`.

## Execution Lifecycle
1. **Creation**: Content is queued via `POST /api/socialQueue`. Status is initialized as `pending`.
2. **Cron Trigger**: The Cloudflare Worker `scheduled` event fires (defined in `functions/api/[[route]].ts`).
3. **Processing**: 
   - The worker queries `social_queue` for records where `status === 'pending'` AND `scheduled_for <= current_time`.
   - Records are locked by setting `status = 'processing'`.
   - The worker iterates over `platforms` and dispatches payloads.
4. **Resolution**: 
   - On success: `status = 'completed'`, `sent_at = current_time`.
   - On failure: `status = 'failed'`, `error_message = <error_trace>`.

## Frontend Integration
- **SocialHub**: The primary dashboard for managing queued and historical posts (`src/components/social/SocialHub.tsx`).
- **SocialComposer**: The modal interface for creating net-new social posts with platform selection and scheduling capabilities.
- **SocialSyndicationGrid**: A reusable component used on entities (Events, Sponsors) to view or attach social posts specifically related to that entity.

## Developer Rules
- **Do NOT manually execute dispatches.** To trigger a test dispatch, you must use the internal `/admin/trigger-cron` endpoint (if available) or mock the cron event.
- **Always serialize arrays.** SQLite/D1 does not support native array types. Ensure `platforms` and `media_urls` are `JSON.stringify()`'d before insertion and `JSON.parse()`'d on read.
- **Respect Rate Limits.** When adding new platforms to the dispatcher, always implement exponential backoff or retry logic to prevent downstream API blocking.
