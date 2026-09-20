# PROJE CANLIYA ALMA, MİMARİ VE RUNBOOK PROTOKOLÜ (HMK m. 193)
> **Runbook Ref:** `OPR-RUNBOOK-ENG2026B-V1`  
> **Kriptografik SHA-256 Özeti:** `04c32e995eb31f1c86217d5532267d5689c18617632dfa358b2a26fe7dd8dcc5`  
> **Hukuki Niteliği:** Eserin İşlerlik ve İdame Rehberi (Bağlayıcı Sözleşme Eki)

---

# 🛡️ OPERİS RESMİ PROJE DEVİR VE İŞLETİM KILAVUZU (PROJECT RUNBOOK)
**Referans No:** `OPR-RUNBOOK-ENG2026B-V1` | **Tarih:** 20 Eylül 2026 05:56 | **Versiyon:** v1
**İlan / Proje:** Kurumsal B2B Finansal Raporlama ve Analitik Platformu
**İşveren:** Acme Teknoloji ve Girişim A.Ş. | **Yüklenici / Yazılımcı:** Can Demir (Kıdemli Yazılım Mimarı)

---

## 1. 🏗️ SİSTEM VE MİMARİ ÖZETİ
Next.js 16 App Router, PostgreSQL 16 (Drizzle ORM), Redis (Upstash) önbellekleme katmanı, AWS S3 depolama ve Docker tabanlı bağımsız konteyner yapısı.

---

## 2. 🔑 ÇEVRE DEĞİŞKENLERİ SÖZLÜĞÜ (.env.example)
> ⚠️ **GÜVENLİK BİLGİLENDİRMESİ:** Bu sözlükte yalnızca değişken anahtarları, açıklamaları ve örnek formatlar yer alır. Canlı üretim şifreleri asla bu belgede saklanmaz; güvenli sunucu ortamında tanımlanmalıdır.

| Değişken Adı | Açıklama | Kategori | Zorunlu? | Örnek Format |
|---|---|---|---|---|
| `DATABASE_URL` | Production PostgreSQL bağlantı URI'si | `DATABASE` | Evet (Zorunlu) | `postgresql://user:pass@host:5432/db` |
| `UPSTASH_REDIS_REST_URL` | Dağıtık rate limit ve cache bağlantısı | `OTHER` | Evet (Zorunlu) | `https://redis.upstash.io` |
| `DATA_ENCRYPTION_KEY` | KVKK AES-256 master şifreleme anahtarı | `AUTH` | Evet (Zorunlu) | `hex64char...` |

---

## 3. 🚀 BAŞLATMA VE DERLEME KOMUTLARI (BUILD & RUNBOOK)

### 1. Bağımlılık Kurulumu [PRODUCTION]
Bağımlılıkların temiz kurulumu
```bash
npm ci --production=false
```

### 2. Veritabanı Migrasyonu [PRODUCTION]
Veritabanı şema migrasyonlarının yürütülmesi
```bash
npm run db:migrate
```

### 3. Üretim Derlemesi [PRODUCTION]
Üretim paketinin derlenmesi
```bash
npm run build
```

### 4. Sunucu Başlatma [PRODUCTION]
Next.js üretim sunucusunun başlatılması
```bash
npm run start
```

---

## 4. 🔌 ÜÇÜNCÜ TARAF SERVİSLER VE DIŞ HESAPLAR

| Servis Adı | Kategori | Kullanım Amacı | Yönetim Paneli | Devir Durumu |
|---|---|---|---|---|
| **Upstash Redis** | Cache & Rate Limiting | DDoS önleme ve istek hız kısıtlama | [Link](https://console.upstash.com) | ✅ Devredildi |
| **AWS S3** | Cloud Storage | PDF ve CSV ihracat dosyalarının şifreli saklanması | [Link](https://aws.amazon.com/s3) | ✅ Devredildi |

---

## 5. 🚨 YEDEKLEME VE ACİL FELAKET KURTARMA (DISASTER RECOVERY)

### 💾 Yedekleme Çizelgesi
- **Sıklık:** Günde 4 Kez (Her 6 saatte bir artımlı, her gece 03:00 tam yedek)
- **Yedekleme Komutu / Script:** `—`
- **Depolama Konumu:** AWS S3 Frankfurt (eu-central-1) WORM (Write-Once-Read-Many) bucket
- **Geri Yükleme (Restore) Prosedürü:** Point-in-time recovery konsolu üzerinden 1 tıkla geri yükleme

### 🛠️ Kritik Acil Durum Senaryoları
#### [CRITICAL] Veritabanı çökmesi veya veri bozulması
**Müdahale Adımı:** Veritabanı en son point-in-time snapshot yedeğine dönülür.
**Doğrulama Komutu:** `npm run db:check`

#### [HIGH] Uygulama sunucusu yanıt vermiyor
**Müdahale Adımı:** Container orkestrasyonunda staging cluster aktive edilir.
**Doğrulama Komutu:** `curl -f http://localhost:8000/api/health`

### 📞 Acil Durum Teknik İletişim
- **İsim:** Operis Acil Müdahale ve DevOps Masası
- **E-Posta:** devops@acmeteknoloji.com.tr
- **Telefon:** +90 (212) 555 9911
- **Notlar:** 7/24 PagerDuty ve telefon nöbeti aktiftir.

---

## 6. 🔒 HMK M. 193 DİJİTAL DELİL MÜHRÜ
Bu Proje Devir ve İşletim Kılavuzu içeriği 6100 sayılı Hukuk Muhakemeleri Kanunu Madde 193 (Delil Sözleşmesi) uyarınca taraflar arasında teknik teslimatın eksiksiz yapıldığını ispatlamak üzere aşağıdaki benzersiz SHA-256 dijital mührü ile tescillenmiştir:

```text
SHA-256: 04c32e995eb31f1c86217d5532267d5689c18617632dfa358b2a26fe7dd8dcc5
```

*Operis Güvenli Altyapısı Tarafından Üretilmiştir • operis.pro*
