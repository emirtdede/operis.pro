import { beforeAll, afterAll, afterEach, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { createIsolatedTestDatabase, type TestDatabaseContext } from "../helpers/test-database";
import { setDbForTesting, resetDbForTesting } from "@/src/lib/db";
import * as schema from "@/db/schema";
import * as storage from "@/src/modules/storage/r2-client";
import { ContractSigningService } from "@/src/modules/contracts/contract-signing-service";
import { NotificationService } from "@/src/modules/notifications/service";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as environment from "@/src/config/env";
import {
  registerSignatureUpload,
  processSignatureStorageJobs,
  requestSignatureCleanup,
} from "@/src/modules/storage/signature-cleanup";
let ctx: TestDatabaseContext;
beforeAll(async () => {
  ctx = await createIsolatedTestDatabase();
  setDbForTesting(ctx.db, ctx.pool);
}, 60000);
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  resetDbForTesting();
  await ctx?.destroy();
});
async function createPackage() {
  const owner = randomUUID(),
    freelancer = randomUUID(),
    category = randomUUID(),
    listing = randomUUID(),
    offer = randomUUID(),
    engagement = randomUUID(),
    id = randomUUID();
  await ctx.db
    .insert(schema.users)
    .values(
      [owner, freelancer].map((id) => ({ id, email: `${id}@example.test`, passwordHash: "hash" }))
    );
  await ctx.db.insert(schema.categories).values({ id: category, key: category });
  await ctx.db.insert(schema.listings).values({
    id: listing,
    ownerUserId: owner,
    categoryId: category,
    slug: listing,
    title: "test",
    summary: "test",
    scope: "test",
    budgetMode: "NEGOTIABLE",
    timelineMode: "FLEXIBLE",
  });
  await ctx.db.insert(schema.offers).values({
    id: offer,
    listingId: listing,
    offerorUserId: freelancer,
    listingActivationSeq: 1,
    message: "test",
  });
  await ctx.db.insert(schema.engagements).values({
    id: engagement,
    listingId: listing,
    acceptedOfferId: offer,
    ownerUserId: owner,
    freelancerUserId: freelancer,
    listingTitleSnapshot: "test",
    listingCategorySnapshot: "test",
  });
  await ctx.db.insert(schema.engagementContractPackages).values({ id, engagementId: engagement });
  return { id, engagement, owner, freelancer };
}

const signatureDataUrl =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function configureTestR2() {
  vi.spyOn(environment, "getEnv").mockReturnValue({
    ...environment.getEnv(),
    CLOUDFLARE_R2_ACCOUNT_ID: "integration-test-account",
    CLOUDFLARE_R2_ACCESS_KEY_ID: "integration-test-key",
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: "integration-test-secret",
    CLOUDFLARE_R2_BUCKET_NAME: "integration-test-bucket",
  });
}

it("persists an upload intent before issuing PutObject and retains it after a storage timeout", async () => {
  configureTestR2();
  const engagement = randomUUID();
  let key: string | undefined;
  const send = vi.spyOn(S3Client.prototype, "send").mockImplementation(async (command) => {
    expect(command).toBeInstanceOf(PutObjectCommand);
    key = (command as PutObjectCommand).input.Key;
    const [job] = await ctx.db
      .select()
      .from(schema.signatureStorageJobs)
      .where(eq(schema.signatureStorageJobs.key, key!));
    expect(job?.status).toBe("UPLOADING");
    throw new Error("INJECTED_PUT_TIMEOUT");
  });
  await expect(
    storage.uploadEphemeralSignature(engagement, "CLIENT", Buffer.from("signature"))
  ).rejects.toThrow("INJECTED_PUT_TIMEOUT");
  expect(send).toHaveBeenCalledOnce();
  const [job] = await ctx.db
    .select()
    .from(schema.signatureStorageJobs)
    .where(eq(schema.signatureStorageJobs.key, key!));
  expect(job?.status).toBe("UPLOADING");
});

it("never issues PutObject when recording its durable intent fails", async () => {
  configureTestR2();
  const engagement = randomUUID();
  const send = vi.spyOn(S3Client.prototype, "send");
  await ctx.pool
    .query(`CREATE FUNCTION reject_test_upload_intent() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN IF NEW.engagement_id='${engagement}'::uuid THEN RAISE EXCEPTION 'INJECTED_INTENT_FAILURE';
    END IF; RETURN NEW; END $$;
    CREATE TRIGGER reject_test_upload_intent BEFORE INSERT ON signature_storage_jobs
    FOR EACH ROW EXECUTE FUNCTION reject_test_upload_intent()`);
  try {
    await expect(
      storage.uploadEphemeralSignature(engagement, "CLIENT", Buffer.from("signature"))
    ).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
    const jobs = await ctx.db
      .select()
      .from(schema.signatureStorageJobs)
      .where(eq(schema.signatureStorageJobs.engagementId, engagement));
    expect(jobs).toHaveLength(0);
  } finally {
    await ctx.pool.query(
      "DROP TRIGGER reject_test_upload_intent ON signature_storage_jobs; DROP FUNCTION reject_test_upload_intent()"
    );
  }
});

it("keeps local storage signing compatible with the durable DB trigger and cleans invalidated signatures", async () => {
  const { id, engagement, owner } = await createPackage();
  vi.spyOn(NotificationService, "createNotification").mockResolvedValue(null);
  const upload = vi.spyOn(storage, "uploadEphemeralSignature");
  await ContractSigningService.submitSignature({
    engagementId: engagement,
    userId: owner,
    signerName: "Client",
    role: "CLIENT",
    signatureType: "DRAWN",
    signatureDataUrl,
    legalAcknowledged: true,
    expectedVersion: 1,
  });
  expect(upload).toHaveBeenCalledOnce();
  const [pkg] = await ctx.db
    .select()
    .from(schema.engagementContractPackages)
    .where(eq(schema.engagementContractPackages.id, id));
  expect(pkg?.clientSignatureR2Key).toBeTruthy();
  const [job] = await ctx.db
    .select()
    .from(schema.signatureStorageJobs)
    .where(eq(schema.signatureStorageJobs.key, pkg!.clientSignatureR2Key!));
  expect(job?.status).toBe("ATTACHED");
  await ContractSigningService.updateSelectedContracts(engagement, owner, [
    "CORE_SERVICE",
    "KVKK_DPA",
  ]);
  const [cleaned] = await ctx.db
    .select()
    .from(schema.signatureStorageJobs)
    .where(eq(schema.signatureStorageJobs.key, job!.key));
  expect(cleaned?.status).toBe("DONE");
});

it("retains the real uploaded key when package CAS loses after upload and deletion fails", async () => {
  const { id, engagement, owner } = await createPackage();
  const realUpload = storage.uploadEphemeralSignature;
  let uploadedKey: string | undefined;
  const upload = vi
    .spyOn(storage, "uploadEphemeralSignature")
    .mockImplementation(async (...args) => {
      const result = await realUpload(...args);
      uploadedKey = result.key;
      await ctx.db
        .update(schema.engagementContractPackages)
        .set({ version: 2 })
        .where(eq(schema.engagementContractPackages.id, id));
      return result;
    });
  const deletion = vi.spyOn(storage, "deleteEphemeralSignature").mockResolvedValue(false);
  await expect(
    ContractSigningService.submitSignature({
      engagementId: engagement,
      userId: owner,
      signerName: "Client",
      role: "CLIENT",
      signatureType: "DRAWN",
      signatureDataUrl,
      legalAcknowledged: true,
      expectedVersion: 1,
    })
  ).rejects.toThrow("CONCURRENCY_CONFLICT");
  expect(upload).toHaveBeenCalledOnce();
  expect(deletion).toHaveBeenCalledWith(uploadedKey);
  const [job] = await ctx.db
    .select()
    .from(schema.signatureStorageJobs)
    .where(eq(schema.signatureStorageJobs.key, uploadedKey!));
  expect(job?.status).toBe("PENDING");
  expect(job?.lastError).toBe("R2_DELETE_FAILED");
  const [pkg] = await ctx.db
    .select()
    .from(schema.engagementContractPackages)
    .where(eq(schema.engagementContractPackages.id, id));
  expect(pkg?.clientSignatureR2Key).toBeNull();
});

it("does not hide a real package DB failure behind the test memory fallback", async () => {
  const { id, engagement, owner } = await createPackage();
  const upload = vi.spyOn(storage, "uploadEphemeralSignature");
  const deletion = vi.spyOn(storage, "deleteEphemeralSignature").mockResolvedValue(false);
  await ctx.pool
    .query(`CREATE FUNCTION reject_test_signature() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN IF NEW.id='${id}'::uuid AND NEW.client_signature_r2_key IS NOT NULL THEN
      RAISE EXCEPTION 'INJECTED_PACKAGE_WRITE_FAILURE'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER reject_test_signature BEFORE UPDATE ON engagement_contract_packages
    FOR EACH ROW EXECUTE FUNCTION reject_test_signature()`);
  try {
    await expect(
      ContractSigningService.submitSignature({
        engagementId: engagement,
        userId: owner,
        signerName: "Client",
        role: "CLIENT",
        signatureType: "DRAWN",
        signatureDataUrl,
        legalAcknowledged: true,
        expectedVersion: 1,
      })
    ).rejects.toThrow("İmza veritabanına kaydedilemedi");
    expect(upload).toHaveBeenCalledOnce();
    const result = await upload.mock.results[0]!.value;
    expect(deletion).toHaveBeenCalledWith(result.key);
    const [job] = await ctx.db
      .select()
      .from(schema.signatureStorageJobs)
      .where(eq(schema.signatureStorageJobs.key, result.key));
    expect(job?.status).toBe("PENDING");
    const [pkg] = await ctx.db
      .select()
      .from(schema.engagementContractPackages)
      .where(eq(schema.engagementContractPackages.id, id));
    expect(pkg?.clientSignatureR2Key).toBeNull();
  } finally {
    await ctx.pool.query(
      "DROP TRIGGER reject_test_signature ON engagement_contract_packages; DROP FUNCTION reject_test_signature()"
    );
  }
});

it("serializes separate-key completion behind the package lock and marks cleanup in the same round", async () => {
  const { id, engagement } = await createPackage();
  const keys = ["client", "contractor"].map(
    (role) => `ephemeral-signatures/${engagement}/${role}.webp`
  );
  for (const key of keys) await registerSignatureUpload(key, engagement);
  await ctx.db
    .update(schema.engagementContractPackages)
    .set({
      clientSignatureR2Key: keys[0],
      freelancerSignatureR2Key: keys[1],
      status: "FULLY_SIGNED",
      version: 2,
    })
    .where(eq(schema.engagementContractPackages.id, id));
  const deletion = vi.spyOn(storage, "deleteEphemeralSignature").mockResolvedValue(true);
  const blocker = await ctx.pool.connect();
  await blocker.query("BEGIN");
  await blocker.query("SELECT id FROM engagement_contract_packages WHERE id=$1 FOR UPDATE", [id]);
  const workers = keys.map((key) => processSignatureStorageJobs(1, [key]));
  try {
    await vi.waitFor(() => expect(deletion).toHaveBeenCalledTimes(2));
    // Both workers must wait before updating their job state, so their later
    // completion snapshots can observe the other worker's committed deletion.
    await vi.waitFor(async () => {
      const waiting = await ctx.pool.query<{ count: number }>(`SELECT count(*)::int AS count
        FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'
        AND query LIKE '%engagement_contract_packages%FOR UPDATE%'`);
      expect(waiting.rows[0]?.count).toBe(2);
    });
    const jobs = await ctx.db
      .select()
      .from(schema.signatureStorageJobs)
      .where(inArray(schema.signatureStorageJobs.key, keys));
    expect(jobs.every((job) => job.status === "PROCESSING")).toBe(true);
  } finally {
    await blocker.query("ROLLBACK");
    blocker.release();
    await Promise.all(workers);
  }
  const [pkg] = await ctx.db
    .select()
    .from(schema.engagementContractPackages)
    .where(eq(schema.engagementContractPackages.id, id));
  expect(pkg?.ephemeralCleanedAt).toBeInstanceOf(Date);
});
it("attaches atomically, preserves active signatures and records full cleanup only after every deletion", async () => {
  const { id, engagement } = await createPackage();
  const a = `ephemeral-signatures/${engagement}/client.webp`,
    b = `ephemeral-signatures/${engagement}/contractor.webp`;
  await registerSignatureUpload(a, engagement);
  await registerSignatureUpload(b, engagement);
  await ctx.db
    .update(schema.engagementContractPackages)
    .set({
      clientSignatureR2Key: a,
      freelancerSignatureR2Key: b,
      status: "PARTIALLY_SIGNED",
      version: 2,
    })
    .where(eq(schema.engagementContractPackages.id, id));
  const deletion = vi.spyOn(storage, "deleteEphemeralSignature").mockResolvedValue(true);
  await requestSignatureCleanup([a, b]);
  expect(deletion).not.toHaveBeenCalled();
  await ctx.db
    .update(schema.engagementContractPackages)
    .set({ status: "FULLY_SIGNED", version: 3 })
    .where(eq(schema.engagementContractPackages.id, id));
  deletion.mockImplementation(async (key) => key === a);
  await processSignatureStorageJobs(25, [a, b]);
  let [pkg] = await ctx.db
    .select()
    .from(schema.engagementContractPackages)
    .where(eq(schema.engagementContractPackages.id, id));
  expect(pkg?.ephemeralCleanedAt).toBeNull();
  await ctx.db
    .update(schema.signatureStorageJobs)
    .set({ nextAttemptAt: new Date(0) })
    .where(eq(schema.signatureStorageJobs.key, b));
  deletion.mockResolvedValue(true);
  await processSignatureStorageJobs(25, [b]);
  [pkg] = await ctx.db
    .select()
    .from(schema.engagementContractPackages)
    .where(eq(schema.engagementContractPackages.id, id));
  expect(pkg?.ephemeralCleanedAt).toBeInstanceOf(Date);
});
it("rejects attaching an already claimed orphan and rolls back the package update", async () => {
  const { id, engagement } = await createPackage();
  const key = `ephemeral-signatures/${engagement}/expired.webp`;
  await registerSignatureUpload(key, engagement);
  await ctx.db
    .update(schema.signatureStorageJobs)
    .set({ status: "PROCESSING" })
    .where(eq(schema.signatureStorageJobs.key, key));
  await expect(
    ctx.db
      .update(schema.engagementContractPackages)
      .set({ clientSignatureR2Key: key, version: 2 })
      .where(eq(schema.engagementContractPackages.id, id))
  ).rejects.toThrow();
  const [pkg] = await ctx.db
    .select()
    .from(schema.engagementContractPackages)
    .where(eq(schema.engagementContractPackages.id, id));
  expect(pkg?.clientSignatureR2Key).toBeNull();
  expect(pkg?.version).toBe(1);
});
it("retains failed keys across retries and claims once across concurrent workers", async () => {
  const engagement = randomUUID(),
    a = `ephemeral-signatures/${engagement}/a.webp`,
    b = `ephemeral-signatures/${engagement}/b.webp`;
  await registerSignatureUpload(a, engagement);
  await registerSignatureUpload(b, engagement);
  const deletion = vi
    .spyOn(storage, "deleteEphemeralSignature")
    .mockImplementation(async (key) => key === a);
  expect(await requestSignatureCleanup([a, b])).toBe(1);
  let jobs = await ctx.db.select().from(schema.signatureStorageJobs);
  expect(jobs.find((j) => j.key === a)?.status).toBe("DONE");
  expect(jobs.find((j) => j.key === b)?.status).toBe("PENDING");
  await ctx.db
    .update(schema.signatureStorageJobs)
    .set({ nextAttemptAt: new Date(0) })
    .where(eq(schema.signatureStorageJobs.key, b));
  deletion.mockClear().mockResolvedValue(true);
  await Promise.all([processSignatureStorageJobs(), processSignatureStorageJobs()]);
  expect(deletion).toHaveBeenCalledTimes(1);
  jobs = await ctx.db.select().from(schema.signatureStorageJobs);
  expect(jobs.filter((j) => j.key === a || j.key === b).every((j) => j.status === "DONE")).toBe(
    true
  );
});
it("rechecks completed intents to remove a late PUT after an earlier DELETE", async () => {
  const engagement = randomUUID(),
    key = `ephemeral-signatures/${engagement}/late.webp`;
  await registerSignatureUpload(key, engagement);
  const deletion = vi.spyOn(storage, "deleteEphemeralSignature").mockResolvedValue(true);
  await requestSignatureCleanup([key]);
  await ctx.db
    .update(schema.signatureStorageJobs)
    .set({ nextAttemptAt: new Date(0) })
    .where(eq(schema.signatureStorageJobs.key, key));
  deletion.mockClear();
  await processSignatureStorageJobs();
  expect(deletion).toHaveBeenCalledWith(key);
});

it("does not finalize a deletion after its lease expires and retries it idempotently", async () => {
  const engagement = randomUUID(),
    key = `ephemeral-signatures/${engagement}/lost-lease.webp`;
  await registerSignatureUpload(key, engagement);
  await ctx.db
    .update(schema.signatureStorageJobs)
    .set({ nextAttemptAt: new Date(0) })
    .where(eq(schema.signatureStorageJobs.key, key));
  let resolveDeletion!: (value: boolean) => void;
  const deletionResult = new Promise<boolean>((resolve) => {
    resolveDeletion = resolve;
  });
  const deletion = vi
    .spyOn(storage, "deleteEphemeralSignature")
    .mockReturnValueOnce(deletionResult)
    .mockResolvedValue(true);
  const worker = processSignatureStorageJobs(1, [key]);
  await vi.waitFor(() => expect(deletion).toHaveBeenCalledOnce());
  await ctx.db
    .update(schema.signatureStorageJobs)
    .set({ leaseUntil: new Date(0) })
    .where(eq(schema.signatureStorageJobs.key, key));
  resolveDeletion(true);
  expect(await worker).toBe(0);
  const [job] = await ctx.db
    .select()
    .from(schema.signatureStorageJobs)
    .where(eq(schema.signatureStorageJobs.key, key));
  expect(job?.status).toBe("PROCESSING");
  expect(await processSignatureStorageJobs(1, [key])).toBe(1);
  expect(deletion).toHaveBeenCalledTimes(2);
});

it("uses the current database clock when a package lock delays completion past lease expiry", async () => {
  const { id, engagement } = await createPackage();
  const key = `ephemeral-signatures/${engagement}/blocked-lease.webp`;
  await registerSignatureUpload(key, engagement);
  await ctx.db
    .update(schema.engagementContractPackages)
    .set({
      clientSignatureR2Key: key,
      status: "FULLY_SIGNED",
      version: 2,
    })
    .where(eq(schema.engagementContractPackages.id, id));
  vi.spyOn(storage, "deleteEphemeralSignature").mockResolvedValue(true);
  const blocker = await ctx.pool.connect();
  await blocker.query("BEGIN");
  await blocker.query("SELECT id FROM engagement_contract_packages WHERE id=$1 FOR UPDATE", [id]);
  const worker = processSignatureStorageJobs(1, [key]);
  try {
    await vi.waitFor(async () => {
      const waiting = await ctx.pool.query<{ count: number }>(`SELECT count(*)::int AS count
        FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'
        AND query LIKE '%engagement_contract_packages%FOR UPDATE%'`);
      expect(waiting.rows[0]?.count).toBe(1);
    });
    await ctx.pool.query(
      "UPDATE signature_storage_jobs SET lease_until=clock_timestamp()+interval '50 milliseconds' WHERE key=$1",
      [key]
    );
    await vi.waitFor(async () => {
      const expired = await ctx.pool.query<{ expired: boolean }>(
        "SELECT lease_until < clock_timestamp() AS expired FROM signature_storage_jobs WHERE key=$1",
        [key]
      );
      expect(expired.rows[0]?.expired).toBe(true);
    });
  } finally {
    await blocker.query("ROLLBACK");
    blocker.release();
  }
  expect(await worker).toBe(0);
  const [pkg] = await ctx.db
    .select()
    .from(schema.engagementContractPackages)
    .where(eq(schema.engagementContractPackages.id, id));
  expect(pkg?.ephemeralCleanedAt).toBeNull();
  expect(await processSignatureStorageJobs(1, [key])).toBe(1);
});

it("retries an idempotent storage deletion when persisting its success fails", async () => {
  const engagement = randomUUID(),
    key = `ephemeral-signatures/${engagement}/db-after-delete.webp`;
  await registerSignatureUpload(key, engagement);
  await ctx.db
    .update(schema.signatureStorageJobs)
    .set({ nextAttemptAt: new Date(0) })
    .where(eq(schema.signatureStorageJobs.key, key));
  const deletion = vi.spyOn(storage, "deleteEphemeralSignature").mockResolvedValue(true);
  await ctx.pool
    .query(`CREATE FUNCTION reject_test_cleanup_commit() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN IF NEW.engagement_id='${engagement}'::uuid AND NEW.status='DONE' THEN
      RAISE EXCEPTION 'INJECTED_CLEANUP_COMMIT_FAILURE'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER reject_test_cleanup_commit BEFORE UPDATE ON signature_storage_jobs
    FOR EACH ROW EXECUTE FUNCTION reject_test_cleanup_commit()`);
  try {
    await expect(processSignatureStorageJobs(1, [key])).rejects.toThrow();
    expect(deletion).toHaveBeenCalledWith(key);
    const [job] = await ctx.db
      .select()
      .from(schema.signatureStorageJobs)
      .where(eq(schema.signatureStorageJobs.key, key));
    expect(job?.status).toBe("PROCESSING");
    expect(job?.leaseToken).toBeTruthy();
  } finally {
    await ctx.pool.query(
      "DROP TRIGGER reject_test_cleanup_commit ON signature_storage_jobs; DROP FUNCTION reject_test_cleanup_commit()"
    );
  }
  await ctx.db
    .update(schema.signatureStorageJobs)
    .set({ leaseUntil: new Date(0) })
    .where(eq(schema.signatureStorageJobs.key, key));
  expect(await processSignatureStorageJobs(1, [key])).toBe(1);
  expect(deletion).toHaveBeenCalledTimes(2);
});
