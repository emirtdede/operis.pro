import { getDb, schema } from "../src/lib/db";
import { and, eq, or } from "drizzle-orm";
import { listEphemeralSignatureObjects } from "../src/modules/storage/r2-client";

// Read-only by default. --enqueue records verified orphan candidates; deletion is
// still performed by the fenced worker, which rechecks package references.
const enqueue = process.argv.includes("--enqueue");
let token: string | undefined;
let candidates = 0;
const db = getDb();
do {
  const page = await listEphemeralSignatureObjects(token);
  for (const item of page.objects) {
    const match = /^ephemeral-signatures\/([0-9a-f-]{36})\/[^/]+\.webp$/i.exec(item.key || "");
    if (
      !item.key ||
      !match?.[1] ||
      !item.modifiedAt ||
      item.modifiedAt.getTime() > Date.now() - 86400000
    )
      continue;
    const [reference] = await db
      .select({ id: schema.engagementContractPackages.id })
      .from(schema.engagementContractPackages)
      .where(
        or(
          eq(schema.engagementContractPackages.clientSignatureR2Key, item.key),
          eq(schema.engagementContractPackages.freelancerSignatureR2Key, item.key)
        )
      )
      .limit(1);
    const [job] = await db
      .select({ key: schema.signatureStorageJobs.key })
      .from(schema.signatureStorageJobs)
      .where(and(eq(schema.signatureStorageJobs.key, item.key)))
      .limit(1);
    if (reference || job) continue;
    candidates++;
    console.info(
      JSON.stringify({
        key: item.key,
        modifiedAt: item.modifiedAt,
        action: enqueue ? "enqueue" : "candidate",
      })
    );
    if (enqueue)
      await db
        .insert(schema.signatureStorageJobs)
        .values({ key: item.key, engagementId: match[1], status: "PENDING" })
        .onConflictDoNothing();
  }
  token = page.nextToken;
} while (token);
console.info(JSON.stringify({ candidates, enqueue }));
