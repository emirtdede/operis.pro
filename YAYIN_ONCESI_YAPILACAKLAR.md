# 🚀 OPERİS — YAYIN ÖNCESİ YAPILACAKLAR LİSTESİ (PRE-LAUNCH CHECKLIST)

Bu belge, Operis platformunun yerel geliştirme (development) ortamından canlı (production) ortama taşınması sırasında tamamlanması gereken tüm teknik, hukuki ve güvenlik adımlarını içerir.

---

## 🔐 1. Sosyal Giriş (OAuth & Clerk) Canlı Yapılandırması

Şu anda sistemde Clerk test anahtarları (`pk_test_...`, `sk_test_...`) ve geliştirme modundaki paylaşımlı kimlikler kullanılmaktadır. Canlıya geçmeden önce:

- [ ] **Clerk Ortamını Production'a Geçirme:**
  - [Clerk Dashboard](https://dashboard.clerk.com) üzerinden proje "Production" moduna geçirilmeli.
  - Canlı anahtarlar alınıp sunucu `.env` dosyasına girilmeli:
    ```env
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
    CLERK_SECRET_KEY=sk_live_...
    CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
    ```
- [ ] **Google Cloud Console OAuth 2.0 İstemcisi:**
  - Google Cloud Console üzerinde *"Operis"* adına resmi bir proje ve OAuth Consent Screen (Onay Ekranı) oluşturulmalı.
  - Alınan `Client ID` ve `Client Secret` Clerk Dashboard > *User & Authentication > Social Connections > Google* alanına kaydedilmeli.
  - *(Böylece kullanıcılar giriş yaparken Clerk uyarısı yerine doğrudan "Operis'e Giriş Yap" ekranı görür).*
- [ ] **GitHub OAuth App:**
  - GitHub > *Settings > Developer settings > OAuth Apps* altından "Operis" adıyla yeni bir OAuth App açılmalı ve kimlik bilgileri Clerk'e girilmeli.
- [ ] **Apple ile Giriş (Sign in with Apple):**
  - Apple Developer ($99/yıl) hesabında bir **App ID**, **Services ID**, **Key ID** ve `.p8 Private Key` üretilip Clerk paneline yüklenmeli.
  - *Alternatif:* Eğer ilk aşamada Apple girişi açılmayacaksa, buton `src/components/auth/social-login-buttons.tsx` içerisinden geçici olarak devre dışı bırakılmalı.
- [ ] **LinkedIn & Microsoft:**
  - LinkedIn Developers ve Microsoft Entra ID (Azure) üzerinden resmi kurumsal uygulama kayıtları tamamlanıp Clerk paneline tanımlanmalı.
- [ ] **Clerk Webhook Entegrasyonu:**
  - Kullanıcı Clerk üzerinden silindiğinde veya güncellendiğinde Operis veritabanıyla tam senkronizasyon için Clerk Webhook URL'si canlı domaine (`https://operis.pro/api/webhooks/clerk`) bağlanmalı.

---

## 🛡️ 2. Güvenlik & Admin Paneli Sertleştirme

- [ ] **Admin Giriş Ekranındaki Bilgi İfşasını (Information Disclosure) Temizleme:**
  - [`src/components/admin/admin-access-denied-client.tsx`](./src/components/admin/admin-access-denied-client.tsx) içindeki test amaçlı `admin@operis.pro` ve *"Demir Yıldız"* hardcoded varsayılan değerleri boşaltılmalı (`useState("")`).
  - Canlıda yetkisiz kullanıcıların bu ekranı hiç görmemesi, doğrudan ana sayfaya yönlendirilmesi (`redirect("/")`) sağlanmalı.
- [ ] **Admin Güvenlik Anahtarı (Master Key):**
  - `.env` içerisine güçlü, en az 32 karakterlik rastgele bir acil durum yönetim anahtarı tanımlanmalı:
    ```env
    ADMIN_MASTER_KEY="cok_guclu_ve_rastgele_uretilen_admin_anahtari_2026"
    ```
- [ ] **Demo ve Hızlı Giriş Ayarlarını Kapatma:**
  - Canlı ortamda şifresiz/demo girişlerin kesinlikle kapatılması zorunludur:
    ```env
    ENABLE_DEMO_LOGIN=false
    ALLOW_DEMO_CREDENTIALS=false
    ```
- [ ] **Admin Paneline Ağ / IP Kısıtlaması (Opsiyonel / Önerilen):**
  - `/admin` rotasına yalnızca şirket/ofis statik IP'lerinin veya Cloudflare Access / VPN üzerinden erişilmesine izin veren Next.js middleware filtresi aktif edilmeli.
- [ ] **Süper Admin Şifresini Değiştirme:**
  - Tohumlama verisindeki varsayılan şifre (`OperisAdmin2026!`) canlı veritabanında kesinlikle kullanılmamalı; güçlü, benzersiz bir parola ve 2FA (Google Authenticator) tanımlanmalı.

---

## 🗄️ 3. Veritabanı Hijyeni ve Canlıya Geçiş

- [ ] **Test Verilerini Temizleme:**
  - Geliştirme aşamasında oluşturulan test kullanıcıları (`kullanici@operis.pro`, `freelancer@operis.pro`), hayalet ilanlar ve sahte teklifler canlı veritabanından temizlenmeli.
- [ ] **Veritabanı Yedekleme (Backup) ve Felaket Kurtarma:**
  - Canlı PostgreSQL / Supabase veritabanında günlük otomatik yedekleme (Point-in-Time Recovery) açılmalı.
- [ ] **Drizzle Migration Doğrulaması:**
  - Canlı veritabanına tüm şema geçişlerinin (`pnpm db:migrate`) eksiksiz uygulandığı teyit edilmeli.

---

## ⚖️ 4. Hukuki ve Kurumsal Uyum (KVKK, ETBİS, Ticaret Bakanlığı)

- [ ] **Şirket Resmi Bilgilerini `.env` ile Senkronize Etme:**
  - `.env` dosyasındaki yasal alanlar resmi ticaret sicil gazetesi verileriyle doldurulmalı:
    ```env
    LEGAL_ENTITY_NAME="Resmi Şirket Unvanı A.Ş."
    LEGAL_ADDRESS="Şirketin Resmi Tebligat Adresi"
    MERSIS_NO="0123456789000001"
    TAX_NO="1234567890"
    KEP_ADDRESS="sirket@hs01.kep.tr"
    LEGAL_SUPPORT_EMAIL="destek@operis.pro"
    LEGAL_PRIVACY_EMAIL="kvkk@operis.pro"
    ```
- [x] **ETBİS Değerlendirmesi ve Temizliği:**
  - Platform doğrudan sipariş ve ödeme tahsilatı yapmadığı için ETBİS tescili zorunluluğu bulunmamaktadır; yanıltıcı beyan riskini önlemek amacıyla footer ve hukuki künyedeki tüm ETBİS tescili iddiaları kaldırılmıştır. İleride doğrudan ödeme/emanet modeli eklenirse Bakanlık kaydı yapılıp resmi karekod eklenecektir.
- [ ] **Kriptografik SHA-256 Doğrulaması:**
  - Tüm yasal sayfaların güncel SHA-256 parmak izlerinin `src/lib/legal/legal-documents-data.ts` ile eşleştiği `pnpm vitest run tests/unit/legal.test.ts` komutuyla teyit edilmeli.

---

## 📧 5. E-Posta ve SMS Sağlayıcıları

- [ ] **Resend / Kurumsal E-posta Altyapısı:**
  - `RESEND_API_KEY` canlı anahtarı girilmeli.
  - Alan adı için DNS kayıtları (SPF, DKIM, DMARC, MX) Cloudflare üzerinde doğrulanmalı (`operis.pro` üzerinden sorunsuz e-posta iletimi için).
- [ ] **SMS OTP Sağlayıcısı (Twilio / Netgsm):**
  - Canlı SMS sağlayıcı bilgileri tanımlanmalı ve bakiye tanımlaması yapılmalı (`FEATURE_SMS_OTP=true`).

---

## 🌐 6. Alan Adı, SSL ve Cloudflare Optimizasyonu

- [ ] **DNS & SSL Yapılandırması:**
  - `operis.pro` ve `www.operis.pro` Cloudflare üzerinden yönlendirilmeli (Full Strict SSL).
- [ ] **Cloudflare Turnstile (Bot Kalkanı):**
  - Canlı domain için Cloudflare Dashboard'dan Turnstile Site Key ve Secret Key üretilip `.env` dosyasına işlenmeli:
    ```env
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAA...
    TURNSTILE_SECRET_KEY=0x4AAAAAA...
    ```
- [ ] **WAF ve Hız Sınırlama (Rate Limiting):**
  - Cloudflare WAF kurallarında `/api/auth/*` ve `/api/admin/*` yollarına ek siber güvenlik kuralları tanımlanmalı.

---

## 🔍 7. SEO & Schema.org Yapısal Veri Doğrulaması

Platformdaki tüm indekslenebilir kamuya açık sayfaların Schema.org JSON-LD yapısal verileri kodlanmıştır. Canlı yayına çıkıldığında:

- [ ] **Google Rich Results Test (Zengin Sonuçlar Doğrulaması):**
  - [Google Rich Results Test](https://search.google.com/test/rich-results) aracı ile aşağıdaki canlı URL'ler test edilip geçerliliği doğrulanmalı:
    - `https://operis.pro/tr` (WebSite, Organization, BreadcrumbList)
    - `https://operis.pro/tr/hakkimizda` (AboutPage, Organization, BreadcrumbList)
    - `https://operis.pro/tr/iletisim` (ContactPage, Organization, ContactPoint, BreadcrumbList)
    - `https://operis.pro/tr/yardim` (HelpPage, FAQPage, BreadcrumbList)
    - `https://operis.pro/tr/ilanlar` (ItemList, BreadcrumbList)
    - `https://operis.pro/tr/kategoriler` (CollectionPage, BreadcrumbList)
- [ ] **Google Search Console Sitemap Gönderimi:**
  - `https://operis.pro/sitemap.xml` adresi Google Search Console ve Bing Webmaster Tools panellerine dizine eklenmek üzere iletilmeli.

