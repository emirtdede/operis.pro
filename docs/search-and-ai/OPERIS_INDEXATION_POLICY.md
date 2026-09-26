# OPERIS — RESMİ İNDEKSLENME VE DİZİN POLİTİKASI
## (OFFICIAL INDEXATION & CANONICAL POLICY)

**Versiyon:** 1.0.0-PROD  
**Kapsam:** Tüm Operis URL Şeması (`https://operis.pro`)  
**Hedef:** Pazar yeri kalitesini korumak, crawl bütçesini optimize etmek, "thin content" ve "duplicate content" cezalarını önlemek.

---

## 1. ROTA VE ŞABLON BAZLI İNDEKSLENME MATRİSİ

| Şablon ID | Sayfa / Rota | Dizin Durumu (Index) | Takip Durumu (Follow) | Kanonik URL Kuralı | XML Sitemap Durumu | Koşul / Not |
|---|---|:---:|:---:|---|:---:|---|
| **TPL-01** | `/[locale]` (Ana Sayfa) | **INDEX** | **FOLLOW** | Mutlak `https://operis.pro/${locale}` | **DAHİL** | `x-default: /tr` |
| **TPL-02** | `/[locale]/listings` (Katalog) | **INDEX** | **FOLLOW** | `https://operis.pro/${locale}/listings` | **DAHİL** | Parametresiz kök katalog |
| **TPL-03** | `/[locale]/listings?category=...` | **NOINDEX** | **FOLLOW** | Müstakil Kategori URL'sine Kanonik | HARİÇ | Müstakil kategori açılana dek `noindex` |
| **TPL-04** | `/[locale]/listings?q=...` (Arama) | **NOINDEX** | **FOLLOW** | Self-canonical + `noindex, follow` | HARİÇ | Scaled search abuse kalkanı |
| **TPL-05** | `/[locale]/listings?sort=...&page=...` | **NOINDEX** | **FOLLOW** | Parametresiz Kanoniğe Bağlı | HARİÇ | Dizin şişmesini (Index Bloat) önler |
| **TPL-06** | `/[locale]/categories/[slug]` (Kategori) | **INDEX** | **FOLLOW** | `https://operis.pro/${locale}/kategori/${slug}` | **DAHİL** | Anahtar kelime iniş sayfası |
| **TPL-07** | `/[locale]/listings/[slug]` (Aktif İlan) | **INDEX** | **FOLLOW** | `https://operis.pro/${locale}/listings/${slug}` | **DAHİL** | 168 saat süresince tam indeks |
| **TPL-08** | `/[locale]/listings/[slug]` (Süresi Biten) | **NOINDEX** | **FOLLOW** | Self-canonical + `noindex, follow` | HARİÇ | 200 OK + Benzer ilanlar önerilir |
| **TPL-09** | `/[locale]/listings/[slug]` (Silinmiş İlan) | **410 GONE** | — | — | HARİÇ | Kalıcı silinme sinyali |
| **TPL-10** | `/[locale]/u/[handle]` (Dolu Profil) | **INDEX** | **FOLLOW** | `https://operis.pro/${locale}/profile/${handle}` | **DAHİL** | Biyografi ve becerisi tam profiller |
| **TPL-11** | `/[locale]/u/[handle]` (Yetersiz/Boş) | **NOINDEX** | **FOLLOW** | Self-canonical + `noindex, follow` | HARİÇ | Thin-content kalkanı |
| **TPL-12** | `/[locale]/about` (Kurumsal Manifesto) | **INDEX** | **FOLLOW** | `https://operis.pro/${locale}/about` | **DAHİL** | E-E-A-T ve kurumsal kimlik |
| **TPL-13** | `/[locale]/contact` (İletişim & Künye) | **INDEX** | **FOLLOW** | `https://operis.pro/${locale}/contact` | **DAHİL** | Resmi künye ve şirket bilgileri |
| **TPL-14** | `/[locale]/help` (Bilgi Merkezi & SSS) | **INDEX** | **FOLLOW** | `https://operis.pro/${locale}/help` | **DAHİL** | SSS ve pazar yeri rehberi |
| **TPL-15** | `/[locale]/brand` (Marka & Varlıklar) | **INDEX** | **FOLLOW** | `https://operis.pro/${locale}/brand` | **DAHİL** | Logo ve basın varlıkları |
| **TPL-16** | `/[locale]/legal/[slug]` (Yasal Metinler)| **INDEX** | **FOLLOW** | `https://operis.pro/${locale}/legal/${slug}` | **DAHİL** | Şeffaflık ve mevzuat belgeleri |
| **TPL-17** | `/[locale]/login` / `register` | **NOINDEX** | **FOLLOW** | Self-canonical | HARİÇ | Transactional kapılar dizine sokulmaz |
| **TPL-18** | `/[locale]/dashboard/*` (Panel) | **NOINDEX** | **NOFOLLOW** | — | HARİÇ | robots.txt disallow + Auth redirect |
| **TPL-19** | `/[locale]/work/[id]` (Çalışma Alanı) | **NOINDEX** | **NOFOLLOW** | — | HARİÇ | Gizli iki taraflı sözleşme alanı |
| **TPL-20** | `/admin/*` (Yönetici Konsolu) | **NOINDEX** | **NOFOLLOW** | — | HARİÇ | HTTP 403 / Redirect + robots.txt |

---

## 2. DİL VE COĞRAFYA KANONİK KURALLARI (HREFLANG POLICY)

1. **Birincil Dil & x-default:**  
   Operis Türkiye merkezli bir platformdur. Dil eşleşmesi bulunmayan tüm uluslararası ziyaretçiler ve arama botları için `x-default` değeri daima **Türkçe (`/tr`)** rotayı işaret etmelidir.
2. **Kanonik URL Mutlaklığı:**  
   Kanonik URL'ler hiçbir zaman göreceli (relative `/tr/ilanlar`) bırakılmamalı; `metadataBase` üzerinden daima `https://operis.pro` protokol ve host'u ile tam nitelikli (fully-qualified) basılmalıdır.
3. **Trailing Slash Standartı:**  
   Platform genelinde URL'lerin sonunda eğik çizgi (trailing slash) bulunmamalıdır (`/tr/ilanlar` geçerli; `/tr/ilanlar/` 308 ile düzeltilir).
4. **Büyük/Küçük Harf (Case Sensitivity):**  
   Tüm URL'ler mutlak olarak küçük harfli (lowercase) olmalıdır.

---

## 3. YAŞAM DÖNGÜSÜ İNDEKSLEME POLİTİKASI (LIFECYCLE RULES)

### A. İlan Yayınlandığında (ACTIVE):
- URL anında `sitemap.xml` dinamik listesine eklenir.
- IndexNow üzerinden Bing ve arama motorlarına bildirim atılır.
- Meta tag: `index, follow`.
- Şema: `JobPosting` (Remote parametreleri ile eksiksiz).

### B. İlanın 7 Günü Dolduğunda (INACTIVE_EXPIRED):
- URL `sitemap.xml` dosyasından otomatik olarak çıkarılır.
- Sayfa HTTP 200 döner, ancak meta tag anında `noindex, follow` yapılır.
- `JobPosting` şeması temizlenir.
- Kullanıcıya "Süresi dolmuştur" uyarısı ile aynı kategoriden benzer 3 ilan gösterilir.

### C. İlan Yeniden Aktifleştirildiğinde (REACTIVATED):
- `active_until = now + 7 days` atanır.
- URL tekrar `sitemap.xml`'e girer, IndexNow ping'i atılır.
- Meta tag tekrar `index, follow` olur.

### D. İlan Silindiğinde (DELETED):
- Sayfa HTTP 410 Gone döndürür.
