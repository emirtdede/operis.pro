export function encodeNotificationCursor(userId: string, sequence: string): string {
  return `v1.${userId}.${sequence}`;
}
export function decodeNotificationCursor(cursor: string, userId: string): string | null {
  const match = /^v1\.([0-9a-f-]{36})\.(0|[1-9][0-9]{0,18})$/i.exec(cursor);
  if (!match || match[1] !== userId || !match[2] || BigInt(match[2]) > 9223372036854775807n)
    return null;
  return match[2];
}
