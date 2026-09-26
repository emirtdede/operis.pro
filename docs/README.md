# Operis Mühendislik ve Sistem Dokümantasyon Merkezi

Bu dizin, **Operis** platformunun mimari şartnamelerini, güvenlik politikalarını, operasyonel rehberlerini, denetim raporlarını, arama motoru / yapay zeka optimizasyonlarını ve hukuki sözleşme kütüphanesini barındıran merkezi dokümantasyon kütüphanesidir.

---

## 📁 Dokümantasyon Dizin Mimarisi

```text
docs/
├── README.md                              # Dokümantasyon indeksi ve mimari harita (Bu dosya)
│
├── production-readiness/                  # Canlıya Geçiş (Production Readiness) & Risk Yönetimi
│   ├── OPERIS_PRODUCTION_READINESS_AUDIT.md # Kapsamlı 20 rollü sistem denetim raporu
│   ├── OPERIS_REMEDIATION_PLAN.md         # Fazlandırılmış mimari iyileştirme planı (Risk 1-14)
│   ├── OPERIS_RISK_REGISTER.md            # Risk kütüğü ve etki/olasılık matrisi
│   ├── OPERIS_REGRESSION_MATRIX.md        # Regresyon koruma matrisi
│   ├── OPERIS_PRE_LAUNCH_CHECKLIST.md     # Yayın öncesi teknik kapılar (Blocker, Critical, High)
│   ├── OPERIS_GO_LIVE_CHECKLIST.md        # T-24h ile +30 gün arası operasyonel canlıya geçiş kılavuzu
│   ├── OPERIS_POST_LAUNCH_CHECKLIST.md    # Yayın sonrası ilk gün, hafta ve ay kontrol listesi
│   ├── OPERIS_INCIDENT_RESPONSE_PLAN.md   # SEV-1, SEV-2 kriz ve olay müdahale protokolü
│   ├── OPERIS_RESEARCH_SOURCES.md         # Resmi doğrulama ve teknik kaynakça
│   └── YAYIN_ONCESI_YAPILACAKLAR.md       # Adım adım yapılacaklar operasyonel özeti
│
├── search-and-ai/                         # SEO, GEO, AEO & AI Arama Keşfedilebilirliği (Search & AI Discovery)
│   ├── OPERIS_SEO_GEO_AEO_MASTER_AUDIT.md # 128 direktifli SEO / GEO / AEO ana denetim raporu
│   ├── OPERIS_SEARCH_OPTIMIZATION_PLAN.md # SEO-FIX-001 - SEO-FIX-015 iyileştirme planı
│   ├── OPERIS_INDEXATION_POLICY.md        # 20 URL tipi için kesin dizinleme ve kanonik kuralları
│   ├── OPERIS_CRAWLER_POLICY.md           # Bot bazlı (Googlebot, OAI-SearchBot vb.) tarama politikası
│   ├── OPERIS_SEARCH_ARCHITECTURE.md      # 10 sektör ve 110 kategori bilgi mimarisi ve iç link grafiği
│   ├── OPERIS_STRUCTURED_DATA_SPEC.md     # JobPosting, Organization, Breadcrumb JSON-LD şartnamesi
│   ├── OPERIS_AI_SEARCH_GEO_AEO_REPORT.md # ChatGPT Search, Google AI Overviews, AEO ve mitler raporu
│   ├── OPERIS_PRE_LAUNCH_SEARCH_CHECKLIST.md # Yayın öncesi arama motoru kontrol listesi
│   ├── OPERIS_SEARCH_GO_LIVE_CHECKLIST.md # Arama motorları canlıya geçiş operasyon planı
│   ├── OPERIS_POST_LAUNCH_SEARCH_MONITORING.md # Sunucu log analizi, AI atıf metrikleri ve alarmlar
│   ├── OPERIS_SEARCH_RESEARCH_SOURCES.md  # Level A/B/C kanıt seviyeli resmi kaynakça
│   └── OPERIS_SEO_REGRESSION_TEST_PLAN.md # Vitest ve CI arama regresyon test süiti şartnamesi
│
├── architecture/                          # Mimari Şartnameler & Çekirdek Standartlar
│   ├── FREELANCE_PLATFORM_MASTER_SPEC.md  # Ana teknik, veri modeli ve sistem şartnamesi
│   ├── build-manifest.md                  # Çalışma zamanı (Runtime), bağımlılık ve derleme matrisi
│   └── GOD_CONTEXT_REFACTORING_PROMPTS.md # Mimari refaktoring talimatları ve bağlam promptları
│
├── operations/                            # Sistem Operasyonları & Canlıya Alma
│   ├── OPERIS_WORKER_DAEMON_OPERATIONS.md # Bağımsız arka plan işçi (Worker Daemon) rehberi
│   └── YAYIN_ONCESI_KONTROL_LISTESI.md    # Canlı üretime çıkış öncesi kontrol listesi
│
├── security/                              # Güvenlik, Kriptografi & Veri Gizliliği
│   └── KEY_ROTATION.md                    # Zarf şifreleme (Envelope encryption) anahtar rotasyon protokolü
│
├── audit/                                 # Kod & Güvenlik Denetim Raporları
│   ├── v18-audit-remediation.md           # Sürüm 18 denetim açıkları kök neden çözümleri
│   ├── operis-kod-denetim-raporu.md       # Detaylı statik kod analizi ve kalite denetim raporu
│   └── ocr-remediation-walkthrough.md     # Alibaba OpenCodeReview nihai iyileştirme özeti
│
├── sozlesme-ornekleri/                    # Bağımsız Yazılım & Freelance Sözleşme Şablonları Kütüphanesi
│   ├── 00-SOZLESME-KATALOGU-VE-HUKUKI-REHBER.md # Sözleşme kataloğu ve hukuki kullanım rehberi
│   ├── 01-YAZILIM-GELISTIRME-VE-HIZMET-SOZLESMESI.md
│   ├── 02-FIKRI-MULKIYET-VE-KOD-DEVIR-PROTOKOLU.md
│   ├── 03-GIZLILIK-SOZLESMESI-NDA.md
│   ├── 04-KAPSAM-DEGISIKLIGI-CHANGE-REQUEST-PROTOKOLU.md
│   ├── 05-KABUL-TESTI-VE-TESLIM-TUTANAGI.md
│   ├── 06-HIZMET-SEVIYESI-TAAHHUDU-SLA-BAKIM-SOZLESMESI.md
│   ├── 07-ARABULUCULUK-VE-UYUSMAZLIK-COZUM-PROTOKOLU.md
│   ├── 08-SÖZLESME-FESIH-VE-TASFIYE-PROTOKOLU.md
│   ├── 09-BAĞIMSIZ-CALISAN-FREELANCER-CERCEVE-SOZLESMESI.md
│   └── 10-OPERIS-PLATFORM-KULLANIM-KOSULLARI-REFERANS.md
│
├── Operis_Search_100_v5_1/                # Semantik Arama Motoru Şartnamesi & Benchmark Seti
│   ├── 00_README.md                       # Arama motoru sürüm notları ve rehberi
│   ├── 01_AGENT_PROMPT.md                 # Arama mimarisi ajan talimatları
│   ├── MANIFEST.json                      # Arama veri seti ve sözlük manifestosu
│   ├── data/                              # Arama taksonomisi, eş anlamlılar ve normalizasyon kuralları
│   ├── docs/                              # Arama sıralama, disambiguation ve analitik şartnameleri
│   ├── schemas/                           # Zod ve JSON arama şemaları
│   └── tests/                             # Benchmark test sorguları (Regresyon, Karşıt, Altın Set)
│
└── assets/                                # Görsel Varlıklar & Doğrulama Kanıtları
    └── screenshots/                       # Arayüz ve tasarım doğrulama ekran görüntüleri
```

---

## 📚 Bölüm Detayları ve Doğrudan Bağlantılar

### 1. [`production-readiness/`](./production-readiness/) — Canlıya Geçiş ve Sistem Dayanıklılığı
* [OPERIS_PRODUCTION_READINESS_AUDIT.md](./production-readiness/OPERIS_PRODUCTION_READINESS_AUDIT.md): 20 kritik mühendislik rolüyle gerçekleştirilen, 14 doğrulanmış riski belgeleyen master denetim raporu.
* [OPERIS_REMEDIATION_PLAN.md](./production-readiness/OPERIS_REMEDIATION_PLAN.md): Blocker ve Critical risklerin kök nedenlerini ortadan kaldıran 4 fazlı uygulama şartnamesi.
* [OPERIS_RISK_REGISTER.md](./production-readiness/OPERIS_RISK_REGISTER.md): Platformun güvenlik, altyapı ve veri bütünlüğü risk matrisi.
* [OPERIS_REGRESSION_MATRIX.md](./production-readiness/OPERIS_REGRESSION_MATRIX.md): 6.100+ otomatik test ile garanti altına alınan regresyon engelleme haritası.
* [OPERIS_PRE_LAUNCH_CHECKLIST.md](./production-readiness/OPERIS_PRE_LAUNCH_CHECKLIST.md): Yayın öncesi kesinlikle tamamlanması gereken Blocker/Critical/High güvenlik kapıları.
* [OPERIS_GO_LIVE_CHECKLIST.md](./production-readiness/OPERIS_GO_LIVE_CHECKLIST.md): T-24 saatten +30 güne kadar anlık operasyonel canlıya geçiş adımları.
* [OPERIS_POST_LAUNCH_CHECKLIST.md](./production-readiness/OPERIS_POST_LAUNCH_CHECKLIST.md): İlk gün, ilk hafta ve ilk ay için operasyonel takip listesi.
* [OPERIS_INCIDENT_RESPONSE_PLAN.md](./production-readiness/OPERIS_INCIDENT_RESPONSE_PLAN.md): Veri tabanı, e-posta veya kimlik doğrulama kesintilerinde acil müdahale runbook'u.
* [OPERIS_RESEARCH_SOURCES.md](./production-readiness/OPERIS_RESEARCH_SOURCES.md): Teknik mimari kararlarında başvurulan resmi kaynaklar.
* [YAYIN_ONCESI_YAPILACAKLAR.md](./production-readiness/YAYIN_ONCESI_YAPILACAKLAR.md): Operasyon ekibi için pratik özet kontrol listesi.

---

### 2. [`search-and-ai/`](./search-and-ai/) — SEO, GEO, AEO & AI Keşfedilebilirliği
* [OPERIS_SEO_GEO_AEO_MASTER_AUDIT.md](./search-and-ai/OPERIS_SEO_GEO_AEO_MASTER_AUDIT.md): Klasik arama (Google, Bing) ve üretken arama (ChatGPT Search, Google AI Overviews, Bing Copilot) master denetimi.
* [OPERIS_SEARCH_OPTIMIZATION_PLAN.md](./search-and-ai/OPERIS_SEARCH_OPTIMIZATION_PLAN.md): SEO-FIX-001'den SEO-FIX-015'e kadar tüm teknik arama optimizasyonu adımları.
* [OPERIS_INDEXATION_POLICY.md](./search-and-ai/OPERIS_INDEXATION_POLICY.md): Platformdaki 20 URL tipinin dizinlenme, noindex ve kanonik kuralları.
* [OPERIS_CRAWLER_POLICY.md](./search-and-ai/OPERIS_CRAWLER_POLICY.md): `Googlebot`, `Bingbot`, `OAI-SearchBot`, `GPTBot` ve diğer botların robots.txt şartnamesi.
* [OPERIS_SEARCH_ARCHITECTURE.md](./search-and-ai/OPERIS_SEARCH_ARCHITECTURE.md): 10 sektör ve 110 kategori için kanonik landing ve iç linkleme mimarisi.
* [OPERIS_STRUCTURED_DATA_SPEC.md](./search-and-ai/OPERIS_STRUCTURED_DATA_SPEC.md): `JobPosting` (telecommute kuralları), `Organization`, `WebSite`, `ProfilePage` ve `BreadcrumbList` JSON-LD şemaları.
* [OPERIS_AI_SEARCH_GEO_AEO_REPORT.md](./search-and-ai/OPERIS_AI_SEARCH_GEO_AEO_REPORT.md): Generative Engine Optimization (GEO), alıntılanabilirlik ve GEO efsanelerinin ayıklanması.
* [OPERIS_PRE_LAUNCH_SEARCH_CHECKLIST.md](./search-and-ai/OPERIS_PRE_LAUNCH_SEARCH_CHECKLIST.md): Arama motorlarına açılış öncesi onay kapıları.
* [OPERIS_SEARCH_GO_LIVE_CHECKLIST.md](./search-and-ai/OPERIS_SEARCH_GO_LIVE_CHECKLIST.md): Search Console, Bing Webmaster ve IndexNow canlıya geçiş takvimi.
* [OPERIS_POST_LAUNCH_SEARCH_MONITORING.md](./search-and-ai/OPERIS_POST_LAUNCH_SEARCH_MONITORING.md): Sunucu log analizi, AI yönlendirme dönüşüm takibi ve alarm kuralları.
* [OPERIS_SEARCH_RESEARCH_SOURCES.md](./search-and-ai/OPERIS_SEARCH_RESEARCH_SOURCES.md): Google Search Central, Bing Webmaster ve OpenAI resmi yönergeleri tablosu.
* [OPERIS_SEO_REGRESSION_TEST_PLAN.md](./search-and-ai/OPERIS_SEO_REGRESSION_TEST_PLAN.md): Vitest ve GitHub Actions tabanlı otomatik arama regresyon testleri.

---

### 3. [`architecture/`](./architecture/) — Sistem ve Veri Mimarisi
* [FREELANCE_PLATFORM_MASTER_SPEC.md](./architecture/FREELANCE_PLATFORM_MASTER_SPEC.md): Veri tabanı şeması, çift körleme teklif modeli ve finansal durum makineleri.
* [build-manifest.md](./architecture/build-manifest.md): Node.js, Next.js 16, React 19 ve PostgreSQL derleme matrisi.
* [GOD_CONTEXT_REFACTORING_PROMPTS.md](./architecture/GOD_CONTEXT_REFACTORING_PROMPTS.md): Kod tabanı tekilleştirme ve bağlam promptları.

---

### 4. [`operations/`](./operations/) — Operasyonel Çalıştırma
* [OPERIS_WORKER_DAEMON_OPERATIONS.md](./operations/OPERIS_WORKER_DAEMON_OPERATIONS.md): Outbox kuyrukları, zamanlanmış temizleme ve e-posta işleyici rehberi.
* [YAYIN_ONCESI_KONTROL_LISTESI.md](./operations/YAYIN_ONCESI_KONTROL_LISTESI.md): Dağıtım öncesi operasyonel kontrol kılavuzu.

---

### 5. [`security/`](./security/) — Bilgi Güvenliği & Kriptografi
* [KEY_ROTATION.md](./security/KEY_ROTATION.md): PII ve hassas teklif verilerinin AES-256-GCM zarf şifreleme anahtar rotasyon protokolü.

---

### 6. [`audit/`](./audit/) — Denetim & Kod Kalitesi
* [v18-audit-remediation.md](./audit/v18-audit-remediation.md): Sürüm 18 denetim bulgularının çözümleri.
* [operis-kod-denetim-raporu.md](./audit/operis-kod-denetim-raporu.md): Kapsamlı kod tabanı statik analiz ve mimari denetim raporu.
* [ocr-remediation-walkthrough.md](./audit/ocr-remediation-walkthrough.md): Alibaba OpenCodeReview standartları tamamlama özeti.

---

### 7. [`sozlesme-ornekleri/`](./sozlesme-ornekleri/) — Hukuki Sözleşme Kütüphanesi
* [00-SOZLESME-KATALOGU-VE-HUKUKI-REHBER.md](./sozlesme-ornekleri/00-SOZLESME-KATALOGU-VE-HUKUKI-REHBER.md): Operis platformunda kullanılan 10 adet profesyonel sözleşme şablonunun hukuki rehberi ve kullanım kataloğu.

---

### 8. [`Operis_Search_100_v5_1/`](./Operis_Search_100_v5_1/) — Semantik Arama Motoru
* [00_README.md](./Operis_Search_100_v5_1/00_README.md): 10 sektör ve 110 kategori için Türkçe/İngilizce hibrit semantik arama motoru, SymSpell, taksonomi ve test veri setleri.
