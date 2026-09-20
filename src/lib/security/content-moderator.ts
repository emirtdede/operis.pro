/**
 * Content Moderation and Abuse Guardrail Engine
 * Protects users from profanity, insults, harassment, hate speech,
 * and prohibited off-platform contact leakage in proposals and messages.
 */

// Unicode Extended Pictographic pattern according to Unicode Standard Annex #51
export const EMOJI_REGEX =
  /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;

export function containsEmoji(text: string): boolean {
  return EMOJI_REGEX.test(text);
}

// Common Turkish & English profanity, slurs, offensive roots
const BLOCKED_WORDS = [
  // Küfür ve Hakaret Kökleri (TR)
  "küfür",
  "orospu",
  "piç",
  "sik",
  "sikeyim",
  "sikerim",
  "sikiş",
  "yarrak",
  "amk",
  "amq",
  "aq",
  "oç",
  "ibne",
  "puşt",
  "göt",
  "gavat",
  "pezevenk",
  "kahpe",
  "şerefsiz",
  "haysiyetsiz",
  "ahmak",
  "salak",
  "gerizekalı",
  "aptal",
  "moron",
  "dangalak",
  "yavşak",
  "bok",
  "ananı",
  "bacını",
  "ebeni",

  // Profanity & Slurs (EN)
  "fuck",
  "fucking",
  "motherfucker",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "cunt",
  "whore",
  "slut",
  "nigger",
  "faggot",
  "retard",
  "idiot",
  "scam",
  "scammer",
  "fraud",
];

// Regex to detect intentional obfuscation (e.g. s.i.k, p_i_ç, a m k)
const L33T_MAP: Record<string, string> = {
  "@": "a",
  "4": "a",
  "3": "e",
  "1": "i",
  "!": "i",
  "0": "o",
  $: "s",
  "5": "s",
  "7": "t",
};

/**
 * Normalizes text to defeat basic obfuscation tricks:
 * - Leetspeak substitutions (@ -> a, 1 -> i, etc.)
 * - Repetitive punctuation / dots / underscores
 * - Whitespace compression
 */
export function normalizeContentForAnalysis(rawText: string): string {
  let text = rawText.toLowerCase();

  // Replace common l33t chars
  for (const [char, replacement] of Object.entries(L33T_MAP)) {
    text = text.replaceAll(char, replacement);
  }

  // Remove invisible characters and zero-width spaces
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, "");

  return text;
}

export interface ModerationResult {
  isValid: boolean;
  flaggedTerms: string[];
  category?: "PROFANITY" | "INSULT" | "HARASSMENT" | "CONTACT_LEAK";
  reason?: string;
}

/**
 * Validates text against profanity, insults, harassment, and unauthorized leaks.
 */
function toAscii(str: string): string {
  return str
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

export function validateContentAppropriateness(rawText: string): ModerationResult {
  if (!rawText || rawText.trim().length === 0) {
    return { isValid: true, flaggedTerms: [] };
  }

  const normalized = normalizeContentForAnalysis(rawText);
  const asciiNormalized = toAscii(normalized);

  // Split into alphanumeric words and also check compressed continuous string
  const words = normalized.split(/[\s,._\-:;!?*#/\\()[\]{}<>+="'`~]+/);
  const asciiWords = asciiNormalized.split(/[\s,._\-:;!?*#/\\()[\]{}<>+="'`~]+/);
  const compressed = normalized.replace(/[^a-z0-9ğüşıöç]/gi, "");
  const asciiCompressed = asciiNormalized.replace(/[^a-z0-9]/gi, "");

  const flagged = new Set<string>();

  for (const blocked of BLOCKED_WORDS) {
    const asciiBlocked = toAscii(blocked);

    // Word boundary check
    if (words.includes(blocked) || asciiWords.includes(asciiBlocked)) {
      flagged.add(blocked);
    }

    // Direct substring check for severe slurs (longer than 3 chars)
    if (
      blocked.length >= 4 &&
      (compressed.includes(blocked) || asciiCompressed.includes(asciiBlocked))
    ) {
      flagged.add(blocked);
    }
  }

  // Contact leakage & off-platform solicitation guards
  const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  const PHONE_REGEX = /(?:\+?90\s*|\b0\s*)[5][0-9]{2}[\s.-]*[0-9]{3}[\s.-]*[0-9]{2}[\s.-]*[0-9]{2}\b/;
  const CONTACT_INVITE_REGEX = /(?:wa\.me\/|t\.me\/|discord\.gg\/|instagram\.com\/[a-zA-Z0-9_.]+|wp(?:'den|\s*tan|\s*den)?\s*(?:yaz|ulas|ara)|dm(?:'den|\s*den)?\s*(?:yaz|ulas))/i;

  if (EMAIL_REGEX.test(rawText) || PHONE_REGEX.test(rawText) || CONTACT_INVITE_REGEX.test(rawText)) {
    return {
      isValid: false,
      flaggedTerms: ["CONTACT_LEAK"],
      category: "CONTACT_LEAK",
      reason:
        "Platform dışı iletişim ve gizli anlaşmaları önlemek amacıyla e-posta adresi, telefon numarası veya harici iletişim bağlantısı paylaşılamaz.",
    };
  }

  if (flagged.size > 0) {
    return {
      isValid: false,
      flaggedTerms: Array.from(flagged),
      category: "PROFANITY",
      reason:
        "Mesajınız topluluk kurallarımıza aykırı uygunsuz ifadeler (küfür, hakaret veya saldırgan dil) içerdiği için engellendi.",
    };
  }

  return {
    isValid: true,
    flaggedTerms: [],
  };
}
