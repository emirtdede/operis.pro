import { getTurnstileEndpoint } from "./turnstile-endpoint";
import { getEnv } from "@/src/config/env";

export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Verifies a Cloudflare Turnstile token server-side using the siteverify API.
 * Rejects verification failures; only unconfigured non-production environments may bypass.
 */
export async function verifyTurnstileToken(
  token?: string | null,
  ip?: string
): Promise<TurnstileVerifyResult> {
  const secretKey =
    process.env.TURNSTILE_SECRET_KEY ||
    (() => {
      try {
        return getEnv().TURNSTILE_SECRET_KEY;
      } catch {
        return undefined;
      }
    })();

  if (!secretKey) {
    return process.env.NODE_ENV === "production"
      ? { success: false, error: "Bot verification unavailable. Please try again later." }
      : { success: true };
  }

  if (!token) {
    return { success: false, error: "Missing bot verification token" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const res = await fetch(getTurnstileEndpoint(), {
      method: "POST",
      body: formData,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) throw new Error("Turnstile upstream request failed");

    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };

    if (data.success !== true) {
      return {
        success: false,
        error: data["error-codes"]?.[0] || "Bot verification failed. Please try again.",
      };
    }

    return { success: true };
  } catch (err) {
    // Never grant verification when the provider cannot verify the token.
    console.error(
      "Turnstile verification unavailable:",
      err instanceof Error ? err.name : "UnknownError"
    );
    return { success: false, error: "Bot verification unavailable. Please try again later." };
  }
}
