export type ExportErrorCode =
  | "USER_NOT_FOUND"
  | "EXPORT_ALREADY_ACTIVE"
  | "EXPORT_NOT_FOUND"
  | "EXPORT_JOB_NOT_FOUND"
  | "EXPORT_CANNOT_CANCEL"
  | "EXPORT_EXPIRED"
  | "EXPORT_NOT_READY"
  | "EXPORT_CHECKSUM_MISMATCH"
  | "EXPORT_PART_MISSING"
  | "EXPORT_PART_CORRUPT"
  | "EXPORT_DECRYPTION_FAILED"
  | "EXPORT_IDENTITY_DECRYPTION_FAILED"
  | "EXPORT_EMAIL_DECRYPTION_FAILED"
  | "EXPORT_LEASE_LOST"
  | "LEASE_LOST"
  | "EXPORT_ABORTED"
  | "EXPORT_DB_UNAVAILABLE"
  | "EXPORT_RECORD_TOO_LARGE"
  | "EXPORT_TIMEOUT";

export class ExportError extends Error {
  constructor(
    public readonly code: ExportErrorCode,
    message: string,
    public readonly status: number = 400,
    public readonly isRetryable: boolean = true
  ) {
    super(message);
    this.name = "ExportError";
  }
}
