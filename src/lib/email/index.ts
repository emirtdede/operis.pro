import fs from "node:fs";
import path from "node:path";
import { Locale } from "@/src/lib/i18n/config";
import { renderEmailTemplate } from "./templates";
import { ResendPoolService } from "@/src/modules/email/resend-pool-service";

let cachedLogoBase64: string | null = null;
function getLogoBase64(): string | null {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const p = path.join(process.cwd(), "public", "operis-logo-email.png");
    if (fs.existsSync(p)) {
      cachedLogoBase64 = fs.readFileSync(p).toString("base64");
      return cachedLogoBase64;
    }
  } catch {
    // ignore
  }
  return null;
}

export type EmailTemplateKey =
  | "verify_email"
  | "password_reset"
  | "new_offer_received"
  | "offer_accepted"
  | "offer_rejected"
  | "match_created"
  | "completion_requested"
  | "listing_expiring"
  | "listing_expired"
  | "platform_notification"
  | "contact_form"
  | "category_follow_match"
  | (string & {});

export interface TransactionalEmailProvider {
  send(input: {
    to: string;
    template: EmailTemplateKey;
    locale: Locale;
    variables: Record<string, string>;
    idempotencyKey: string;
    replyTo?: string;
    headers?: Record<string, string>;
    unsubscribeUrl?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class MockEmailProvider implements TransactionalEmailProvider {
  private sentEmails: Array<{
    to: string;
    template: EmailTemplateKey;
    locale: Locale;
    variables: Record<string, string>;
    sentAt: Date;
    replyTo?: string;
    headers?: Record<string, string>;
    unsubscribeUrl?: string;
  }> = [];

  async send(input: {
    to: string;
    template: EmailTemplateKey;
    locale: Locale;
    variables: Record<string, string>;
    idempotencyKey: string;
    replyTo?: string;
    headers?: Record<string, string>;
    unsubscribeUrl?: string;
  }) {
    this.sentEmails.push({
      to: input.to,
      template: input.template,
      locale: input.locale,
      variables: input.variables,
      sentAt: new Date(),
      replyTo: input.replyTo,
    });

    return {
      success: true,
      messageId: `mock_email_${Date.now()}_${input.idempotencyKey}`,
    };
  }

  getRecentSent(to: string) {
    return this.sentEmails.filter((m) => m.to === to);
  }
}

export class ResendEmailProvider implements TransactionalEmailProvider {
  async send(input: {
    to: string;
    template: EmailTemplateKey;
    locale: Locale;
    variables: Record<string, string>;
    idempotencyKey: string;
    replyTo?: string;
    headers?: Record<string, string>;
    unsubscribeUrl?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Pre-flight check: Suppress dispatch to known bounced addresses to protect sender reputation
    try {
      if (await ResendPoolService.isEmailBounced(input.to)) {
        return {
          success: false,
          error: `Recipient ${input.to} has previously bounced or filed a complaint. Dispatch suppressed.`,
        };
      }
    } catch {
      // Non-fatal if DB check is not available
    }

    const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
    const from = process.env.EMAIL_FROM || "noreply@operis.pro";

    if (!apiKey) {
      return {
        success: false,
        error: "EMAIL_API_KEY or RESEND_API_KEY is missing for Resend provider",
      };
    }

    const baseUrl = process.env.RESEND_BASE_URL || "https://api.resend.com";

    // B25-RUNNER: In test mode, egress to external endpoints is strictly forbidden
    if (process.env.TEST_PROD === "1" || process.env.NODE_ENV === "test") {
      const parsedUrl = new URL(baseUrl);
      if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
        return {
          success: false,
          error: `B25-RUNNER: External network egress to ${parsedUrl.hostname} is strictly blocked in test mode.`,
        };
      }
    }

    const rendered = renderEmailTemplate({
      template: input.template,
      locale: input.locale,
      variables: input.variables,
    });

    const logoBase64 = getLogoBase64();
    const attachments = logoBase64
      ? [
          {
            filename: "operis-logo.png",
            content: logoBase64,
            content_id: "operis-logo",
          },
        ]
      : undefined;

    const customHeaders: Record<string, string> = {
      ...(input.headers || {}),
    };

    if (input.unsubscribeUrl) {
      customHeaders["List-Unsubscribe"] = `<${input.unsubscribeUrl}>`;
      customHeaders["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }

    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": input.idempotencyKey,
        },
        body: JSON.stringify({
          from,
          to: input.to,
          reply_to: input.replyTo,
          subject: input.variables.subject || rendered.subject,
          html: rendered.html,
          text: input.variables.body || rendered.text,
          attachments,
          headers: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.message || "Resend dispatch failed" };
      }

      const data = await res.json().catch(() => null);
      if (!data || typeof data.id !== "string" || !data.id.trim()) {
        return { success: false, error: "Resend response missing message ID" };
      }

      return { success: true, messageId: data.id };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Resend network error",
      };
    }
  }
}

function isBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PRIVATE_BUILD_WORKER !== undefined ||
    process.env.npm_lifecycle_event === "build" ||
    process.argv.some((arg) => arg.includes("build"))
  );
}

function createEmailProvider(): TransactionalEmailProvider {
  const providerType = process.env.EMAIL_PROVIDER;
  if (providerType === "resend") {
    if (
      process.env.NODE_ENV === "production" &&
      !isBuildPhase() &&
      !process.env.RESEND_API_KEY &&
      !process.env.EMAIL_API_KEY
    ) {
      throw new Error(
        "Production error: RESEND_API_KEY or EMAIL_API_KEY must be configured when EMAIL_PROVIDER=resend."
      );
    }
    return new ResendEmailProvider();
  }
  if (providerType === "smtp") {
    if (process.env.NODE_ENV === "production" && !isBuildPhase()) {
      throw new Error(
        "EMAIL_PROVIDER=smtp is configured but SMTP direct transport is not implemented in production."
      );
    }
    console.error("Warning: EMAIL_PROVIDER=smtp is not implemented. Using mock in non-production.");
  }
  if (process.env.NODE_ENV === "production" && !isBuildPhase()) {
    throw new Error(
      `Invalid production configuration: EMAIL_PROVIDER cannot be '${providerType || "undefined"}'. A valid real provider (e.g. 'resend') must be configured in production.`
    );
  }
  return new MockEmailProvider();
}

export const emailProvider: TransactionalEmailProvider = {
  send: (input) => createEmailProvider().send(input),
};

export class EmailAdapter {
  static async sendTransactionalEmail(input: {
    to: string;
    subject: string;
    body: string;
    template?: EmailTemplateKey;
    locale?: "tr" | "en";
    idempotencyKey?: string;
    replyTo?: string;
    headers?: Record<string, string>;
    unsubscribeUrl?: string;
    variables?: Record<string, string>;
  }): Promise<boolean> {
    const result = await emailProvider.send({
      to: input.to,
      template: input.template || "platform_notification",
      locale: input.locale || "tr",
      replyTo: input.replyTo,
      headers: input.headers,
      unsubscribeUrl: input.unsubscribeUrl,
      variables: {
        subject: input.subject,
        body: input.body,
        ...(input.variables || {}),
      },
      idempotencyKey:
        input.idempotencyKey || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    });
    return Boolean(result.success);
  }
}
