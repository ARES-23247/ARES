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
  db: D1Database,
  payload: PostPayload, 
  config: SocialConfig, 
  socialsFilter: Record<string, boolean> | null = null
) {
  const promises: Promise<unknown>[] = [];

  const isEnabled = (key: string) => {
    if (!socialsFilter) return true;
    return socialsFilter[key] === true;
  };

  // 1. Webhooks & Integrated Services
  if (isEnabled('discord')) promises.push(dispatchDiscord(payload, config));
  if (isEnabled('slack')) promises.push(dispatchSlack(payload, config));
  if (isEnabled('teams')) promises.push(dispatchTeams(payload, config));
  if (isEnabled('gchat')) promises.push(dispatchGChat(payload, config));
  if (isEnabled('make')) promises.push(dispatchMake(payload, config));

  // 2. Zulip Announcements Channel
  if (config.ZULIP_BOT_EMAIL && config.ZULIP_API_KEY && isEnabled('zulip')) {
    promises.push(
      sendZulipMessage(
        {
          ZULIP_BOT_EMAIL: config.ZULIP_BOT_EMAIL,
          ZULIP_API_KEY: config.ZULIP_API_KEY,
          ZULIP_URL: config.ZULIP_URL,
          DB: db,
        },
        "announcements",
        "Website Updates",
        `🚀 **${payload.title}**\n\n${payload.snippet}\n\n[🔗 Read more](${payload.url})`
      )
    );
  }

  // 3. Social Platforms
  if (isEnabled('facebook')) promises.push(dispatchFacebook(payload, config));
  if (isEnabled('bluesky')) promises.push(dispatchBluesky(payload, config));

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

  // 1. Meta (Instagram & Facebook)
  promises.push(dispatchMetaPhoto(imageUrl, caption, config));

  // 2. Twitter (X)
  promises.push(dispatchTwitterPhoto(imageUrl, caption, config).catch(() => {}));

  // 3. Webhooks
  promises.push(dispatchDiscordPhoto(imageUrl, caption, config));
  promises.push(dispatchSlackPhoto(imageUrl, caption, config));
  promises.push(dispatchTeamsPhoto(imageUrl, caption, config));
  promises.push(dispatchGChatPhoto(imageUrl, caption, config));

  await Promise.allSettled(promises);
}
