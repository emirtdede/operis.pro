# OPERIS — PRE-LAUNCH SEARCH CHECKLIST

**Domain:** `https://operis.pro`  
**Sürüm / Tarih:** v1.0.0 / Mart 2025  
**Kapsam:** Yayın Öncesi Arama Motoru, Yapay Zeka Keşfedilebilirliği ve Dizinleme Kapıları  
**Hazırlayan:** Organic Search & AI Discovery Engineering Team  

---

## 1. BLOCKER (YAYIN ENGELLEYİCİLER — ÇÖZÜLMEDEN LAUNCH EDİLEMEZ)

Bu maddeler çözülmeden arama motorlarına site açıldığında veya dizinleme başlatıldığında tüm domain'in dizinleme sağlığı çöker veya Google botları crawl döngüsünde cezalandırıcı sinyaller üretir.

- [ ] **BLOCKER-01: Sitemap Redirect İhlali Düzeltildi mi?**
  * **Açıklama:** `src/app/sitemap.ts` içindeki `feed` anahtarı (`/tr/akis` ve `/en/feed`) kaldırılmalıdır. `src/proxy.ts:119` bu URL'leri kalıcı (301) yönlendirdiği için sitemap içerisinde asla yer almamalıdır.
  * **Doğrulama:** `curl -I https://operis.pro/sitemap.xml` çıktısındaki tüm URL'ler HTTP 200 dönmeli, 301/302/404 içermemelidir.
- [ ] **BLOCKER-02: Kategori Landing Sayfaları (Kanonik Dizinleme) Kuruldu mu?**
  * **Açıklama:** 110 kategorinin tamamı için `/tr/kategori/[slug]` canonical rotası oluşturulmalı; her kategori kendi statik URL'sine ve özgün H1/description alanına sahip olmalıdır. `?category=...` filtre URL'lerinin ana ilana kanonik işaret etme karmaşası bitirilmelidir.
  * **Doğrulama:** `/tr/kategori/web-yazilim` URL'si HTTP 200 dönmeli ve `<link rel="canonical" href="https://operis.pro/tr/kategori/web-yazilim" />` içermelidir.
- [ ] **BLOCKER-03: Süresi Dolan İlanlar İçin 404 Krizini Önleyen Lifecycle Devreye Alındı mı?**
  * **Açıklama:** Süresi dolan ilanlar (`expiredAt < now`) anında HTTP 404 `notFound()` tetiklememelidir. Bunun yerine HTTP 200 + `<meta name="robots" content="noindex, follow" />` + "Bu ilanın süresi dolmuştur, benzer aktif ilanlar:" arayüzü sunulmalıdır.
  * **Doğrulama:** Süresi dolmuş test ilanı tarandığında HTTP 200 dönmeli, header veya meta'da `noindex` bulunmalı ve sayfadaki iç linkler taranabilir (`follow`) olmalıdır.

---

## 2. CRITICAL (KRİTİK — İLK 48 SAATTE DÜZELTİLMELİ)

- [ ] **CRITICAL-01: Tüm Çok Dilli Rotalarda `x-default` Hreflang Eklendi mi?**
  * **Açıklama:** `listings/[slug]`, `u/[handle]`, `categories`, `about`, `legal/[slug]` rotalarının metadata'sında `alternates.languages` içine `x-default: https://operis.pro/tr/...` tanımlanmalıdır.
  * **Doğrulama:** Sayfa kaynak kodunda `<link rel="alternate" hreflang="x-default" href="..." />` etiketi doğrulanmalıdır.
- [ ] **CRITICAL-02: Google JobPosting Şeması Konum Zorunluluğu Karşılandı mı?**
  * **Açıklama:** `jobLocationType: "TELECOMMUTE"` için Google Rich Results'ın zorunlu kıldığı `applicantLocationRequirements: { "@type": "Country", "name": "TR" }` nesnesi eklenmelidir.
  * **Doğrulama:** Rich Results Test aracında sıfır hata ve sıfır uyarı alınmalıdır.
- [ ] **CRITICAL-03: Kategori Sayfaları BreadcrumbList Şeması ile Donatıldı mı?**
  * **Açıklama:** Ana Sayfa > Sektör > Kategori hiyerarşisi hem UI'da hem de JSON-LD BreadcrumbList formatında sunulmalıdır.
  * **Doğrulama:** Schema.org Validator üzerinden `BreadcrumbList` nesnesi doğrulanmalıdır.

---

## 3. HIGH (YÜKSEK ÖNCELİK — LAUNCH HAFTASI)

- [ ] **HIGH-01: Boş / İnce Profiller İçin Noindex Filtresi Devreye Girdi mi?**
  * **Açıklama:** Biyografisi, portfolyosu ve tamamlanmış ilanı olmayan profiller `robots: { index: false, follow: true }` olarak işaretlenmeli; dizin çöpü (index bloat) engellenmelidir.
  * **Doğrulama:** Boş bir kullanıcı profili çağrıldığında HTML `<head>` içinde `noindex` görülmelidir.
- [ ] **HIGH-02: `OAI-SearchBot` ve AI Crawler Kuralları `robots.ts`'e Eklendi mi?**
  * **Açıklama:** ChatGPT Search botu (`OAI-SearchBot`) açıkça izinli (`Allow: /`) yapılmalı; `/tr/panel/`, `/tr/mesajlar/` gibi özel alanlar kısıtlanmalıdır.
  * **Doğrulama:** `https://operis.pro/robots.txt` çıktısı kontrol edilmelidir.
- [ ] **HIGH-03: Dahili Arama Parametresi `?q=` Robots ve Meta Noindex ile Korundu mu?**
  * **Açıklama:** Arama motorlarının dahili arama sonuçlarını indekslemesi Google Spam Policies uyarınca engellenmelidir.
  * **Doğrulama:** `robots.txt` içinde `Disallow: /*?*q=*` yer almalıdır.
- [ ] **HIGH-04: Canlı Domain Canonical Güvencesi (`APP_URL`) Sağlandı mı?**
  * **Açıklama:** `src/lib/config/url.ts` içerisinde `VERCEL_URL` fallback'i yerine production ortamında kesin `https://operis.pro` zorunlu kılınmalıdır.
  * **Doğrulama:** Canlı yayında canonical URL'lerin asla `*.vercel.app` içermediği teyit edilmelidir.
- [ ] **HIGH-05: Dinamik OG Image Altyapısı Aktif mi?**
  * **Açıklama:** İlanlar ve kategoriler için `og:image` dinamik Edge Route (`api/og`) üzerinden üretilmeli; sosyal medya paylaşımlarında zengin kart görünümü sağlanmalıdır.
  * **Doğrulama:** Facebook Sharing Debugger ve Twitter Card Validator ile test edilmelidir.

---

## 4. MEDIUM (ORTA ÖNCELİK — YAYIN SONRASI İLK 2 HAFTA)

- [ ] **MEDIUM-01: IndexNow Entegrasyonu Tamamlandı mı?**
  * **Açıklama:** Yeni ilan yayınlandığında veya güncellendiğinde Bing ve Yandex'e IndexNow API üzerinden asenkron ping gönderilmelidir.
  * **Doğrulama:** API uç noktası test isteği ile Bing Webmaster Tools üzerinden doğrulanmalıdır.
- [ ] **MEDIUM-02: Semantik `<time datetime="...">` Etiketleri Eklendi mi?**
  * **Açıklama:** Göreli tarihlerin (ör. "2 gün önce") yanına makine tarafından okunabilir ISO-8601 zaman damgaları eklenmelidir.
- [ ] **MEDIUM-03: Kategori Bazlı Pagination Crawlability Sağlandı mı?**
  * **Açıklama:** Sayfalama butonları salt JavaScript `onClick` yerine gerçek `<a href="/tr/kategori/web-yazilim?sayfa=2">` bağlantıları içermelidir.
- [ ] **MEDIUM-04: Görsel WebP/AVIF Dönüşümü ve Alt Etiketleri Denetlendi mi?**
  * **Açıklama:** Next.js Image bileşeni üzerinden tüm avatarlar ve ilan kapakları optimize edilmeli; dekoratif olmayan görsellerde açıklayıcı alt metin bulunmalıdır.

---

## 5. LOW (DÜŞÜK ÖNCELİK — POLISH & OPTİMİZASYON)

- [ ] **LOW-01: `public/llms.txt` Kategori ve Yol Güncelliği Kontrol Edildi mi?**
  * **Açıklama:** Yeni kategori rotaları eklendikçe `llms.txt` dosyası güncellenmelidir.
- [ ] **LOW-02: Eski / Artık Desteklenmeyen Meta Tag'ler Temizlendi mi?**
  * **Açıklama:** Modern arama motorları tarafından dikkate alınmayan etiketler temizlenmelidir.
- [ ] **LOW-03: Favicon ve Web App Manifest SVG/PNG Çözünürlükleri Teyit Edildi mi?**
  * **Açıklama:** Google Arama mobil sonuçlarında site simgesinin net görünmesi için 48x48 ve katları boyutlar kontrol edilmelidir.

---

## 6. ONAY KAPISI (SIGN-OFF)

| Rol | Sorumlu | Onay Durumu | Tarih |
|---|---|---|---|
| **Technical SEO Architect** | Lead Engineer | [ ] BEKLEMEDE | - |
| **Search Engine Optimization Lead** | SEO Specialist | [ ] BEKLEMEDE | - |
| **Frontend SEO Engineer** | Principal Engineer | [ ] BEKLEMEDE | - |
| **AI Discovery Specialist** | AI Specialist | [ ] BEKLEMEDE | - |
