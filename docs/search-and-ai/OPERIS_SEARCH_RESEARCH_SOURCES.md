# OPERIS — SEARCH & AI DISCOVERY RESEARCH SOURCES

**Domain:** `https://operis.pro`  
**Sürüm / Tarih:** v1.0.0 / Mart 2025  
**Kapsam:** Audit ve Strateji Belgelerinde Kullanılan Resmi ve Teknik Doğrulama Kaynakları  
**Hazırlayan:** Organic Search & AI Discovery Engineering Team  

---

## 1. KANIT SEVİYESİ DAĞILIMI VE PRENSİP

Bu denetimde hiçbir karar SEO bloglarından, doğrulanmamış kulaktan dolma iddialardan veya "guru" tahminlerinden türetilmemiştir. Her teknik kural ve tavsiye aşağıdaki hiyerarşiye göre resmi dokümanlarla doğrulanmıştır:

* **LEVEL A — OFFICIAL:** Arama motorlarının (Google, Bing), yapay zeka geliştiricilerinin (OpenAI, Microsoft, Anthropic), resmi standart kuruluşlarının (Schema.org, W3C) bizzat yayınladığı yönergeler ve API belgeleri.
* **LEVEL B — STRONG INDUSTRY EVIDENCE:** Arama motoru mühendislerinin açık teyitleri veya büyük veri setleriyle doğrulanmış sektör konsensüsü.
* **LEVEL C — EXPERIMENTAL:** Yeni gelişen, potansiyel faydası olan ancak henüz resmi standart olmayan yaklaşımlar (ör. `llms.txt`).
* **LEVEL D — MYTH / UNSUPPORTED:** Yanıltıcı, spam sayılan veya algoritmik ceza riski taşıyan asılsız teoriler (Plan ve uygulamadan tamamen hariç tutulmuştur).

---

## 2. RESMİ VE TEKNİK KAYNAKLAR TABLOSU

| ID | Source | Publisher | URL | Date Checked | Topic | Evidence Level |
|---|---|---|---|---|---|---|
| **REF-001** | Google Search Central: Robots.txt Specifications | Google | `https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt` | Mart 2025 | Robots.txt sözdizimi, bot kuralları, tarama kısıtlamaları | **LEVEL A — OFFICIAL** |
| **REF-002** | Google Search Central: Sitemaps Overview & Guidelines | Google | `https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview` | Mart 2025 | XML Sitemap gereksinimleri, 301/404 yasakları, lastmod | **LEVEL A — OFFICIAL** |
| **REF-003** | Google Search Central: Consolidate Duplicate URLs (Canonical) | Google | `https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls` | Mart 2025 | rel="canonical" sinyalleri, parametre yönetimi | **LEVEL A — OFFICIAL** |
| **REF-004** | Google Search Central: Localized Versions (hreflang) | Google | `https://developers.google.com/search/docs/specialty/international/localized-versions` | Mart 2025 | hreflang etiketleri, x-default zorunluluğu, çok dillilik | **LEVEL A — OFFICIAL** |
| **REF-005** | Google Search Central: JobPosting Structured Data | Google | `https://developers.google.com/search/docs/appearance/structured-data/job-posting` | Mart 2025 | Uzaktan çalışma, applicantLocationRequirements zorunluluğu | **LEVEL A — OFFICIAL** |
| **REF-006** | Google Search Central: Breadcrumb Structured Data | Google | `https://developers.google.com/search/docs/appearance/structured-data/breadcrumb` | Mart 2025 | BreadcrumbList şeması ve mobil arama görünümü | **LEVEL A — OFFICIAL** |
| **REF-007** | Google Search Central: Deprecated Rich Results Updates | Google | `https://developers.google.com/search/updates` | Mart 2025 | FAQ rich results ve Sitelinks searchbox resmi yürürlükten kalkışı | **LEVEL A — OFFICIAL** |
| **REF-008** | Google Search Essentials: Spam Policies (Internal Search) | Google | `https://developers.google.com/search/docs/essentials/spam-policies` | Mart 2025 | Dahili arama sonuçlarının dizinlenmesi yasağı, Scaled Content Abuse | **LEVEL A — OFFICIAL** |
| **REF-009** | Google Search Central: Creating Helpful, People-First Content | Google | `https://developers.google.com/search/docs/fundamentals/creating-helpful-content` | Mart 2025 | E-E-A-T ilkeleri, özgün değer ve yapay içerik riskleri | **LEVEL A — OFFICIAL** |
| **REF-010** | OpenAI Documentation: Crawlers Overview (OAI-SearchBot & GPTBot) | OpenAI | `https://platform.openai.com/docs/bots` | Mart 2025 | ChatGPT Search taranabilirliği ve model eğitim botu ayrımı | **LEVEL A — OFFICIAL** |
| **REF-011** | Bing Webmaster Guidelines | Microsoft Bing | `https://www.bing.com/webmasters/help/webmasters-guidelines` | Mart 2025 | Bingbot tarama kriterleri, dizinleme ve Bing Copilot uyumu | **LEVEL A — OFFICIAL** |
| **REF-012** | IndexNow Protocol Documentation | IndexNow (Microsoft & Yandex) | `https://www.indexnow.org/documentation` | Mart 2025 | Dinamik içerik anlık bildirim protokolü ve API entegrasyonu | **LEVEL A — OFFICIAL** |
| **REF-013** | Schema.org Community Vocabulary Specifications | Schema.org | `https://schema.org/` | Mart 2025 | Organization, WebSite, JobPosting, ProfilePage sözdizimi | **LEVEL A — OFFICIAL** |
| **REF-014** | web.dev: Core Web Vitals (LCP, INP, CLS) Metrics | Google / web.dev | `https://web.dev/explore/metrics` | Mart 2025 | Sayfa hızı, etkileşim gecikmesi ve düzen kayması standartları | **LEVEL A — OFFICIAL** |
| **REF-015** | W3C Semantic HTML5 Recommendations | W3C | `https://www.w3.org/TR/html52/` | Mart 2025 | Semantik doküman iskeleti, makine okunabilirliği | **LEVEL A — OFFICIAL** |
| **REF-016** | Next.js Metadata and SEO Architecture Guide | Vercel / Next.js | `https://nextjs.org/docs/app/building-your-application/optimizing/metadata` | Mart 2025 | Next.js 16 generateMetadata, sitemap.ts, robots.ts uygulaması | **LEVEL A — OFFICIAL** |
| **REF-017** | The llms.txt Proposal & Community Discussion | Jeremy Howard / Answer.ai | `https://llmstxt.org/` | Mart 2025 | LLM bağlam özet dosyası formatı (Deneysel standart) | **LEVEL C — EXPERIMENTAL** |

---

## 3. ESKİ VEYA YÜRÜRLÜKTEN KALKAN TEKNİKLER (DEPRECATED IN 2024/2025)

1. **Google Sitelinks Searchbox (Kasım 2024 İtibarıyla Kaldırıldı):**
   * *Açıklama:* WebSite şemasına eklenen `potentialAction: { "@type": "SearchAction" }` özelliği Google tarafından tamamen devre dışı bırakılmıştır. Kod karmaşası yaratmamak adına Operis şemalarında bu özellik terk edilmiştir.
2. **Genel FAQ Rich Results (Ağustos 2023 İtibarıyla Kaldırıldı):**
   * *Açıklama:* Google, FAQPage şemalarını artık yalnızca resmi kamu ve sağlık kurumları için zengin sonuç olarak sunmaktadır. Ticari sitelerde arama görünümüne katkısı sıfırdır.
3. **Google-Extended Botunun Arama Görünürlüğünü Etkilediği İddiası (Yanlış):**
   * *Açıklama:* `Google-Extended` yalnızca Gemini ve Vertex AI eğitim modellerini kısıtlar. Bu botun engellenmesi Google Search veya Google AI Overviews dizinlenmesini etkilemez.
4. **Rel Next / Rel Prev Sayfalama Etiketleri (2019'da Kaldırıldı):**
   * *Açıklama:* Google sayfalamayı rel="next/prev" yerine normal bağlantılar ve benzersiz başlıklar üzerinden anlar. Standart `<a href="...">` bağlantıları tek geçerli yöntemdir.
