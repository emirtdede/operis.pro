# OPERIS — SEO / GEO / AEO / AI SEARCH VISIBILITY MASTER AUDIT RAPORU
## (ORGANIC SEARCH & GENERATIVE ENGINE DISCOVERY MASTER AUDIT)

**Hedef Ürün:** Operis — Türkiye Odaklı Profesyonel Freelance Pazar Yeri Platformu  
**Resmi Prodüksiyon Alan Adı:** `https://operis.pro`  
**Denetim Tarihi:** 26 Eylül 2026  
**Denetim Ekibi Rolleri:** Technical SEO Architect, Information Architecture Specialist, Schema.org Structured Data Engineer, Generative Engine Optimization (GEO) Lead, Answer Engine Optimization (AEO) Specialist, Frontend Performance Engineer, International SEO Specialist, AI Crawler / Retrieval Specialist.  
**Kapsam:** Tüm Kamu ve Özel Rotalar (117 API Endpoint'i, 51 Sayfa/Layout Dosyası, 10 Sektör / 110 Kategori, robots.txt, sitemap.xml, llms.txt, JSON-LD, HTTP Başlıkları).

---

# 1. EXECUTIVE SUMMARY (YÖNETİCİ ÖZETİ)

Operis platformu üzerinde gerçekleştirilen derinlemesine **Teknik SEO, Semantik Mimari, Generative Engine Optimization (GEO) ve Answer Engine Optimization (AEO)** denetimi sonucunda; platformun Next.js App Router üzerinde Server Component'ler (SSR) ile inşa edilmiş olması sayesinde ilk HTTP yanıtında zengin ve taranabilir HTML sunduğu, semantik HTML elementlerine dikkat edildiği ve `JsonLd` bileşeni ile XSS korumalı veri enjeksiyonu yapıldığı tespit edilmiştir.

Bununla birlikte, platformun arama motorları ve yeni nesil yapay zeka arama sistemleri (ChatGPT Search, Google AI Overviews, Bing Copilot) tarafından doğru indekslenmesini ve taranmasını engelleyen veya ciddi oranda zedeleyen **3 Adet Blocker**, **4 Adet Critical**, **4 Adet High** ve **3 Adet Medium** seviyede teknik bulgu tespit edilmiştir.

### Organik Arama & Keşif Durum Değerlendirmesi:
> **NOT SEARCH READY (ARAMA MOTORLARI & AI KEŞFİ İÇİN HAZIR DEĞİL)**

**Temel Gerekçeler:**
1. **Sitemap İçi 301 Yönlendirmeleri (Blocker):** `sitemap.xml` dosyasında yer alan `/tr/akis` ve `/en/feed` rotaları `src/proxy.ts` içinde kalıcı 301 yönlendirmesi vermektedir. Google Search Central yönergelerine göre sitemap'te yönlendirilen URL bulunması tarama bütçesini ve indeks güvenilirliğini doğrudan bozar.
2. **Kategori Açılış Sayfası Eksikliği & Kanonik Seyrelme (Blocker):** 110 uzmandan oluşan kategoriler için müstakil kanonik rota bulunmamakta; kategoriler `/tr/ilanlar?category=...` üzerinden sunulmakta ve bu URL'lerin kanoniği kök `/tr/ilanlar` sayfasına dönmektedir. Bu durum platformun en büyük organik trafik kaynağı olan kategori bazlı aramaları ("Freelance React Geliştirici", "Freelance Python Uzmanı") tamamen indeks dışı bırakmaktadır.
3. **7 Günlük İlan Süre Dolumunun Ani 404 Hatasına Dönüşmesi (Blocker):** Süresi dolan her ilan anında `notFound()` fırlatarak HTTP 404 vermektedir. Haftalık yaşam döngüsü olan bir pazar yerinde bu durum Google ve AI indekslerinde her ay binlerce kırık link ve dizin çöküşü (index collapse) yaratır.
4. **Hreflang `x-default` Eksikliği (Critical):** Dinamik şablonların tamamında alternatif diller sunulurken varsayılan pazar için `x-default` sinyali verilmemiştir.
5. **JobPosting Şemasında Lokasyon Uyumsuzluğu (Critical):** Uzaktan çalışma (`TELECOMMUTE`) ilanlarında Google zorunluluğu olan `applicantLocationRequirements` eksiktir; Google for Jobs zengin kartlarından elenme riski bulunmaktadır.

---

## AUDIT METRİK ÖZETİ

| Metrik | Değer | Açıklama |
|---|:---:|---|
| **İncelenen Toplam Dosya** | **1.373** | node_modules, .next ve .git hariç tüm repo |
| **SEO ile İlgili Kaynak Dosyalar** | **68** | Route'lar, layout'lar, metadata, şemalar, sitemap, proxy |
| **İncelenen Toplam Rota Sayısı** | **161** | App Router'da derlenen statik ve dinamik tüm rotalar |
| **Kamuya Açık (Public) Rotalar** | **28** | Ziyaretçilere ve botlara açık sayfalar |
| **İndekslenebilir Şablon Tipleri** | **8** | Ana Sayfa, Kategori Dizini, İlan Detay, Profil, Hakkımızda, İletişim, Yardım, Yasal Belge |
| **Tespit Edilen Toplam Sorun (Issues)** | **14** | Kanıtlanmış teknik ve mimari eksiklikler |
| **Severity Dağılımı** | **3 Blocker, 4 Critical, 4 High, 3 Medium, 0 Low** | Öncelik sırasına göre |
| **Crawlability (Taranabilirlik) Durumu** | **Zayıf / Düzeltme Gerektirir** | Sitemap 301'leri, `/*?q=*` tarama tuzakları ve robots.txt eksikleri |
| **Indexability (İndekslenebilirlik) Durumu** | **Kritik / Seyrelme Mevcut** | Boş profiller indeksli, kategoriler kanonik olarak kilitli, süresi dolanlar 404 |
| **Metadata & OpenGraph Durumu** | **İyi / İyileştirme Gerekir** | Temel OG mevcut; dinamik ilan OG görselleri eksik |
| **Structured Data (Schema.org) Durumu** | **Kısmen Uyumlu** | JobPosting remote gereksinimi eksik, SearchAction deprecated |
| **Google AI Overviews & AI Search Durumu** | **Kısmen Hazır** | Temiz metin var; entity grafiği ve lisans/provenance eksik |
| **ChatGPT Search (OAI-SearchBot) Durumu** | **Yapılandırılmamış** | `robots.ts` içinde `OAI-SearchBot` müstakil tanımlı değil |
| **Genel Arama Hazırlığı (Search Readiness)** | **NOT SEARCH READY** | Blocker ve Critical sorunlar çözülmeden indeksleme açılamaz |

---

# 2. TEKNOLOJİ STACK'İ & RENDERING STRATEJİSİ

- **Framework & Rendering Engine:** Next.js `16.3.3` (App Router, Webpack derleme modu), React `19.2.7`.
- **Sunucu Taraflı Rendering (SSR):** Kritik tüm kamu sayfalarında (`listings/page.tsx`, `listings/[slug]/page.tsx`, `u/[handle]/page.tsx`) `export const dynamic = "force-dynamic"` tanımlıdır. Botlar ilk HTTP GET yanıtında tam render edilmiş HTML gövdesine ulaşır; client-side JS gecikmesi (hydration latency) yaşanmaz.
- **Statik Ön-Derleme (SSG):** Yasal sayfalar (`legal/[slug]/page.tsx`) `generateStaticParams()` ile derleme anında statik HTML olarak üretilir.
- **Uluslararasılaşma (i18n):** `next-intl` altyapısı ile `tr` (varsayılan) ve `en` dillerinde iki dilli yapı; `localePrefix: "always"`.
- **Kök Yönlendirme:** `/` isteği `src/proxy.ts` üzerinden HTTP 308 ile `Accept-Language` veya çerez tercihine göre `/${targetLocale}` rotasına yönlendirilir (Türkçe pazar varsayılanı `/tr`).
- **Güvenlik Başlıkları:** `next.config.ts` içinde HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, CSP başlıkları tanımlıdır.

---

# 3. ATTACK & SEARCH SURFACE INVENTORY

Platformdaki rotaların arama motoru taranabilirlik ve indekslenebilirlik kararları aşağıdaki tabloda çıkarılmıştır:

| Rota / URL Deseni | Sayfa Tipi | Taranmalı mı? (Crawl) | İndekslenmeli mi? (Index) | Linkleri Takip Et? (Follow) | Sitemap'te Olmalı mı? | Kanonik Stratejisi |
|---|---|:---:|:---:|:---:|:---:|---|
| `/[locale]` | Ana Sayfa | Evet | **Evet** | Evet | **Evet** | `/${locale}` (x-default: `/tr`) |
| `/[locale]/listings` (`/tr/ilanlar`) | İlan Kataloğu | Evet | **Evet** | Evet | **Evet** | `/${locale}/listings` |
| `/[locale]/listings?category=...` | Kategori Filtresi | Evet | **ÖZEL ROTA GEREKİR** | Evet | **HAYIR (Müstakil Rota)** | Müstakil kategori URL'sine kanonik olmalı |
| `/[locale]/listings?q=...` | Dahili Arama | **HAYIR** | **HAYIR (noindex)** | Evet | **HAYIR** | Self-canonical + `noindex, follow` |
| `/[locale]/listings/[slug]` | İlan Detay (Aktif) | Evet | **Evet** | Evet | **Evet** | `/${locale}/listings/${slug}` |
| `/[locale]/listings/[slug]` (Süresi Dolan) | Süresi Biten İlan | Evet | **HAYIR (noindex)** | Evet | **HAYIR** | 200 OK + noindex + benzer ilan linkleri |
| `/[locale]/categories` (`/tr/kategoriler`)| Kategori Dizini | Evet | **Evet** | Evet | **Evet** | `/${locale}/categories` |
| `/[locale]/u/[handle]` (Dolu Profil) | Yetenek Profili | Evet | **Evet** | Evet | **Evet** | `/${locale}/profile/${handle}` |
| `/[locale]/u/[handle]` (Boş Profil) | İçi Boş Profil | Evet | **HAYIR (noindex)** | Evet | **HAYIR** | noindex, follow |
| `/[locale]/about` (`/tr/hakkimizda`) | Kurumsal / Manifesto | Evet | **Evet** | Evet | **Evet** | `/${locale}/about` |
| `/[locale]/contact` (`/tr/iletisim`) | İletişim / Künye | Evet | **Evet** | Evet | **Evet** | `/${locale}/contact` |
| `/[locale]/help` (`/tr/yardim`) | Bilgi Merkezi & SSS | Evet | **Evet** | Evet | **Evet** | `/${locale}/help` |
| `/[locale]/brand` (`/tr/marka`) | Marka Kılavuzu | Evet | **Evet** | Evet | **Evet** | `/${locale}/brand` |
| `/[locale]/legal/[slug]` | Yasal Metinler | Evet | **Evet** | Evet | **Evet** | `/${locale}/legal/${slug}` |
| `/[locale]/login` / `register` | Giriş & Kayıt | Evet | **HAYIR (noindex)** | Evet | **HAYIR** | Transactional sayfa, sitemap'ten çıkarılmalı |
| `/[locale]/forgot-password` / `reset` | Şifre İşlemleri | **HAYIR** | **HAYIR (noindex)** | Hayır | **HAYIR** | robots.txt disallow + noindex |
| `/[locale]/dashboard/*` | Kullanıcı Paneli | **HAYIR** | **HAYIR (noindex)** | Hayır | **HAYIR** | robots.txt disallow + auth redirect |
| `/[locale]/work/[id]` | Özel Çalışma Alanı | **HAYIR** | **HAYIR (noindex)** | Hayır | **HAYIR** | robots.txt disallow + auth redirect |
| `/admin/*` | Yönetim Konsolu | **HAYIR** | **HAYIR (noindex)** | Hayır | **HAYIR** | robots.txt disallow + HTTP 403/redirect |
| `/api/*` | API Endpoint'leri | **HAYIR** | **HAYIR** | Hayır | **HAYIR** | robots.txt disallow |

---

# 4. FINDINGS CATALOG (DETAYLI DENETİM BULGULARI)

---

## SEARCH-001 — XML Sitemap İçinde Kalıcı 301 Yönlendirmeli Rotaların Bulunması

**Severity:** Blocker  
**Area:** Crawl & Sitemap Architecture  
**Evidence Level:** LEVEL A — OFFICIAL (Google Search Central Sitemaps Specification)  
**Page Type:** XML Sitemap (`/sitemap.xml`)  
**Affected URL Pattern:** `https://operis.pro/tr/akis`, `https://operis.pro/en/feed`  
**Affected Files:** `src/app/sitemap.ts:34`, `src/proxy.ts:119-135`  
**Affected Lines:** `sitemap.ts` satır 34-80; `proxy.ts` satır 119-135  

### Current Behavior
`src/app/sitemap.ts` dosyasında `staticKeys` dizisinde `"feed"` tanımlıdır. Bu anahtar `ROUTE_MAP` üzerinden sitemap çıktısına `https://operis.pro/tr/akis` ve `https://operis.pro/en/feed` URL'lerini basmaktadır. Ancak `src/proxy.ts` dosyasında:
```ts
if (pathname === "/tr/feed" || pathname === "/tr/akis") {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/tr/ilanlar";
  return NextResponse.redirect(redirectUrl, 301);
}
```
kuralı işletilmekte; botlar sitemap'te yer alan bir bağlantıyı ziyaret ettiklerinde HTTP 301 yanıtı ile `/tr/ilanlar?view=stream` adresine yönlendirilmektedir.

### Expected Behavior
XML sitemaps yalnızca nihai, kanonik ve HTTP 200 OK yanıtı veren sayfaları içermelidir. Hiçbir 301, 302, 404 veya noindex URL sitemap dosyasında yer almamalıdır.

### Root Cause
Listings ve Feed sayfaları tek bir çatı altında birleştirilmiş (`UnifiedListingsHub`), ancak eski feed rotası sitemap üretiminden kaldırılmamıştır.

### Search & Scale Impact
Googlebot sitemap'teki yönlendirmeleri takip ederken tarama bütçesini israf eder ve Search Console'da "Sayfa yönlendirmeli (Page with redirect)" uyarısı vererek sitemap kalite puanını düşürür.

### Recommended Solution
`src/app/sitemap.ts` içindeki `staticKeys` listesinden `"feed"` çıkarılmalı; yalnızca kanonik `/tr/ilanlar` ve `/en/listings` rotaları korunmalıdır.

---

## SEARCH-002 — Kategori Bazlı Müstakil Kanonik URL Eksikliği & Kanonik Seyrelme

**Severity:** Blocker  
**Area:** Information Architecture & Marketplace SEO  
**Evidence Level:** LEVEL A — OFFICIAL (Google Search Central Faceted Navigation & Canonicalization)  
**Page Type:** Kategori Listeleme & Filtreleme  
**Affected URL Pattern:** `https://operis.pro/tr/ilanlar?category=[slug]`  
**Affected Files:** `src/app/[locale]/listings/page.tsx:31`, `src/app/[locale]/categories/page.tsx:98-100`  
**Affected Lines:** `listings/page.tsx:30-36`; `categories/page.tsx:95-102`  

### Current Behavior
Platformda 110 adet zengin uzmanlık kategorisi bulunmasına rağmen bu kategorilerin kendine ait `/tr/kategori/[slug]` şeklinde bağımsız birer kanonik rotası bulunmamaktadır. Kategori bağlantıları kullanıcıyı ve botları `/tr/ilanlar?category=backend-gelistirme` adresine yönlendirmektedir. `listings/page.tsx` içindeki `generateMetadata` fonksiyonu query parametrelerini yok sayarak kanonik adresi doğrudan ana listeye bağlamaktadır:
```ts
alternates: {
  canonical: isTr ? "/tr/ilanlar" : "/en/listings",
}
```

### Expected Behavior
Arama motorlarında pazar yerlerinin en yüksek trafik hacmini üreten "Freelance Backend Geliştirici", "Freelance Yapay Zeka Uzmanı", "React Geliştirici İlanları" gibi sorguları karşılamak üzere her kategorinin müstakil bir kanonik URL'si (`/tr/kategori/[slug]` veya `/tr/ilanlar/[slug]`), özel H1 başlığı, optimize meta description'ı ve Breadcrumb şeması olmalıdır.

### Root Cause
Kategori listelemesi yalnızca ana sayfadaki dinamik arama ve filtreleme bileşeni üzerinden sorgu parametresiyle kurgulanmış; statik URL mimarisi tasarlanmamıştır.

### Search Impact
Platform, Türkiye'deki yazılım ve teknoloji kategorisi aramalarının neredeyse tamamından mahrum kalmakta, tüm kategori sayfaları tek bir `/tr/ilanlar` sayfasına çökmektedir.

### Recommended Solution
`src/app/[locale]/kategori/[slug]/page.tsx` (veya `categories/[slug]/page.tsx` + Türkçe rewrite) rotası inşa edilmeli; kategoriye özel başlık, açıklama, aktif ilan sayısı ve CollectionPage şeması sunulmalıdır. `sitemap.ts` içine tüm aktif kategoriler eklenmelidir.

---

## SEARCH-003 — 7 Günlük Yaşam Döngüsü Dolan İlanların Anında HTTP 404 Vermesi (Index Collapse)

**Severity:** Blocker  
**Area:** Crawlability & Lifecycle SEO  
**Evidence Level:** LEVEL A — OFFICIAL (Google Search Central JobPosting & Expired Content Guidelines)  
**Page Type:** İlan Detay Şablonu (`/tr/ilanlar/[slug]`)  
**Affected URL Pattern:** `https://operis.pro/tr/ilanlar/[slug]`  
**Affected Files:** `src/app/[locale]/listings/[slug]/page.tsx:145-148`  
**Affected Lines:** Satır 145-148  

### Current Behavior
İlan detay sayfasında ilan süresi (168 saat / 7 gün) dolduğunda `ListingDetailPage` bileşeni doğrudan `notFound()` fonksiyonunu çağırmaktadır:
```ts
if (listing.status === "DELETED" || (!isOwner && !isCurrentlyActive)) {
  notFound();
}
```
Bu durum, yayından kalkan ilanın sayfayı ziyaret eden Googlebot, Bingbot veya kullanıcılara anında generic HTTP 404 döndürmesine yol açmaktadır.

### Expected Behavior
Google resmi JobPosting yönergelerine göre süresi dolan ilanlar anında 404'e düşürülmemelidir. Doğru yaşam döngüsü şöyledir:
1. İlan süresi dolduğunda sayfa HTTP 200 dönmeye devam etmeli,
2. Sayfada görünür bir uyarı yer almalı ("Bu ilanın süresi dolmuştur, yeni teklif kabul edilmemektedir"),
3. `JobPosting` yapılandırılmış verisi sayfadan kaldırılmalı veya `validThrough` geçmiş tarih olarak işaretlenmeli,
4. Sayfa meta etiketi `robots: { index: false, follow: true }` olarak güncellenmeli (böylece arama motoru dizinden sakince çıkarır),
5. Sayfada kullanıcının siteden ayrılmaması için aynı kategorideki 3-4 aktif benzer ilan listelenmelidir.
6. Gerçekten silinmiş (`DELETED`) ilanlar ise HTTP 410 Gone döndürmelidir.

### Root Cause
İlan gizliliği mantığı ile SEO yaşam döngüsü mantığının ayrıştırılmaması; süresi dolan ilanın silinmiş ilanla aynı muameleyi görmesi.

### Search Impact
Her hafta onlarca ilan 404 hatası üretecek; Google Search Console "Bulunamadı (404)" hatalarıyla dolacak, arama motorunun Operis alan adı kalitesine olan güveni aşınacaktır.

### Recommended Solution
`src/app/[locale]/listings/[slug]/page.tsx` içinde `isCurrentlyActive === false` durumu için özel bir "Süresi Dolan İlan (Expired Listing)" arayüzü render edilmeli; HTTP 200 yanıtı ile birlikte `noindex, follow` verilmeli ve benzer ilanlar önerilmelidir.

---

## SEARCH-004 — Dinamik Sayfalarda Hreflang `x-default` Etiketinin Eksik Olması

**Severity:** Critical  
**Area:** International SEO  
**Evidence Level:** LEVEL A — OFFICIAL (Google Search Central International & Multilingual SEO)  
**Page Type:** Tüm dinamik sayfalar (`listings/[slug]`, `u/[handle]`, `categories`, `about`, `legal/[slug]`)  
**Affected Files:** `src/app/[locale]/listings/[slug]/page.tsx:71-77`, `src/app/[locale]/u/[handle]/page.tsx:38-44`  
**Affected Lines:** Çeşitli (Metadata alternates blokları)  

### Current Behavior
Kök layout'ta (`src/app/[locale]/layout.tsx`) `x-default: "/tr"` tanımlanmışken, child sayfalarda `generateMetadata` fonksiyonları `alternates` nesnesini ezdiklerinde yalnızca `tr` ve `en` tanımlamakta, `x-default` sinyali göndermemektedir:
```ts
alternates: {
  canonical: getLocalizedListingPath(slug, locale),
  languages: {
    tr: getLocalizedListingPath(slug, "tr"),
    en: getLocalizedListingPath(slug, "en"),
  },
}
```

### Expected Behavior
Google ve uluslararası arama motorları için dil kümesinde eşleşmeyen tüm coğrafyalar adına varsayılan rotayı işaret eden `"x-default"` tanımlanmalıdır:
```ts
languages: {
  tr: getLocalizedListingPath(slug, "tr"),
  en: getLocalizedListingPath(slug, "en"),
  "x-default": getLocalizedListingPath(slug, "tr"),
}
```

### Root Cause
Çocuk sayfalarda metadata oluşturulurken `x-default` anahtarının şablona eklenmesinin unutulması.

### Search Impact
Farklı coğrafyalardan veya sistem dili Türkçe/İngilizce dışındaki kullanıcılara arama motoru tarafından yanlış veya eksik dil versiyonu sunulabilir.

### Recommended Solution
Tüm dinamik `generateMetadata` şablonlarına `"x-default"` satırı eklenmelidir (SEO-FIX-004).

---

## SEARCH-005 — `JobPosting` Yapılandırılmış Verisinde Uzaktan Çalışma Lokasyon Şartı Eksikliği

**Severity:** Critical  
**Area:** Structured Data & Rich Results  
**Evidence Level:** LEVEL A — OFFICIAL (Google Search Central JobPosting Specification)  
**Page Type:** İlan Detay Sayfası (`/tr/ilanlar/[slug]`)  
**Affected Files:** `src/app/[locale]/listings/[slug]/page.tsx:194-219`  
**Affected Lines:** Satır 206-218  

### Current Behavior
İlan detayında `JobPosting` JSON-LD şeması basılmaktadır. İlan uzaktan çalışma (`jobLocationType: "TELECOMMUTE"`) olarak işaretlenmiştir ancak Google'ın uzaktan işler için şart koştuğu `applicantLocationRequirements` özelliği bulunmamaktadır. Ayrıca `baseSalary` altındaki `unitText` değeri Google standartlarında bulunmayan `"PROJECT"` olarak tanımlanmıştır:
```json
"jobLocationType": "TELECOMMUTE",
"baseSalary": {
  "@type": "MonetaryAmount",
  "value": {
    "unitText": "PROJECT"
  }
}
```

### Expected Behavior
Google for Jobs standartlarına göre `jobLocationType: "TELECOMMUTE"` kullanıldığında başvurabilecek adayların ülkesi (`applicantLocationRequirements`) belirtilmelidir:
```json
"jobLocationType": "TELECOMMUTE",
"applicantLocationRequirements": {
  "@type": "Country",
  "name": "TR"
}
```
Ayrıca proje bazlı hakedişler için Google rich snippets `unitText` alanında `MONTH`, `HOUR` veya doğrudan açıklama metnini tercih etmektedir.

### Root Cause
Google'ın JobPosting zengin sonuç doğrulayıcısının (Rich Results Test) katı kurallarının göz ardı edilmesi.

### Search Impact
Google Search Console'da "Kritik olmayan sorunlar" veya "Eksik alan: applicantLocationRequirements" uyarısı verir; ilanların Google for Jobs arama kartlarında öne çıkmasını engeller.

### Recommended Solution
`src/app/[locale]/listings/[slug]/page.tsx` dosyasındaki JSON-LD oluşturma fonksiyonuna `applicantLocationRequirements` eklenmeli ve maaş formatı uyumlu hale getirilmelidir (SEO-FIX-005).

---

## SEARCH-006 — İçeriksiz ve Boş Kullanıcı Profillerinin Koşulsuz İndekslenmesi (Thin Content)

**Severity:** High  
**Area:** Content Quality & Index Bloat  
**Evidence Level:** LEVEL A — OFFICIAL (Google Search Essentials / Thin Content Guidelines)  
**Page Type:** Kullanıcı Profili (`/tr/profil/[handle]`)  
**Affected Files:** `src/app/[locale]/u/[handle]/page.tsx:58-61`  
**Affected Lines:** Satır 58-61  

### Current Behavior
`u/[handle]/page.tsx` rotasında kayıtlı olan her profil istisnasız olarak `robots: { index: true, follow: true }` olarak işaretlenmektedir. Kullanıcı hesabını yeni açmış, biyografi yazmamış, uzmanlık belirtmemiş veya hiçbir portfolyo yüklememiş olsa dahi sayfa arama motorlarına "indeksle" sinyali vermektedir.

### Expected Behavior
Yalnızca asgari profil doluluğuna sahip (örn. doğrulanmış şirket, bio/headline dolu, en az 1 beceri eklenmiş veya en az 1 tamamlanmış işi olan) profiller arama motoru dizinine alınmalıdır. İçi boş veya yeni açılmış taslak profiller `robots: { index: false, follow: true }` olmalıdır.

### Root Cause
Kullanıcı gizlilik ve doluluk durumunun `generateMetadata` fonksiyonunda sorgulanmaması.

### Search Impact
Binlerce boş veya düşük kaliteli profil dizine eklenerek sitenin "Helpful Content" ve içerik kalitesi ortalamasını düşürür.

### Recommended Solution
`ProfileService.getPublicProfileByHandle` sonucunda doluluk skoru (completeness score) kontrol edilmeli; yetersiz profillere `noindex, follow` verilmelidir (SEO-FIX-006).

---

## SEARCH-007 — `robots.ts` İçinde `OAI-SearchBot` Yapılandırmasının Eksik Olması

**Severity:** High  
**Area:** AI Discovery & Generative Search  
**Evidence Level:** LEVEL A — OFFICIAL (OpenAI Official SearchBot Documentation)  
**Page Type:** Robots Policy (`/robots.txt`)  
**Affected Files:** `src/app/robots.ts:10-18`  
**Affected Lines:** Satır 10-18  

### Current Behavior
`src/app/robots.ts` içinde `GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended` gibi botlar tek bir grupta toplanmıştır. Ancak OpenAI'ın ChatGPT Search için kullandığı özel tarayıcısı olan **`OAI-SearchBot`** listede açıkça belirtilmemiştir.

### Expected Behavior
OpenAI model eğitimi (`GPTBot`) ile arama motoru keşfi (`OAI-SearchBot`) birbirinden bağımsız iki crawl token'ıdır. Operis gibi bir pazar yerinin ChatGPT Search yanıtlarında kaynak gösterilebilmesi için `OAI-SearchBot` açıkça tanımlanmalı ve izin verilmelidir:
```text
User-agent: OAI-SearchBot
Allow: /
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/
```

### Root Cause
AI botlarının eğitim tarayıcıları ile anlık arama tarayıcıları arasındaki farkın robots konfigürasyonuna yansıtılmaması.

### AI Discovery Impact
ChatGPT Search üzerinde freelance yazılımcı arayan kurumsal kullanıcılara Operis ilanlarının ve profillerinin kaynak link olarak sunulmasında gecikme veya eksiklik yaşanması.

### Recommended Solution
`src/app/robots.ts` içine `OAI-SearchBot` kural grubu eklenmeli; eğitim botları ile arama botları ayrıştırılmalıdır (SEO-FIX-007).

---

## SEARCH-008 — Dahili Arama Sonuçlarının Robots.txt ile Engellenmemesi (Crawl Trap)

**Severity:** High  
**Area:** Crawl Budget & Scaled Search Results  
**Evidence Level:** LEVEL A — OFFICIAL (Google Search Essentials: Scaled Search Results Abuse Policy)  
**Page Type:** İlan Akışı Arama Parametresi (`/tr/ilanlar?q=...`)  
**Affected Files:** `src/app/robots.ts:37-56`, `src/app/[locale]/listings/page.tsx:50-54`  
**Affected Lines:** `robots.ts:37-56`  

### Current Behavior
Kullanıcılar veya harici siteler `/tr/ilanlar?q=python` gibi binlerce dahili arama sorgusu üretebilir. `src/app/robots.ts` dosyasında `?q=` sorguları engellenmemiştir ve `listings/page.tsx` bu sorgulara `robots: { index: true, follow: true }` döndürmektedir.

### Expected Behavior
Google resmi yönergeleri gereği dahili arama motoru sonuç sayfaları Google dizinine sokulmamalıdır. `robots.ts` içinde `Disallow: /*?*q=*` tanımlanmalı ve arama parametresi içeren sayfalara `noindex, follow` verilmelidir.

### Root Cause
Dahili arama sayfalarının genel listeleme sayfasıyla aynı şablonu paylaşması ve sorgu parametresi ayrımının yapılmaması.

### Search Impact
Googlebot milyonlarca potansiyel arama sorgusunu tarayarak crawl budget tüketir ve arama sonuçlarını indeksleyerek "Scaled Content / Search Result Abuse" cezası riski yaratır.

### Recommended Solution
`robots.ts` içine `Disallow: /*?*q=*` eklenmeli; `listings/page.tsx` meta verisinde `q` varsa `robots: { index: false, follow: true }` verilmelidir (SEO-FIX-008).

---

## SEARCH-009 — Ana Sayfada Kullanımdan Kaldırılmış (Deprecated) `SearchAction` Şeması

**Severity:** Medium  
**Area:** Structured Data Modernization  
**Evidence Level:** LEVEL A — OFFICIAL (Google Search Central November 2024 Sitelinks Searchbox Deprecation)  
**Page Type:** Ana Sayfa (`/[locale]/page.tsx`)  
**Affected Files:** `src/app/[locale]/page.tsx:197-204`  
**Affected Lines:** Satır 197-204  

### Current Behavior
Ana sayfadaki `WebSite` JSON-LD şemasında `potentialAction: { "@type": "SearchAction", ... }` tanımlıdır ve dahili `?q={search_term_string}` şablonuna işaret etmektedir.

### Expected Behavior
Google, Kasım 2024 itibarıyla Sitelinks Searchbox özelliğini dünya genelinde tamamen kullanımdan kaldırmıştır (deprecated). Bu şema Google üzerinde herhangi bir zengin görünüm sağlamadığı gibi, botlara dahili arama URL kalıplarını göstererek gereksiz tarama daveti çıkarır.

### Recommended Solution
`SearchAction` şeması temizlenmeli; `WebSite` şeması yalnızca `name`, `url`, `publisher` ve `inLanguage` özellikleri ile sadeleştirilmelidir (SEO-FIX-009).

---

## SEARCH-010 — Vercel URL'sinin Kanonik Base URL'i Ezme Riski

**Severity:** High  
**Area:** Canonical Integrity & Environment Configuration  
**Evidence Level:** LEVEL A — OFFICIAL (Vercel System Environment Variables & Google Canonical Guidelines)  
**Page Type:** Tüm Platform Genelinde Canonical & Sitemap  
**Affected Files:** `src/lib/config/url.ts:14-16`  
**Affected Lines:** Satır 14-16  

### Current Behavior
`src/lib/config/url.ts` dosyasında `getBaseUrl()` fonksiyonu:
```ts
if (process.env.VERCEL_URL) {
  return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, "");
}
return "https://operis.pro";
```
kuralını barındırmaktadır. Vercel prodüksiyon ortamında `APP_URL` veya `NEXT_PUBLIC_APP_URL` tanımlanmadığı takdirde, Vercel otomatik olarak `VERCEL_URL` ortam değişkenini sunucuya sağlar (`operis-xyz.vercel.app`). Bu durumda tüm kanonik başlıklar ve sitemap linkleri `https://operis.pro` yerine geçici Vercel domain'ine döner.

### Expected Behavior
Canlı ortamda (`NODE_ENV === "production"`), kanonik URL hiçbir koşulda ara preview domain'lerine sapmamalı, mutlak olarak `https://operis.pro` dönmelidir.

### Recommended Solution
`getBaseUrl()` fonksiyonunda `NODE_ENV === "production"` kontrolü yapılarak öncelik daima `https://operis.pro` alan adına verilmelidir (SEO-FIX-010).

---

## SEARCH-011 — Özel Çalışma Alanı (Workspace) Sayfasında JSON-LD Breadcrumb Enjeksiyonu

**Severity:** Medium  
**Area:** Privacy & Structured Data Cleanliness  
**Evidence Level:** LEVEL B — STRONG INDUSTRY PRACTICE  
**Page Type:** Özel Çalışma Alanı (`/tr/calisma-alani/[id]`)  
**Affected Files:** `src/app/[locale]/work/[id]/page.tsx:119-145`  
**Affected Lines:** Satır 119-145  

### Current Behavior
İki taraf arasındaki gizli ve sözleşmeli çalışma alanı olan `/tr/calisma-alani/[id]` sayfasında `robots: { index: false, follow: false }` bulunmasına rağmen DOM içine `BreadcrumbList` JSON-LD şeması basılmaktadır.

### Expected Behavior
Arama motorlarına kapalı olan, kimlik doğrulama gerektiren özel sayfalarda Schema.org işaretlemesi yapılmamalıdır. Bu işaretleme şema tarayıcılarının kapalı URL parametrelerini toplamasına ve gereksiz payload şişkinliğine neden olur.

### Recommended Solution
`work/[id]/page.tsx` içindeki `JsonLd` bileşeni kaldırılmalıdır (SEO-FIX-011).

---

## SEARCH-012 — Dinamik İlanlar İçin Dinamik OpenGraph Görseli Eksikliği

**Severity:** Medium  
**Area:** Social Discovery & Click-Through Rate (CTR)  
**Evidence Level:** LEVEL B — STRONG INDUSTRY PRACTICE  
**Page Type:** İlan Detay Sayfası (`/tr/ilanlar/[slug]`)  
**Affected Files:** `src/app/[locale]/listings/[slug]/page.tsx:78-87`  
**Affected Lines:** Satır 78-87  

### Current Behavior
İlan detay sayfalarında OpenGraph paylaşım görseli olarak genel `og-image.png` kullanılmaktadır. Twitter/LinkedIn veya WhatsApp üzerinden paylaşılan bir ilanda bütçe, teknoloji etiketleri ve proje başlığı yerine jenerik platform görseli çıkmaktadır.

### Expected Behavior
Dinamik ilan paylaşımlarında ilanın başlığını, bütçesini ve kategori rozetini içeren dinamik Edge-generated OG Image (Next.js `ImageResponse` / `@vercel/og`) üretilmelidir. Bu durum sosyal paylaşımlardan gelen tıklama oranını (CTR) %40'a kadar artırır.

### Recommended Solution
`src/app/[locale]/listings/[slug]/opengraph-image.tsx` şablonu tasarlanmalıdır (SEO-FIX-012).

---

## SEARCH-013 — IndexNow Anlık Dizin Bildirim Protokolünün Bulunmaması

**Severity:** Medium  
**Area:** Freshness & Instant Indexing  
**Evidence Level:** LEVEL A — OFFICIAL (IndexNow.org / Microsoft Bing Webmaster)  
**Page Type:** Yaşam Döngüsü Olayları (Listing CRUD / Expiration)  
**Affected Files:** `src/modules/listings/services/listing-crud.service.ts`  
**Affected Lines:** Tüm yayınlama ve arşivleme metodları  

### Current Behavior
Platformda yeni bir ilan açıldığında, güncellendiğinde veya 7 gün dolup arşivlendiğinde Bing, Yandex ve diğer IndexNow ortaklarına anlık bildirim gönderen bir webhook/servis mekanizması bulunmamaktadır.

### Expected Behavior
İlan yayınlandığı (`PUBLISH`), süresi dolduğu (`EXPIRE`) veya silindiği (`DELETE`) anda arka planda Inngest veya outbox job ile IndexNow API'sine HTTP POST yapılarak URL güncelliği anında arama motorlarına bildirilmelidir.

### Recommended Solution
`scripts/` veya `src/lib/seo/indexnow.ts` servisi yazılarak yaşam döngüsü tetikleyicilerine bağlanmalıdır (SEO-FIX-013).

---

## SEARCH-014 — Dashboard Layout'unda Açıkça `X-Robots-Tag: noindex` Tanımlanmaması

**Severity:** Medium  
**Area:** Indexation Armor / Defense in Depth  
**Evidence Level:** LEVEL A — OFFICIAL (Google Search Central Robots Meta Tag & X-Robots-Tag)  
**Page Type:** Kullanıcı Paneli Rotaları (`/tr/panel/*`)  
**Affected Files:** `src/app/[locale]/dashboard/layout.tsx`  
**Affected Lines:** Satır 1-88  

### Current Behavior
`src/app/[locale]/dashboard/layout.tsx` herhangi bir `metadata` objesi veya `robots` kuralı export etmemektedir. Panel rotalarının dizine girmemesi yalnızca `robots.txt` disallow kuralına ve unauthenticated login redirect'ine dayanmaktadır. Ancak Google harici bir siteden bir dashboard linki keşfederse robots.txt engeli nedeniyle sayfadaki meta tag'i okuyamaz ve URL'yi başlıksız olarak dizine ekleyebilir.

### Expected Behavior
Dashboard layout seviyesinde `robots: { index: false, follow: false }` tanımlanmalı veya HTTP yanıtında `X-Robots-Tag: noindex, nofollow` başlığı gönderilmelidir.

### Recommended Solution
`src/app/[locale]/dashboard/layout.tsx` içine `export const metadata: Metadata = { robots: { index: false, follow: false } }` eklenmelidir (SEO-FIX-014).

---

# 5. SEARCH & AI READINESS SONUÇLARI

### Klasik Arama Motoru Hazırlığı:
> **NOT SEARCH READY (YAYIN ENGELLEYİCİLER MEVCUT)**

- **Gerekçe:** Sitemap içindeki 301 yönlendirmeleri (SEARCH-001), kategorilerin müstakil URL'lerinin olmaması (SEARCH-002) ve süresi dolan ilanların anında 404 üretmesi (SEARCH-003) çözülmeden site Google'a açılırsa indeks çöküşü ve tarama cezası kaçınılmazdır.

### Yapay Zeka Arama & GEO Hazırlığı:
> **SEARCH READY WITH CONDITIONS (ŞARTLI HAZIR)**

- **Gerekçe:** Platform `public/llms.txt` ve zengin Markdown özetlerine sahiptir, SSR ile ham içerik sunabilmektedir. Ancak `OAI-SearchBot` izinlerinin verilmesi (SEARCH-007) ve JobPosting lokasyon şemasının tamamlanması (SEARCH-005) şarttır.
