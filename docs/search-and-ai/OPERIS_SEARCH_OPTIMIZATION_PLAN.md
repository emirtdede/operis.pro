# OPERIS — ARAMA MOTORU VE YAPAY ZEKA KEŞFİ İYİLEŞTİRME PLANI
## (SEARCH ENGINE & AI DISCOVERY OPTIMIZATION PLAN)

Bu doküman, Operis platformunun Google, Bing, ChatGPT Search, Perplexity ve diğer arama/yanıt motorlarında en yüksek görünürlük, doğru indekslenme ve sıfır regresyonla yer almasını sağlayacak mimari iyileştirme planıdır.

---

## 1. UYGULAMA FAZLARI (PHASED EXECUTION ROADMAP)

- **PHASE 0: İndeksleme ve Tarama Engelleyicileri (Immediate Blockers)**
  - SEO-FIX-001: Sitemap İçindeki 301 Yönlendirmeli Feed Rotalarının Temizlenmesi
  - SEO-FIX-002: Müstakil Kategori Sayfaları Mimarisinin Kurulması (`/tr/kategori/[slug]`)
  - SEO-FIX-003: Süresi Dolan İlanlar İçin Zarif 200 OK + `noindex` Yaşam Döngüsü
- **PHASE 1: Tarama Mimarisi & Robot Politikası (Crawl Architecture)**
  - SEO-FIX-007: `robots.ts` İçinde `OAI-SearchBot` İzinlerinin ve Dahili Arama Engellerinin Tanımlanması
  - SEO-FIX-008: Dahili Arama Parametrelerinin (`?q=`) Arama Motorlarına Kapatılması
  - SEO-FIX-014: Dashboard Layout'una Savunma Amaçlı `noindex` Koruma Kalkanı Eklenmesi
- **PHASE 2: Kanonik & Uluslararası SEO (Canonical & Hreflang)**
  - SEO-FIX-004: Tüm Dinamik Sayfalara Hreflang `"x-default"` Sinyalinin Eklenmesi
  - SEO-FIX-010: `getBaseUrl()` Fonksiyonunun Canlıda Mutlak Olarak `https://operis.pro` Sabitlenmesi
- **PHASE 3: Yapılandırılmış Veri & Varlık Netliği (Structured Data & Schema)**
  - SEO-FIX-005: `JobPosting` Şemasında Uzaktan Çalışma Lokasyonu ve Maaş Biriminin Düzeltilmesi
  - SEO-FIX-009: Ana Sayfadaki Deprecated `SearchAction` Şemasının Temizlenmesi
  - SEO-FIX-011: Özel Çalışma Alanı (`work/[id]`) DOM'undan JSON-LD Şemasının Kaldırılması
- **PHASE 4: İçerik Kalitesi & Pazar Yeri Sağlığı (Quality Gates)**
  - SEO-FIX-006: Boş ve Yetersiz Profillerin Otomatik Olarak `noindex, follow` Yapılması
  - SEO-FIX-012: Dinamik İlan Paylaşım Görselleri (`opengraph-image.tsx`) Entegrasyonu
- **PHASE 5: Anlık Dizinleme & Gözlemlenebilirlik (Instant Indexing & Observability)**
  - SEO-FIX-013: IndexNow Protokolü ile Yaşam Döngüsü Tetikleyicilerinin Bağlanması
  - SEO-FIX-015: Otomatik SEO Regresyon CI/CD Kalite Kapısının Kurulması

---

## 2. DETAYLI TEKNİK ÇÖZÜM SPESİFİKASYONLARI

---

### SEO-FIX-001 — Sitemap İçindeki 301 Yönlendirmeli Rotaların Temizlenmesi
- **İlgili Bulgu:** SEARCH-001 (Blocker)
- **Amaç:** `sitemap.xml` çıktısının %100 oranında yalnızca nihai, 200 OK yanıt veren kanonik URL'lerden oluşmasını sağlamak.
- **Root Cause:** Eski feed rotalarının sitemap `staticKeys` listesinde kalması.
- **Değiştirilecek Dosyalar:** `src/app/sitemap.ts`
- **Uygulama Adımları:**
  1. `src/app/sitemap.ts` içindeki `staticKeys` dizisinden `"feed"` elemanını çıkar.
  2. `login` ve `register` rotalarının sitemap önceliğini kaldır veya transactional oldukları için sitemap'ten arındır.
  3. Yerine aktif kategorilerin listesini (`CategoryService.getAllCategories()`) dinamik olarak sitemap'e dahil et.
- **Acceptance Criteria:** `curl https://operis.pro/sitemap.xml` çıktısındaki tüm URL'ler HTTP 200 dönmeli, hiçbir 301 yönlendirmesi içermemelidir.

---

### SEO-FIX-002 — Müstakil Kategori Açılış Sayfaları Mimarisinin Kurulması
- **İlgili Bulgu:** SEARCH-002 (Blocker)
- **Amaç:** 110 teknoloji kategorisi için müstakil, indekslenebilir, zengin içerikli ve kanonik açılış sayfaları oluşturmak.
- **Yeni Dosyalar:**
  - `src/app/[locale]/categories/[slug]/page.tsx`
- **Değiştirilecek Dosyalar:**
  - `next.config.ts` (Türkçe rewrite: `/tr/kategori/:slug` -> `/tr/categories/:slug`)
  - `src/proxy.ts` (Kategori slug yönlendirmeleri)
  - `src/lib/i18n/routes.ts` (`getLocalizedCategoryPath`)
  - `src/app/sitemap.ts` (Tüm kategorilerin sitemap'e eklenmesi)
- **Mimari Değişiklikler:**
  - Kategori sayfası o kategoriye ait aktif ilanları SSR ile listeler.
  - Sayfa başlığı: `{Kategori Adı} İlanları & Freelance Uzmanlar | Operis`.
  - Sayfa şeması: `CollectionPage` + `BreadcrumbList`.
  - Kanonik: `https://operis.pro/tr/kategori/[slug]`.
- **Acceptance Criteria:** `/tr/kategori/backend-gelistirme` sayfası HTTP 200 dönmeli, self-canonical barındırmalı ve Googlebot tarafından taranabilir olmalıdır.

---

### SEO-FIX-003 — Süresi Dolan İlanlar İçin Zarif 200 OK + `noindex` Yaşam Döngüsü
- **İlgili Bulgu:** SEARCH-003 (Blocker)
- **Amaç:** 7 günlük süresi dolan ilanların anında 404 üretmesini engelleyerek index collapse ve kırık link krizini önlemek.
- **Değiştirilecek Dosyalar:** `src/app/[locale]/listings/[slug]/page.tsx`
- **Yeni Bileşenler:** `src/components/listings/expired-listing-notice.tsx`
- **Uygulama Adımları:**
  1. İlan süresi dolmuşsa (`isCurrentlyActive === false`) `notFound()` çağırmak yerine sayfayı HTTP 200 olarak render et.
  2. `generateMetadata` içinde `robots: { index: false, follow: true }` döndür.
  3. `JobPosting` şemasını kaldır (Google'ın süresi dolan iş ilanını cezalandırmasını önlemek için) veya `validThrough` tarihini geçmiş zaman olarak koru.
  4. Sayfa gövdesinde kullanıcıya bildirim göster: "Bu ilanın 7 günlük yayım süresi dolmuştur. Yeni teklif kabul edilmemektedir."
  5. İlanın altına aynı kategorideki 3-4 adet **Aktif İlanı** öneri olarak yerleştir.
  6. Yalnızca kullanıcı veya moderatör tarafından hard-delete edilen (`status === 'DELETED'`) ilanlar için HTTP 410 / `notFound()` döndür.
- **Acceptance Criteria:** Süresi dolan bir ilan ziyaret edildiğinde 404 yerine bilgilendirici 200 OK sayfası gelmeli, robots meta tag `noindex, follow` olmalıdır.

---

### SEO-FIX-004 — Tüm Dinamik Sayfalara Hreflang `"x-default"` Sinyalinin Eklenmesi
- **İlgili Bulgu:** SEARCH-004 (Critical)
- **Amaç:** Uluslararası arama motorlarına pazar varsayılanı fallback dilini bildirmek.
- **Değiştirilecek Dosyalar:**
  - `src/app/[locale]/listings/[slug]/page.tsx`
  - `src/app/[locale]/u/[handle]/page.tsx`
  - `src/app/[locale]/categories/page.tsx`
  - `src/app/[locale]/about/page.tsx`
  - `src/app/[locale]/legal/[slug]/page.tsx`
- **Uygulama Adımları:**
  `alternates.languages` nesnesi içine daima `"x-default"` ekle:
  ```ts
  languages: {
    tr: getLocalizedPath(..., "tr"),
    en: getLocalizedPath(..., "en"),
    "x-default": getLocalizedPath(..., "tr"),
  }
  ```
- **Acceptance Criteria:** Sayfa kaynak kodunda `<link rel="alternate" hreflang="x-default" ...>` etiketi eksiksiz yer almalıdır.

---

### SEO-FIX-005 — `JobPosting` Şemasında Uzaktan Çalışma Lokasyonu ve Maaş Formatının Düzeltilmesi
- **İlgili Bulgu:** SEARCH-005 (Critical)
- **Amaç:** Google for Jobs zengin sonuç kartı uygunluğunu garanti altına almak.
- **Değiştirilecek Dosyalar:** `src/app/[locale]/listings/[slug]/page.tsx`
- **Uygulama Adımları:**
  1. `jobLocationType: "TELECOMMUTE"` yanına:
     ```json
     "applicantLocationRequirements": {
       "@type": "Country",
       "name": "TR"
     }
     ```
     özelliğini ekle.
  2. `baseSalary` altındaki geçersiz `"PROJECT"` birimini Google standartlarıyla uyumlu hale getir (veya `description` içinde bütçe kapsamını vurgula).
- **Acceptance Criteria:** Google Rich Results Test aracında `JobPosting` geçerli ve sıfır hata/uyarı ile onaylanmalıdır.

---

### SEO-FIX-006 — Boş ve Yetersiz Profillerin Otomatik Olarak `noindex, follow` Yapılması
- **İlgili Bulgu:** SEARCH-006 (High)
- **Amaç:** İçi boş, biyografisiz veya terk edilmiş profillerin dizine girerek site kalitesini düşürmesini önlemek.
- **Değiştirilecek Dosyalar:** `src/app/[locale]/u/[handle]/page.tsx`
- **Uygulama Mantığı:**
  Bir profilin `index: true` alabilmesi için şu kriterler aranır:
  - Biyografi (`about`) veya başlık (`headline`) dolu olmalı,
  - En az 1 uzmanlık becerisi (`trackedSkills`) tanımlanmış olmalı,
  - Hesap `ACTIVE` durumda olmalı (askıya alınmış veya silinmiş olmamalı).
  Bu şartları sağlamayan yeni veya taslak profillere `robots: { index: false, follow: true }` atanır.
- **Acceptance Criteria:** Boş bir test kullanıcısı profili `noindex` alırken, dolu ve doğrulanmış bir profil `index: true` almalıdır.

---

### SEO-FIX-007 — `robots.ts` İçinde `OAI-SearchBot` ve Yapay Zeka Arama Politikalarının Yapılandırılması
- **İlgili Bulgu:** SEARCH-007 & SEARCH-008 (High)
- **Amaç:** ChatGPT Search botuna izin verirken, dahili arama parametrelerinin taranmasını engellemek.
- **Değiştirilecek Dosyalar:** `src/app/robots.ts`
- **Uygulama Adımları:**
  ```ts
  export default function robots(): MetadataRoute.Robots {
    const baseUrl = getBaseUrl();
    return {
      rules: [
        {
          userAgent: "OAI-SearchBot",
          allow: ["/", "/llms.txt", "/llms-full.txt"],
          disallow: ["/dashboard/", "/*/dashboard/", "/panel/", "/*/panel/", "/admin/", "/api/", "/*?*q=*"],
        },
        {
          userAgent: ["GPTBot", "Google-Extended", "CCBot", "ClaudeBot", "PerplexityBot"],
          allow: ["/", "/llms.txt", "/llms-full.txt"],
          disallow: ["/dashboard/", "/*/dashboard/", "/panel/", "/*/panel/", "/admin/", "/api/", "/*?*q=*"],
        },
        {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/dashboard/",
            "/*/dashboard/",
            "/panel/",
            "/*/panel/",
            "/work/",
            "/*/work/",
            "/admin/",
            "/api/",
            "/*?*q=*",
          ],
        },
      ],
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }
  ```
- **Acceptance Criteria:** `https://operis.pro/robots.txt` çıktısı OAI-SearchBot'u içermeli ve `/*?*q=*` kalıbını disallow etmelidir.

---

### SEO-FIX-010 — `getBaseUrl()` Fonksiyonunun Canlıda Mutlak Olarak `https://operis.pro` Sabitlenmesi
- **İlgili Bulgu:** SEARCH-010 (High)
- **Amaç:** Vercel otomatik ortam değişkenlerinin kanonik alan adını `*.vercel.app` olarak ezmesini önlemek.
- **Değiştirilecek Dosyalar:** `src/lib/config/url.ts`
- **Uygulama Adımları:**
  ```ts
  export function getBaseUrl(): string {
    if (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV_PREVIEW) {
      return "https://operis.pro";
    }
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, "");
    return "https://operis.pro";
  }
  ```
- **Acceptance Criteria:** Prodüksiyon derlemesinde tüm kanonik etiketler ve sitemap URL'leri `https://operis.pro` ile başlamalıdır.

---

### SEO-FIX-013 — IndexNow Entegrasyonu
- **İlgili Bulgu:** SEARCH-013 (Medium)
- **Amaç:** İlan yayınlama ve süre dolumu anında Bing ve Yandex motorlarına milisaniyeler içinde bildirim göndermek.
- **Yeni Dosyalar:** `src/lib/seo/indexnow.ts`, `public/{INDEXNOW_KEY}.txt`
- **Uygulama Adımları:**
  1. Kriptografik IndexNow anahtarı üret ve `public/` altına `.txt` dosyası olarak koy.
  2. `submitIndexNow(urls: string[])` fonksiyonunu yaz.
  3. `ListingCrudService.publishListing` ve `ListingLifecycleService.expireListing` içine asenkron fail-open IndexNow bildirim çağrısı bağla.
- **Acceptance Criteria:** Yeni bir ilan açıldığında IndexNow API HTTP 200 veya 202 kabul yanıtı dönmelidir.
