# OPERIS — RESMİ ARAŞTIRMA KAYNAKLARI & REFERANSLAR (RESEARCH SOURCES)

Bu doküman, Operis üretim hazırlığı denetimi (Production Readiness Audit) sürecinde taranan ve bulguların dayandırıldığı resmi dokümantasyon, güvenlik bültenleri, standartlar ve mevzuat kaynaklarını listeler.

---

## 1. RESMİ GÜVENLİK BÜLTENLERİ VE CVE KAYITLARI

| Kaynak / CVE | Başlık & Kapsam | İlgili Paket / Bileşen | Erişim Tarihi | Resmi URL | İlgili Bulgu |
|---|---|---|---|---|---|
| **CVE-2026-6211 / GHSA-8f24-v5vv-gm5j** | Prototype Pollution via Translation Keys | `next-intl` (<=4.9.1) | 25.09.2026 | [GitHub Advisory](https://github.com/advisories/GHSA-8f24-v5vv-gm5j) | Dep-01 / Moderate-High Dependency Risk |
| **CVE-2026-6212 / GHSA-4c35-wcg5-mm9h** | Prototype Pollution with `experimental.messages.precompile` | `next-intl` (<=4.9.1) | 25.09.2026 | [GitHub Advisory](https://github.com/advisories/GHSA-4c35-wcg5-mm9h) | Dep-01 / Supply Chain Audit |
| **CVE-2026-84373 / GHSA-82fw-gwwq-j7x9** | Path Traversal / Arbitrary File Read in `@vitest/mocker` | `vitest` (>=2.1.0 <4.1.11) | 25.09.2026 | [GitHub Advisory](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) | Dep-02 / Dev Dependency Security |
| **OWASP Top 10:2021** | A01: Broken Access Control & IDOR | API Authorization & Offer Access | 25.09.2026 | [OWASP A01](https://owasp.org/Top10/A01_2021-Broken_Access_Control/) | Auth-01 / Invariant Verification |
| **OWASP Top 10:2021** | A07: Identification and Authentication Failures | Session Management & 2FA | 25.09.2026 | [OWASP A07](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/) | Auth-02 / Admin Session Controls |
| **OWASP ASVS v4.0.3** | V3 Session Management & V4 Access Control | Session Tokens & Timing Attacks | 25.09.2026 | [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) | Crypto-01 / Session HMAC Verification |

---

## 2. RESMİ FRAMEWORK & CLOUD DOKÜMANTASYONU

| Sağlayıcı / Proje | Başlık & Konu | Erişim Tarihi | Resmi URL | İlgili Bulgu |
|---|---|---|---|---|
| **Next.js (Vercel)** | Next.js 16 Production Deployment & Server Actions Security | 25.09.2026 | [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#security) | Arch-01 / Serverless Headers & Origin |
| **Next.js (Vercel)** | Content Security Policy (CSP) & Nonces in App Router | 25.09.2026 | [Next.js CSP Guide](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy) | Sec-01 / Script-src 'unsafe-eval' Audit |
| **Supabase** | Connection Management in Serverless Environments (Port 6543 vs 5432) | 25.09.2026 | [Supabase Connection Pooler Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler) | DB-01 / Lambda Pool Exhaustion Risk |
| **PostgreSQL Global Development Group** | Transaction Isolation & Explicit Locking (`FOR UPDATE`, Advisory Locks) | 25.09.2026 | [PostgreSQL Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html) | Concurrency-01 / Bilateral Lock Verification |
| **Cloudflare** | Cloudflare R2 S3 API Compatibility & Presigned PUT URLs | 25.09.2026 | [Cloudflare R2 Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) | Storage-01 / S3 Client Uploads |
| **Cloudflare** | Cloudflare Turnstile Server-Side Siteverify API | 25.09.2026 | [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) | Abuse-01 / Bot Protection Fallback |
| **Inngest** | Inngest Durable Execution & Serverless Cron Scheduling | 25.09.2026 | [Inngest Functions & Crons](https://www.inngest.com/docs/guides/scheduled-functions) | Ops-01 / Background Maintenance Trigger |
| **Resend** | Domain Verification, SPF, DKIM & DMARC Deliverability | 25.09.2026 | [Resend Domain Verification](https://resend.com/docs/dashboard/domains/introduction) | Mail-01 / DNS SPF & DKIM Checklist |

---

## 3. RESMİ TÜRKİYE MEVZUATI VE DÜZENLEYİCİ OTORİTELER

| Kanun / Düzenleme | Yasal Dayanak & Madde | Resmi Kurum | İlgili Bulgu & Teknik Yansıması |
|---|---|---|---|
| **6563 Sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun** | Elektronik Ticaret Bilgi Sistemi (ETBİS) Kayıt Yükümlülüğü | T.C. Ticaret Bakanlığı | Hukuk-01 / `LEGAL_ETBIS_CLASSIFICATION_APPROVED` & MERSİS/KEP |
| **Elektronik Ticaret Aracı Hizmet Sağlayıcı (ETAHS) Yönetmeliği** | Pazar yeri bilgi doğrulama ve stopaj (%1 tevkifat 2025/2026 düzenlemesi) | T.C. Ticaret Bakanlığı / Gelir İdaresi Başkanlığı | Finans-01 / Operis'in Sıfır-Emanet (Zero-Escrow) Bilateral Modeli |
| **6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK)** | m. 4 (Genel İlkeler), m. 7 (Silme/Anonim Hale Getirme), m. 12 (Veri Güvenliği) | Kişisel Verileri Koruma Kurumu (KVKK) | KVKK-01 / PII Envelope v2 Şifreleme, Blind Index, Hesap Silme |
| **6098 Sayılı Türk Borçlar Kanunu (TBK)** | m. 470 (Eser Sözleşmesi), m. 474 (Ayıp İncelemesi), m. 480/2 (Uyarlama/Scope Shield) | T.C. Adalet Bakanlığı | İş Mantığı-01 / Milestones, Scope Shield, Handovers |
| **6100 Sayılı Hukuk Muhakemeleri Kanunu (HMK)** | m. 193 (Delil Sözleşmesi) ve Elektronik Belge Hükmü | T.C. Adalet Bakanlığı | Hukuk-02 / Sözleşme SHA-256 Dijital Mühürleri |
| **6102 Sayılı Türk Ticaret Kanunu (TTK)** | m. 82 (Ticari Defter ve Belgelerin 10 Yıl Saklanması) | T.C. Ticaret Bakanlığı | Veri-01 / Hesap Silmede Tamamlanan Proje Faturalarının Korunması |
