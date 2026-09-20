# Operis Sürüm 18 Denetim Açıkları — Çözüm ve Doğrulama Raporu (Sürüm 19)

**Tarih:** 13 Eylül 2026  
**Durum:** Tüm Sürüm 18 Denetim Açıkları Kök Nedenleriyle Çözüldü ve Gerçek PostgreSQL 16 + Production Ortamında Doğrulandı.

---

## 1. Yönetici Özeti ve Denetim Maddeleri Durumu

| ID | Öncelik | Tanım | Uygulanan Kök Neden Çözümü | Doğrulama Kanıtı | Durum |
|---|---|---|---|---|---|
| **B25-ENTRY** | **KRİTİK** | Playwright config eksik URL'de koşullu `if` bırakmamalı; test worker ve web DB eşitliği doğrulanmalı; runner token şartı. | `playwright.config.ts` koşulsuz `throw` ile fail-closed yapıldı. Host ve dbName denetlendi. Kriptografik `OPERIS_E2E_RUNNER_TOKEN` şart koşuldu. `assertSafeE2ETestEnvironment()` eklendi. | `tests/integration/export-v18-audit.test.ts` (4 fail-closed testi) | **KAPATILDI** |
| **B25-EXIT** | **KRİTİK** | Runner `finally` içindeki `process.exit` seed/spawn hatasını exit 0 ile örtmemeli; başlangıçta hata varsayılmalı. | `scripts/run-e2e-prod.ts` `finally` içerisinden `process.exit` kaldırıldı. `seedError`, `spawnError`, `testExitCode`, `cleanupError` ayrı yakalanıp tek bir çıkış noktasına bağlandı. | `tests/integration/export-v18-audit.test.ts` (B25-EXIT 4 ayrı hata enjeksiyonu) | **KAPATILDI** |
| **B25-RUNNER** | **YÜKSEK** | Egress ağ izolasyonu; parent SIGINT/SIGTERM süreç ağacı ve DB temizliği; stale DB kurtarma; commit artifact kontrolü. | Resend ve Netgsm sağlayıcılarına test modunda fail-closed engel getirildi. Yerel HTTP stub sunucusu kuruldu. Parent sinyal dinleyicileri bağlandı. Stale DB fonksiyonuna aktif backend kontrolü eklendi. Production artifact commit marker ile doğrulandı. | `tests/integration/export-v18-audit.test.ts` (stub & cleanup testi) + `npm run test:e2e:prod` | **KAPATILDI** |
| **B26-CLEANUP** | **YÜKSEK** | 2000 ms bütçeye gizli 1500 ms eklenmemeli; edinim, sorgu ve RESET aynı bütçeyi kullanmalı; gerçek RESET hatası ve hang testi. | Gizli 1500 ms kaldırıldı (`forceCloseMs = Math.max(1, absoluteDeadline - Date.now())`). RESET sorgusu `Promise.race` ile kalan bütçeyle sınırlandı; zaman aşımı ve hata durumunda `terminateClientSafely` ile bağlantı yok edildi. | `tests/integration/export-v18-audit.test.ts` (RESET socket destroy, 818ms hang cancellation, 1800ms acquisition test) | **KAPATILDI** |
| **B26-MEM** | **YÜKSEK** | Keyset sorgularında pre-check ve <= 16 MiB gruplama; 11 MiB kayıt testi; 50 × ~8.8 MiB (~440 MiB) gerçek kapasite ve deşifre edilmiş JSON doğrulaması. | `listings` ve `offers` keyset sayfalamasında `octet_length(...)` pre-check ve <= 16 MiB gruplama uygulandı. 11 MiB kayıt testiyle `EXPORT_RECORD_TOO_LARGE` doğrulandı. Gerçek 50 × ~8.8 MiB (~429.7 MiB, 430 parça) veri başarıyla işlendi (`Peak RSS: 411 MiB, Delta RSS: 159 MiB`); tüm parçalar deşifre edilip SHA-256 ve tüm 50 revizyon JSON içeriği doğrulandı. | `tests/integration/export-v18-audit.test.ts` (11 MiB pre-check & 50x ~8.8 MiB capacity test) | **KAPATILDI** |
| **K01-TEST** | **ORTA** | Gerçek renewal zamanlayıcısının çalıştığı kontrollü bariyerle kanıtlanmalı; `lastProgressAt` aynı kalmalı; token çalma `rowCount === 1` doğrulanıp kesin `LEASE_LOST` dönmeli. | `testProcessingBarrier` ve `renewalIntervalMs` parametreleri eklendi. Kontrollü bariyerde 250ms aralıkla renewal tetiklenerek `leaseUntil`'in güncellendiği, `lastProgressAt`'in milisaniyesine kadar %100 aynı kaldığı kanıtlandı. Ayrı bağlantıyla satır etkileyen UPDATE sonrası sonucun kesin `LEASE_LOST` olduğu ve daemon state'in temizlendiği kanıtlandı. | `tests/integration/export-v18-audit.test.ts` (renewal progress-free update & rowCount 1 token theft) | **KAPATILDI** |

---

## 2. Gerçek Test Çalıştırma Kanıtları ve Çıkış Kodları

### A. TypeScript Typecheck
- **Komut:** `npm run typecheck` (`tsc --noEmit`)
- **Çıkış Kodu:** `0`
- **Sonuç:** Sıfır tip hatası.

### B. ESLint
- **Komut:** `npm run lint` (`eslint .`)
- **Çıkış Kodu:** `0`
- **Sonuç:** Sıfır lint uyarısı veya hatası.

### C. Birim Testleri
- **Komut:** `npm run test:unit`
- **Çıkış Kodu:** `0`
- **Sonuç:** 39 test dosyası, 5.298 test başarılı (0 hata).

### D. Sürüm 18 Özel Denetim Testleri
- **Komut:** `$env:TEST_DATABASE_URL = "postgresql://operis_ci:operis_ci_password@localhost:5432/operis_test_ci"; npx vitest run tests/integration/export-v18-audit.test.ts --config vitest.integration.config.ts`
- **Çıkış Kodu:** `0`
- **Sonuç:** 14 testin 14'ü de başarılı:
  1. `B25-ENTRY: fails closed when TEST_DATABASE_URL is missing or empty at config load` (PASSED)
  2. `B25-ENTRY: fails closed when runner token is missing at config load` (PASSED)
  3. `B25-ENTRY: fails closed when DATABASE_URL differs from TEST_DATABASE_URL` (PASSED)
  4. `B25-ENTRY: assertSafeE2ETestEnvironment throws before mutating actions if preconditions are not met` (PASSED)
  5. `B25-EXIT: runner defaults to failure and returns nonzero if seed or child fails; cleanup is always invoked` (PASSED)
  6. `B25-RUNNER: local stub intercepts email and SMS dispatches with zero external network egress` (PASSED)
  7. `B25-RUNNER: cleanupStaleEphemeralDatabases successfully removes orphaned test databases` (PASSED)
  8. `B26-CLEANUP: real RESET error terminates client safely, tainted connection never returned to pool` (PASSED)
  9. `B26-CLEANUP: real RESET hang is terminated at absoluteDeadline without hidden 1500ms addition` (PASSED, 818ms)
  10. `B26-CLEANUP: 1800ms acquisition delay consumes budget; op query only gets remaining 200ms and cancels on time` (PASSED, 2113ms)
  11. `K01-TEST: renewal timer fires and updates leaseUntil while lastProgressAt remains identical` (PASSED)
  12. `K01-TEST: separate connection steals lease_token with rowCount 1; processor returns exact LEASE_LOST and cleans daemon state` (PASSED)
  13. `B26-MEM: 11 MiB oversized listing scope is rejected by pre-check with EXPORT_RECORD_TOO_LARGE, never READY` (PASSED)
  14. `B26-MEM: 50 large-scope revisions (~8.8 MiB each, ~440 MiB total) process boundedly, decrypted JSON fully verified` (PASSED, Total: 429.7 MiB, 430 parts, Peak RSS: 411 MiB, Delta: 159 MiB)

### E. Tüm Entegrasyon Testleri
- **Komut:** `$env:TEST_DATABASE_URL = "postgresql://ozlem_user:ozlem_secure_pass_2026@localhost:5432/operis_test_ci"; npm run test:integration`
- **Çıkış Kodu:** `0`
- **Sonuç:** 14 test dosyası, 72 test başarılı (0 hata).

### F. Erişilebilirlik Testleri
- **Komut:** `npm run test:a11y`
- **Çıkış Kodu:** `0`
- **Sonuç:** 1 test dosyası, 7 test başarılı.

### G. Next.js Production Derlemesi
- **Komut:** `npm run build` (`next build --webpack`)
- **Çıkış Kodu:** `0`
- **Sonuç:** Next.js 16.3.3 Webpack production build (124 rota derlendi).

### H. Production E2E Test Koşusu
- **Komut:** `$env:TEST_DATABASE_URL = "postgresql://ozlem_user:ozlem_secure_pass_2026@localhost:5432/operis_test_ci"; npm run test:e2e:prod`
- **Çıkış Kodu:** `0`
- **Sonuç:** İzole geçici DB (`operis_test_a8d75874e88a4c6c85a6056430fc26a1`), yerel provider stub (port 53538), Next.js production sunucusu (port 8008), 16 Playwright E2E testi (8 Desktop Chromium, 8 Mobile Chrome) %100 başarılı. Ephemeral DB imha edildi.

---

## 3. Resend Ücretsiz Planını Maksimum Verimle Kullanma (Contact Pool & Slot Recycling)

### A. Hedef ve Kapsam
Resend'in ücretsiz planındaki kotalardan (Ayda 3.000 e-posta, 1.000 kontakt limiti) maksimum verim almak:
1. **İsteğe Bağlı Katılım (Opt-in):** Sadece açık rıza veren kullanıcıları Resend Audience'a ekleme.
2. **Kişiselleştirilmiş Çıkış (Opt-out / 1-Click Unsubscribe):** Kullanıcıların panelden veya gelen e-postadaki tek tıkla bağlantı üzerinden kendilerini listeden çıkarabilmesi (RFC 8058 uyumlu).
3. **Otomatik Havuz Yenileme (Slot Recycling):** Bir kullanıcı abonelikten çıktığında, hesabı silindiğinde veya e-postası bounce olduğunda açılan kontenjana bekleme listesindeki (PENDING) en aktif kullanıcının otomatik terfi ettirilmesi (`ORDER BY last_active_at DESC, consent_given_at ASC`).
4. **Bounce ve Spam Önleme (Webhook & Suppression):** Resend webhook'u üzerinden gelen `email.bounced` ve `email.complained` olaylarıyla sorunlu adreslerin listeden düşürülmesi ve gereksiz gönderimlerin engellenmesi.

### B. Mimari ve Uygulama Bileşenleri

1. **Veritabanı Tablosu (`resend_contact_pool`):**
   - Migration: `db/migrations/0016_create_resend_contact_pool.sql` (Supabase Frankfurt projesine başarıyla uygulandı).
   - Alanlar: `user_id` (benzersiz), `email`, `status` (`IN_POOL`, `PENDING`, `OPTED_OUT`, `BOUNCED`), `resend_contact_id`, `consent_given_at`, `synced_at`, `unsubscribed_at`, `bounced_at`, `last_active_at`.
   - İndeksler ve RLS güvenlik politikaları eksiksiz tanımlandı.

2. **Backend Havuz Servisi (`src/modules/email/resend-pool-service.ts`):**
   - `optInUser(userId, email)`: 1.000 kotayı denetler; yer varsa Resend'e ekleyip `IN_POOL` yapar, yoksa `PENDING` kuyruğuna alır.
   - `optOutUser(userId)`: Kullanıcıyı havuzdan çıkarır, Resend Audience'tan siler ve `refillPoolSlots()` ile açılan yeri doldurur.
   - `handleBounceOrComplaint(email, type, reason)`: Bounce bildiriminde adresi `BOUNCED` yapar, Resend'den siler ve kontenjanı yeniler.
   - `refillPoolSlots()`: Açılan slot sayısını hesaplar ve beklemedeki en aktif adayları terfi ettirir.
   - `generateUnsubscribeToken()` / `verifyUnsubscribeToken()`: `AUTH_SECRET` ile HMAC-SHA256 imzalı tek kullanımlık token üretir ve doğrular.
   - `isEmailBounced(email)`: Bounce adreslerine gönderimi engelleyen suppression fonksiyonu.

3. **Abonelikten Çıkış ve Webhook Rotaları:**
   - `src/app/api/newsletter/unsubscribe/route.ts`: GET (Türkçe HTML onay ekranı) + POST (RFC 8058 `List-Unsubscribe=One-Click`). Arama motoru indekslemesini engellemek için `X-Robots-Tag: noindex, nofollow` başlığı içerir.
   - `src/app/api/webhooks/resend/route.ts`: Resend'den gelen Svix imzalı bildirimleri doğrular; `email.bounced` ve `email.complained` olaylarını işler.
   - `src/app/api/profile/marketing-consent/route.ts`: Giriş yapmış kullanıcının pazarlama iznini sorgular ve günceller.

4. **Kullanıcı Arayüzü Entegrasyonu:**
   - Kayıt Formu (`src/components/auth/register-form.tsx`): KVKK / İleti Yönetimi onay kutusu eklendi; işaretlendiğinde kayıt esnasında havuz servisine iletilir.
   - Profil Ayarları (`src/components/profile/profile-settings-form.tsx`): "Gizlilik & İletişim Tercihleri" bölümünde dinamik bülten onay kutusu eklendi.
   - Bildirimler Sayfası (`src/components/dashboard/notifications-view.tsx`): E-posta bildirim ve bülten tercihlerine yönlendiren bilgilendirici kart eklendi.

5. **E-posta Gönderim Entegrasyonu (`src/lib/email/index.ts`):**
   - Gönderim öncesi `isEmailBounced` kontrolü ile reputasyon koruması.
   - Pazarlama e-postalarına otomatik `List-Unsubscribe` ve `List-Unsubscribe-Post` başlıkları ekleme desteği.

### C. Doğrulama ve Kalite Kapıları
- **Birim Testleri (`tests/unit/resend-pool.test.ts`):** 20 adet test %100 başarılı.
  - HMAC token üretimi, doğrulaması, tahrifat ve süre kontrolü.
  - GET ve POST unsubscribe uç noktaları.
  - Svix webhook imza doğrulaması ve bounce işleme.
  - Bounce suppression ve test modu ağ izolasyonu.
  - Profil pazarlama izni rotası (yetkisiz, onay verme, onay geri çekme).
- **TypeScript Typecheck:** `npm run typecheck` (0 hata, exit code 0).
- **ESLint:** `npm run lint` (0 uyarı/hata, exit code 0).
- **Prettier:** `npm run format:check` (Tüm dosyalar biçimlendirilmiş, exit code 0).
- **Tüm Birim Testleri:** `npm run test:unit` (47 dosya, **5.358 test** %100 başarılı, exit code 0).

---

## 4. Supabase "unused_index" Linter Denetimi ve Şema İyileştirmesi

### A. Kök Neden Analizi
- Supabase Database Linter'ın `0005_unused_index` kuralı, PostgreSQL'in `pg_stat_user_indexes` tablosundaki `idx_scan = 0` değerini tarayarak henüz sorgu görmemiş indeksleri `INFO` düzeyinde listeler.
- Yeni kurulan veritabanında henüz canlı kullanıcı yükü oluşmadığı için, birincil anahtarlar (`users_pkey`, `listings_pkey`) dahil tüm indekslerin sayaçları `0` seviyesindeydi.
- Raporlanan 38 indeksin 37'si; **`unindexed_foreign_keys` tablo kilitlemelerini önleyen yabancı anahtar indeksleri**, KVKK şifreli arama (`idx_users_email_hmac`), ilan akış kompozitleri (`listings_feed_idx`) ve Resend havuz optimizasyonu için platformun vazgeçilmez temel taşıdır ve silinmeleri durumunda ağır tablo kilitlenmeleri (`ExclusiveLock`) ve sorgu gecikmeleri oluşacaktır.

### B. Uygulanan İyileştirme (Migration 0017)
- Şema taramasında `notifications` tablosunda `delivery_key` sütunu üzerinde birbirinin tam kopyası olan 2 adet benzersiz indeks tespit edildi:
  - `notifications_delivery_key_unique_idx` (Korundu)
  - `notifications_delivery_key_full_unique_idx` (Gereksiz kopya)
- **`db/migrations/0017_drop_duplicate_notification_delivery_key_idx.sql`** oluşturuldu ve Supabase (Frankfurt) veritabanına `npm run db:migrate` ile başarıyla uygulandı (Exit code: 0).
- Kalan 37 indeks korumaya alındı; platform canlıya geçtikçe bu indeksler taranacak ve Supabase paneli `idx_scan` değerleri arttıkça uyarıları otomatik olarak kapatacaktır.

---

## 5. Clerk %100 Ücretsiz Plan Tam Entegrasyonu ve Sosyal Giriş Butonları (White-Label)

### A. Tespit Edilen Problemler ve Kök Neden Analizi
1. **Microsoft Logo Bozulması:** `src/components/auth/social-login-buttons.tsx` içinde Tailwind CSS v3'te varsayılan olarak bulunmayan `h-4.5 w-4.5` sınıfları kullanılmıştı. Sınıf çözümlenemediği için SVG viewBox kısıtlamasından çıkarak dairesel butonun sınırlarını aşıyor ve orantısız görünüyordu.
2. **CSP (Content Security Policy) Kısıtlaması:** `next.config.ts` dosyasında `script-src` ve `connect-src` direktifleri sadece `'self'` olarak sınırlandırılmıştı; bu nedenle Clerk SDK browser scripti (`*.clerk.accounts.dev`) tarayıcı tarafından engelleniyordu.
3. **SSO Bağlantılarının Sadece Hesap Eşleme (Account Linking) Modunda Olması:** Clerk Dashboard'da Google dışındaki bağlantılar (GitHub, LinkedIn, Apple, Microsoft) varsayılan olarak sadece "Account Linking Only" olarak işaretliydi; bu nedenle doğrudan giriş/kayıt istekleri reddediliyordu.
4. **React Hooks Kuralları:** `useSignIn` çağrısının koşullu try/catch içinde yapılması React Hook sırası ihlaline yol açıyordu.

### B. Uygulanan Çözümler
1. **Görsel Düzeltme & Tasarım:**
   - Microsoft SVG'si `h-5 w-5 shrink-0 viewBox="0 0 24 24"` ile 4 renkli kare (Kırmızı `#F25022`, Yeşil `#7FBA00`, Mavi `#00A4EF`, Sarı `#FFB900`) ve `rx="1"` hafif kavisli köşelerle yeniden modellendi.
   - 5 dairesel sosyal buton (Google, GitHub, LinkedIn, Apple, Microsoft) eşit `h-11 w-11 shrink-0 rounded-full border border-slate-800 bg-[#12141a] overflow-hidden` tasarımıyla kusursuz hizalandı.
   - Giriş (`/tr/giris`) ve Kayıt Ol (`/tr/kayit`) ekranlarının her ikisine de eklendi; Clerk markası/logosu tamamen gizlendi (%100 Operis white-label).
2. **Clerk Dashboard Otomasyonu (Chrome DevTools MCP):**
   - API anahtarları (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` ve `CLERK_SECRET_KEY`) `.env` dosyasına senkronize edildi.
   - 5 sosyal sağlayıcının (Google, GitHub, LinkedIn, Apple, Microsoft) tamamında *"Enable for sign-up and sign-in"* aktif edildi ve kaydedildi.
   - **$0 Maliyet Koruması:** SMS / Telefon ile doğrulama tamamen devre dışı bırakıldı (Clerk SMS ücretlendirme riski %0).
   - Svix Webhook uç noktası (`https://operis.pro/api/webhooks/clerk`) yapılandırıldı; `user.created`, `user.updated`, `user.deleted` olaylarına abone olundu ve imza sırrı (`CLERK_WEBHOOK_SIGNING_SECRET`) `.env` dosyasına işlendi.
3. **CSP ve Proxy Yapılandırması:**
   - `next.config.ts` Content-Security-Policy direktiflerine `https://*.clerk.accounts.dev`, `https://challenges.cloudflare.com`, `https://img.clerk.com` eklendi; worker-src (`'self' blob:`) tanımlandı.
   - `src/proxy.ts` dosyasında `/sso-callback` rotasının `next-intl` yönlendirmesinden muaf tutulması sağlandı.
   - `src/components/auth/social-login-buttons.tsx` mimarisi `SocialLoginButtonsConnected` ve `SocialLoginButtonsFallback` olarak ayrılarak React Hooks kuralları %100 güvenceye alındı.

### C. Doğrulama ve Test Kanıtları
- **Canlı Tarayıcı Testi:** Microsoft butonuna tıklandığında doğrudan resmi `https://login.live.com` (Microsoft Oturum Açma) ekranına yönlendiği doğrulandı.
- **Konsol Denetimi:** Sayfada sıfır CSP hatası, sıfır hook uyarısı ve sıfır çalışma zamanı hatası olduğu Chrome DevTools konsolu ile kanıtlandı.
- **TypeScript & Format:** `npm run typecheck` (0 hata) ve `npm run format:check` (100% temiz).
- **Tüm Birim Testleri:** `npm run test:unit` (48 dosya, **5.360 test** %100 başarılı).



