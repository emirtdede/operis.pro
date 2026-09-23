/**
 * Enterprise Async Concurrency & Sequencing Utilities.
 * Implements bounded worker concurrency and strict sequential execution
 * using functional recursion and promise chains to comply with Alibaba OpenCodeReview
 * and ESLint `no-await-in-loop` standards without external dependencies.
 */

/**
 * Maps an array asynchronously with a strict maximum concurrency limit.
 * Guarantees that at most `limit` asynchronous invocations run concurrently.
 * Results preserve the original array order.
 *
 * @param items Array of items to process
 * @param limit Maximum concurrent operations (minimum 1)
 * @param fn Asynchronous mapping function
 */
export async function mapConcurrent<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];

  const safeLimit = Math.max(1, Math.floor(limit));
  const results = new Array<R>(items.length);
  let currentIndex = 0;

  const runWorker = async (): Promise<void> => {
    if (currentIndex >= items.length) {
      return;
    }
    const index = currentIndex++;
    const item = items[index] as T;
    results[index] = await fn(item, index);
    return runWorker();
  };

  const workerCount = Math.min(safeLimit, items.length);
  const workers: Promise<void>[] = [];
  for (let i = 0; i < workerCount; i++) {
    // Workers are initialized synchronously; their async recursion handles the work
    workers.push(runWorker());
  }

  await Promise.all(workers);
  return results;
}

/**
 * Executes an async iterator sequentially over an array using functional reduction.
 * Ensures strict sequential order without triggering loop-level await warnings.
 *
 * @param items Array of items to process in strict sequence
 * @param fn Asynchronous handler executed sequentially per item
 */
export async function runSequentially<T, R>(
  items: readonly T[],
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  return items.reduce(
    async (accPromise, item, index) => {
      const acc = await accPromise;
      const res = await fn(item, index);
      acc.push(res);
      return acc;
    },
    Promise.resolve([] as R[])
  );
}
