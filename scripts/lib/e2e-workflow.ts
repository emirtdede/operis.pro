export interface E2EResource {
  close(): Promise<void>;
}

export interface E2EWorkflowDependencies {
  provider(): Promise<E2EResource>;
  database(): Promise<E2EResource>;
  configure(): void;
  seed(signal: AbortSignal): Promise<void>;
  build(signal: AbortSignal): Promise<void>;
  test(signal: AbortSignal): Promise<number>;
  report(error: unknown): void;
}

/** The CLI and fault-injection tests execute this same orchestration. */
export async function runE2EWorkflow(
  deps: E2EWorkflowDependencies,
  signal: AbortSignal
): Promise<number> {
  const resources: E2EResource[] = [];
  let result: number;
  const check = () => signal.throwIfAborted();
  try {
    check();
    resources.push(await deps.provider());
    check();
    resources.push(await deps.database());
    check();
    deps.configure();
    await deps.seed(signal);
    check();
    // Always build the current working tree, including uncommitted changes.
    await deps.build(signal);
    check();
    result = await deps.test(signal);
    check();
  } catch (error) {
    deps.report(error);
    result = 1;
  } finally {
    const closeAll = async (list: E2EResource[]): Promise<void> => {
      const resource = list.pop();
      if (!resource) return;
      try {
        await resource.close();
      } catch (error) {
        deps.report(error);
        result = 1;
      }
      await closeAll(list);
    };
    await closeAll([...resources]);
  }
  return signal.aborted ? 1 : result;
}
