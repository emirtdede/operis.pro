import { encryptEnvelopeV2, decryptEnvelopeV2, type EnvelopeAadContext } from "@/src/lib/crypto/envelope";

/**
 * Encrypts an offer proposal message using Envelope v2 AES-256-GCM with AAD context binding.
 * Format: v2:keyId:iv:authTag:ciphertext
 */
export function encryptOfferMessage(plaintext: string, offerId: string): string {
  if (!plaintext) return "";
  const context: EnvelopeAadContext = {
    table: "offers",
    primaryKey: offerId,
    column: "message",
  };
  return encryptEnvelopeV2(plaintext, context);
}

/**
 * Decrypts an AES-256-GCM encrypted offer proposal message.
 * Backward-compatible:
 * - If the message starts with "v2:", decrypts using Envelope v2 with verified AAD context.
 * - If the message is legacy plaintext (from before encryption was applied), returns it as-is.
 */
export function decryptOfferMessage(rawMessage: string | null | undefined, offerId?: string): string {
  if (!rawMessage) return "";

  if (rawMessage.startsWith("v2:")) {
    const context: EnvelopeAadContext | undefined = offerId
      ? {
          table: "offers",
          primaryKey: offerId,
          column: "message",
        }
      : undefined;
    return decryptEnvelopeV2(rawMessage, context);
  }

  // Legacy plaintext fallback
  return rawMessage;
}
