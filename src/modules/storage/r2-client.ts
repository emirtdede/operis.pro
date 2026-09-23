import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv } from "@/src/config/env";
import crypto from "node:crypto";

let s3ClientInstance: S3Client | null = null;

// In-memory mock storage for local testing when Cloudflare R2 is not configured
const inMemoryEphemeralStore = new Map<string, { buffer: Buffer; mimeType: string }>();

interface ValidatedR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrlBase?: string;
}

function getValidatedR2Config(): ValidatedR2Config {
  const env = getEnv();
  const {
    CLOUDFLARE_R2_ACCOUNT_ID: accountId,
    CLOUDFLARE_R2_ACCESS_KEY_ID: accessKeyId,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: secretAccessKey,
    CLOUDFLARE_R2_BUCKET_NAME: bucketName,
    NEXT_PUBLIC_R2_PUBLIC_URL: publicUrlBase,
  } = env;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Cloudflare R2 storage credentials are not configured in environment.");
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrlBase };
}

export function isR2Configured(): boolean {
  try {
    getValidatedR2Config();
    return true;
  } catch {
    return false;
  }
}

function getR2Client(): { client: S3Client; bucketName: string; publicUrlBase: string } {
  const config = getValidatedR2Config();

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  const publicUrlBase =
    config.publicUrlBase?.replace(/\/+$/, "") ||
    `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com`;

  return {
    client: s3ClientInstance,
    bucketName: config.bucketName,
    publicUrlBase,
  };
}

export interface PresignedAvatarUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresInSeconds: number;
}

export interface EphemeralSignatureUploadResult {
  key: string;
  publicUrl: string;
  sha256: string;
  sizeBytes: number;
}

/**
 * Generates a short-lived (60s) presigned PUT URL for uploading an avatar directly to Cloudflare R2.
 */
export async function createAvatarPresignedUploadUrl(userId: string): Promise<PresignedAvatarUpload> {
  const { client, bucketName, publicUrlBase } = getR2Client();

  const randomSuffix = crypto.randomBytes(6).toString("hex");
  const key = `avatars/${userId}-${Date.now()}-${randomSuffix}.webp`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  });

  const expiresInSeconds = 60;
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  const publicUrl = `${publicUrlBase}/${key}`;

  return {
    uploadUrl,
    publicUrl,
    key,
    expiresInSeconds,
  };
}

/**
 * Uploads an ephemeral digital signature to Cloudflare R2 (10 GB free tier).
 * Stored only until the contract package is finalized and executed, after which it is deleted.
 */
export async function uploadEphemeralSignature(
  engagementId: string,
  role: "CLIENT" | "CONTRACTOR",
  buffer: Buffer,
  mimeType: string = "image/webp"
): Promise<EphemeralSignatureUploadResult> {
  const randomSuffix = crypto.randomBytes(6).toString("hex");
  const key = `ephemeral-signatures/${engagementId}/${role.toLowerCase()}-${Date.now()}-${randomSuffix}.webp`;
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

  if (isR2Configured()) {
    const { client, bucketName, publicUrlBase } = getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          engagementId,
          role,
          sha256,
          purpose: "ephemeral-contract-signature",
        },
      })
    );
    return {
      key,
      publicUrl: `${publicUrlBase}/${key}`,
      sha256,
      sizeBytes: buffer.length,
    };
  }

  // Fallback for tests/local environment without R2 credentials
  inMemoryEphemeralStore.set(key, { buffer, mimeType });
  return {
    key,
    publicUrl: `https://storage.operis.local/${key}`,
    sha256,
    sizeBytes: buffer.length,
  };
}

/**
 * Permanently purges an ephemeral signature from Cloudflare R2 to conserve 10 GB free storage.
 */
export async function deleteEphemeralSignature(key: string): Promise<boolean> {
  if (!key) return true;

  if (isR2Configured()) {
    try {
      const { client, bucketName } = getR2Client();
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  // Fallback mock deletion
  inMemoryEphemeralStore.delete(key);
  return true;
}

/**
 * Batch deletes multiple ephemeral signature keys from Cloudflare R2.
 */
export async function deleteEphemeralSignatures(keys: string[]): Promise<number> {
  const validKeys = keys.filter(Boolean);
  if (validKeys.length === 0) return 0;
  const results = await Promise.all(validKeys.map((key) => deleteEphemeralSignature(key)));
  return results.filter(Boolean).length;
}

/**
 * Helper to inspect mock storage during tests.
 */
export function getMockEphemeralSignatureCount(): number {
  return inMemoryEphemeralStore.size;
}
