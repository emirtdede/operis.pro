import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const dotNextPath = path.join(process.cwd(), ".next");

console.info("🧹 Cleaning .next directory to prevent manifest cache corruptions...");
if (fs.existsSync(dotNextPath)) {
  try {
    fs.rmSync(dotNextPath, { recursive: true, force: true });
    console.info("✅ .next build cache successfully removed.");
  } catch (err) {
    console.warn("⚠️ Could not remove .next directory (some files may be locked):", err);
  }
} else {
  console.info("ℹ️ .next directory does not exist, starting fresh.");
}

console.info("🚀 Starting Next.js dev server on port 8000...");

const child = spawn(
  process.execPath,
  ["--max-old-space-size=4096", "./node_modules/next/dist/bin/next", "dev", "--webpack", "-p", "8000"],
  {
    stdio: "inherit",
    env: process.env,
    shell: true,
  }
);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
