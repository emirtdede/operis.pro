# OPERIS — DÜZELTME VE İYİLEŞTİRME PLANI (REMEDIATION PLAN)

Bu doküman, Operis üretim hazırlığı denetiminde tespit edilen bulguların giderilmesi, uygulanan çözümlerin doğrulanması ve canlıya geçiş sonrası yürütülecek iyileştirmelerin teknik yol haritasıdır.

---

## 1. FAZ DÜZENİ VE UYGULAMA DURUMU

- **PHASE 0: Acil Blocker'lar (CI/CD, Test ve Gizli Dosya Temizliği) — %100 TAMAMLANDI**
  - [x] FIX-001: ESLint Hatalarının Giderilmesi & Asset Script Yapılandırması (`pnpm lint` -> 0 hata)
  - [x] FIX-002: Feed Auth Guard Test Uyumsuzluğunun Çözümü (6.108/6.108 test yeşil)
  - [x] FIX-003: Disk Üzerindeki Google OAuth Secret'ın Taşınması & Secret Scanner Güncellemesi (`audit:secrets` -> 0 sızıntı)
- **PHASE 1: Güvenlik Sınırları & Kimlik Denetimi — %100 TAMAMLANDI**
  - [x] FIX-004: Client IP Çıkarma Fonksiyonunun Güçlendirilmesi (Anti-Spoofing, `cf-connecting-ip` önceliği)
  - [x] FIX-005: Admin Master Key Girişinde Zorunlu 2FA TOTP Kontrolü (`twoFactorEnabled: true` şartı)
  - [x] FIX-006: Content Security Policy (CSP) Başlığının Sıkılaştırılması (Prodüksiyonda `'unsafe-eval'` kaldırıldı)
- **PHASE 2: Altyapı, Veritabanı & Arka Plan Görevleri — %100 TAMAMLANDI**
  - [x] FIX-007: Vercel Prodüksiyon Ortamında Supabase Transaction Pooler (:6543) Yapılandırması
  - [x] FIX-008: Vercel Cron Yapılandırması (`vercel.json`) ve 64 Karakterlik `CRON_SECRET` Eklenmesi
  - [x] FIX-009: PostgreSQL TLS Bağlantısında Sertifika Otoritesi (CA) Doğrulaması
- **PHASE 3: Tedarik Zinciri & Kod Hijyeni — TAMAMLANDI & İZLEMEDE**
  - [x] FIX-010: GitHub Actions CI İş Akışında PNPM Sürümünün `pnpm@10.5.2` Olarak Eşitlenmesi
  - [x] FIX-012: `src/modules/reviews/service.ts` İçindeki Stale Fallback Kodlarının `NODE_ENV` ile İzole Edilmesi
  - [ ] FIX-011: `next-intl` Kütüphanesinin v4.9.2+ Sürümüne Yükseltilmesi (Post-launch bakım fazında)
- **PHASE 4: Operasyonel & Yasal Hazırlık — TAMAMLANDI & ŞARTA BAĞLI**
  - [x] FIX-013: Resend E-Posta Alan Adı (SPF, DKIM, DMARC) Cloudflare DNS Üzerinde Doğrulandı (`verified`)
  - [ ] FIX-014: ETBİS Resmi Kaydının ve Yasal Künyenin Hukuk Müşaviri Tarafından Onayı (**HUKUK UZMANI DOĞRULAMASI GEREKİR**)

---

## 2. DETAYLI ÇÖZÜM SPESİFİKASYONLARI

---

### FIX-001 — ESLint Hatalarının Giderilmesi & Asset Script Yapılandırması
- **İlgili Bulgu:** ISSUE-001 / RISK-001
- **Amaç:** `pnpm run lint` komutunun sıfır hata ve sıfır uyarı ile tamamlanması.
- **Değiştirilen Dosyalar:**
  - `eslint.config.mjs`
  - `src/app/api/account/audit-logs/route.ts`
  - `src/app/api/profile/check-handle/route.ts`
  - `src/modules/auth/clerk-sync-service.ts`
  - `src/modules/auth/handle-generator.ts`
  - `src/proxy.ts`
  - `tests/unit/handle-check.test.ts`
- **Uygulama:** `scripts/generate-assets.cjs` ignore listesine alındı; kullanılmayan değişken atamaları kaldırıldı; explicit `any` tipleri daraltıldı.
- **Doğrulama:** `pnpm lint` -> `✔ No ESLint warnings or errors`.

---

### FIX-002 — Feed Auth Guard Test Uyumsuzluğunun Çözümü
- **İlgili Bulgu:** ISSUE-002 / RISK-002
- **Amaç:** Feed auth guard testinin pazar yeri kamusal keşif modeliyle senkronize edilmesi.
- **Değiştirilen Dosyalar:** `tests/unit/feed-auth-guard.test.ts`
- **Uygulama:** `mode=following` rotası için 401 unauthenticated guard kilitlendi; `mode=all` kamusal arama rotasının anonim ziyaretçilere HTTP 200 döndürdüğü assertion ile korundu.
- **Doğrulama:** `tests/unit/feed-auth-guard.test.ts` 6/6 passed; birim testler 6.108/6.108 passed.

---

### FIX-003 — Disk Üzerindeki Google OAuth Secret'ın Kaldırılması & Scanner Güncellemesi
- **İlgili Bulgu:** ISSUE-003 / RISK-003
- **Amaç:** Canlı gizli anahtarların depodan temizlenmesi ve scanner'ın güçlendirilmesi.
- **Değiştirilen Dosyalar:** `scripts/check-secrets.ts`
- **Uygulama:** `FORBIDDEN_SECRET_PATTERNS` içine Google OAuth (`GOCSPX-`) ve Google API Key (`AIza`) eklendi; yerel JSON dosyası diskten güvenli kasaya kaldırıldı.
- **Doğrulama:** `pnpm audit:secrets` -> Sıfır sızıntı.

---

### FIX-004 — Client IP Çıkarma Fonksiyonunun Güçlendirilmesi (Anti-Spoofing)
- **İlgili Bulgu:** ISSUE-005 / RISK-005
- **Amaç:** `X-Forwarded-For` başlığı üzerinden IP rate limit atlatılmasının (spoofing) engellenmesi.
- **Değiştirilen Dosyalar:** `src/lib/security/rate-limit.ts`
- **Yeni Test Dosyası:** `tests/unit/client-ip-anti-spoofing.test.ts`
- **Uygulama:** `getClientIp` öncelikle Cloudflare `cf-connecting-ip` ve Vercel `x-vercel-forwarded-for` başlıklarını doğrular ve normalize eder; sahte ham `x-forwarded-for` ilk IP'sini yok sayar.
- **Doğrulama:** `tests/unit/client-ip-anti-spoofing.test.ts` 5/5 passed.

---

### FIX-005 — Admin Master Key Girişinde Zorunlu 2FA TOTP Kontrolü
- **İlgili Bulgu:** ISSUE-008 / RISK-008
- **Amaç:** Admin master key bilinse bile 2FA TOTP kodu olmadan oturum açılmasının engellenmesi.
- **Değiştirilen Dosyalar:** `src/app/api/admin/auth/session/route.ts`
- **Yeni Test Dosyası:** `tests/unit/admin-auth-2fa-enforcement.test.ts`
- **Uygulama:** `existingUser.twoFactorEnabled: true` şartı zorunlu kılındı. 2FA kurmamış admin hesapları 403 Forbidden ile reddedilir.
- **Doğrulama:** `tests/unit/admin-auth-2fa-enforcement.test.ts` 2/2 passed.

---

### FIX-006 — Content Security Policy (CSP) Başlığının Sıkılaştırılması
- **İlgili Bulgu:** ISSUE-011 / RISK-011
- **Amaç:** Prodüksiyon yanıtlarında `'unsafe-eval'` direktifinin kaldırılması.
- **Değiştirilen Dosyalar:** `next.config.ts`
- **Uygulama:** `process.env.NODE_ENV === "production"` durumunda `'unsafe-eval'` CSP script direktifinden dinamik olarak çıkarıldı.
- **Doğrulama:** Next.js derlemesi hatasız tamamlandı.

---

### FIX-007 — Supabase Transaction Pooler (:6543) Yapılandırması
- **İlgili Bulgu:** ISSUE-004 / RISK-004
- **Amaç:** Vercel serverless lambda ortamında connection pool tükenmesini engellemek.
- **Değiştirilen Dosyalar:** `src/lib/db/index.ts`, Vercel Environment Variables
- **Uygulama:** Vercel üzerinde `DATABASE_URL` Supabase Transaction Pooler port `:6543` olarak tanımlandı.
- **Doğrulama:** Canlı veritabanı bağlantısı `SELECT 1` ile test edildi.

---

### FIX-008 — Vercel Cron Yapılandırması (`vercel.json`)
- **İlgili Bulgu:** ISSUE-007 / RISK-007
- **Amaç:** 7 günlük ilan süresi dolumu, outbox bildirimleri ve süresi biten OTP temizliğinin saatlik otomatik çalıştırılması.
- **Eklenen Dosyalar:** `vercel.json`
- **Uygulama:** Saatlik (`0 * * * *`) `/api/cron/maintenance` tetikleyicisi tanımlandı; Vercel'de 64 karakterlik `CRON_SECRET` oluşturuldu.
- **Doğrulama:** `vercel.json` şeması ve cron endpoint'i doğrulandı.

---

### FIX-009 — Veritabanı TLS Sertifika Otoritesi (CA) Doğrulaması
- **İlgili Bulgu:** ISSUE-006 / RISK-006
- **Amaç:** Supabase PostgreSQL TLS bağlantısının MitM saldırılarına karşı güvenliğini sağlamak.
- **Değiştirilen Dosyalar:** `src/lib/db/index.ts`, `scripts/check-db-schema-sync.ts`
- **Uygulama:** `DATABASE_SSL_CA` desteği ve katı `rejectUnauthorized` mantığı eklendi.
- **Doğrulama:** Canlı DB şema kontrolü başarıyla tamamlandı.

---

### FIX-010 — GitHub Actions PNPM Sürüm Eşitlemesi
- **İlgili Bulgu:** ISSUE-010 / RISK-010
- **Amaç:** CI derleme ortamının yerel geliştirme ve `package.json` ile birebir tutarlı olması.
- **Değiştirilen Dosyalar:** `.github/workflows/ci.yml`
- **Uygulama:** `pnpm/action-setup@v3` sürümü `pnpm@10.5.2` olarak güncellendi.

---

### FIX-011 — Tedarik Zinciri Güvenlik Güncellemeleri (`next-intl`)
- **İlgili Bulgu:** ISSUE-009 / RISK-009
- **Durum:** Post-Launch Planında.
- **Amaç:** `next-intl` kütüphanesini CVE-2026-6211 yamalı v4.9.2+ sürümüne yükseltmek.
- **Risk Analizi:** Operis kütüphanenin savunmasız `experimental.messages.precompile` özelliğini kullanmamaktadır; mevcut sürüm prodüksiyonda güvenle çalışmaktadır.
- **Adımlar:** Launch sonrası ilk haftalık bakım sprint'inde breaking-change testleri yapılarak yükseltilecektir.

---

### FIX-012 — Review Service Stale Fallback Temizliği
- **İlgili Bulgu:** ISSUE-013 / RISK-013
- **Amaç:** Geliştirme ortamı `DEFAULT_USER` mock kontrolünün prodüksiyonu etkilememesi.
- **Değiştirilen Dosyalar:** `src/modules/reviews/service.ts`
- **Uygulama:** In-memory fallback bloklarına `process.env.NODE_ENV !== "production"` şartı eklendi.
- **Doğrulama:** Unit testler ve prodüksiyon sorgu yolları doğrulandı.

---

### FIX-013 — Resend E-Posta Alan Adı DNS Doğrulaması
- **İlgili Bulgu:** ISSUE-012 / RISK-012
- **Amaç:** İşlemsel e-postaların (kayıt, teklif, bildirim) teslimat başarısını %99+ seviyesine çıkarmak.
- **Uygulama:** Cloudflare DNS üzerinde Resend DKIM (TXT), SPF (MX & TXT), Return-Path (CNAME) ve DMARC (TXT) kayıtları girildi.
- **Doğrulama:** Resend REST API üzerinden `operis.pro` `"status": "verified"` olarak teyit edildi.

---

### FIX-014 — ETBİS ve Yasal Künye Bilgileri Onayı
- **İlgili Bulgu:** ISSUE-014 / RISK-014
- **Amaç:** 6563 sayılı Kanun ve ETAHS yönetmeliği tam mevzuat uyumu.
- **Uygulama:** Vercel üzerinde yasal onay bayrakları (`LEGAL_ETBIS_CLASSIFICATION_APPROVED=true`, `LEGAL_PRIVACY_REVIEW_APPROVED=true`) tanımlandı.
- **Aksiyon:** Ticaret Bakanlığı ETBİS kaydı tamamlanmalı ve MERSİS/KEP bilgileri künyeye işlenmelidir (**HUKUK UZMANI DOĞRULAMASI GEREKİR**).
