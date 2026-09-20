# Build Manifest & Runtime Baseline

**Document status:** Implementation baseline  
**Date:** 2026-09-06  
**Project:** Freelance Platform (Turkey / Global Tech Marketplace)  
**Governing Specification:** `FREELANCE_PLATFORM_MASTER_SPEC.md`  

---

## 1. Runtime & Environment

| Component | Target in Master Spec | Resolved Version | Verification |
|---|---|---|---|
| OS | Windows 11 / Server | Windows 10/11 x64 | Verified native PowerShell shell |
| Node.js | 24.20.x LTS line | v24.19.0 (Node 24 LTS) | `node -v` -> `v24.19.0` |
| Package Manager | pnpm | 12.3.4 | `pnpm -v` -> `12.3.4` |
| npm | Supporting CLI | 11.17.0 | `npm -v` -> `11.17.0` |
| PostgreSQL | PostgreSQL 18.6 | 18.6 | `initdb (PostgreSQL) 18.6` installed |
| Git | Standard VCS | 2.55.0.windows.3 | `git --version` -> `2.55.0.windows.3` |

---

## 2. Core Dependencies & Framework Architecture

- **Web Framework:** Next.js `16.3.3` (App Router, Server Actions, Server Components)
- **UI Runtime:** React `19.2.x`
- **Language:** TypeScript 5.8+ in strict mode
- **Styling:** Tailwind CSS + custom semantic CSS variable design tokens
- **Database ORM:** Drizzle ORM + PostgreSQL client (`pg` / `postgres`) + explicit SQL migrations
- **i18n:** `next-intl` (deterministic `/tr` and `/en` routing)
- **Validation:** Zod (centralized domain schemas, Unicode NFC, emoji prohibition)
- **Cryptography:** Node.js native `node:crypto` (Argon2 / scrypt, AES-256-GCM for PII, HMAC-SHA256 blind index)
- **Testing:**
  - Vitest (Unit & Integration tests)
  - Playwright (End-to-End browser journeys)
  - axe-core (Automated WCAG 2.2 AA accessibility audit)
- **Icons:** SVG-only Lucide outline icons + custom scalable SVG brand logo (zero emojis, zero raster graphics)
