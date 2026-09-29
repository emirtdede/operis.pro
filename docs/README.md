# Operis dokümantasyon rehberi

Bu dizin, yaşayan teknik şartnameleri, operasyon kılavuzlarını, arama politikalarını ve hukuki şablonları içerir. Yayın durumu ile yapılması gereken bütün işler için tek yetkili kaynak [`YAYIN_ONCESI_TEK_RAPOR.md`](./YAYIN_ONCESI_TEK_RAPOR.md) dosyasıdır. Başka bir belgede geçen kabul ölçütü veya öneri, bu raporda açık bir görev olarak yer almıyorsa yayın takip maddesi sayılmaz.

## Nereden başlanmalı?

| İhtiyaç | Belge |
|---|---|
| Kalan sorunlar, yayın kapıları ve canlıya geçiş sırası | [`YAYIN_ONCESI_TEK_RAPOR.md`](./YAYIN_ONCESI_TEK_RAPOR.md) |
| Ana ürün ve mimari şartnamesi | [`architecture/FREELANCE_PLATFORM_MASTER_SPEC.md`](./architecture/FREELANCE_PLATFORM_MASTER_SPEC.md) |
| Doğrulanmış çalışma zamanı ve araç sürümleri | [`architecture/build-manifest.md`](./architecture/build-manifest.md) |
| Worker işletimi ve alarm yaklaşımı | [`operations/OPERIS_WORKER_DAEMON_OPERATIONS.md`](./operations/OPERIS_WORKER_DAEMON_OPERATIONS.md) |
| PDF çalışma zamanı doğrulaması | [`deployment/pdf-runtime-matrix.md`](./deployment/pdf-runtime-matrix.md) |
| Şifreleme anahtarı rotasyonu | [`security/KEY_ROTATION.md`](./security/KEY_ROTATION.md) |
| İndeksleme, crawler ve yapılandırılmış veri politikaları | [`search-and-ai/`](./search-and-ai/) |
| Semantik arama şartnamesi ve benchmark veri seti | [`Operis_Search_100_v5_1/`](./Operis_Search_100_v5_1/) |
| Hukuki şablon kataloğu | [`sozlesme-ornekleri/00-SOZLESME-KATALOGU-VE-HUKUKI-REHBER.md`](./sozlesme-ornekleri/00-SOZLESME-KATALOGU-VE-HUKUKI-REHBER.md) |

## Dizin yapısı

```text
docs/
├── README.md
├── YAYIN_ONCESI_TEK_RAPOR.md
├── architecture/
│   ├── FREELANCE_PLATFORM_MASTER_SPEC.md
│   └── build-manifest.md
├── deployment/
│   └── pdf-runtime-matrix.md
├── operations/
│   └── OPERIS_WORKER_DAEMON_OPERATIONS.md
├── search-and-ai/
│   ├── OPERIS_AI_SEARCH_GEO_AEO_REPORT.md
│   ├── OPERIS_CRAWLER_POLICY.md
│   ├── OPERIS_INDEXATION_POLICY.md
│   ├── OPERIS_SEARCH_ARCHITECTURE.md
│   ├── OPERIS_SEARCH_RESEARCH_SOURCES.md
│   ├── OPERIS_SEO_REGRESSION_TEST_PLAN.md
│   └── OPERIS_STRUCTURED_DATA_SPEC.md
├── security/
│   └── KEY_ROTATION.md
├── Operis_Search_100_v5_1/
└── sozlesme-ornekleri/
```

## Belge türleri

- **Yayın raporu:** Durum ve görev takibi yalnızca `YAYIN_ONCESI_TEK_RAPOR.md` içinde yapılır.
- **Şartname/politika:** Beklenen kalıcı davranışı açıklar; tamamlanma durumu ifade etmez.
- **Runbook:** Bir üretim işleminin nasıl uygulanacağını açıklar; gerçek ortam değerleri dağıtım sırasında doğrulanır.
- **Veri seti ve hukuki çıktı:** Aynı kaynağın JSON, Markdown, HTML veya PDF biçimleri kasıtlı olarak birlikte tutulabilir; bunlar gereksiz kopya sayılmaz.

## Bakım kuralları

1. Çözülmüş bir yayın maddesi ana rapordan silinir; tarihsel sonuç raporu oluşturulmaz.
2. Yeni yayın riski veya zorunlu işlem yalnızca ana rapora eklenir.
3. Anlık test logları, audit JSON çıktıları ve makineye özgü kanıt dosyaları `docs/` altında saklanmaz; CI artefaktı veya sürüm kaydı olarak tutulur.
4. Runbook örneklerindeki alan adı, servis yöneticisi ve gizli değişken adları hedef ortamda doğrulanmadan uygulanmaz.
5. Hukuki şablonlar yayınlanmadan önce yetkili hukuk danışmanı tarafından onaylanır.
