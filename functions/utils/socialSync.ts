import { BskyAgent } from '@atproto/api';

export interface SocialConfig {
  DISCORD_WEBHOOK_URL?: string;
  MAKE_WEBHOOK_URL?: string;
  BLUESKY_HANDLE?: string;
  BLUESKY_APP_PASSWORD?: string;
}

export interface PostPayload {
  title: string;
  url: string;
  snippet: string;
  coverImageUrl?: string;
}

/**
 * Pushes updates to all configured social channels simultaneously.
 * Fails gracefully on any single provider so others still execute.
 */
export async function dispatchSocials(payload: PostPayload, config: SocialConfig) {
  const promises: Promise<unknown>[] = [];

  if (config.DISCORD_WEBHOOK_URL && config.DISCORD_WEBHOOK_URL.trim() !== '') {
    promises.push(
      fetch(config.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: null,
          embeds: [
            {
              title: "🚀 New Web Update: " + payload.title,
              description: payload.snippet,
              url: payload.url,
              color: 12582912, // ARES Red (0xC00000)
              author: { name: "ARES 23247 Bot" },
              image: payload.coverImageUrl ? { url: payload.url.replace('/blog/', '') + payload.coverImageUrl } : null,
              footer: { text: "FIRST Robotics Competition • ARES 23247" }
            }
          ]
        })
      }).catch(err => console.error("Discord webhook failed:", err))
    );
  }

  if (config.MAKE_WEBHOOK_URL && config.MAKE_WEBHOOK_URL.trim() !== '') {
    promises.push(
      fetch(config.MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(err => console.error("Make.com webhook failed:", err))
    );
  }

  if (config.BLUESKY_HANDLE && config.BLUESKY_APP_PASSWORD) {
    promises.push(
      (async () => {
        try {
          const agent = new BskyAgent({ service: 'https://bsky.social' });
          await agent.login({
            identifier: config.BLUESKY_HANDLE as string,
            password: config.BLUESKY_APP_PASSWORD as string,
          });

          const rt = new agent.rtText.RichText({
            text: `🚀 New Blog Post: ${payload.title}\n\n${payload.snippet}\n\nRead more: ${payload.url}`
          });
          
          await rt.detectFacets(agent);

          await agent.post({
            text: rt.text,
            facets: rt.facets,
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          console.error("Bluesky post failed:", err);
        }
      })()
    );
  }

  await Promise.allSettled(promises);
}
