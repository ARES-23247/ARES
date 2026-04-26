import { PostPayload, SocialConfig } from "../socialSync";

export async function dispatchBand(payload: PostPayload, config: SocialConfig) {
  if (!config.BAND_ACCESS_TOKEN || !config.BAND_KEY) return;

  try {
    const url = 'https://openapi.band.us/v2.2/band/post/create';

    const textContent = `🚀 New Update: ${payload.title}\n\n${payload.snippet || ""}\n\nRead more: ${payload.url}`;

    const params = new URLSearchParams();
    params.append('access_token', config.BAND_ACCESS_TOKEN);
    params.append('band_key', config.BAND_KEY);
    params.append('content', textContent);
    params.append('do_push', 'true');

    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params,
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`HTTP ${response.status}: ${body}`);
        }
        
        const data = await response.json() as { result_code?: number; result_data?: unknown };
        if (data.result_code !== 1) {
           throw new Error(`BAND API Error: ${JSON.stringify(data)}`);
        }
        
        break; // Success
      } catch (err: unknown) {
        const errMsg = (err as Error)?.message || String(err);
        if (attempt === maxRetries) {
            console.error("BAND post failed:", errMsg);
            throw new Error(`BAND: ${errMsg}`, { cause: err });
        }
        console.warn(`BAND timeout or error (attempt ${attempt}), retrying...`);
        await new Promise(r => setTimeout(r, 1500)); // Brief backoff
      }
    }
  } catch (err: unknown) {
    console.error("BAND syndication failed:", (err as Error)?.message || err);
    throw new Error(`BAND: ${(err as Error)?.message || String(err)}`, { cause: err });
  }
}
