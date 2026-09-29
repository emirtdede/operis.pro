import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { createIsolatedTestDatabase, type TestDatabaseContext } from "../helpers/test-database";
import { setDbForTesting, resetDbForTesting } from "@/src/lib/db";
import * as schema from "@/db/schema";
import { notificationPubSub } from "@/src/modules/notifications/pubsub";
const identity = vi.hoisted(() => ({ userId: "" }));
vi.mock("@/src/modules/auth/session", () => ({ getSession: async () => identity }));
import { GET } from "@/src/app/api/notifications/stream/route";
import { encodeNotificationCursor } from "@/src/modules/notifications/stream-cursor";
let ctx: TestDatabaseContext;
beforeAll(async () => {
  ctx = await createIsolatedTestDatabase();
  setDbForTesting(ctx.db, ctx.pool);
  identity.userId = randomUUID();
  await ctx.db.insert(schema.users).values({
    id: identity.userId,
    email: `${identity.userId}@example.test`,
    passwordHash: "hash",
  });
}, 60000);
afterAll(async () => {
  resetDbForTesting();
  await ctx?.destroy();
});
it("delivers DB backlog before the newer local PubSub event", async () => {
  const [start] = await ctx.db
    .insert(schema.notifications)
    .values({
      userId: identity.userId,
      type: "SECURITY_EVENT",
      payloadJson: {},
      createdAt: new Date(0),
    })
    .returning();
  if (!start) throw new Error("missing cursor");
  const res = await GET(
    new Request(`http://localhost/api/notifications/stream?lastEventId=${start.id}`)
  );
  const reader = res.body!.getReader();
  try {
    await reader.read(); // connected
    const [a, b] = await ctx.db
      .insert(schema.notifications)
      .values([
        {
          userId: identity.userId,
          type: "SECURITY_EVENT",
          payloadJson: { name: "A" },
          createdAt: new Date(1000),
        },
        {
          userId: identity.userId,
          type: "SECURITY_EVENT",
          payloadJson: { name: "B" },
          createdAt: new Date(2000),
        },
      ])
      .returning();
    if (!a || !b) throw new Error("missing events");
    notificationPubSub.emitNotification(identity.userId, {
      id: b.id,
      userId: identity.userId,
      type: b.type,
      payloadJson: { name: "B" },
      readAt: null,
      createdAt: b.createdAt.toISOString(),
    });
    const frame = new TextDecoder().decode((await reader.read()).value);
    expect(frame).toContain(a.id);
  } finally {
    await reader.cancel();
  }
});
it("replays 250 equal-timestamp events over multiple pages and reconnects without skipping", async () => {
  const [counter] = await ctx.db
    .select()
    .from(schema.notificationStreamCounters)
    .where(eq(schema.notificationStreamCounters.userId, identity.userId));
  let cursor = encodeNotificationCursor(identity.userId, counter?.lastSequence || "0");
  const rows = await ctx.db
    .insert(schema.notifications)
    .values(
      Array.from({ length: 250 }, () => ({
        userId: identity.userId,
        type: "SECURITY_EVENT",
        payloadJson: {},
        createdAt: new Date(1000),
      }))
    )
    .returning();
  const received: string[] = [];
  for (const count of [117, 133]) {
    const res = await GET(
      new Request(`http://localhost/api/notifications/stream?lastEventId=${cursor}`)
    );
    const reader = res.body!.getReader();
    try {
      await reader.read();
      for (let i = 0; i < count; i++) {
        const frame = new TextDecoder().decode((await reader.read()).value);
        cursor = /^id: (.+)$/m.exec(frame)?.[1] || "";
        const payload = JSON.parse(/^data: (.+)$/m.exec(frame)?.[1] || "{}");
        received.push(payload.id);
      }
    } finally {
      await reader.cancel();
    }
  }
  expect(received).toEqual(rows.map((r) => r.id));
  expect(new Set(received).size).toBe(250);
});
it("serializes another process behind an uncommitted same-user insert", async () => {
  const client = await ctx.pool.connect();
  const child = spawn(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import pg from 'pg'; const c=new pg.Client({connectionString:process.env.TEST_CHILD_DB});await c.connect();
    console.log('ready');process.stdin.once('data',async()=>{
      const r=await c.query("insert into notifications(user_id,type,payload_json,created_at) values($1,'SECURITY_EVENT','{}','1970-01-01') returning stream_sequence",[process.env.TEST_CHILD_USER]);
      console.log(r.rows[0].stream_sequence);await c.end();process.stdin.destroy();
    });
  `,
    ],
    {
      env: {
        ...process.env,
        TEST_CHILD_DB: ctx.connectionString,
        TEST_CHILD_USER: identity.userId,
      },
      stdio: ["pipe", "pipe", "pipe"],
    }
  );
  try {
    await once(child.stdout!, "data");
    await client.query("BEGIN");
    const a = await client.query(
      "insert into notifications(user_id,type,payload_json) values($1,'SECURITY_EVENT','{}') returning stream_sequence",
      [identity.userId]
    );
    const output = once(child.stdout!, "data");
    child.stdin!.write("insert\n");
    // Wait until PostgreSQL reports the second writer waiting on the counter lock.
    let blocked = false;
    for (let i = 0; i < 100; i++) {
      const result = await ctx.pool.query(
        "select 1 from pg_stat_activity where datname=current_database() and wait_event_type='Lock'"
      );
      if (result.rowCount) {
        blocked = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(blocked).toBe(true);
    await client.query("COMMIT");
    const [data] = await output;
    expect(BigInt(String(data).trim())).toBe(BigInt(a.rows[0].stream_sequence) + 1n);
  } finally {
    await client.query("ROLLBACK");
    client.release();
    child.kill();
  }
});
it("rejects foreign and future cursors", async () => {
  for (const cursor of [
    "-".repeat(36),
    encodeNotificationCursor(randomUUID(), "1"),
    encodeNotificationCursor(identity.userId, "9223372036854775807"),
  ]) {
    expect(
      (await GET(new Request(`http://localhost/api/notifications/stream?lastEventId=${cursor}`)))
        .status
    ).toBe(400);
  }
});

it("does not consume a sequence for a rolled-back insert or duplicate delivery", async () => {
  const client = await ctx.pool.connect();
  try {
    await client.query("BEGIN");
    const aborted = await client.query(
      "INSERT INTO notifications(user_id,type,payload_json) VALUES($1,'SECURITY_EVENT','{}') RETURNING stream_sequence",
      [identity.userId]
    );
    await client.query("ROLLBACK");
    const deliveryKey = randomUUID();
    const values = {
      userId: identity.userId,
      type: "SECURITY_EVENT",
      payloadJson: {},
      deliveryKey,
    };
    const [committed] = await ctx.db.insert(schema.notifications).values(values).returning();
    if (!committed) throw new Error("missing committed notification");
    expect(committed.streamSequence).toBe(aborted.rows[0].stream_sequence);
    expect(
      await ctx.db.insert(schema.notifications).values(values).onConflictDoNothing().returning()
    ).toEqual([]);
    const [counter] = await ctx.db
      .select()
      .from(schema.notificationStreamCounters)
      .where(eq(schema.notificationStreamCounters.userId, identity.userId));
    if (!counter) throw new Error("missing stream counter");
    expect(counter.lastSequence).toBe(committed.streamSequence);
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
});

it("retries a failed DB drain without skipping the backlog and removes listeners on abort", async () => {
  const channel = `user:${identity.userId}:notification`;
  const listeners = notificationPubSub.listenerCount(channel);
  const controller = new AbortController();
  const failedRead = vi.spyOn(ctx.db, "select").mockImplementationOnce(() => {
    throw new Error("injected read outage");
  });
  const res = await GET(
    new Request("http://localhost/api/notifications/stream", { signal: controller.signal })
  );
  const reader = res.body!.getReader();
  try {
    expect(new TextDecoder().decode((await reader.read()).value)).toContain("event: connected");
    expect(new TextDecoder().decode((await reader.read()).value)).toContain("event: retry");
    failedRead.mockRestore();
    const [first] = await ctx.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, identity.userId))
      .orderBy(schema.notifications.streamSequence)
      .limit(1);
    if (!first) throw new Error("missing backlog notification");
    notificationPubSub.emitNotification(identity.userId, {
      id: randomUUID(),
      userId: identity.userId,
      type: "SECURITY_EVENT",
      payloadJson: {},
      readAt: null,
      createdAt: new Date().toISOString(),
    });
    expect(new TextDecoder().decode((await reader.read()).value)).toContain(first.id);
    expect(notificationPubSub.listenerCount(channel)).toBe(listeners + 1);
    controller.abort();
    expect(notificationPubSub.listenerCount(channel)).toBe(listeners);
  } finally {
    failedRead.mockRestore();
    controller.abort();
    await reader.cancel();
  }
});
