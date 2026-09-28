import { NextResponse } from "next/server";

export interface SafeErrorOptions {
  status?: number;
  isEn?: boolean;
  logPrefix?: string;
  allowedMessages?: Record<string, { en: string; tr: string; status?: number }>;
}

/**
 * Standardized API error response handler.
 * Prevents internal database, network, and file system error messages from leaking to clients (CWE-209).
 * Safely logs details server-side while returning localized, sanitized error responses.
 */
export function handleApiError(
  err: unknown,
  fallbackMessage: { en: string; tr: string } | string,
  options: SafeErrorOptions = {}
): NextResponse {
  const { status = 500, isEn = false, logPrefix = "[API Error]", allowedMessages } = options;

  console.error(`${logPrefix}:`, err);

  const fallbackStr =
    typeof fallbackMessage === "string"
      ? fallbackMessage
      : isEn
        ? fallbackMessage.en
        : fallbackMessage.tr;

  if (err instanceof Error && allowedMessages) {
    for (const [key, config] of Object.entries(allowedMessages)) {
      if (err.message.includes(key)) {
        return NextResponse.json(
          { error: isEn ? config.en : config.tr },
          { status: config.status ?? 400 }
        );
      }
    }
  }

  return NextResponse.json({ error: fallbackStr }, { status });
}
