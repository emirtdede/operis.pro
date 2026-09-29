import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray, lte, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/src/lib/db";
import { deleteEphemeralSignature, deleteEphemeralSignatures } from "./r2-client";

export async function registerSignatureUpload(key: string, engagementId: string): Promise<void> {
  await getDb()
    .insert(schema.signatureStorageJobs)
    .values({
      key,
      engagementId,
      nextAttemptAt: new Date(Date.now() + 15 * 60000),
    });
}

/** Upload intents and package triggers retain work even if the request process dies. */
export async function processSignatureStorageJobs(limit = 25, keys?: string[]): Promise<number> {
  const db = getDb();
  const t = schema.signatureStorageJobs;
  const now = new Date();
  const due = and(
    lte(t.nextAttemptAt, now),
    or(
      inArray(t.status, ["UPLOADING", "PENDING", "DONE"]),
      and(eq(t.status, "PROCESSING"), lte(t.leaseUntil, now))
    ),
    keys ? inArray(t.key, keys) : undefined
  );
  const candidates = await db
    .select()
    .from(t)
    .where(due)
    .orderBy(asc(t.nextAttemptAt), asc(t.createdAt), asc(t.key))
    .limit(limit);
  let deleted = 0;
  for (const candidate of candidates) {
    const token = randomUUID();
    const [job] = await db
      .update(t)
      .set({
        status: "PROCESSING",
        leaseToken: token,
        leaseUntil: new Date(Date.now() + 60000),
        attemptCount: sql`${t.attemptCount} + 1`,
      })
      .where(and(eq(t.key, candidate.key), due))
      .returning();
    if (!job) continue;
    // Once claimed, the package trigger refuses to attach this key. Existing active
    // references are checked again for legacy records and reconciliation jobs.
    const [active] = await db
      .select({ id: schema.engagementContractPackages.id })
      .from(schema.engagementContractPackages)
      .where(
        and(
          sql`${schema.engagementContractPackages.status} <> 'FULLY_SIGNED'`,
          or(
            eq(schema.engagementContractPackages.clientSignatureR2Key, job.key),
            eq(schema.engagementContractPackages.freelancerSignatureR2Key, job.key)
          )
        )
      )
      .limit(1);
    if (active) {
      await db
        .update(t)
        .set({ status: "ATTACHED", leaseToken: null, leaseUntil: null })
        .where(
          and(
            eq(t.key, job.key),
            eq(t.leaseToken, token),
            eq(t.status, "PROCESSING"),
            sql`${t.leaseUntil} > clock_timestamp()`
          )
        );
      continue;
    }
    const success = await deleteEphemeralSignature(job.key);
    const status = success ? "DONE" : job.attemptCount >= 12 ? "DEAD" : "PENDING";
    await db.transaction(async (tx) => {
      if (job.packageId) {
        // Serialize completion of separate keys belonging to one package. Acquire
        // the package lock before the job lock, matching the package trigger order.
        // The following statements then see the previous worker's committed DONE.
        await tx.execute(sql`SELECT id FROM engagement_contract_packages
          WHERE id=${job.packageId} FOR UPDATE`);
      }
      const updated = await tx
        .update(t)
        .set({
          status,
          leaseToken: null,
          leaseUntil: null,
          attemptCount: success ? 0 : job.attemptCount,
          lastError: success ? null : "R2_DELETE_FAILED",
          // Recheck completed intents: a timed-out PUT can finish after an earlier DELETE.
          nextAttemptAt: new Date(
            Date.now() + (success ? 86400000 : Math.min(3600000, 1000 * 2 ** job.attemptCount))
          ),
        })
        .where(
          and(
            eq(t.key, job.key),
            eq(t.leaseToken, token),
            eq(t.status, "PROCESSING"),
            sql`${t.leaseUntil} > clock_timestamp()`
          )
        )
        .returning({ key: t.key });
      if (!updated.length || !success) return;
      deleted++;
      if (job.packageId && job.packageVersion) {
        await tx.execute(sql`UPDATE engagement_contract_packages p SET ephemeral_cleaned_at=now()
          WHERE p.id=${job.packageId} AND p.version=${job.packageVersion} AND p.status='FULLY_SIGNED'
          AND NOT EXISTS (SELECT 1 FROM unnest(ARRAY[p.client_signature_r2_key,p.freelancer_signature_r2_key]) k
            WHERE k IS NOT NULL AND NOT EXISTS (SELECT 1 FROM signature_storage_jobs j WHERE j.key=k AND j.status='DONE'))`);
      }
    });
    if (!success) console.error("[Signature cleanup job]", { status, attempts: job.attemptCount });
  }
  return deleted;
}

export async function requestSignatureCleanup(keys: string[]): Promise<number> {
  if (!keys.length) return 0;
  if (process.env.NODE_ENV === "test" && !process.env.TEST_DATABASE_URL) {
    return deleteEphemeralSignatures(keys);
  }
  const t = schema.signatureStorageJobs;
  // Never detach committed active signatures in a compensation handler.
  await getDb()
    .update(t)
    .set({ status: "PENDING", nextAttemptAt: new Date() })
    .where(and(inArray(t.key, keys), eq(t.status, "UPLOADING")));
  await processSignatureStorageJobs(keys.length, keys);
  const done = await getDb()
    .select({ key: t.key })
    .from(t)
    .where(and(inArray(t.key, keys), eq(t.status, "DONE")));
  return done.length;
}
