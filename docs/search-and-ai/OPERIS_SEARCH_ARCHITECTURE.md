# OPERIS — ARAMA VE BİLGİ MİMARİSİ
## (SEARCH & INFORMATION ARCHITECTURE SPECIFICATION)

**Versiyon:** 1.0.0-PROD  
**Kapsam:** Pazar Yeri Hiyerarşisi, URL Mimarisi, İç Link Ağı ve Yaşam Döngüsü

---

## 1. BİLGİ VE HİYERARŞİ MİMARİSİ (INFORMATION HIERARCHY)

Operis'in içerik mimarisi hem arama botlarının hem de AI anlamsal çıkarım modellerinin minimum belirsizlikle gezinebilmesi için 4 temel derinlik seviyesine bölünmüştür:

```
[Seviye 1: Ana Sayfa]
https://operis.pro/tr
   │
   ├──────► [Seviye 2: Kategori & Sektör İndeksi]
   │        https://operis.pro/tr/kategoriler
   │           │
   │           └──────► [Seviye 3: Müstakil Kategori Sayfaları (110 Uzmanlık)]
   │                    https://operis.pro/tr/kategori/backend-gelistirme
   │                    https://operis.pro/tr/kategori/yapay-zeka-ve-makine-ogrenimi
   │                    https://operis.pro/tr/kategori/mobil-uygulama-ios-android
   │                       │
   │                       └──────► [Seviye 4: Tekil İlanlar (168 Saatlik Yaşam)]
   │                                https://operis.pro/tr/ilanlar/fintech-icin-go-gelistirici-3f9a
   │
   ├──────► [Yetenekler & Doğrulanmış Profiller]
   │        https://operis.pro/tr/profil/demiryildiz
   │
   └──────► [Kurumsal Otorite & Güven Merkezi (E-E-A-T)]
            https://operis.pro/tr/hakkimizda (Manifesto & Model)
            https://operis.pro/tr/iletisim (Tüzel Kişilik, KEP, Adres)
            https://operis.pro/tr/yardim (Rehber & SSS)
            https://operis.pro/tr/yasal/* (FSEK, TBK, KVKK Sözleşmeleri)
```

---

## 2. KATEGORİ VE SEKTÖR AĞACI (10 SEKTÖR / 110 KATEGORİ)

Arama motorlarında pazar yerlerinin en büyük organik giriş kapısı kategori sayfalarıdır.
Aşağıdaki 10 ana sektörün tamamı alt kategorileriyle birlikte taranabilir `<a href="...">` bağlantıları ile donatılmalıdır:

1. **Yazılım & Bilişim (`sector-software-it`):** Backend, Frontend, Full Stack, Mobil (iOS/Android), DevOps/Bulut, Siber Güvenlik, Veritabanı Mimarisi, Gömülü Sistemler.
2. **Yapay Zeka & Veri (`sector-ai-data`):** LLM Entegrasyonu, Makine Öğrenimi, Veri Mühendisliği, Bilgisayarlı Görü, NLP, Veri Analitiği.
3. **Tasarım & Kreatif (`sector-design-creative`):** UI/UX Tasarımı, Tasarım Sistemleri, Mobil Arayüz, 3D Modelleme, Marka Kimliği.
4. **Büyüme & Pazarlama (`sector-marketing-growth`):** Teknik SEO, Performans Pazarlaması, Veri Odaklı Büyüme.
5. **Video & Ses (`sector-video-audio`):** Ürün Tanıtım Animasyonları, Hareketli Grafikler (Motion Design).
6. **Yazarlık & Çeviri (`sector-writing-translation`):** Teknik Dokümantasyon, API Kılavuzları, Yazılım Lokalizasyonu.
7. **İş & Finans (`sector-business-finance`):** FinTech Danışmanlığı, Ürün Yönetimi (Technical PM), Çevik Koçluk.
8. **Hukuk & Mevzuat (`sector-legal-compliance`):** Bilişim Hukuku, KVKK & GDPR Uyum, Yazılım Sözleşmeleri Danışmanlığı.
9. **Mühendislik & 3D (`sector-engineering-3d`):** CAD, Donanım Tasarımı, IoT Çözümleri.
10. **Operasyon & Destek (`sector-operations-support`):** Teknik Destek, QA & Test Otomasyonu, SRE Danışmanlığı.

---

## 3. FACETED NAVIGATION (FİLTRE) VE DAHİLİ ARAMA POLİTİKASI

| Filtre Türü | Örnek URL | İndekslenme Kararı | Kanonik Hedefi | Gerekçe |
|---|---|:---:|---|---|
| **Kategori Seçimi** | `/tr/ilanlar?category=backend` | Özel Rota (`/tr/kategori/backend`) | `/tr/kategori/backend` | Yüksek ticari ve bilgilendirici arama hacmi |
| **Metin Araması** | `/tr/ilanlar?q=react` | **NOINDEX** | `/tr/ilanlar` | Google Scaled Search spam kuralı |
| **Bütçe Filtresi** | `/tr/ilanlar?minBudget=50000` | **NOINDEX** | Parametresiz Kategori / Katalog | Değişken ve düşük arama değeri |
| **Zaman Filtresi** | `/tr/ilanlar?timeRange=24h` | **NOINDEX** | Parametresiz Kategori / Katalog | Sürekli bayatlayan dinamik filtre |
| **Görünüm Filtresi**| `/tr/ilanlar?view=catalog` | **NOINDEX** | `/tr/ilanlar` | Salt UI tercihi; duplicate içerik |
| **Çoklu Kombinasyon** | `?category=x&tags=y&minBudget=z` | **NOINDEX** | `/tr/kategori/x` | Sonsuz URL uzayı ve crawl tuzağı engeli |

---

## 4. İÇ LİNK AĞI VE DERİNLİK YÖNETİMİ (INTERNAL LINKING GRAPH)

1. **Header Menüsü:** Tüm sayfalardan Ana Sayfa, İlanlar (`/tr/ilanlar`), Kategoriler (`/tr/kategoriler`), Hakkımızda (`/tr/hakkimizda`), Yardım (`/tr/yardim`).
2. **Kategori İçi Linkleme:** Her tekil ilan detay sayfası, bağlı olduğu kategorinin iniş sayfasına taranabilir semantik Breadcrumb ile bağlanır (`Ana Sayfa > İlanlar > Backend Geliştirme > İlan Başlığı`).
3. **Çapraz Öneri Linkleri (Related Listings):** Her ilan detay sayfasının altında aynı kategorideki en son 3 aktif ilan listelenerek orphan ilan riski sıfıra indirilir.
4. **Footer Ağacı:** Tüm kurumsal, yasal (KVKK, FSEK, Şartlar) ve popüler sektör linkleri her sayfada tam `<a href>` formatında render edilir; JavaScript click handler'a bağımlı gizli navigation engellenir.
