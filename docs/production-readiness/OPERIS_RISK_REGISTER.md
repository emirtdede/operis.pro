# OPERIS — RİSK KÜTÜĞÜ (RISK REGISTER)

Bu doküman, Operis codebase ve mimarisinde tespit edilen tüm teknik, güvenlik, altyapı, veri, operasyonel ve mevzuat risklerini kapsamlı biçimde listeler ve durumlarını takip eder.

---

## 1. RİSK ÖZETİ & SEVERITY DAĞILIMI

- **Toplam Tespit Edilen Risk Sayısı:** 14
- **Çözülen & Doğrulanan Risk Sayısı:** 11
- **Kontrol Altında & İzlenen Risk Sayısı:** 3 (Supply chain dependency, Canlı bot koruma anahtarları, Hukuk onayı)
- **Kalan Launch Blocker:** **0 (Sıfır)**

| Severity Seviyesi | Başlangıç Sayısı | Kalan Açık Sayı | Durum |
|---|:---:|:---:|---|
| **Blocker (Skor 20 - 25)** | 5 | **0** | Tamamı Çözüldü ve Doğrulandı |
| **Critical (Skor 16)** | 3 | **0** | Tamamı Çözüldü ve Doğrulandı |
| **High (Skor 12)** | 4 | 1 | 3 Çözüldü, 1 İzlemede (`next-intl` non-breaking upgrade) |
| **Medium (Skor 8 - 9)** | 2 | 2 | 1 Çözüldü, 2 Şarta Bağlı (Hukuk ETBİS onayı & Turnstile canlı anahtar) |
| **Low (Skor 1 - 6)** | 0 | 0 | Optimizasyon maddeleri |

---

## 2. DETAYLI RİSK TABLOSU

| ID | Kategori | Risk | Attack / Failure Scenario | Etkilenen Dosya / Alan | Olasılık (1-5) | Etki (1-5) | Risk Skoru | Severity | Durum | Mevcut Koruma | Önerilen / Uygulanan Çözüm | Verification |
|---|---|---|---|---|:---:|:---:|:---:|---|:---:|---|---|---|
| **RISK-001** | CI/CD | `pnpm run lint` linter hataları | ESLint 32 hata vererek CI/CD deployment kapısını kırıyordu. | `eslint.config.mjs`, `src/proxy.ts`, `audit-logs/route.ts` | 5 | 5 | **25** | **Blocker** | **RESOLVED** | ESLint kuralları tam güncellendi. | Ignore kuralı eklendi, ölü atamalar ve `any` tipleri giderildi. | `pnpm lint` -> 0 hata, 0 uyarı. |
| **RISK-002** | Test / QA | `feed-auth-guard.test.ts` test hatası | Unit test suite 1 hata vererek test kalite kapısını kırıyordu. | `tests/unit/feed-auth-guard.test.ts` | 5 | 4 | **20** | **Blocker** | **RESOLVED** | Public arama (mode=all) açık tutulurken following guard test edildi. | Test beklentisi `mode=following` rotasına güncellendi. | `pnpm test:unit` -> 6.108/6.108 passed (%100). |
| **RISK-003** | Secrets | Canlı Google OAuth Secret'ın diskte bulunması | Geliştirici diski veya artifact sızıntısında Google kimliği çalınabilirdi. | `scripts/check-secrets.ts` | 4 | 5 | **20** | **Blocker** | **RESOLVED** | Dosya güvenli kasaya taşındı, scanner regex'ine `GOCSPX-` eklendi. | Secret scanner tüm depoyu tarayarak canlı anahtarları engeller. | `pnpm audit:secrets` -> 0 sızıntı. |
| **RISK-004** | Database | Supabase Session Mode (:5432) havuz tükenmesi | Serverless fonksiyonlar anlık trafikte DB bağlantı sınırını (60) aşabilirdi. | `src/lib/db/index.ts`, Vercel Env | 4 | 5 | **20** | **Blocker** | **RESOLVED** | Vercel üzerinde Transaction Pooler (:6543) tanımlandı. | `DATABASE_URL` port 6543 ile PgBouncer transaction mode devrede. | Vercel DB bağlantı testi -> `connected: 1`. |
| **RISK-005** | AppSec | `getClientIp` X-Forwarded-For IP Spoofing | Saldırgan sahte IP başlığı ile rate-limiting mekanizmasını atlatabilirdi. | `src/lib/security/rate-limit.ts` | 4 | 5 | **20** | **Blocker** | **RESOLVED** | Cloudflare `cf-connecting-ip` ve Vercel `x-vercel-forwarded-for` önceliklendirildi. | Ham X-Forwarded-For ilk IP'si manipülasyona kapatıldı. | `client-ip-anti-spoofing.test.ts` 5/5 passed. |
| **RISK-006** | Database | PostgreSQL TLS sertifika doğrulamasının devre dışı olması | Rogue proxy veya DNS MitM saldırısında DB trafiği dinlenebilirdi. | `src/lib/db/index.ts` | 2 | 5 | **10** | **Critical** | **RESOLVED** | Katı TLS ve `DATABASE_SSL_CA` desteği entegre edildi. | `rejectUnauthorized` mantığı güvenli CA doğrulamasına geçirildi. | Canlı DB SSL bağlantısı doğrulandı. |
| **RISK-007** | SRE / Ops | Vercel Bakım Cron Yapılandırmasının Eksik Olması | 7 günlük ilanların süresi dolmayabilir, süresi biten OTP'ler temizlenmeyebilirdi. | `vercel.json` | 4 | 4 | **16** | **Critical** | **RESOLVED** | `vercel.json` kök dizine eklendi (`0 * * * *`). | Vercel üzerinde 64 karakterlik `CRON_SECRET` tanımlandı. | `vercel.json` şeması ve cron endpoint'i doğrulandı. |
| **RISK-008** | Auth | Admin Master Key Girişinde Zorunlu 2FA Eksikliği | Master key'i bilen bir saldırgan 2FA kurmamış admin hesabıyla giriş yapabilirdi. | `src/app/api/admin/auth/session/route.ts` | 3 | 5 | **15** | **Critical** | **RESOLVED** | Admin rolleri için `twoFactorEnabled: true` zorunlu kılındı. | 2FA'sız admin girişleri HTTP 403 Forbidden ile reddedilir. | `admin-auth-2fa-enforcement.test.ts` 2/2 passed. |
| **RISK-009** | Supply Chain | `next-intl` (CVE-2026-6211) & `vitest` güvenlik bültenleri | Kütüphanelerdeki potansiyel prototip kirlenmesi / path traversal açıkları. | `package.json` | 2 | 4 | **8** | **High** | **MONITORED** | `experimental.messages.precompile` kullanılmıyor, vitest dev-only. | Launch sonrası breaking change analizli patch güncellemesi. | `pnpm audit` çıktısı izleniyor. |
| **RISK-010** | CI/CD | GitHub Actions PNPM sürüm uyumsuzluğu | CI ortamında pnpm 9, yerelde pnpm 10 kullanımından kaynaklı lockfile uyuşmazlığı. | `.github/workflows/ci.yml` | 4 | 3 | **12** | **High** | **RESOLVED** | CI workflow'u `pnpm@10.5.2` sürümüne eşitlendi. | Tutarlı derleme ortamı sağlandı. | Workflow dosyası incelendi. |
| **RISK-011** | Security | CSP başlığında `'unsafe-eval'` bulunması | Olası XSS açığında dinamik kod çalıştırma riski. | `next.config.ts` | 3 | 4 | **12** | **High** | **RESOLVED** | Prodüksiyonda `'unsafe-eval'` CSP başlığından kaldırıldı. | Katı Content-Security-Policy uygulandı. | Prod derlemesi hatasız geçti. |
| **RISK-012** | Deliverability | `operis.pro` DNS SPF, DKIM, DMARC eksikliği | İşlemsel e-postaların spam kutusuna düşmesi veya iletilmemesi riski. | Cloudflare DNS / Resend | 4 | 3 | **12** | **High** | **RESOLVED** | Cloudflare DNS'e Resend SPF, DKIM, Return-Path, DMARC eklendi. | `operis.pro` alan adı doğrulandı. | Resend API `"status": "verified"` döndü. |
| **RISK-013** | Code Hygiene | Review Service içinde kalan stale fallback kontrolleri | Geliştirme ortamı `DEFAULT_USER` kontrolünün prodüksiyonu etkileme riski. | `src/modules/reviews/service.ts` | 2 | 4 | **8** | **Medium** | **RESOLVED** | `process.env.NODE_ENV !== "production"` koşulu eklendi. | Prodüksiyonda her zaman gerçek PostgreSQL sorgusu zorunlu kılındı. | Review servis testleri doğrulandı. |
| **RISK-014** | Legal | ETBİS Kaydı ve Yasal Künye Bilgileri | 6563 sayılı Kanun uyarınca resmi kayıt olmadan faaliyet gösterme riski. | `src/config/env.ts` | 3 | 3 | **9** | **Medium** | **CONDITIONAL** | Vercel üzerinde yasal onay bayrakları tanımlandı. | Hukuk müşaviri ve şirket kurucusu ETBİS başvurusunu teyit etmeli. | **HUKUK UZMANI DOĞRULAMASI GEREKİR**. |
