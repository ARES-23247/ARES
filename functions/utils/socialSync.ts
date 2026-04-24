/* eslint-disable @typescript-eslint/no-explicit-any */
import { sendZulipMessage } from './zulipSync';
import { 
  dispatchDiscord, dispatchDiscordPhoto, 
  dispatchSlack, dispatchSlackPhoto, 
  dispatchTeams, dispatchTeamsPhoto, 
  dispatchGChat, dispatchGChatPhoto, 
  dispatchMake 
} from './social/webhooks';
import { dispatchBluesky } from './social/bluesky';
import { dispatchTwitterPhoto } from './social/twitter';
import { dispatchFacebook, dispatchMetaPhoto } from './social/meta';
import { logSystemError } from '../api/middleware';
import pRetry from 'p-retry';

export interface SocialConfig {
  DISCORD_WEBHOOK_URL?: string;
  MAKE_WEBHOOK_URL?: string;
  BLUESKY_HANDLE?: string;
  BLUESKY_APP_PASSWORD?: string;
  SLACK_WEBHOOK_URL?: string;
  TEAMS_WEBHOOK_URL?: string;
  GCHAT_WEBHOOK_URL?: string;
  FACEBOOK_PAGE_ID?: string;
  FACEBOOK_ACCESS_TOKEN?: string;
  INSTAGRAM_ACCOUNT_ID?: string;
  INSTAGRAM_ACCESS_TOKEN?: string;
  TWITTER_API_KEY?: string;
  TWITTER_API_SECRET?: string;
  TWITTER_ACCESS_TOKEN?: string;
  TWITTER_ACCESS_SECRET?: string;
  // ── Zulip Integration ──
  ZULIP_BOT_EMAIL?: string;
  ZULIP_API_KEY?: string;
  ZULIP_URL?: string;
  ZULIP_ADMIN_STREAM?: string;
  ZULIP_COMMENT_STREAM?: string;
}

export interface PostPayload {
  title: string;
  url: string;
  snippet: string;
  coverImageUrl?: string;
  baseUrl?: string;
}

/**
 * Pushes updates to all configured social channels simultaneously.
 * Fails gracefully on any single provider so others still execute.
 */
export async function dispatchSocials(
  db: any,
  payload: PostPayload, 
  config: SocialConfig, 
  socialsFilter: Record<string, boolean> | null = null
) {
  const promises: Promise<unknown>[] = [];

  const isEnabled = (key: string) => {
    if (!socialsFilter) return true;
    return socialsFilter[key] === true;
  };

  const wrapRetry = (fn: () => Promise<unknown>, name: string) => {
    return pRetry(fn, {
      retries: 2,
      onFailedAttempt: error => {
        console.warn(`[SocialSync:${name}] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
      }
    });
  };

  // 1. Webhooks & Integrated Services
  if (isEnabled('discord')) promises.push(wrapRetry(() => dispatchDiscord(payload, config), 'Discord'));
  if (isEnabled('slack')) promises.push(wrapRetry(() => dispatchSlack(payload, config), 'Slack'));
  if (isEnabled('teams')) promises.push(wrapRetry(() => dispatchTeams(payload, config), 'Teams'));
  if (isEnabled('gchat')) promises.push(wrapRetry(() => dispatchGChat(payload, config), 'GChat'));
  if (isEnabled('make')) promises.push(wrapRetry(() => dispatchMake(payload, config), 'Make'));

  // 2. Zulip Announcements Channel
  if (config.ZULIP_BOT_EMAIL && config.ZULIP_API_KEY && isEnabled('zulip')) {
    promises.push(
      wrapRetry(() => sendZulipMessage(
        {
          ZULIP_BOT_EMAIL: config.ZULIP_BOT_EMAIL,
          ZULIP_API_KEY: config.ZULIP_API_KEY,
          ZULIP_URL: config.ZULIP_URL,
          DB: db,
        },
        "announcements",
        "Website Updates",
        `🚀 **${payload.title}**\n\n${payload.snippet}\n\n[🔗 Read more](${payload.url})`
      ), 'Zulip')
    );
  }

  // 3. Social Platforms
  if (isEnabled('facebook')) promises.push(wrapRetry(() => dispatchFacebook(payload, config), 'Facebook'));
  if (isEnabled('bluesky')) promises.push(wrapRetry(() => dispatchBluesky(payload, config), 'Bluesky'));

  const results = await Promise.allSettled(promises);
  const failures: string[] = [];
  
  results.forEach(result => {
    if (result.status === 'rejected') {
      failures.push(String(result.reason?.message || result.reason));
    }
  });

  if (failures.length > 0) {
    const errorMsg = failures.join(" | ");
    await logSystemError(db, "SocialSync", "Partial syndication failure", errorMsg);
    throw new Error(`Syndication partial failure: ${errorMsg}`);
  }
}

/**
 * Dispatches an uploaded raw photo directly to configured visual social media endpoints.
 */
export async function dispatchPhotoSocials(imageUrl: string, caption: string, config: SocialConfig) {
  const promises: Promise<unknown>[] = [];

  const wrapRetry = (fn: () => Promise<unknown>, name: string) => {
    return pRetry(fn, {
      retries: 2,
      onFailedAttempt: error => {
        console.warn(`[PhotoSocialSync:${name}] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
      }
    });
  };

  // 1. Meta (Instagram & Facebook)
  promises.push(wrapRetry(() => dispatchMetaPhoto(imageUrl, caption, config), 'MetaPhoto'));

  // 2. Twitter (X)
  promises.push(wrapRetry(() => dispatchTwitterPhoto(imageUrl, caption, config), 'TwitterPhoto').catch(() => {}));

  // 3. Webhooks
  promises.push(wrapRetry(() => dispatchDiscordPhoto(imageUrl, caption, config), 'DiscordPhoto'));
  promises.push(wrapRetry(() => dispatchSlackPhoto(imageUrl, caption, config), 'SlackPhoto'));
  promises.push(wrapRetry(() => dispatchTeamsPhoto(imageUrl, caption, config), 'TeamsPhoto'));
  promises.push(wrapRetry(() => dispatchGChatPhoto(imageUrl, caption, config), 'GChatPhoto'));

  await Promise.allSettled(promises);
}
