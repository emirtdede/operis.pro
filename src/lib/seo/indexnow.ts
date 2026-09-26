import { getBaseUrl } from "@/src/lib/config/url";

const DEFAULT_INDEXNOW_KEY = "8b11c0f16e3c4e3692dfba5191ec489b";

interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation?: string;
  urlList: string[];
}

/**
 * Submits updated, created, or deleted URLs to IndexNow (Bing, Yandex, Seznam)
 * for instant search engine discovery and freshness updates.
 *
 * Non-blocking by design with a strict timeout so callers are never slowed down.
 */
export async function notifyIndexNow(urls: string | string[]): Promise<boolean> {
  const urlList = Array.isArray(urls) ? urls : [urls];
  if (urlList.length === 0) return false;

  const key = process.env.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY;
  const baseUrl = getBaseUrl();

  let host: string;
  try {
    host = new URL(baseUrl).hostname;
  } catch {
    host = "operis.pro";
  }

  const payload: IndexNowPayload = {
    host,
    key,
    keyLocation: `${baseUrl}/${key}.txt`,
    urlList,
  };

  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });

    return response.ok;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[IndexNow] Notification skipped or failed:", error);
    }
    return false;
  }
}
