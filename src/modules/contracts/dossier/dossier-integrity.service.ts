import { createHash } from "crypto";

export class DossierIntegrityService {
  /**
   * Generates a deterministic SHA-256 hash from string or buffer content.
   */
  static sha256(content: string | Buffer): string {
    return createHash("sha256")
      .update(Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8"))
      .digest("hex");
  }

  /**
   * Generates a Master Root Hash deterministically combining all document hashes.
   */
  static calculateMasterRootHash(documents: Array<{ path: string; sha256: string }>): string {
    const sorted = [...documents].sort((a, b) => a.path.localeCompare(b.path));
    const combinedString = sorted.map((d) => `${d.sha256}  ${d.path}`).join("\n");
    return this.sha256(combinedString);
  }
}
