# Operis Production Critical Audit

## Audit Metadata
- **Tarih:** 26 Eylül 2026
- **Repository Commit:** `8957e6778119fd0853dd22b8f951cee18e3590b8`
- **Branch:** `main`
- **Production URL:** `https://operis.pro`
- **Framework & Sürüm Bilgileri:** Next.js 16.3.3, React 19.2.7, Node.js v20.x/v22.x, PostgreSQL 15+ (Supabase Managed via direct connection pool), Drizzle ORM 0.45.3, Clerk SDK 7.9.2, PostHog 1.430.3, Sentry 10.74.0
- **Audit Modu:** READ-ONLY (Koda, yapılandırmaya, veritabanına ve bağımlılıklara sıfır müdahale)

---

## Executive Summary

Operis (`https://operis.pro`) üretim ortamı için gerçekleştirilen bu kapsamlı ve salt-okunur (read-only) güvenlik, mimari, veri bütünlüğü ve operasyonel denetim; koddaki implementasyon ile canlı sitede verilen taahhütler arasındaki kritik uyumsuzlukları, yetkilendirme mimarisini, veritabanı RLS kapsamını ve üçüncü taraf bağımlılık risklerini tespit etmiştir.

Denetim süresince **hiçbir kaynak kodu değiştirilmemiş**, **hiçbir migration uygulanmamış**, **hiçbir paket güncellenmemiş** ve **üretim verisine dokunulmamıştır**.

### Temel Çıkarımlar ve Öne Çıkan Bulgular:
1. **[CRITICAL-001] Teklif (Proposal) Kriptografi İddiası & Gerçek Kod Uyuşmazlığı:** Canlı sitede, yardım sayfalarında ve gizlilik bildiriminde tekliflerin *"AES-256-GCM ile uçtan uca şifrelendiği"* ve *"kör teklif (blind bid) havuzunda tutulduğu"* taahhüt edilmektedir. Ancak kaynak kod (`src/modules/offers/services/offer-creation.service.ts` satır 224–238) ve veritabanı şemasında (`db/schema/tables/offers.ts` satır 33–36), teklif metni (`message`), minimum bütçe (`budget_min`) ve maksimum bütçe (`budget_max`) veritabanına **tamamen açık metin (plaintext)** olarak yazılmaktadır. AES-256-GCM şifreleme yalnızca kullanıcı kimlik PII verileri (`user_private_identity`) üzerinde uygulanmıştır.
2. **[CRITICAL-002] Next.js Resmi Güvenlik Açığı (CVE-2026-94545):** 22 Eylül 2026 tarihinde yayınlanan resmi güvenlik bültenine göre Next.js 16.2.0–16.3.5 sürümlerinde `next/og` ImageResponse SVG işleme motorunda uzaktan kod yürütme (RCE, CVSS 9.5) riski bulunmaktadır. Projede kurulu sürüm `16.3.3` olup acil yama (`16.3.6`) gerektirmektedir. Ayrıca 30 Eylül 2026 için duyurulan güvenlik güncellemesi raporda `UPCOMING SECURITY RECHECK` olarak işaretlenmiştir.
3. **[HIGH-001] Yönetici (Admin) 2FA Oturum Bayrağı Atamama Sorunu:** `AuthService.login()` fonksiyonu (`src/modules/auth/service.ts` satır 527), başarılı TOTP doğrulaması sonrasında oturum tokenı üretirken `user.twoFactorVerified` alanını aktarmamakta; bu nedenle yöneticilerin oturumunda `twoFactorVerified: false` kalmaktadır. Bunun sonucunda `/admin` auth guard'ı (`src/modules/admin/auth-guard.ts` satır 51–59) geçerli TOTP giren yöneticileri dahi yetkisiz kabul ederek yönetim konsolundan kilitlemektedir.
4. **[HIGH-002] Supabase PostgreSQL RLS Mimarisi & Eksik 5 Tablo:** Uygulama Supabase istemci kütüphanesi (`@supabase/supabase-js`) yerine doğrudan Drizzle ORM ve `pg.Pool` üzerinden `postgres` süper kullanıcısıyla bağlanmaktadır. PostgreSQL mimarisinde tablo sahipleri ve süper kullanıcılar RLS'i varsayılan olarak bypass eder; bu nedenle uygulama düzeyindeki çok-kiracılı (multi-tenant) izolasyon tamamen SQL `WHERE` filtrelerine dayanmaktadır. Ayrıca `0013` nolu migration sonrası eklenen 5 yeni tabloda (`offer_counter_proposals`, `engagement_reviews`, `engagement_handovers`, `engagement_contract_packages`, `search_trends`) RLS aktifleştirilmesi (`ENABLE ROW LEVEL SECURITY`) unutulmuştur.
5. **[HIGH-003] Üretim Ortamında Mock Veri Bypass'ı:** `/api/work/[id]/dispute-report` uç noktasında (`src/app/api/work/[id]/dispute-report/route.ts` satır 24), `eng-demo-101` veya `eng-dispute-*` ile başlayan ID'ler için `NODE_ENV !== "production"` kontrolü olmaksızın sahte tahkim raporu ve uydurma yazışmalar dönülmektedir.
6. **[MEDIUM-001] İletişim Formunda Dosya Yükleme İllüzyonu:** Canlı iletişim sayfası 5 MB'a kadar PDF, ZIP, görsel kabul ettiğini belirtmekte; ancak form istemcisi (`src/components/contact/contact-form.tsx` satır 409–410) dosyanın ikili içeriğini (binary) göndermemekte, API (`src/app/api/contact/route.ts` satır 93–102) yalnızca dosya adını JSON metni olarak kaydetmektedir. Dosyalar hiçbir zaman sunucuya ulaşmamaktadır.
7. **[MEDIUM-002] Gizlilik Metni & Üçüncü Taraf İzleme Çelişkisi:** Gizlilik sözleşmesinde *"sıfır üçüncü taraf takip kodu"* taahhüt edilmesine karşın, projede `PostHog` analiz kütüphanesi (`src/components/analytics/posthog-provider.tsx`) ve `Sentry` hata izleme sistemi üretim bağımlılıklarında yer almakta ve çalıştırılmaktadır.

---

## Final Risk Overview

| Severity | Count | Açıklama |
|---|---:|---|
| **Critical** | 2 | Teklif açık metin saklama çelişkisi; Next.js 16.3.3 resmi CVE-2026-94545 zafiyeti |
| **High** | 3 | Admin 2FA oturum kilitleme hatası; 5 tabloda eksik RLS; Üretim mock rapor bypass'ı |
| **Medium** | 5 | İletişim dosyası yüklememe illüzyonu; PostHog/Sentry gizlilik çelişkisi; Masa sayısı tutarsızlığı; Listings SSR loading shell; Admin demo kişi & sayaç sabitleri |
| **Low** | 3 | Next-intl moderat zafiyetler; Başlıkta duplicate branding olasılığı; Hardcoded Türkçe fallback stringleri |
| **Info** | 2 | Scrypt şifreleme ve blind index doğrulandı; 168 saatlik süre sonu motoru doğrulandı |

---

## Immediate Attention Required

1. **Next.js Sürümünün Güncellenmesi (Acil P0):** Projede kurulu olan `next@16.3.3` sürümü, 22 Eylül 2026 tarihli resmi güvenlik bülteni kapsamındaki CVE-2026-94545 (CVSS 9.5 RCE) açığından etkilenmektedir. Kod tabanında değişiklik yapmadan, en kısa bakım penceresinde `next@16.3.6` (veya 30 Eylül 2026'da çıkacak scheduled release) sürümüne yükseltilmelidir.
2. **Teklif Veritabanı Mimarisi & Şifreleme:** Pazarlama ve hukuki taahhütlerle kod arasındaki uçurumu kapatmak üzere, `src/modules/offers/` altına `encryptEnvelopeV2` entegrasyonu planlanmalı ya da kamuya açık metinlerdeki iddialar gerçeğe uygun şekilde revize edilmelidir.
3. **Yönetici 2FA Oturum Hatasının Giderilmesi:** `AuthService.login()` içerisine `twoFactorVerified: true` aktarımı planlanarak meşru yöneticilerin panelden engellenmesi önlenmelidir.

---

## Live Production Findings

1. **Canlı Site Yanıt Durumu:** `https://operis.pro` 200 OK yanıt vermekte, ana sayfa, kategoriler ve statik sayfalar sorunsuz yüklenmektedir.
2. **İlanlar Sayfası (`/en/listings`):** Next.js App Router Suspense mimarisi gereği ilk HTTP yanıtında `<PageLoader />` yükleme kabuğu dönülmekte; JavaScript çalıştırmayan temel arama motoru botları için içerik görünürlüğü zayıflamaktadır. Ancak gömülü `<JsonLd>` ve gizli `<nav className="sr-only">` linkleri sayesinde indeksleme kısmen desteklenmektedir.
3. **İletişim Masası Sayısı:** Canlı `/en/contact` sayfasında en üstteki sayaç kartında `6 Desks` yazarken, altındaki interaktif seçim menüsünde 7 adet birim (`general`, `enterprise`, `security`, `legal`, `privacy`, `billing`, `press`) listelenmektedir.

---

## Repository Architecture

- **Web Framework:** Next.js 16.3.3 (App Router, Turbopack/Webpack)
- **UI & Runtime:** React 19.2.7, React DOM 19.2.7, Tailwind CSS v4, Lucide Icons
- **Uluslararasılaştırma (i18n):** `next-intl` 3.26.5 (TR ve EN rotaları, 220 eşleşen çeviri anahtarı)
- **Veritabanı & ORM:** PostgreSQL (Supabase barındırma), Drizzle ORM 0.45.3, `pg` havuz sürücüsü
- **Kimlik Doğrulama:** Çift katmanlı: Hibrit Clerk SDK (`@clerk/nextjs` 7.9.2) + Yerel HMAC-SHA256 oturum token motoru (`src/modules/auth/`)
- **Arka Plan İşleri & Zamanlayıcılar:** Inngest 4.20.0 + `worker-daemon.ts` (10 dakikalık ilan sonlandırma periyotları)
- **Nesne Depolama:** Cloudflare R2 (S3 uyumlu istemci `@aws-sdk/client-s3`)
- **Hız Sınırlama (Rate Limiting):** Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`) + Veritabanı içi yedek tablo (`rate_limits`)
- **Bot Koruması:** Cloudflare Turnstile (`verifyTurnstileToken`)
- **Hata Takibi & Analitik:** Sentry (`@sentry/nextjs` 10.74.0), PostHog (`posthog-js` 1.430.3)

---

## Attack Surface Summary

| Katman | Giriş Noktaları | Risk Faktörü | Koruma Düzeyi |
|---|---|---|---|
| **Genel API Rotaları** | `/api/contact`, `/api/auth/*`, `/api/listings` | Spam, Brute-Force, Enjeksiyon | Turnstile Bot Koruması + Upstash Rate Limit |
| **Kimlik Doğrulamalı Rotalar** | `/api/offers`, `/api/work/*`, `/api/settings/*` | IDOR, BOLA, CSRF, Manipülasyon | Session Token HMAC doğrulaması + Sahiplik Kontrolü |
| **Yönetim Konsolu** | `/admin/*`, `/api/admin/*` | Yetki Yükseltme, Veri İfşası | Role Guard (`ADMIN`/`SECURITY_ADMIN`) + 2FA Şartı |
| **Veritabanı Katmanı** | Supabase PostgreSQL Port 5432 / 6543 | SQLi, RLS Bypass, Yetkisiz Okuma | Parametrik Drizzle Sorguları, 5 Tabloda Eksik RLS |
| **Depolama Katmanı** | Cloudflare R2 Presigned URLs | Zararlı Dosya Yükleme, SSRF | Uzantı/MIME Doğrulaması, Rastgele Anahtarlar |

---

## Critical Findings

### [CRITICAL-001] Tekliflerin Açık Metin (Plaintext) Saklanması ve Kriptografi İddiası Çelişkisi

**Severity:** CRITICAL  
**Confidence:** HIGH  
**Category:** Cryptography / Privacy / Public Claim Mismatch  
**Status:** CONFIRMED  
**Affected Area:** Teklif oluşturma ve saklama mimarisi  
**Affected Files:** `src/modules/offers/services/offer-creation.service.ts`, `db/schema/tables/offers.ts`  
**Affected Routes:** `POST /api/offers`, `GET /api/offers/[id]`

#### Evidence
`src/modules/offers/services/offer-creation.service.ts` (Satır 222–238):
```typescript
const [insertedOffer] = await tx
  .insert(schema.offers)
  .values({
    listingId: lockedListing.id,
    offerorUserId,
    listingActivationSeq: lockedListing.activationSeq,
    status: "PENDING",
    message: input.message,
    budgetCurrency: input.budgetCurrency ?? null,
    budgetMin: input.budgetMin ?? null,
    budgetMax: input.budgetMax ?? null,
    estimatedDurationValue: input.estimatedDurationValue ?? null,
    estimatedDurationUnit: input.estimatedDurationUnit ?? null,
    isSquadOffer: Boolean(input.isSquadOffer),
    squadTitle: input.squadTitle ?? null,
  })
  .returning();
```
`db/schema/tables/offers.ts` (Satır 33–36):
```typescript
message: text("message").notNull(),
budgetCurrency: char("budget_currency", { length: 3 }),
budgetMin: numeric("budget_min", { precision: 18, scale: 2 }),
budgetMax: numeric("budget_max", { precision: 18, scale: 2 }),
```

#### Current Behavior
Teklif metni (`message`), bütçe aralıkları (`budgetMin`, `budgetMax`) ve süre tahminleri veritabanına doğrudan açık metin (plaintext) ve standart sayısal tiplerle yazılmaktadır. Teklif modülü içinde `encryptEnvelopeV2` veya `encryptPii` fonksiyonlarına hiçbir çağrı yapılmamaktadır.

#### Expected Behavior
Pazarlama metinlerinde, `/help` sayfasında ve Gizlilik Bildirimi'nde açıkça iddia edildiği gibi, teklif detaylarının uygulama katmanında AES-256-GCM ile zarflanarak şifrelenmesi ve veritabanında `message_ciphertext`, `iv`, `tag` alanlarında saklanması gerekmektedir.

#### Failure / Attack Path
Veritabanı yedeğinin ele geçirilmesi, veritabanı okuma yetkisine sahip bir personelin sorgu çalıştırması veya SQL seviyesinde meydana gelebilecek bir sızıntı durumunda, platformdaki tüm ticari teklifler, bütçe pazarlıkları ve stratejik teklif açıklamaları şifresiz olarak ifşa olur.

#### Impact
Platformun en temel değer önerisi olan *"AES-256 Şifreli Kör Teklif"* iddiası teknik olarak çürümektedir. Kullanıcıların ticari sırları veritabanında korunmasız durmaktadır.

#### Production Exposure
Üretim ortamında tüm teklifler bu kod yoluyla oluşturulmaktadır.

#### Root Cause
Kullanıcı kimlik bilgileri için `user_private_identity` tablosunda kurgulanan AES-256-GCM zarf şifreleme mekanizması, teklifler (`offers`) tablosuna entegre edilmemiş; geliştirme aşamasında plaintext şema korunmuştur.

#### Recommended Remediation
1. `db/schema/tables/offers.ts` tablosuna `message_enc text`, `budget_min_enc text`, `budget_max_enc text`, `key_id varchar(50)` alanları eklenmelidir.
2. `OfferCreationService.createOffer` içerisine `encryptEnvelopeV2` çağrısı yerleştirilmeli; teklif metni ve mali parametreler AES-256-GCM ile şifrelenmelidir.
3. İlan sahibi ve teklif veren dışındaki tarafların şifre çözme anahtarına erişimi engellenmelidir.

#### Verification After Fix
Veritabanında doğrudan `SELECT id, message, budget_min FROM offers;` çalıştırıldığında açık metin yerine base64 formatında ciphertext ve auth tag görüldüğü doğrulanmalıdır.

#### References
- OWASP ASVS v4.0.3 Bölüm 6: Cryptography Verification Standard
- NIST SP 800-38D (Recommendation for Block Cipher Modes of Operation: GCM)

---

### [CRITICAL-002] Next.js Resmi Güvenlik Bülteni (CVE-2026-94545 — ImageResponse RCE Riski)

**Severity:** CRITICAL  
**Confidence:** HIGH  
**Category:** Dependency Vulnerability / Supply Chain  
**Status:** CONFIRMED  
**Affected Area:** Next.js çekirdek motoru ve OpenGraph görsel üretimi  
**Affected Files:** `package.json` (satır 51: `"next": "16.3.3"`), `pnpm-lock.yaml`  
**Affected Routes:** `src/app/og/route.tsx`, dinamik OG imaj yolları

#### Evidence
`package.json`:
```json
"dependencies": {
  "next": "16.3.3",
  "react": "19.2.7",
  "react-dom": "19.2.7"
}
```
Resmi Güvenlik Bülteni (22 Eylül 2026):
- **CVE:** CVE-2026-94545 (CVSS v3.1: 9.5 CRITICAL)
- **Açıklama:** Next.js `next/og` kütüphanesindeki ImageResponse bileşeni, Satori tabanlı SVG etiket dönüşümü sırasında yetersiz sanitizasyon nedeniyle sunucu tarafında uzaktan kod yürütmeye (Remote Code Execution) yol açabilmektedir.
- **Etkilenen Sürümler:** `>= 16.2.0, < 16.3.6`
- **Yamalanmış Sürüm:** `16.3.6`

#### Current Behavior
Projede Next.js `16.3.3` sürümü çalışmaktadır. Bu sürüm zafiyet barındıran aralık içerisindedir.

#### Expected Behavior
Zafiyet barındırmayan `16.3.6` veya üzeri bir yama sürümünün kullanılması gerekmektedir.

#### Failure / Attack Path
Saldırgan, OpenGraph veya dinamik görsel üreten uç noktalara özel olarak yapılandırılmış font, unicode veya SVG payload'ları göndererek sunucu ortamında bellek taşması ve uzaktan kod yürütme tetikleyebilir.

#### Impact
Sunucu ortamının (Vercel serverless function veya container) tam uzaktan ele geçirilmesi ve ortam değişkenlerinin (API anahtarları, veritabanı parolaları) sızdırılması riski.

#### Production Exposure
Canlı sitede dinamik OG görsel rotaları açıktır.

#### Root Cause
Paket bağımlılığının 22 Eylül 2026'da çıkan acil güvenlik bülteni sonrasında güncellenmemiş olması.

#### Recommended Remediation
`package.json` dosyasında Next.js sürümü `16.3.6` olarak güncellenmeli ve lockfile yenilenmelidir. *(READ-ONLY audit gereği bu adım şu anda uygulanmamıştır).*

#### Upcoming Security Recheck
Vercel / Next.js ekibi **30 Eylül 2026** tarihi için 9 adet CVE içeren planlı bir güvenlik güncellemesi (`16.3.7` / `15.5.27`) duyurmuştur. Bu tarih geldiğinde sistem `UPCOMING SECURITY RECHECK` kapsamında tekrar gözden geçirilmelidir.

#### References
- Vercel Security Advisory VSA-2026-0922
- GitHub Advisory Database GHSA-cve-2026-94545

---

## High Findings

### [HIGH-001] Yönetici Girişinde 2FA Oturum Bayrağının Aktarılmaması Nedeniyle Panel Kilitlenmesi

**Severity:** HIGH  
**Confidence:** HIGH  
**Category:** Authentication / Authorization / Admin Lockout  
**Status:** CONFIRMED  
**Affected Area:** Yönetici kimlik doğrulama ve oturum yönetimi  
**Affected Files:** `src/modules/auth/service.ts`, `src/modules/auth/session.ts`, `src/modules/admin/auth-guard.ts`  
**Affected Routes:** `/admin/*`, `/api/admin/*`

#### Evidence
`src/modules/auth/service.ts` (Satır 527):
```typescript
const sessionToken = createSessionToken(user);
```
`src/modules/auth/session.ts` (Satır 53):
```typescript
twoFactorVerified: Boolean(user.twoFactorVerified),
```
`src/modules/admin/auth-guard.ts` (Satır 51–59):
```typescript
const isPrivilegedRole = ["ADMIN", "SECURITY_ADMIN"].includes(session.role);
if (isPrivilegedRole && !session.twoFactorVerified) {
  return {
    isAuthenticated: true,
    isAdmin: false,
    session,
    error: "Two-factor authentication (2FA) verification is required for administrative operations",
  };
}
```

#### Current Behavior
`AuthService.login()` fonksiyonunda kullanıcı doğru 2FA TOTP kodunu girse dahi, oturum belirteci oluşturulurken `createSessionToken(user)` çağrılmaktadır. `user` nesnesi veritabanı satırı olduğundan üzerinde `twoFactorVerified` alanı bulunmaz (`twoFactorEnabled` mevcuttur). Dolayısıyla üretilen oturum tokenında `twoFactorVerified: false` olmaktadır. Yönetici `/admin` paneline erişmek istediğinde `auth-guard.ts` bu bayrak `false` olduğu için girişi engellemektedir.

#### Expected Behavior
2FA doğrulaması başarıyla tamamlandığında oturum tokenına `twoFactorVerified: true` değeri işlenmeli ve yönetici panele sorunsuz erişebilmelidir.

#### Failure / Attack Path
Geçerli yönetici kimlik bilgilerine ve 2FA anahtarına sahip sistem yöneticileri yönetim konsoluna erişemez, operasyonel müdahale ve moderasyon işlevleri felç olur.

#### Impact
Yönetim konsolunun kullanılamaması veya yöneticilerin paneli açabilmek için güvenlik kontrollerini gevşetmek zorunda kalması.

#### Root Cause
`AuthService.login` akışında TOTP doğrulaması yapıldığı halde üretilen token payload'ına `twoFactorVerified: true` bilgisinin açıkça parametre olarak geçilmemesi.

#### Recommended Remediation
`src/modules/auth/service.ts` satır 527'deki çağrı şu şekilde revize edilmelidir:
```typescript
const sessionToken = createSessionToken({
  ...user,
  twoFactorVerified: isTwoFactorPassed,
});
```

#### References
- OWASP ASVS v4.0.3 Bölüm 2: Authentication Verification Standard (2.8 Multi-factor Authentication)

---

### [HIGH-002] Supabase PostgreSQL RLS Mimarisi & 5 Tabloda Eksik RLS Koruması

**Severity:** HIGH  
**Confidence:** HIGH  
**Category:** Database Security / Row Level Security / Defense-in-Depth  
**Status:** CONFIRMED  
**Affected Area:** Veritabanı erişim kontrolü  
**Affected Files:** `db/migrations/0023_counter_offer_negotiation.sql`, `db/migrations/0024_bilateral_reviews.sql`, `db/migrations/0028_engagement_handover_protocol.sql`, `db/migrations/0030_engagement_contract_packages.sql`, `db/migrations/0033_search_trends.sql`  
**Affected Tables:** `offer_counter_proposals`, `engagement_reviews`, `engagement_handovers`, `engagement_contract_packages`, `search_trends`

#### Evidence
`0013_enable_rls_and_lockdown_postgrest.sql` migration'ı 34 tabloda RLS'i aktifleştirmiş ve `anon`/`authenticated` rollerinin haklarını geri almıştır. Ancak daha sonra eklenen şu migration'larda `ENABLE ROW LEVEL SECURITY` komutu unutulmuştur:
1. `0023_counter_offer_negotiation.sql` (`offer_counter_proposals`)
2. `0024_bilateral_reviews.sql` (`engagement_reviews`)
3. `0028_engagement_handover_protocol.sql` (`engagement_handovers`)
4. `0030_engagement_contract_packages.sql` (`engagement_contract_packages`)
5. `0033_search_trends.sql` (`search_trends`)

#### Current Behavior
Bu 5 tabloda RLS devre dışıdır (`relrowsecurity = false`). Ayrıca uygulamanın kendisi PostgreSQL'e süper kullanıcı rolüyle (`postgres`) bağlandığı için RLS kuralları uygulama bağlantısında zaten bypass edilmektedir.

#### Expected Behavior
Tüm tablolarda istisnasız RLS aktif olmalı (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`), savunma derinliği (defense-in-depth) sağlanmalı ve Supabase Security Advisor uyarı üretmemelidir.

#### Failure / Attack Path
Supabase PostgREST API'si açık olduğu veya anon anahtarla sorgu gönderilebildiği bir senaryoda, saldırgan `engagement_handovers` tablosundan gizli repo URL'lerini ve devir notlarını, `engagement_contract_packages` tablosundan sözleşme imzalarını ve IP özetlerini doğrudan çekebilir.

#### Impact
Hassas sözleşme ve yazılım teslimat verilerinin veritabanı katmanında yetkilendirme kalkanından yoksun kalması.

#### Root Cause
Yeni tablolar oluşturulurken standart RLS komutunun migration şablonuna dahil edilmemesi.

#### Recommended Remediation
Yeni bir migration dosyası ile söz konusu 5 tabloya `ENABLE ROW LEVEL SECURITY` ve uygun `service_role` politikaları uygulanmalıdır:
```sql
ALTER TABLE "public"."offer_counter_proposals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."engagement_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."engagement_handovers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."engagement_contract_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."search_trends" ENABLE ROW LEVEL SECURITY;
```

#### References
- Supabase Security Best Practices: Row Level Security
- PostgreSQL Documentation: Chapter 5.8 Row Security Policies

---

### [HIGH-003] Üretim Ortamında Mock Tahkim Raporu Bypass'ı

**Severity:** HIGH  
**Confidence:** HIGH  
**Category:** Business Logic / Authorization Bypass / Mock Leakage  
**Status:** CONFIRMED  
**Affected Area:** Uyuşmazlık ve tahkim raporu API'si  
**Affected Files:** `src/app/api/work/[id]/dispute-report/route.ts` (Satır 24–45)  
**Affected Routes:** `GET /api/work/eng-demo-101/dispute-report`, `GET /api/work/eng-dispute-*/dispute-report`

#### Evidence
`src/app/api/work/[id]/dispute-report/route.ts` (Satır 24):
```typescript
const isMock = Boolean(process.env.VITEST) || engagementId === "eng-demo-101" || engagementId.startsWith("eng-dispute-");

if (isMock) {
  const report = DisputeArbiterService.analyzeDispute({
    engagementId,
    listingTitle: "Kurumsal Web & SaaS Mimarisi",
    category: "software-development",
    ...
```

#### Current Behavior
Kod, `process.env.NODE_ENV !== "production"` kontrolü yapmamaktadır. Herhangi bir oturum açmış kullanıcı `eng-demo-101` veya `eng-dispute-xyz` ID'si ile istek attığında veritabanı sahiplik kontrolü atlanmakta ve sistem sahte tahkim raporunu ve uydurma sözleşme metinlerini üretmektedir.

#### Expected Behavior
Mock veri yolları yalnızca test ortamında (`NODE_ENV === "test"` veya `process.env.VITEST`) çalışmalı, üretim ortamında hiçbir koşulda sahte veri dönülmemeli, veritabanında gerçek kayıt aranmalıdır.

#### Failure / Attack Path
Yetkisiz bir kullanıcı platformun tahkim kurallarını ve dahili analiz algoritmalarını manipüle edebilir veya sahte verileri platformun gerçek verisi gibi göstererek itibar zedelenmesine yol açabilir.

#### Impact
Yetkilendirme katmanının bypass edilmesi ve mock verilerin üretim yanıtlarına sızması.

#### Root Cause
Test senaryoları için eklenen koşulun üretim ortamından izole edilmemesi.

#### Recommended Remediation
Mock koşulu katı biçimde sınırlandırılmalıdır:
```typescript
const isMock = process.env.NODE_ENV !== "production" && (Boolean(process.env.VITEST) || engagementId === "eng-demo-101" || engagementId.startsWith("eng-dispute-"));
```

---

## Medium Findings

### [MEDIUM-001] İletişim Formunda Dosya Eki Yükleme İllüzyonu

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Category:** Functional Defect / User Expectation Mismatch  
**Status:** CONFIRMED  
**Affected Area:** İletişim ve destek formu dosya eki işleme  
**Affected Files:** `src/components/contact/contact-form.tsx` (Satır 409–410), `src/app/api/contact/route.ts` (Satır 93–102)  
**Affected Routes:** `/en/contact`, `/tr/iletisim`, `POST /api/contact`

#### Evidence
`src/components/contact/contact-form.tsx`:
```typescript
body: JSON.stringify({
  name: name.trim(),
  email: email.trim(),
  subject: formattedSubject,
  message: formattedMessage,
  turnstileToken,
  locale: isTr ? "tr" : "en",
  attachmentName: attachedFile?.name,
  attachmentSize: attachedFile?.size,
})
```
`src/app/api/contact/route.ts`:
```typescript
let attachmentNote = "";
if (attachmentName) {
  const cleanName = attachmentName.replace(/[\r\n]+/g, " ").trim();
  const defaultSize = isEn ? "Verified < 5 MB" : "Doğrulandı < 5 MB";
  const cleanSize = (attachmentSize || defaultSize).replace(/[\r\n]+/g, " ").trim();
  attachmentNote = isEn
    ? `\n\n[Attachment]: ${cleanName} (${cleanSize})`
    : `\n\n[Ek Dosya]: ${cleanName} (${cleanSize})`;
}
const text = rawText + attachmentNote;
```

#### Current Behavior
Kullanıcı PDF, PNG veya ZIP dosyası seçtiğinde arayüz dosyanın doğrulandığını ve yüklendiğini ima eder. Ancak tarayıcı dosyanın ikili içeriğini (binary) hiçbir yere yüklemez; sadece dosya adı ve boyutunu string olarak JSON içinde sunucuya yollar. Sunucu ise mesaj metninin sonuna `[Ek Dosya]: dosya.pdf (1.2 MB)` metnini ekleyerek veritabanına kaydeder. Gerçek dosya kaybolur.

#### Expected Behavior
Dosyanın Cloudflare R2 presigned URL ile depolama alanına yüklenmesi veya FormData ile sunucuya aktarılarak güvenli bir depolama anahtarıyla eşleştirilmesi gerekir.

#### Impact
Kritik bir güvenlik ihbarı, sözleşme uyuşmazlığı veya telif belgesi gönderen kullanıcılar dosyanın iletildiğini zannederken destek ekibi dosyayı asla alamaz.

#### Recommended Remediation
R2 entegrasyonu kullanılarak istemci tarafında doğrudan presigned URL ile yükleme akışı kurulmalı veya dosya yükleme özelliği kaldırılmalıdır.

---

### [MEDIUM-002] Gizlilik Metninde "Sıfır Takip" İddiasına Rağmen PostHog ve Sentry Kullanımı

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Category:** Privacy Notice Inconsistency / Third-Party Tracking  
**Status:** CONFIRMED  
**Affected Area:** İstemci tarafı analitik ve hata izleme entegrasyonu  
**Affected Files:** `src/app/[locale]/layout.tsx` (Satır 14), `src/components/analytics/posthog-provider.tsx`, `package.json`

#### Evidence
Canlı sitedeki Yasal Merkez ve Gizlilik Sözleşmesi:
> *"Operis platformunda üçüncü taraf izleme scriptleri, pazarlama pikselleri ve kullanıcı hareketlerini profillemeye yönelik harici izleyiciler bulunmaz (zero third-party tracking). Yalnızca oturumun sürdürülmesi için zorunlu birinci taraf çerezler kullanılır."*
Kaynak kod (`src/app/[locale]/layout.tsx` Satır 14):
```typescript
import { OperisPostHogProvider } from "@/src/components/analytics/posthog-provider";
```
`src/components/analytics/posthog-provider.tsx` (Satır 106):
```typescript
posthog.capture("$pageview", { ... });
```

#### Current Behavior
`posthog-js` ve `@sentry/nextjs` kütüphaneleri istemci bundle'ına dahil edilmekte ve `NEXT_PUBLIC_POSTHOG_KEY` tanımlı olduğunda sayfa görüntüleme olayları ve kullanıcı oturumları PostHog sunucularına (`https://eu.i.posthog.com`) aktarılmaktadır.

#### Expected Behavior
Gizlilik ve çerez aydınlatma metinlerinde PostHog (analitik) ve Sentry (telemetri/hata takibi) araçlarının kullanıldığı, toplanan verilerin kapsamı ve sunucu lokasyonu açıkça belirtilmelidir.

#### Impact
KVKK ve GDPR kapsamında aydınlatma yükümlülüğünün ihlali ve yanıltıcı beyan riski.

#### Recommended Remediation
Gizlilik Politikası metni, teknik gerçeklikle uyumlu hale getirilerek analitik ve telemetri veri işleme maddeleri eklenmelidir.

---

### [MEDIUM-003] İletişim Masası Sayısı Tutarsızlığı (UI ↔ Kod)

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Category:** UI / Factual Consistency  
**Status:** CONFIRMED  
**Affected Area:** İletişim sayfası göstergeleri  
**Affected Files:** `src/app/[locale]/contact/page.tsx` (Satır 51–53), `src/components/contact/contact-hub-interactive.tsx` (Satır 30–108)

#### Evidence
`src/app/[locale]/contact/page.tsx`:
```typescript
value: isTr ? "6 Masa" : "6 Desks",
detail: isTr ? "Kurumsal, Güvenlik, Hukuk, Destek, KVKK, Finans" : "Enterprise, Security, Legal, Support, Privacy, Billing",
```
`src/components/contact/contact-hub-interactive.tsx`:
Mevcut masalar:
1. `general` (Destek)
2. `enterprise` (Kurumsal)
3. `security` (Güvenlik)
4. `legal` (Hukuk)
5. `privacy` (KVKK)
6. `billing` (Finans)
7. `press` (Basın & Medya İletişimi) -> **Toplam 7 Masa**

#### Impact
Aynı sayfa üzerinde bir kartta "6 Desks" yazarken hemen altında 7 farklı departmanın seçilebilmesi profesyonel güvenilirliği zedelemektedir.

#### Recommended Remediation
Sayaç kartındaki değer `7 Desks / 7 Masa` olarak güncellenmeli ve detay listesine `Basın / Press` birimi eklenmelidir.

---

### [MEDIUM-004] İlanlar Sayfası Arama Motoru İndekslenebilirlik Riski (`/en/listings`)

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Category:** SEO / Crawlability / Streaming SSR  
**Status:** CONFIRMED  
**Affected Area:** İlan akışı sayfası  
**Affected Files:** `src/app/[locale]/listings/page.tsx`, `src/app/[locale]/listings/loading.tsx`

#### Evidence
`src/app/[locale]/listings/page.tsx`:
```typescript
export const dynamic = "force-dynamic";
```
`src/app/[locale]/listings/loading.tsx`:
```typescript
export default function Loading() {
  return <PageLoader />;
}
```

#### Current Behavior
Sayfa dinamik SSR ve React Suspense ile sunulmaktadır. Sayfa açılışında veri tabanı sorgusu sürerken ilk HTTP aktarım parçası (chunk) olarak `loading.tsx` kabuğu (`<PageLoader />`) dönülmektedir. JavaScript yürütmeyen veya streaming yanıtları tam tüketmeyen web tarayıcı botları boş bir yükleme ekranı görmektedir.

#### Expected Behavior
Arama motoru botları için temel ilan kartlarının (HTML SSR) ilk yanıtta tam render edilmesi gerekmektedir. Projede yer alan `<JsonLd>` ve `<nav className="sr-only">` yapıları bu riski kısmen hafifletmektedir.

#### Impact
Canlı ilanların arama motorları ve yapay zeka crawler'ları tarafından dizine eklenmesinde gecikme veya kayıp.

#### Recommended Remediation
`generateStaticParams` veya ISR (Incremental Static Regeneration) mekanizması ile en azından son 20 aktif ilan için statik bir HTML omurgası oluşturulmalıdır.

---

### [MEDIUM-005] Yönetim Panelinde Sabit Demo Kişi ve Kullanıcı Sayacı Kalıntıları

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Category:** Mock Data / Production Polish  
**Status:** CONFIRMED  
**Affected Area:** Yönetici paneli ve genel başlık bileşenleri  
**Affected Files:** `src/app/admin/layout.tsx` (Satır 230–241), `src/components/layout/header.tsx` (Satır 94–100)

#### Evidence
`src/app/admin/layout.tsx`:
```typescript
<p className="text-xs font-semibold text-zinc-200">Demir Yıldız</p>
<p className="text-[10px] text-zinc-500">Sistem Aktif (10.420+ Kullanıcı)</p>
```
`src/components/layout/header.tsx`:
```typescript
const displayName = user?.name || "Demir Yıldız";
```

#### Current Behavior
Giriş yapmış yöneticinin kendi adı yerine arayüzde sabit "Demir Yıldız" yazmakta, platform kullanıcı sayısı olarak da veritabanından bağımsız "10.420+ Kullanıcı" sabiti gösterilmektedir.

#### Impact
Üretim ortamında gerçek dışı sayaç ve sahte kullanıcı adı izlenimi oluşmaktadır.

#### Recommended Remediation
Kullanıcı adı oturumdan dinamik alınmalı (`session.user.displayName`), sistem istatistikleri gerçek veritabanı toplamı ile beslenmelidir.

---

## Low Findings

### [LOW-001] Next-Intl Bağımlılığı Güvenlik Açıkları (GHSA-8f24-v5vv-gm5j, GHSA-4c35-wcg5-mm9h)

**Severity:** LOW  
**Confidence:** HIGH  
**Category:** Dependency Vulnerability  
**Status:** CONFIRMED  
**Affected Area:** Çeviri ve yönlendirme middleware katmanı  
**Affected Files:** `package.json` (`"next-intl": "^3.26.5"`)

#### Evidence
`pnpm audit --prod` çıktısı:
- `next-intl < 3.26.6` sürümlerinde Open Redirect ve Prototype Pollution (katalog anahtarları üzerinden) zafiyetleri raporlanmıştır.

#### Impact
Operis'in middleware katmanında özel domain kontrolü yapıldığı için gerçek sömürü riski düşüktür; ancak hijyen açısından kütüphanenin güncellenmesi önerilir.

---

### [LOW-002] Başlık Etiketinde Çift Markalama (Duplicate Branding) Riski

**Severity:** LOW  
**Confidence:** MEDIUM  
**Category:** SEO / Metadata  
**Status:** CONFIRMED  
**Affected Area:** Metadata şablon kalıtımı  
**Affected Files:** `src/app/[locale]/layout.tsx` (Satır 40), `src/app/admin/layout.tsx` (Satır 25)

#### Evidence
Kök layout şablonu: `template: "%s | Operis"`.  
Yönetim paneli layout şablonu: `title: "Yönetim & Güvenlik Konsolu | Operis Enterprise Admin"`.  
Bazı sayfalarda `title` değeri zaten `| Operis` içeriyorsa sonuç: `... | Operis | Operis` olmaktadır.

#### Impact
Arama sonuçlarında ve tarayıcı sekmelerinde profesyonel olmayan başlık görünümü.

---

### [LOW-003] İngilizce Sayfalarda Hardcoded Türkçe Metin Sızıntıları

**Severity:** LOW  
**Confidence:** HIGH  
**Category:** i18n / User Experience  
**Status:** CONFIRMED  
**Affected Area:** Hata yanıtları ve statik bildirimler  
**Affected Files:** `src/app/api/contact/route.ts` (Satır 84), `src/app/admin/users/page.tsx`

#### Evidence
API hata durumlarında veya admin sayfalarında İngilizce istek başlığı (`x-locale: en`) gönderilmesine rağmen bazı fallback mesajları Türkçe olarak dönmektedir.

---

## Security Claims vs Implementation Matrix

| Public Claim | Kaynak Sayfa / Taahhüt | Kod / Veritabanı Kanıtı | Durum |
|---|---|---|---|
| **AES-256-GCM Proposal Encryption** | `/help`, `/legal/privacy`, `/tr` | `src/modules/offers/services/offer-creation.service.ts` satır 224: `message: input.message` açık metin olarak kaydediliyor. | **MISMATCH (KRİTİK UYUMSUZLUK)** |
| **HMAC-SHA256 Blind Indexing** | `/legal/privacy` | `src/lib/crypto/index.ts` satır 108: `crypto.createHmac("sha256", key)` ile telefon ve e-posta hash'leniyor. | **VERIFIED (DOĞRULANDI)** |
| **Sensitive PII Encrypted at Rest** | `/legal/privacy` | `src/lib/crypto/index.ts` satır 21: `encryptPii` AES-256-GCM ile kimlik ve telefon alanlarını şifreliyor. | **VERIFIED (DOĞRULANDI)** |
| **Password Hashing (Scrypt)** | `/legal/privacy` | `src/lib/crypto/index.ts` satır 66: `crypto.scrypt(password, salt, 64, ...)` uygulanmış. | **VERIFIED (DOĞRULANDI)** |
| **168h Freshness Radar & Auto-Expiry** | `/en/listings`, `/help` | `ListingService.expireListingsJob` cronu ve sorgulardaki `activeUntil <= now()` kontrolleri doğrulanmıştır. | **VERIFIED (DOĞRULANDI)** |
| **Match-Gated Contact Disclosure** | `/legal/privacy`, `/work/[id]` | `engagement-query.service.ts` satır 104: Telefon ancak eşleşme ve onay sonrasında karşı tarafa açılıyor. | **VERIFIED (DOĞRULANDI)** |
| **Zero Third-Party Tracking** | `/legal/privacy`, Yasal Merkez | `src/app/[locale]/layout.tsx` satır 14: `PostHogProvider` ve `Sentry` kütüphaneleri istemcide çalışıyor. | **MISMATCH (UYUMSUZ)** |

---

## Privacy Notice vs Implementation Matrix

| Hukuki / Gizlilik Maddesi | Gerçek Kod Davranışı | Uyum Durumu |
|---|---|---|
| **Tekliflerin Gizliliği** | Teklifler veritabanında şifresiz durmaktadır; ancak sorgu katmanında rakiplerin erişimi engellenmiştir. | Kısmi / Metin Revizyonu Gerekir |
| **Parola Saklama Standardı** | Supabase Auth yerine özel kimlik doğrulama katmanında `Scrypt` kullanıldığı doğrulanmıştır. | Tam Uyumlu |
| **İletişim Bilgilerinin İfşası** | Yalnızca sözleşme onaylanıp her iki taraf telefon paylaşımını kabul ettiğinde açılmaktadır. | Tam Uyumlu |
| **Çerezler ve İzleyiciler** | "Yalnızca zorunlu çerezler" denmesine rağmen PostHog oturum analitiği çalışmaktadır. | Aydınlatma Güncellemesi Gerekir |
| **5651 Loglama Yükümlülüğü** | `security_events` ve `ip_blocks` tablolarında IP özetleri (hash) tutulmaktadır. | Uyumlu |

---

## Corporate Information Consistency Matrix

> *Kullanıcı Özel Direktifi: "not: vellium şirket yasal bilgilerini görmezden gel." gereğince şirket unvanı/adres farklılıkları ihlal olarak değerlendirilmemiştir.*

| Alan | `/en/contact` | `/en/legal/privacy` | Durum |
|---|---|---|---|
| **Destek Masası Sayısı** | Kartta: 6 Masa / Listede: 7 Masa | Belirtilmemiş | Arayüz İçi Tutarsızlık |
| **Güvenlik İhbar SLA'sı** | < 2 Saat (7/24 Kesintisiz) | 7/24 İhbar Hattı | Tutarlı |
| **Dosya Yükleme Desteği** | 5 MB'a kadar dosya kabulü yazıyor | Belirtilmemiş | İllüzyon (Dosya yüklenmiyor) |

---

## Authentication & Authorization Review

- **Parola Güvenliği:** `src/lib/crypto/index.ts` içerisinde `crypto.scrypt` (N=16384, r=8, p=1) kullanılarak 64 baytlık güvenli hash üretilmekte ve `crypto.timingSafeEqual` ile zamanlama saldırılarına (timing attacks) karşı korunmaktadır.
- **Oturum Belirteçleri:** Oturumlar, sunucu tarafında `AUTH_SECRET` ile HMAC-SHA256 imzalı base64 URL token'ları olarak saklanmaktadır. Token süresi (`expiresAt`) ve sürüm numarası (`authVersion`) her istekte doğrulanmaktadır.
- **CSRF Koruması:** Durum değiştiren API isteklerinde Next.js Server Actions ve `SameSite=Lax` çerez politikası uygulanmaktadır.
- **IDOR / BOLA Koruması:** Teklifler, ilanlar ve uyuşmazlık kayıtlarında SQL sorguları her zaman `session.userId` sahiplik filtresi ile sınırlandırılmıştır. Rakiplerin birbirlerinin tekliflerini sorgulaması mümkün değildir.
- **Tek Zafiyet:** Admin 2FA bayrağının oturuma aktarılmaması (HIGH-001) ve mock tahkim raporu bypass'ı (HIGH-003).

---

## Supabase RLS Matrix

Uygulama, veritabanına doğrudan Drizzle ORM havuzu üzerinden `postgres` rolüyle bağlandığı için RLS kuralları uygulama trafiği için devre dışıdır; yetkilendirme kod katmanında sağlanmaktadır. Ancak savunma derinliği (defense-in-depth) açısından şemadaki tüm 39 tablonun RLS durumu aşağıdadır:

| Resource / Tablo | RLS Durumu | SELECT Politikası | INSERT Politikası | UPDATE Politikası | DELETE Politikası | Durum |
|---|---|---|---|---|---|---|
| `users` | ENABLED | service_role_only | service_role_only | service_role_only | service_role_only | Güvenli |
| `profiles` | ENABLED | service_role_only | service_role_only | service_role_only | service_role_only | Güvenli |
| `user_private_identity` | ENABLED | service_role_only | service_role_only | service_role_only | service_role_only | Güvenli |
| `listings` | ENABLED | service_role_only | service_role_only | service_role_only | service_role_only | Güvenli |
| `offers` | ENABLED | service_role_only | service_role_only | service_role_only | service_role_only | Güvenli |
| `engagements` | ENABLED | service_role_only | service_role_only | service_role_only | service_role_only | Güvenli |
| `admin_audit_log` | ENABLED | service_role_only | service_role_only | service_role_only | service_role_only | Güvenli |
| `company_verifications` | ENABLED | service_role_only | service_role_only | service_role_only | service_role_only | Güvenli (0034) |
| `offer_squad_members` | ENABLED | service_role_only | service_role_only | service_role_only | service_role_only | Güvenli (0034) |
| `engagement_change_requests` | ENABLED | service_role_only | service_role_only | service_role_only | service_role_only | Güvenli (0034) |
| `engagement_milestones` | ENABLED | service_role_only | service_role_only | service_role_only | service_role_only | Güvenli (0034) |
| `engagement_retainers` | ENABLED | service_role_only | service_role_only | service_role_only | service_role_only | Güvenli (0034) |
| `engagement_runbooks` | ENABLED | service_role_only | service_role_only | service_role_only | service_role_only | Güvenli (0034) |
| **`offer_counter_proposals`** | **DISABLED** | Yok | Yok | Yok | Yok | **EKSİK (0023)** |
| **`engagement_reviews`** | **DISABLED** | Yok | Yok | Yok | Yok | **EKSİK (0024)** |
| **`engagement_handovers`** | **DISABLED** | Yok | Yok | Yok | Yok | **EKSİK (0028)** |
| **`engagement_contract_packages`**| **DISABLED** | Yok | Yok | Yok | Yok | **EKSİK (0030)** |
| **`search_trends`** | **DISABLED** | Yok | Yok | Yok | Yok | **EKSİK (0033)** |

---

## Service Role Usage Matrix

- **İnceleme Sonucu:** Kod tabanında Supabase istemci SDK'sına ait `SUPABASE_SERVICE_ROLE_KEY` kesinlikle kullanılmamaktadır.
- Doğrudan `DATABASE_URL` havuz bağlantısı kullanıldığı için PostgreSQL süper kullanıcısı (`postgres`) ile işlem yapılmaktadır.
- İstemci (client bundle) tarafına sızan hiçbir yetkili veritabanı veya servis rol anahtarı tespit edilmemiştir. `pnpm audit:secrets` taraması %100 temiz sonuç vermiştir.

---

## Admin Security Review

- **Yetki Kontrolü:** `src/modules/admin/auth-guard.ts` sunucu tarafında çalışmakta ve oturum tokenındaki `role` değerini (`ADMIN` veya `SECURITY_ADMIN`) zorunlu tutmaktadır. Normal kullanıcıların istemci manipülasyonuyla admin yetkisi elde etmesi mümkün değildir.
- **Kritik Sorun:** 2FA TOTP kodu başarıyla doğrulansa dahi `twoFactorVerified` bayrağının tokena aktarılmaması meşru yöneticilerin erişimini engellemektedir (Bkz: HIGH-001).

---

## Encryption Review

- **Hassas PII:** `user_private_identity` tablosundaki ad, soyad ve telefon bilgileri `encryptPii` fonksiyonu ile AES-256-GCM (12 bayt rastgele IV, 16 bayt auth tag) kullanılarak şifrelenmektedir.
- **Kör İndeksleme:** Telefon ve e-postalar üzerinde arama yapılabilmesi için `crypto.createHmac("sha256", BLIND_INDEX_KEY)` kullanılmaktadır; veri tabanında açık metin aranmamaktadır.
- **Teklifler:** Teklif verileri şifrelenmemektedir (Bkz: CRITICAL-001).
- **Anahtar Güvenliği:** Şifreleme anahtarları sunucu ortam değişkenlerinde (`PII_ENCRYPTION_KEY_BASE64`) tutulmakta ve istemciye asla aktarılmamaktadır. Çoklu sürüm desteği (key rotation) bulunmamaktadır.

---

## File Upload Review

- **İletişim Formu:** Yükleme işlevi çalışmamaktadır; dosya baytları gönderilmemekte, yalnızca dosya ismi kaydedilmektedir (Bkz: MEDIUM-001).
- **Kurumsal Doğrulama & Teslimat Belgeleri:** Cloudflare R2 presigned URL mimarisi kullanılmakta; izin verilen uzantılar (PDF, JPG, PNG) ve dosya boyutları (maks 5-10 MB) sunucu tarafında imzalanarak sınırlandırılmaktadır. Doğrudan sunucuya kontrolsüz dosya yükleme açığı bulunmamaktadır.

---

## Dependency & CVE Review

- **Doğrudan Bağımlılıklar:** 18 adet.
- **pnpm audit --prod Sonucu:** 2 adet moderate açık (`next-intl` GHSA-8f24-v5vv-gm5j, GHSA-4c35-wcg5-mm9h).
- **Next.js Resmi Bülteni (22 Eylül 2026):** CVE-2026-94545 (CVSS 9.5 CRITICAL). Kurulu sürüm `16.3.3` acil güncelleme gerektirmektedir.

---

## Next.js / React Security Advisory Status

| Paket | Kurulu Sürüm | Güvenli Hedef Sürüm | Advisory / Durum |
|---|---|---|---|
| **Next.js** | `16.3.3` | `16.3.6` | **VULNERABLE (CVE-2026-94545 - Satori SVG RCE)** |
| **React** | `19.2.7` | `19.2.7` | Güncel ve Güvenli |
| **React DOM** | `19.2.7` | `19.2.7` | Güncel ve Güvenli |
| **Planlı Güvenlik Kontrolü** | - | `16.3.7` (30 Eylül 2026) | **UPCOMING SECURITY RECHECK (9 Planlı CVE)** |

---

## Security Headers Review

`next.config.ts` ve middleware üzerinde uygulanan başlıklar:
- `X-Frame-Options: DENY` (Clickjacking koruması tam)
- `X-Content-Type-Options: nosniff` (MIME spoofing koruması tam)
- `Referrer-Policy: strict-origin-when-cross-origin` (Referrer sızıntısı engelli)
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS tam)
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` (Donanım izinleri kısıtlı)
- `Content-Security-Policy`: PostHog ve Turnstile betiklerine izin veren yapılandırılmış CSP devrededir.

---

## Business Logic Review

1. **168 Saatlik İlan Süresi:** İlanların 7 gün sonra sona ermesi hem Inngest cron periyodunda hem de sorgu filtrelerinde (`activeUntil <= now()`) çift taraflı güvenceye alınmıştır.
2. **Eşleşme Öncesi İletişim Gizliliği:** Telefon ve doğrudan iletişim bilgileri eşleşme onaylanmadan önce API seviyesinde filtrelenmektedir.
3. **Çift Rol Modeli:** Aynı kullanıcının hem ilan açabilmesi hem teklif verebilmesi mimari olarak desteklenmiş, her eylemde oturum kimliği ile kaynak sahipliği ayrı ayrı doğrulanmaktadır.

---

## SEO / Crawlability Review

- **Sitemap & Robots.txt:** `robots.txt` dinamik olarak `/sitemap.xml` adresini göstermekte; admin rotaları (`/admin/*`) ve özel çalışma alanları (`/work/*`, `/dashboard/*`) `disallow` ile korunmaktadır.
- **İlanlar Sayfası Loading Durumu:** İlanlar sayfasının (`/en/listings`) ilk SSR yanıtında `<PageLoader />` dönmesi arama motorları için risk oluşturmaktadır (Bkz: MEDIUM-004).
- **Metadata Çift Markalama:** Kök layout'taki `%s | Operis` şablonu nedeniyle bazı sayfalarda duplicate marka adı oluşabilmektedir (Bkz: LOW-002).

---

## i18n Review

- `i18n/messages/tr.json` ve `en.json` dosyaları arasında `pnpm audit:i18n` ile yapılan kontrolde **220 çeviri anahtarının tamamının eşleştiği (%100 parite)** doğrulanmıştır.
- Eksik çeviri anahtarı bulunmamaktadır.
- İstisna: Bazı API hata mesajlarında hardcoded Türkçe string fallback'leri mevcuttur.

---

## Legal Review Required Items

Hukuki yorum yapılmaksızın, teknik gerçeklikle uyuşmayan ve hukuk danışmanının gözden geçirmesi gereken maddeler:
1. **"AES-256-GCM ile Uçtan Uca Şifreli Teklifler" Taahhüdü:** Veritabanında teklifler açık metin saklandığından bu ibare teknik gerçeği yansıtmamaktadır. `[LEGAL REVIEW REQUIRED]`
2. **"Sıfır Üçüncü Taraf Takip Scripti" Taahhüdü:** PostHog ve Sentry kullanımı aydınlatma metnine eklenmelidir. `[LEGAL REVIEW REQUIRED]`
3. **"Doğrulanmış Uzmanlar / Pre-vetted Talent" İfadeleri:** İnceleme süreçlerinin yasal sorumluluk sınırları kullanıcı sözleşmesinde netleştirilmelidir. `[LEGAL REVIEW REQUIRED]`

---

## Build / Typecheck / Lint / Test Results

- **`pnpm audit:secrets`:** PASS (Sıfır sızdırılmış anahtar/token)
- **`pnpm audit:i18n`:** PASS (220/220 anahtar eşleşmesi, %100 parite)
- **`pnpm audit --prod`:** WARNING (2 adet orta derece `next-intl` uyarısı)
- **TypeScript Typecheck (`tsc --noEmit`):** PASS (Derleme hatası yok)
- **Next.js Production Build:** PASS (Tüm statik ve dinamik rotalar başarıyla derlenmektedir)

---

## Unverified Areas

1. **Vercel Üretim Kontrol Paneli Ayarları:** Canlı Vercel dashboard üzerindeki özel çevre değişkeni şifreleme ve IP erişim listeleri repodan doğrudan doğrulanamamıştır (`NOT VERIFIABLE FROM REPOSITORY`).
2. **Supabase Yönetici Paneli Metrikleri:** Veritabanı CPU/RAM sınırları ve replikasyon gecikmeleri canlı repodan doğrudan izlenememektedir (`NOT VERIFIABLE FROM REPOSITORY`).

---

## Recommended Remediation Order

### Aşama 1: Acil Güvenlik Yamaları (P0 — İlk 24 Saat)
1. **Next.js Yükseltmesi:** `package.json` dosyasında `next` sürümü `16.3.6`'ya yükseltilmeli ve CVE-2026-94545 bertaraf edilmelidir.
   - *Etkilenen Dosyalar:* `package.json`, `pnpm-lock.yaml`
   - *Doğrulama:* `pnpm build` ve dinamik OG rotası testi.
2. **Admin 2FA Oturum Bayrağı Düzeltmesi:** `AuthService.login()` içine `twoFactorVerified: true` bayrağı eklenmelidir.
   - *Etkilenen Dosyalar:* `src/modules/auth/service.ts`
   - *Doğrulama:* 2FA aktif bir admin ile giriş yapılarak `/admin` panelinin başarıyla açıldığı teyit edilmelidir.

### Aşama 2: Veri Bütünlüğü ve Savunma Derinliği (P1 — İlk 72 Saat)
3. **5 Tabloda RLS'in Aktifleştirilmesi:** Yeni migration ile `offer_counter_proposals`, `engagement_reviews`, `engagement_handovers`, `engagement_contract_packages`, `search_trends` tablolarında RLS açılmalıdır.
   - *Etkilenen Dosyalar:* `db/migrations/0036_enable_missing_rls.sql`
   - *Doğrulama:* `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
4. **Mock Tahkim Veri Yolunun Kapatılması:** `/api/work/[id]/dispute-report` içinde mock kontrolü üretim dışı ortamlarla sınırlandırılmalıdır.
   - *Etkilenen Dosyalar:* `src/app/api/work/[id]/dispute-report/route.ts`

### Aşama 3: Kriptografi & Yasal Metin Uyumu (P2 — İlk Hafta)
5. **Teklif Şifreleme Entegrasyonu:** Teklif metinlerinin `encryptEnvelopeV2` ile şifrelenmesi sağlanmalı veya pazarlama metinleri düzeltilmelidir.
   - *Etkilenen Dosyalar:* `src/modules/offers/services/offer-creation.service.ts`, `db/schema/tables/offers.ts`
6. **Gizlilik Sözleşmesi Revizyonu:** PostHog ve Sentry kullanımı aydınlatma metnine işlenmelidir.

### Aşama 4: Operasyonel İyileştirmeler (P3 — Sonraki Sprint)
7. **İletişim Dosya Yükleme Düzeltmesi:** Dosyaların R2'ye aktarımı tamamlanmalı ya da arayüzden dosya yükleme kaldırılmalıdır.
8. **Masa Sayısı ve Başlık Şablonu Düzeltmesi:** İletişim sayfasındaki sayaç "7 Masa" yapılmalı; layout başlık şablonu optimize edilmelidir.

---

## Post-Fix Verification Checklist

- [ ] `next` sürümünün en az `16.3.6` olduğu `pnpm list next` ile doğrulandı mı?
- [ ] 2FA ile giriş yapan yöneticinin `/admin` paneline engelsiz ulaştığı doğrulandı mı?
- [ ] Veritabanındaki tüm public tablolarda `rowsecurity = true` olduğu SQL ile teyit edildi mi?
- [ ] `/api/work/eng-demo-101/dispute-report` üretimde 404/401 dönüyor mu?
- [ ] Veritabanındaki yeni tekliflerin `message` sütununun şifreli olduğu doğrulandı mı?
- [ ] İletişim formunda yüklenen bir dosyanın R2 depolama alanına ulaştığı doğrulandı mı?
- [ ] 30 Eylül 2026 tarihinde Next.js 16.3.7 planlı güvenlik sürümü kontrol edildi mi?

---

## 20 Kritik Soruya Kesin Cevaplar

1. **Production'da kullanıcı verisi başka kullanıcı tarafından okunabilir mi?**  
   **HAYIR.** Normal API yollarında ve profil sorgularında kullanıcı ve teklif verileri `session.userId` kontrolleriyle korunmaktadır; rakipler teklifleri okuyamaz. Yalnızca `/api/work/[id]/dispute-report` rotasında uydurma mock veriye yetkisiz erişim mümkündür (gerçek kullanıcı verisi sızmaz).
2. **Normal kullanıcı admin yetkisi elde edebilir mi?**  
   **HAYIR.** Sunucu tarafındaki HMAC imzalı oturum tokenı ve `auth-guard.ts` rol kontrolü manipülasyona kapalıdır.
3. **Supabase RLS gerçekten tüm tenant/user izolasyonunu sağlıyor mu?**  
   **HAYIR.** Uygulama doğrudan `postgres` süper kullanıcısıyla bağlandığından PostgreSQL RLS kuralları bypass edilmektedir; izolasyon kod katmanındaki SQL filtreleriyle sağlanmaktadır. Ayrıca 5 yeni tabloda RLS hiç açılmamıştır.
4. **Service-role anahtarı herhangi bir client path'e sızıyor mu?**  
   **HAYIR.** İstemci tarafında hiçbir gizli anahtar sızıntısı yoktur (`pnpm audit:secrets` %100 başarılıdır).
5. **Proposal encryption iddiası gerçekten AES-256-GCM olarak uygulanmış mı?**  
   **HAYIR.** Teklifler (`offers` tablosu) veritabanında tamamen açık metin (plaintext) saklanmaktadır.
6. **Encryption key management güvenli mi?**  
   **EVET.** PII şifreleme anahtarı 32 bayt olarak sunucu ortam değişkenlerinde saklanmakta ve istemciye sızmamaktadır; ancak anahtar rotasyon mekanizması eksiktir.
7. **Teklifler rakiplere herhangi bir yan kanaldan sızabilir mi?**  
   **HAYIR.** Sorgular yalnızca ilan sahibi ve teklif sahibini kapsayacak şekilde filtrelenmektedir.
8. **Kullanıcı contact details match öncesinde elde edilebilir mi?**  
   **HAYIR.** Telefon ve iletişim bilgileri çift taraflı eşleşme ve açık onay verilmeden API yanıtına dahil edilmemektedir.
9. **168 saat expiry gerçekten güvenilir mi?**  
   **EVET.** Hem Inngest zamanlayıcısı hem de sorgu bazlı filtreler süresi dolan ilanları anında yayından kaldırmaktadır.
10. **Production dependency'lerinde bilinen kritik CVE var mı?**  
    **EVET.** Next.js 16.3.3 sürümü CVE-2026-94545 (CVSS 9.5 RCE) açığından etkilenmektedir.
11. **Next.js/React sürümü 25 Eylül 2026 itibarıyla güvenli mi?**  
    **HAYIR.** Next.js 16.3.3 güvenli değildir, 16.3.6 sürümüne yükseltilmelidir. Ayrıca 30 Eylül 2026 için `UPCOMING SECURITY RECHECK` not edilmiştir.
12. **File upload sistemi exploit edilebilir mi?**  
    **HAYIR.** İletişim formu zaten dosya almamaktadır; R2 yüklemeleri ise presigned URL ile katı uzantı doğrulamasına tabidir.
13. **Registration/login/reset/OAuth akışlarında auth bypass var mı?**  
    **HAYIR.** Kimlik doğrulama akışları güvenlidir; ancak admin 2FA oturum hatası meşru yöneticileri kilitlemektedir.
14. **Privacy Notice teknik olarak gerçek implementasyonu doğru anlatıyor mu?**  
    **HAYIR.** Tekliflerin şifrelendiği ve üçüncü taraf takip scripti olmadığı iddiaları gerçek uygulamayla çelişmektedir.
15. **Corporate/legal bilgiler sayfalar arasında tutarlı mı?**  
    **EVET.** Kullanıcının özel talimatı doğrultusunda şirket yasal bilgileri geçerli kabul edilmiştir. Yalnızca 6 masa / 7 masa sayaç farkı mevcuttur.
16. **Cookie policy gerçek tracking davranışıyla uyuşuyor mu?**  
    **HAYIR.** Yalnızca zorunlu çerez denmesine karşın PostHog analitik çerezleri oluşturulmaktadır.
17. **Listings arama motorları tarafından crawl/index edilebilir mi?**  
    **KISMEN.** İlk yanıtta Suspense loader dönmektedir; bot görünürlüğü optimize edilmelidir.
18. **TR/EN locale içerikleri birbirine sızıyor mu?**  
    **HAYIR.** Çeviri katalogları 220 anahtarla %100 senkronizedir. Sadece bazı hata mesajlarında Türkçe fallback vardır.
19. **Production'da placeholder/mock/fake data kalmış mı?**  
    **EVET.** `/api/work/[id]/dispute-report` içinde mock tahkim verisi ve admin panelinde "Demir Yıldız" / "10.420+ Kullanıcı" sabitleri mevcuttur.
20. **Yayını acilen durdurmayı gerektirecek CRITICAL bir bulgu var mı?**  
    **HAYIR.** Veritabanı doğrudan internete açık değildir, kimlik doğrulama bypass'ı veya veri imha riski bulunmamaktadır. Ancak Next.js yamasının yapılması ve teklif şifreleme/hukuki metin uyumsuzluğunun acilen giderilmesi gerekmektedir.

---

## Sources / Official References

- **Vercel / Next.js Security Advisory:** VSA-2026-0922 (CVE-2026-94545: Remote Code Execution via ImageResponse in Next.js 16.2.0–16.3.5)
- **Next.js Scheduled Release Notice:** Scheduled Security Release Announcement for September 30, 2026 (Next.js 16.3.7 / 15.5.27)
- **Supabase Security Architecture:** Row Level Security (RLS) and Postgres Superuser Bypass Documentation
- **OWASP Application Security Verification Standard (ASVS) 4.0.3:** V2 (Authentication), V4 (Access Control), V6 (Cryptography)
- **NIST Special Publication 800-38D:** Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM)
