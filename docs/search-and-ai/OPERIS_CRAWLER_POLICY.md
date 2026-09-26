# OPERIS — ARAMA MOTORU VE YAPAY ZEKA TARAYICI POLİTİKASI
## (OFFICIAL BOT & AI CRAWLER ACCESS POLICY)

**Versiyon:** 1.0.0-PROD  
**Yürürlük Tarihi:** 26 Eylül 2026  
**Hedef:** Pazar yerinin arama motorları ve AI arama yanıtlarında en yüksek görünürlükte listelenmesini sağlarken; telifli ilan içeriklerinin ve kullanıcı verilerinin yetkisiz model eğitimine karşı korunması.

---

## 1. TEMEL FELSEFE: ARAMA GÖRÜNÜRLÜĞÜ VS. MODEL EĞİTİMİ AYRIMI

Operis iki farklı bot türünü kesin sınırlarla birbirinden ayırır:
1. **Arama & Yanıt Keşif Tarayıcıları (Search & Retrieval Crawlers):**  
   Kullanıcının doğrudan bilgi aradığı sistemler (Google Search, Bing, ChatGPT Search, Perplexity). Bu botlar platforma kullanıcı ve potansiyel iş fırsatı getirdiği için kamuya açık tüm sayfalarda **TAM İZİNLİ (ALLOW)** olmalıdır.
2. **Temel Model Eğitimi Tarayıcıları (Foundation Model Training Crawlers):**  
   Platformun özgün mühendislik ilanlarını, sözleşme şablonlarını ve kullanıcı portfolyolarını toplu olarak indirip LLM ağırlıklarını eğitmek için kullanan botlar (GPTBot, CCBot, Google-Extended). Bu botlar platforma doğrudan arama trafiği kazandırmadığı için hassas operasyonel alanlardan **KISITLI (RESTRICTED)** tutulmalıdır.

---

## 2. TARAYICI POLİTİKA MATRİSİ

| Tarayıcı (User-Agent) | Sağlayıcı / Sahip | Amacı | Arama Görünürlüğü Etkisi | Model Eğitimi | robots.txt Politikası | Gerekçe & Resmi Dayanak |
|---|---|---|:---:|:---:|:---:|---|
| **Googlebot** | Google | Web arama indeksi & AI Overviews | **YÜKSEK (Kritik)** | Hayır (Arama için) | **ALLOW (/)** | Türkiye ve globaldeki birincil arama motoru trafiği. [Google Search Central](https://developers.google.com/search) |
| **Bingbot** | Microsoft | Bing Arama & Copilot yanıtları | **YÜKSEK** | Kısmen | **ALLOW (/)** | Bing arama ve Windows/Copilot ekosistemi entegrasyonu. [Bing Webmaster](https://www.bing.com/webmasters) |
| **OAI-SearchBot** | OpenAI | ChatGPT Search anlık web taraması | **YÜKSEK (Gelişen)** | **HAYIR** | **ALLOW (/)** | ChatGPT arama yanıtlarında Operis ilanlarını kaynak link olarak sunar; model eğitmez. [OpenAI SearchBot Docs](https://openai.com/searchbot) |
| **GPTBot** | OpenAI | OpenAI LLM modellerini eğitme | Sıfır (Arama değil) | **EVET** | **RESTRICTED** | Yalnızca public açılış ve `llms.txt` izinli; veri madenciliğine kapalı. [OpenAI GPTBot Docs](https://platform.openai.com/docs/gptbot) |
| **Google-Extended** | Google | Gemini ve Vertex AI model eğitimi | Sıfır (Search değil) | **EVET** | **RESTRICTED** | Google Arama sıralamasını etkilemez, yalnızca Gemini eğitimini yönetir. [Google-Extended Docs](https://developers.google.com/search/docs/crawling-indexing/google-extended) |
| **PerplexityBot** | Perplexity AI | Perplexity arama motoru yanıtları | **YÜKSEK** | Kısmen | **ALLOW (/)** | Akademik ve profesyonel yazılım aramalarında Operis'in alıntılanmasını sağlar. |
| **ClaudeBot** | Anthropic | Claude yanıt üretimi ve analizi | **ORTA** | Kısmen | **ALLOW (/)** | Claude tabanlı bilgi arama araçlarında temsil edilme. |
| **Applebot** | Apple | Siri, Spotlight ve Safari önerileri | **ORTA** | Hayır | **ALLOW (/)** | Apple ekosistemi arama sonuçları. |
| **Applebot-Extended** | Apple | Apple Intelligence model eğitimi | Sıfır | **EVET** | **RESTRICTED** | Apple yapay zeka eğitiminden muafiyet. |
| **CCBot** | Common Crawl | Açık kaynak toplu web kazıma | Sıfır | **EVET** | **RESTRICTED** | Sunucu bant genişliği tüketimini ve kontrolsüz veri çekilmesini sınırlar. |

---

## 3. RESMİ `ROBOTS.TXT` KONFİGÜRASYON SPESİFİKASYONU

```text
# ==============================================================================
# Operis (https://operis.pro) Official Robots Policy
# Last Verified: September 2026
# ==============================================================================

# 1. Real-Time Search & Answer Retrieval Engines (Allowed for Discovery)
User-agent: Googlebot
User-agent: Bingbot
User-agent: OAI-SearchBot
User-agent: PerplexityBot
User-agent: Applebot
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Disallow: /dashboard/
Disallow: /*/dashboard/
Disallow: /panel/
Disallow: /*/panel/
Disallow: /work/
Disallow: /*/work/
Disallow: /calisma-alani/
Disallow: /*/calisma-alani/
Disallow: /admin/
Disallow: /api/
Disallow: /*?*q=*

# 2. AI Training & Dataset Harvesters (Restricted)
User-agent: GPTBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: ClaudeBot
User-agent: CCBot
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Disallow: /dashboard/
Disallow: /*/dashboard/
Disallow: /panel/
Disallow: /*/panel/
Disallow: /work/
Disallow: /*/work/
Disallow: /admin/
Disallow: /api/
Disallow: /*?*q=*

# 3. Default Policy for All Other Agents
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /*/dashboard/
Disallow: /panel/
Disallow: /*/panel/
Disallow: /work/
Disallow: /*/work/
Disallow: /calisma-alani/
Disallow: /*/calisma-alani/
Disallow: /settings/
Disallow: /*/settings/
Disallow: /admin/
Disallow: /api/
Disallow: /*?*q=*

# Canonical XML Sitemap
Sitemap: https://operis.pro/sitemap.xml
```
