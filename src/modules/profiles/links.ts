import { z } from "zod";
import { EMOJI_REGEX } from "@/src/lib/security/content-moderator";

export const ALLOWED_LINK_TYPES = [
  "website",
  "github",
  "gitlab",
  "linkedin",
  "stackoverflow",
  "behance",
  "dribbble",
  "figma",
  "artstation",
  "sketchfab",
  "medium",
  "substack",
  "twitter",
  "x",
  "youtube",
  "vimeo",
  "soundcloud",
  "spotify",
  "kaggle",
  "huggingface",
  "codepen",
  "devto",
  "portfolio",
  "other",
] as const;

export type LinkType = (typeof ALLOWED_LINK_TYPES)[number];

const PRIVATE_IP_REGEX =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3}|0\.0\.0\.0)$/;

export function isValidExternalUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);

    // Development allows localhost
    if (process.env.NODE_ENV !== "production" && parsed.hostname === "localhost") {
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    }

    // Production: HTTPS only
    if (parsed.protocol !== "https:") return false;

    // Block private IP addresses, loopbacks, and numeric IPs (SSRF mitigation per §9.1 & §26.1)
    if (PRIVATE_IP_REGEX.test(parsed.hostname)) return false;
    if (parsed.hostname.endsWith(".local") || parsed.hostname.endsWith(".internal")) {
      return false;
    }

    // No credentials in URL
    if (parsed.username || parsed.password) return false;

    return true;
  } catch {
    return false;
  }
}

export const profileLinkSchema = z.object({
  type: z.enum(ALLOWED_LINK_TYPES),
  label: z
    .string()
    .min(1, "Link label must be at least 1 character")
    .max(40, "Link label cannot exceed 40 characters")
    .trim()
    .refine((val) => !EMOJI_REGEX.test(val), {
      message: "Link label cannot contain emojis",
    }),
  url: z
    .string()
    .url("Must be a valid URL")
    .refine((val) => isValidExternalUrl(val), {
      message: "URL must be a valid public HTTPS address (no local/private IPs)",
    }),
});

export type ProfileLinkInput = z.infer<typeof profileLinkSchema>;
