import { assertSafeE2ETestEnvironment } from "../tests/helpers/test-database";
import { getDb, getDbPool, schema } from "../src/lib/db";
import { hashPassword } from "../src/lib/crypto";
import { SEED_USERS } from "../db/seeds/users";

// Never use the general demo dataset (which may reference stale listings) for auth tests.
assertSafeE2ETestEnvironment();
try {
  const db = getDb();
  for (const user of SEED_USERS.filter((u) =>
    ["kullanici@operis.pro", "freelancer@operis.pro"].includes(u.email)
  )) {
    await db.insert(schema.users).values({
      id: user.id,
      email: user.email,
      passwordHash: await hashPassword(user.passwordPlain),
      emailVerified: true,
      role: "USER",
      status: "ACTIVE",
      twoFactorEnabled: false,
    });
    await db.insert(schema.profiles).values({ userId: user.id, ...user.profile });
  }
} finally {
  await getDbPool().end();
}
