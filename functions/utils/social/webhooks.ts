import { PostPayload, SocialConfig } from "../socialSync";

export async function dispatchDiscord(payload: PostPayload, config: SocialConfig) {
  if (!config.DISCORD_WEBHOOK_URL) return;
  
  return fetch(config.DISCORD_WEBHOOK_URL, {
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
  }).catch(err => console.error("Discord webhook failed:", err));
}

export async function dispatchDiscordPhoto(imageUrl: string, caption: string, config: SocialConfig) {
  if (!config.DISCORD_WEBHOOK_URL) return;

  return fetch(config.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: null,
      embeds: [
        {
          title: "📸 New ARES Gallery Media",
          description: caption,
          color: 12582912,
          image: { url: imageUrl },
          author: { name: "ARES 23247 Bot" }
        }
      ]
    })
  }).catch(err => console.error("Discord Photo push failed:", err));
}

export async function dispatchSlack(payload: PostPayload, config: SocialConfig) {
  if (!config.SLACK_WEBHOOK_URL) return;

  return fetch(config.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `🚀 *New Web Update: ${payload.title}*\n${payload.snippet}\n<${payload.url}|Read more>`
    })
  }).catch(err => console.error("Slack webhook failed:", err));
}

export async function dispatchSlackPhoto(imageUrl: string, caption: string, config: SocialConfig) {
  if (!config.SLACK_WEBHOOK_URL) return;

  return fetch(config.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        {
          type: "image",
          title: { type: "plain_text", text: caption || "ARES Media" },
          image_url: imageUrl,
          alt_text: "ARES 23247 Broadcast"
        }
      ]
    })
  }).catch(err => console.error("Slack Photo push failed:", err));
}

export async function dispatchTeams(payload: PostPayload, config: SocialConfig) {
  if (!config.TEAMS_WEBHOOK_URL) return;

  return fetch(config.TEAMS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.2",
            body: [
              { type: "TextBlock", text: `🚀 New Web Update: ${payload.title}`, weight: "Bolder", size: "Medium" },
              { type: "TextBlock", text: payload.snippet, wrap: true }
            ],
            actions: [
              { type: "Action.OpenUrl", title: "Read More", url: payload.url }
            ]
          }
        }
      ]
    })
  }).catch(err => console.error("Teams webhook failed:", err));
}

export async function dispatchTeamsPhoto(imageUrl: string, caption: string, config: SocialConfig) {
  if (!config.TEAMS_WEBHOOK_URL) return;

  return fetch(config.TEAMS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.2",
            body: [
              { type: "TextBlock", text: "📸 New ARES Gallery Media", weight: "Bolder", size: "Medium" },
              { type: "Image", url: imageUrl },
              { type: "TextBlock", text: caption, wrap: true }
            ]
          }
        }
      ]
    })
  }).catch(err => console.error("Teams Photo push failed:", err));
}

export async function dispatchGChat(payload: PostPayload, config: SocialConfig) {
  if (!config.GCHAT_WEBHOOK_URL) return;

  return fetch(config.GCHAT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `🚀 *New Web Update: ${payload.title}*\n${payload.snippet}\nRead more: ${payload.url}`
    })
  }).then(async res => { 
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GChat Rejected: ${errText}`);
    }
  });
}

export async function dispatchGChatPhoto(imageUrl: string, caption: string, config: SocialConfig) {
  if (!config.GCHAT_WEBHOOK_URL) return;

  return fetch(config.GCHAT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cardsV2: [
        {
          cardId: "photoCard",
          card: {
            header: { title: "📸 New ARES Gallery Media" },
            sections: [
              {
                widgets: [
                  { image: { imageUrl: imageUrl } },
                  { textParagraph: { text: caption } }
                ]
              }
            ]
          }
        }
      ]
    })
  }).catch(err => console.error("GChat Photo push failed:", err));
}

export async function dispatchMake(payload: PostPayload, config: SocialConfig) {
  if (!config.MAKE_WEBHOOK_URL) return;

  return fetch(config.MAKE_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(err => console.error("Make.com webhook failed:", err));
}
