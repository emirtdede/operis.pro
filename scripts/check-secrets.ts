import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const FORBIDDEN_SECRET_PATTERNS = [
  { name: "Resend Live API Key", regex: /re_[a-zA-Z0-9_]{20,}/g },
  { name: "Stripe Live Secret Key", regex: /(sk_live|rk_live)_[a-zA-Z0-9]{20,}/g },
  { name: "GitHub Access Token", regex: /(ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{20,}/g },
  { name: "Slack Secret Token", regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/g },
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/g },
  { name: "Private RSA/SSH/EC Key", regex: /-----BEGIN (RSA|OPENSSH|EC|PGP|PRIVATE) KEY-----/g },
  { name: "Clerk Live Secret Key", regex: /sk_live_[a-zA-Z0-9_]{20,}/g },
  { name: "Upstash Redis Token", regex: /AX[a-zA-Z0-9_]{30,}/g },
  { name: "Google OAuth Client Secret", regex: /GOCSPX-[a-zA-Z0-9_-]{28,}/g },
  { name: "Google API Key", regex: /AIza[0-9A-Za-z-_]{35}/g },
];

const ALLOWED_TEST_PREFIXES = [
  "re_test_",
  "re_stub_",
  "re_local_",
  "re_ci_",
  "sk_test_",
  "pk_test_",
  "whsec_test_",
  "AKIAIOSFODNN7EXAMPLE",
];

const SCAN_DIRS = [
  "src",
  "scripts",
  "tests",
  "db",
  "deploy",
  "public",
  "i18n",
  "messages",
  ".github",
];

function scanDirectory(dir: string): string[] {
  const violations: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".next" &&
        entry.name !== "coverage" &&
        entry.name !== ".vercel" &&
        entry.name !== ".git" &&
        entry.name !== "test-results"
      ) {
        violations.push(...scanDirectory(fullPath));
      }
    } else if (entry.isFile() && /\.(ts|tsx|js|mjs|json|md|yml|yaml)$/.test(entry.name)) {
      if (entry.name === "check-secrets.ts") continue;
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const { name, regex } of FORBIDDEN_SECRET_PATTERNS) {
        const matches = content.match(regex);
        if (matches) {
          for (const match of matches) {
            const isAllowedStub = ALLOWED_TEST_PREFIXES.some((prefix) => match.startsWith(prefix));
            if (!isAllowedStub) {
              violations.push(
                `[${name}] ${fullPath}: hardcoded gizli anahtar bulundu (${match.slice(0, 7)}...)`
              );
            }
          }
        }
      }
    }
  }

  return violations;
}

const rootDir = process.cwd();
const allViolations: string[] = [];

// 1. Scan subdirectories
for (const dir of SCAN_DIRS) {
  const targetDir = path.join(rootDir, dir);
  if (fs.existsSync(targetDir)) {
    allViolations.push(...scanDirectory(targetDir));
  }
}

// 2. Scan root configuration files
const rootFiles = fs.readdirSync(rootDir, { withFileTypes: true });
const IGNORED_ROOT_FILES = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock"];

for (const entry of rootFiles) {
  if (
    entry.isFile() &&
    !IGNORED_ROOT_FILES.includes(entry.name) &&
    /\.(ts|tsx|js|mjs|json|md|ya?ml)$/.test(entry.name)
  ) {
    const fullPath = path.join(rootDir, entry.name);
    const content = fs.readFileSync(fullPath, "utf-8");
    for (const { name, regex } of FORBIDDEN_SECRET_PATTERNS) {
      const matches = content.match(regex);
      if (matches) {
        for (const match of matches) {
          const isAllowedStub = ALLOWED_TEST_PREFIXES.some((prefix) => match.startsWith(prefix));
          if (!isAllowedStub) {
            allViolations.push(
              `[${name}] ${fullPath}: hardcoded gizli anahtar bulundu (${match.slice(0, 7)}...)`
            );
          }
        }
      }
    }
  }
}

// 3. Verify that git does not track any real .env files
try {
  const trackedEnvFiles = execSync('git ls-files ".env*"', { encoding: "utf-8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const envFile of trackedEnvFiles) {
    if (envFile !== ".env.example") {
      allViolations.push(
        `[GIT TRACKING HATASI] ${envFile} dosyası git tarafından takip ediliyor! Yalnızca .env.example versiyonlanabilir.`
      );
    }
  }
} catch {
  // Git komutu başarısız olursa atla
}

if (allViolations.length > 0) {
  console.error("\n❌ GÜVENLİK İHLALİ: Kod tabanında sızdırılmış gizli anahtar tespit edildi:");
  for (const v of allViolations) {
    console.error(`  - ${v}`);
  }
  console.error(
    "\nLütfen tüm gizli anahtarları .env.local dosyasına taşıyın ve process.env üzerinden okuyun.\n"
  );
  process.exit(1);
} else {
  console.info(
    "✅ GÜVENLİK DENETİMİ BAŞARILI: Kod tabanında hiçbir hardcoded API anahtarı veya yetkisiz .env dosyası bulunamadı."
  );
}
