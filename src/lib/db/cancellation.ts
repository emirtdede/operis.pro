import pg from "pg";
import { getEnv } from "@/src/config/env";
import { getDbSslConfig } from "./index";

/**
 * Dedicated cancellation and connection lifecycle manager.
 *
 * Guarantees:
 * 1. Cancel commands NEVER borrow from the application/worker/reader pool,
 *    preventing deadlocks when pools are at capacity (e.g. max: 1).
 * 2. Cancel commands have a dedicated strict timeout (default: 2000ms).
 * 3. Connection acquisition is strictly bounded by a deadline and AbortSignal.
 * 4. Late-completing pool.connect() operations never leak connections.
 * 5. Tainted or aborted client connections are safely destroyed and dropped from the pool.
 */

/**
 * Safely destroy and release a tainted or aborted pool client.
 * Idempotent: Destroys the underlying TCP socket immediately to guarantee the PostgreSQL
 * server terminates the backend query and rolls back uncommitted transactions,
 * while preventing unhandled error events in Node.js.
 */
export function terminateClientSafely(client: pg.PoolClient): void {
  if (!client) return;
  const clientObj = client as unknown as {
    _terminatedSafely?: boolean;
    connection?: { stream?: { destroy: () => void } };
  };
  if (clientObj._terminatedSafely) return;
  clientObj._terminatedSafely = true;

  try {
    // Attach error listener to avoid unhandled error crash when socket is destroyed
    client.on("error", () => {});
  } catch {
    // ignore
  }

  try {
    if (clientObj.connection?.stream && typeof clientObj.connection.stream.destroy === "function") {
      clientObj.connection.stream.destroy();
    }
  } catch {
    // ignore
  }

  try {
    // release(true) instructs pg-pool to discard this client instance
    client.release(true);
  } catch {
    // ignore
  }
}

let activeControlClients = 0;
const MAX_CONCURRENT_CONTROL_CLIENTS = 5;

export interface CancelBackendOptions {
  pool?: pg.Pool;
  client?: pg.PoolClient;
  connectionString?: string;
  timeoutMs?: number;
}

/**
 * Execute pg_cancel_backend on a target backend PID using a dedicated,
 * independent PostgreSQL client that NEVER borrows from the worker/job pool.
 * Targets the exact same PostgreSQL server as the target pool/client.
 * Checks the boolean 'cancelled' result column from PostgreSQL.
 */
export async function cancelBackendPid(
  pid: number,
  options?: CancelBackendOptions
): Promise<boolean> {
  if (!pid || pid <= 0) return false;

  // 1. Guard against control connection exhaustion under bursts of aborts
  if (activeControlClients >= MAX_CONCURRENT_CONTROL_CLIENTS) {
    return false;
  }

  const timeoutMs = options?.timeoutMs ?? 1500;
  let clientConfig: pg.ClientConfig | string;

  if (options?.connectionString) {
    clientConfig = options.connectionString;
  } else if (options?.client) {
    const cp = (options.client as unknown as { connectionParameters?: Record<string, unknown> })
      ?.connectionParameters;
    const poolOpts = (
      options.client as unknown as {
        _pool?: { options?: Record<string, unknown> & { connectionString?: string } };
      }
    )?._pool?.options;

    if (poolOpts?.connectionString) {
      clientConfig = poolOpts.connectionString;
    } else if (cp && typeof cp === "object") {
      // NOTE: node_modules/pg/lib/connection-parameters.js defines `password` with enumerable: false!
      // Object spreading ({ ...cp }) drops password! Explicitly extract and forward password:
      const password =
        (cp.password as string | undefined) ??
        (poolOpts?.password as string | undefined) ??
        ((poolOpts?.connectionParameters as Record<string, unknown> | undefined)?.password as
          string | undefined);

      clientConfig = {
        user: cp.user as string | undefined,
        database: cp.database as string | undefined,
        host: cp.host as string | undefined,
        port: cp.port as number | undefined,
        ssl: cp.ssl as pg.ClientConfig["ssl"],
        password,
        connectionTimeoutMillis: timeoutMs,
      };
    } else if (poolOpts && typeof poolOpts === "object") {
      const password =
        (poolOpts.password as string | undefined) ??
        ((poolOpts.connectionParameters as Record<string, unknown> | undefined)?.password as
          string | undefined);

      clientConfig = {
        user: poolOpts.user as string | undefined,
        database: poolOpts.database as string | undefined,
        host: poolOpts.host as string | undefined,
        port: poolOpts.port as number | undefined,
        ssl: poolOpts.ssl as pg.ClientConfig["ssl"],
        password,
        connectionTimeoutMillis: timeoutMs,
      };
    } else {
      // Fail closed: Do NOT fallback to global DB when client override was explicitly specified
      return false;
    }
  } else if (options?.pool) {
    const poolOpts = (
      options.pool as unknown as {
        options?: Record<string, unknown> & { connectionString?: string };
      }
    )?.options;

    if (poolOpts?.connectionString) {
      clientConfig = poolOpts.connectionString;
    } else if (poolOpts && typeof poolOpts === "object") {
      const password =
        (poolOpts.password as string | undefined) ??
        ((poolOpts.connectionParameters as Record<string, unknown> | undefined)?.password as
          string | undefined);

      clientConfig = {
        user: poolOpts.user as string | undefined,
        database: poolOpts.database as string | undefined,
        host: poolOpts.host as string | undefined,
        port: poolOpts.port as number | undefined,
        ssl: poolOpts.ssl as pg.ClientConfig["ssl"],
        password,
        connectionTimeoutMillis: timeoutMs,
      };
    } else {
      // Fail closed: Do NOT fallback to global DB when pool override was explicitly specified
      return false;
    }
  } else {
    clientConfig = getEnv().DATABASE_URL;
  }

  const sslConfig =
    typeof clientConfig === "string"
      ? getDbSslConfig(clientConfig)
      : clientConfig.host
        ? getDbSslConfig(clientConfig.host)
        : clientConfig.ssl;

  const controlClient =
    typeof clientConfig === "string"
      ? new pg.Client({
          connectionString: clientConfig,
          connectionTimeoutMillis: timeoutMs,
          ssl: sslConfig,
        })
      : new pg.Client({
          ...clientConfig,
          connectionTimeoutMillis: timeoutMs,
          ssl: sslConfig,
        });

  activeControlClients++;
  let controlClientEnded = false;
  const safelyCloseControlClient = async () => {
    if (controlClientEnded) return;
    controlClientEnded = true;
    try {
      const stream = (
        controlClient as unknown as { connection?: { stream?: { destroy: () => void } } }
      )?.connection?.stream;
      if (stream && typeof stream.destroy === "function") {
        stream.destroy();
      }
    } catch {
      // ignore
    }
    await controlClient.end().catch(() => {});
  };

  let timer: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });

  try {
    const cancelResult = await Promise.race([
      (async () => {
        try {
          await controlClient.connect();
          const res = await controlClient.query<{ cancelled: boolean }>(
            "SELECT pg_cancel_backend($1) AS cancelled;",
            [pid]
          );
          return res.rows[0]?.cancelled === true;
        } finally {
          await safelyCloseControlClient();
        }
      })(),
      timeoutPromise,
    ]);

    if (cancelResult !== true) {
      // Timeout won or query returned false -> terminate socket immediately
      await safelyCloseControlClient();
    }
    return cancelResult === true;
  } catch {
    await safelyCloseControlClient();
    return false;
  } finally {
    if (timer) clearTimeout(timer);
    await safelyCloseControlClient();
    activeControlClients--;
  }
}

/**
 * Acquire a client from the given pool within a strict deadline and AbortSignal.
 * If acquisition times out or is aborted, the late-completing connection is
 * immediately released back to the pool to prevent leaks.
 */
export async function acquireClientWithDeadline(
  pool: pg.Pool,
  deadlineMs: number,
  signal?: AbortSignal
): Promise<pg.PoolClient> {
  if (signal?.aborted) {
    throw new Error("ACQUISITION_ABORTED");
  }

  let timedOutOrAborted = false;
  let clientAcquired: pg.PoolClient | null = null;
  let timer: NodeJS.Timeout | null = null;
  let abortListener: (() => void) | null = null;

  const connectPromise = pool.connect().then((c) => {
    if (timedOutOrAborted) {
      // Caller already timed out or aborted — release immediately so it does not leak!
      try {
        c.release();
      } catch {
        // ignore
      }
      return null as unknown as pg.PoolClient;
    }
    clientAcquired = c;
    return c;
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOutOrAborted = true;
      reject(new Error("CONNECTION_ACQUISITION_TIMEOUT"));
    }, deadlineMs);
  });

  const abortPromise = new Promise<never>((_, reject) => {
    if (signal) {
      abortListener = () => {
        timedOutOrAborted = true;
        reject(new Error("ACQUISITION_ABORTED"));
      };
      signal.addEventListener("abort", abortListener, { once: true });
    }
  });

  try {
    const client = await Promise.race([connectPromise, timeoutPromise, abortPromise]);
    return client;
  } catch (err) {
    timedOutOrAborted = true;
    if (clientAcquired) {
      try {
        (clientAcquired as pg.PoolClient).release();
      } catch {
        // ignore
      }
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
    if (signal && abortListener) {
      signal.removeEventListener("abort", abortListener);
    }
  }
}
