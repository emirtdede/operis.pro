import { expect, it } from "vitest";
import { createRequire } from "node:module";
import { mkdtempSync, writeFileSync, readFileSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

it("rejects a corrupted Next manifest without modifying the deployment artifact", () => {
  const require = createRequire(import.meta.url);
  const { loadManifest } = require("next/dist/server/load-manifest.external.js") as {
    loadManifest(path: string, shouldCache: boolean): unknown;
  };
  const folder = mkdtempSync(join(tmpdir(), "operis-manifest-test-"));
  const file = join(folder, "manifest.json");
  const corrupted = '{"routes":{}}trailing-corruption';
  try {
    writeFileSync(file, corrupted);
    expect(() => loadManifest(file, false)).toThrow();
    expect(readFileSync(file, "utf8")).toBe(corrupted);
  } finally {
    unlinkSync(file);
    rmdirSync(folder);
  }
});
