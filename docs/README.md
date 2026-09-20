# Operis Mühendislik ve Sistem Dokümantasyon Merkezi

Bu dizin, **Operis** platformunun mimari şartnamelerini, güvenlik politikalarını, operasyonel rehberlerini, denetim raporlarını ve arama motoru kıyaslama veri setlerini barındıran merkezi dokümantasyon kütüphanesidir.

---

## 📁 Dizin Mimarisi

```text
docs/
├── README.md                              # Dokümantasyon indeksi ve mimari harita (Bu dosya)
│
├── architecture/                          # Mimari Şartnameler & Çekirdek Standartlar
│   ├── FREELANCE_PLATFORM_MASTER_SPEC.md  # Ana teknik, veri modeli ve sistem şartnamesi
│   └── build-manifest.md                  # Çalışma zamanı (Runtime), bağımlılık ve derleme matrisi
│
├── operations/                            # Sistem Operasyonları & Canlıya Alma
│   ├── OPERIS_WORKER_DAEMON_OPERATIONS.md # Bağımsız arka plan işçi (Worker Daemon) rehberi
│   └── YAYIN_ONCESI_KONTROL_LISTESI.md    # Canlı üretime çıkış öncesi kontrol listesi
│
├── security/                              # Güvenlik, Kriptografi & Veri Gizliliği
│   └── KEY_ROTATION.md                    # Zarf şifreleme (Envelope encryption) anahtar rotasyon protokolü
│
├── audit/                                 # Güvenlik & Denetim Çözüm Raporları
│   └── v18-audit-remediation.md           # Sürüm 18 denetim açıkları kök neden çözümleri ve doğrulama kanıtları
│
├── assets/                                # Görsel Varlıklar & Doğrulama Kanıtları
│   └── screenshots/                       # Arayüz ve tasarım doğrulama ekran görüntüleri
│       ├── categories_dropdown_open_right.png
│       ├── categories_search_left_filter_right.png
│       ├── help_faq_clean.png
│       ├── login_balanced_spacings.png
│       ├── login_equal_heights.png
│       ├── login_invisible_clean.png
│       ├── login_mobile_balanced.png
│       ├── login_page_final_verification.png
│       ├── login_with_create_account_row.png
│       └── register_invisible_clean.png
│
└── Operis_Search_100_v5_1/                # Semantik Arama Motoru Şartnamesi & Benchmark Seti
    ├── 00_README.md                       # Arama motoru sürüm notları ve rehberi
    ├── 01_AGENT_PROMPT.md                 # Arama mimarisi ajan talimatları
    ├── MANIFEST.json                      # Arama veri seti ve sözlük manifestosu
    ├── data/                              # Arama taksonomisi, eş anlamlılar ve normalizasyon kuralları
    ├── docs/                              # Arama sıralama, disambiguation ve analitik şartnameleri
    ├── schemas/                           # Zod ve JSON arama şemaları
    └── tests/                             # Benchmark test sorguları (Regresyon, Karşıt, Altın Set)
```

---

## 📚 Bölüm Detayları ve Kullanım Kılavuzu

### 1. [`architecture/`](./architecture/) — Sistem ve Ürün Mimarisi
* **[`FREELANCE_PLATFORM_MASTER_SPEC.md`](./architecture/FREELANCE_PLATFORM_MASTER_SPEC.md):**  
  Platformun veri tabanı şeması, değişmez kuralları (invariants), durum makineleri (State Machines), çift körleme teklif modeli ve finansal işlem akışlarının tanımlandığı ana teknik referans belgesidir.
* **[`build-manifest.md`](./architecture/build-manifest.md):**  
  Node.js 24 LTS, Next.js 16 (App Router), React 19, TypeScript 5.8, Drizzle ORM ve PostgreSQL 16+ sürümlerinin kesin kilitlendiği çalışma zamanı matrisidir.

### 2. [`operations/`](./operations/) — Operasyonel Çalıştırma ve Yayın
* **[`OPERIS_WORKER_DAEMON_OPERATIONS.md`](./operations/OPERIS_WORKER_DAEMON_OPERATIONS.md):**  
  İşlem kuyruğu (Outbox pattern), GDPR/KVKK veri dışa aktarım işçisi, kiralama kilitleri (lease tokens) ve systemd servislerinin yönetimi.
* **[`YAYIN_ONCESI_KONTROL_LISTESI.md`](./operations/YAYIN_ONCESI_KONTROL_LISTESI.md):**  
  Canlı sunucu dağıtımı öncesinde tamamlanması zorunlu olan güvenlik, performans, i18n eşitliği ve veritabanı indeks kontrolleri.

### 3. [`security/`](./security/) — Güvenlik ve Gizlilik
* **[`KEY_ROTATION.md`](./security/KEY_ROTATION.md):**  
  KVKK ve GDPR uyumlu PII (Kişisel Veri) alanlarının AES-256-GCM ile şifrelenmesinde kullanılan kök ve türetilmiş anahtarların sıfır kesintiyle rotasyonu.

### 4. [`audit/`](./audit/) — Denetim ve Çözüm Raporları
* **[`v18-audit-remediation.md`](./audit/v18-audit-remediation.md):**  
  Sürüm 18 bağımsız güvenlik ve dayanıklılık denetiminde tespit edilen bulguların (B25-ENTRY, B25-EXIT, B25-RUNNER, B26-CLEANUP, B26-MEM, K01-TEST) kök neden çözümleri ve canlı PostgreSQL 16 test kanıtları.

### 5. [`assets/screenshots/`](./assets/screenshots/) — Arayüz Doğrulama Kanıtları
* Kök dizindeki geçici ekran görüntüleri buraya toplanmıştır. Giriş kartı hizalamaları, görünmez Turnstile entegrasyonu, mobil uyumluluk ve kategori açılır menülerinin görsel test kanıtlarını içerir.

### 6. [`Operis_Search_100_v5_1/`](./Operis_Search_100_v5_1/) — Semantik Arama Motoru
* Arama motorunun 100/100 başarı oranına sahip benchmark veri setleri (`scripts/run-all-benchmarks.ts` tarafından doğrudan tüketilir), n-gram normalizasyon tabloları ve sektör taksonomisi.
