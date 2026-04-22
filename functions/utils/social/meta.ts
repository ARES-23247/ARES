import { PostPayload, SocialConfig } from "../socialSync";

export async function dispatchFacebook(payload: PostPayload, config: SocialConfig) {
  if (!config.FACEBOOK_PAGE_ID || !config.FACEBOOK_ACCESS_TOKEN) return;

  const fbUrl = `https://graph.facebook.com/v19.0/${config.FACEBOOK_PAGE_ID}/feed`;
  const fbPayload = new URLSearchParams({
    message: `🚀 New Update: ${payload.title}\n\n${payload.snippet}`,
    link: payload.url,
    access_token: config.FACEBOOK_ACCESS_TOKEN
  });

  return fetch(fbUrl, { signal: AbortSignal.timeout(5000, { signal: AbortSignal.timeout(5000) }),
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: fbPayload.toString()
  }).then(async res => { 
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Facebook API Rejected: ${errText}`);
    }
  });
}

export async function dispatchMetaPhoto(imageUrl: string, caption: string, config: SocialConfig) {
  const promises: Promise<unknown>[] = [];

  // 1. Instagram Photo
  if (config.INSTAGRAM_ACCOUNT_ID && config.INSTAGRAM_ACCESS_TOKEN) {
    promises.push(
      (async () => {
        const creationUrl = `https://graph.facebook.com/v19.0/${config.INSTAGRAM_ACCOUNT_ID}/media`;
        const creationPayload = new URLSearchParams({
          image_url: imageUrl,
          caption: caption,
          access_token: config.INSTAGRAM_ACCESS_TOKEN || ""
        });
        const createRes = await fetch(creationUrl, { signal: AbortSignal.timeout(5000, { signal: AbortSignal.timeout(5000) }), method: "POST", body: creationPayload.toString(), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        if (!createRes.ok) {
          const errText = await createRes.text();
          throw new Error(`Instagram Photo Creation Rejected: ${errText}`);
        }
        
        const createData = await createRes.json() as { id?: string };

        if (createData.id) {
          const publishUrl = `https://graph.facebook.com/v19.0/${config.INSTAGRAM_ACCOUNT_ID}/media_publish`;
          const publishPayload = new URLSearchParams({ creation_id: createData.id, access_token: config.INSTAGRAM_ACCESS_TOKEN || "" });
          const pubRes = await fetch(publishUrl, { signal: AbortSignal.timeout(5000, { signal: AbortSignal.timeout(5000) }), method: "POST", body: publishPayload.toString(), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
          if (!pubRes.ok) {
            const errText = await pubRes.text();
            throw new Error(`Instagram Photo Publish Rejected: ${errText}`);
          }
        }
      })()
    );
  }

  // 2. Facebook Photo
  if (config.FACEBOOK_PAGE_ID && config.FACEBOOK_ACCESS_TOKEN) {
    promises.push(
      (async () => {
        const fbUrl = `https://graph.facebook.com/v19.0/${config.FACEBOOK_PAGE_ID}/photos`;
        const fbPayload = new URLSearchParams({ url: imageUrl, message: caption, access_token: config.FACEBOOK_ACCESS_TOKEN || "" });
        const res = await fetch(fbUrl, { signal: AbortSignal.timeout(5000, { signal: AbortSignal.timeout(5000) }), method: "POST", body: fbPayload.toString(), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Facebook Photo API Rejected: ${text}`);
        }
      })()
    );
  }

  return Promise.all(promises);
}
