import type { AppEnv } from "../api/middleware/utils";

/**
 * Sends a message to a Zulip stream.
 * 
 * Requires the following environment variables:
 * - ZULIP_URL: e.g., "https://ares23247.zulipchat.com"
 * - ZULIP_EMAIL: Bot email
 * - ZULIP_API_KEY: Bot API key
 */
export async function sendZulipMessage(
  env: AppEnv,
  stream: string,
  topic: string,
  content: string
): Promise<boolean> {
  const url = env.ZULIP_URL;
  const email = env.ZULIP_EMAIL;
  const apiKey = env.ZULIP_API_KEY;

  if (!url || !email || !apiKey) {
    console.error("[Zulip] Missing required environment variables.");
    return false;
  }

  try {
    const auth = btoa(`${email}:${apiKey}`);
    const endpoint = `${url}/api/v1/messages`;
    
    const params = new URLSearchParams();
    params.append("type", "stream");
    params.append("to", stream);
    params.append("topic", topic);
    params.append("content", content);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Zulip] Failed to send message:", res.status, errorText);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Zulip] Exception sending message:", err);
    return false;
  }
}
