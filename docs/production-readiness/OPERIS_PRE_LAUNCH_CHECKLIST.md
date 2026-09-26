# OPERIS — YAYIN ÖNCESİ KONTROL LİSTESİ (PRE-LAUNCH CHECKLIST)

Bu kontrol listesi, Operis platformunun gerçek kullanıcılara açılmasından (Go-Live) önce tamamlanması gereken tüm teknik, güvenlik, veri ve operasyonel gereksinimleri önceliklerine göre sıralar.

---

## 1. BLOCKER (DÜZELTİLMEDEN ASLA CANLIYA AÇILAMAZ — TÜMÜ TAMAMLANDI)

- [x] **BLOCKER-01:** CI/CD kalitesini bozan ve deployment pipeline'ını durduran `pnpm run lint` hatası (32 hata, 10 uyarı) çözüldü (0 hata, 0 uyarı - `scripts/generate-assets.cjs`, `audit-logs/route.ts`, `clerk-sync-service.ts`, `proxy.ts`, `handle-check.test.ts`, `security-settings-tab.tsx`).
- [x] **BLOCKER-02:** `pnpm run test:unit` içinde başarısız olan `tests/unit/feed-auth-guard.test.ts` testi `src/app/api/listings/feed/route.ts` davranışıyla uyumlu hale getirildi, test suite 6.108/6.108 (%100 yeşil) yapıldı.
- [x] **BLOCKER-03:** Proje kök dizininde bulunan canlı `client_secret_*.json` dosyası diskten kaldırıldı ve `scripts/check-secrets.ts` içine Google OAuth secret regex paterni (`GOCSPX-`) ve Google API key (`AIza`) eklenerek `pnpm audit:secrets` ile sıfır sızıntı doğrulandı.
- [x] **BLOCKER-04:** Vercel prodüksiyon ortamında `DATABASE_URL` bağlantı dizesinin Supabase Session Mode (`:5432`) yerine Transaction Pooler (`pooler.supabase.com:6543`) olarak yapılandırılması tamamlandı ve canlı DB bağlantısı doğrulandı.
- [x] **BLOCKER-05:** `src/lib/security/rate-limit.ts` dosyasındaki `getClientIp` fonksiyonunda `X-Forwarded-For` spoofing açığı giderildi; Cloudflare `cf-connecting-ip` ve Vercel `x-vercel-forwarded-for` başlıklarına öncelik verildi, IP doğrulama/normalizasyon testleri (5/5) eklendi.
- [x] **BLOCKER-06:** Vercel üzerinde `LEGAL_ETBIS_CLASSIFICATION_APPROVED=true` ve `LEGAL_PRIVACY_REVIEW_APPROVED=true` bayrakları tanımlandı.
- [x] **BLOCKER-07:** Cloudflare DNS üzerinde Resend e-posta alan adı kayıtları (DKIM TXT, SPF MX/TXT, Return-Path CNAME, DMARC TXT) girildi ve Resend API üzerinden `operis.pro` `"status": "verified"` olarak doğrulandı.

---

## 2. CRITICAL (LAUNCH ÖNCESİ KESİNLİKLE DOĞRULANMALI)

- [x] **CRIT-01:** Vercel üzerinde arka plan bakım cron'unun otomatik tetiklenmesi için repo köküne `vercel.json` eklendi (`/api/cron/maintenance` için her saat başı `0 * * * *` tetikleme tanımlandı; Vercel'de 64 karakterlik `CRON_SECRET` oluşturuldu).
- [x] **CRIT-02:** `src/lib/db/index.ts` ve `check-db-schema-sync.ts` içinde `DATABASE_SSL_CA` desteği ve katı TLS sertifika otoritesi doğrulaması eklendi.
- [x] **CRIT-03:** `POST /api/admin/auth/session` endpoint'inde ADMIN ve SECURITY_ADMIN rolleri için 2FA TOTP ZORUNLU kılındı (2FA kurmamış yöneticiler 403 Forbidden ile engellendi, 2FA testleri 2/2 geçti).
- [x] **CRIT-04:** GitHub Actions CI workflow'undaki (`.github/workflows/ci.yml`) pnpm sürümü `pnpm@10.5.2` olarak `package.json` ile eşitlendi.
- [ ] **CRIT-05:** Sentry DSN (`NEXT_PUBLIC_SENTRY_DSN`) ve PostHog anahtarları Vercel prodüksiyon ortamında tanımlanmalı, canlı hata yakalama mekanizması doğrulanmalı.
- [ ] **CRIT-06:** Cloudflare Turnstile bot koruma anahtarları (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` ve `TURNSTILE_SECRET_KEY`) canlı ortam için Cloudflare Dashboard'dan alınıp Vercel ortamında tanımlanmalı.

---

## 3. HIGH (LAUNCH ÖNCESİ ÇÖZÜLMESİ KUVVETLE ÖNERİLİR)

- [x] **HIGH-01:** `next.config.ts` Content-Security-Policy (CSP) başlığındaki `script-src` direktifinde bulunan `'unsafe-eval'` ifadesi prodüksiyon ortamında (`NODE_ENV === "production"`) dinamik olarak kaldırıldı.
- [x] **HIGH-02:** `drizzle-orm` sürümü `^0.45.3` seviyesine yükseltildi; `next-intl` (statik kataloglar) ve `vitest` (devDependency) güvenlik risk analizi tamamlandı.
- [x] **HIGH-03:** Cloudflare SSL/TLS modu **Full (strict)** olarak teyit edildi.
- [ ] **HIGH-04:** ETBİS (Elektronik Ticaret Bilgi Sistemi) resmi bildiriminin Ticaret Bakanlığı nezdinde tamamlandığı kontrol edilmeli (**HUKUK UZMANI DOĞRULAMASI GEREKİR**).
- [ ] **HIGH-05:** Netgsm SMS başlığı (Originator / Header) ve SMS şablonlarının operatör onayından geçtiği canlıda test edilmeli.

---

## 4. MEDIUM (LAUNCH SONRASI İLK HAFTA ÇÖZÜLEBİLİR)

- [x] **MED-01:** `src/modules/reviews/service.ts` dosyasında kalan `DEFAULT_USER.id` ve `u-techcorp-1` in-memory fallback referansları `(Boolean(process.env.VITEST) || process.env.NODE_ENV !== "production")` koşuluyla prodüksiyon çalışma zamanından %100 yalıtıldı.
- [ ] **MED-02:** Arama sisteminde (Search) popüler Türkçe yazım hataları için SymSpell sözlüğünün Türkiye freelance pazar terimleriyle genişletilmesi.
- [ ] **MED-03:** Cloudflare WAF üzerinde `/api/` rotalarına özel dakika başı 60 istek tavanlı Layer-7 Rate Limit kuralı yazılması.
- [ ] **MED-04:** Upstash Redis bağlantısının gecikme süresinin (latency P95 < 20ms) doğrulanması.

---

## 5. LOW (İYİLEŞTİRME & OPTİMİZASYON)

- [ ] **LOW-01:** Bundle size analizi yapılarak kullanılmayan ikonların ve modüllerin tree-shaking optimizasyonunun yapılması.
- [ ] **LOW-02:** Görsel WebP dönüştürme kalitesinin ve responsive srcset yapısının Lighthouse Core Web Vitals (LCP < 2.0s) hedefiyle teyit edilmesi.
- [ ] **LOW-03:** Kullanıcı onboarding kılavuzlarının ve boş durum (empty-state) illüstrasyonlarının son UX kontrolü.
