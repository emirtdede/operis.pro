# OPERIS — YAPILANDIRILMIŞ VERİ VE ŞEMA SPESİFİKASYONU
## (STRUCTURED DATA & SCHEMA.ORG TECHNICAL SPECIFICATION)

**Versiyon:** 1.0.0-PROD  
**Biçim:** JSON-LD (`application/ld+json`)  
**Doğrulama Standartları:** Schema.org Core v26, Google Search Central Rich Results Test, W3C Semantic Web

---

## 1. TEMEL ŞEMA FELSEFESİ VE KURALLAR

1. **Görünür İçerik Eşleşmesi (Visible Parity):** Şemada belirtilen her bilgi (başlık, bütçe, tarih, şirket adı, beceri) sayfada ziyaretçinin gözüyle gördüğü içerikle %100 örtüşmelidir. Gizli metinler veya sahte alanlar Schema Spam olarak cezalandırılır.
2. **XSS Korumalı Enjeksiyon:** Tüm JSON-LD verisi `src/components/seo/json-ld.tsx` içindeki `serializeJsonLd` ile sterilize edilmeli; `<` ve `>` karakterleri `\u003c` ve `\u003e` kaçış karakterlerine dönüştürülmelidir.
3. **Kullanımdan Kalkan Özelliklerin Temizlenmesi:** Google tarafından kullanımdan kaldırılan (deprecated) `SearchAction` (Sitelinks Searchbox) gibi şemalar arındırılmalıdır.
4. **Özel Sayfalarda Şema Yasağı:** Kimlik doğrulama gerektiren özel çalışma alanlarına (`/tr/calisma-alani/*`) veya yönetim konsoluna şema basılmamalıdır.

---

## 2. ŞABLON BAZLI ŞEMA SPESİFİKASYONLARI

---

### ŞABLON 1: İLAN DETAY SAYFASI (`JobPosting` + `BreadcrumbList`)
- **Hedef URL:** `https://operis.pro/tr/ilanlar/[slug]`
- **Koşul:** Yalnızca `isCurrentlyActive === true` olan ilanlarda render edilir. Süresi dolan veya silinen ilanlarda kaldırılır.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "JobPosting",
      "title": "{listing.title}",
      "description": "{listing.scope || listing.summary}",
      "datePosted": "{listing.firstPublishedAt.toISOString()}",
      "validThrough": "{listing.activeUntil.toISOString()}",
      "employmentType": "CONTRACTOR",
      "hiringOrganization": {
        "@type": "Organization",
        "name": "{ownerProfile.displayName}",
        "sameAs": "https://operis.pro/tr/profil/{ownerProfile.handle}"
      },
      "jobLocationType": "TELECOMMUTE",
      "applicantLocationRequirements": {
        "@type": "Country",
        "name": "TR"
      },
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "{listing.budgetCurrency || 'TRY'}",
        "value": {
          "@type": "QuantitativeValue",
          "minValue": 50000,
          "maxValue": 100000,
          "unitText": "MONTH"
        }
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Ana Sayfa",
          "item": "https://operis.pro/tr"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "İlanlar",
          "item": "https://operis.pro/tr/ilanlar"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "{category.name}",
          "item": "https://operis.pro/tr/kategori/{category.slug}"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "{listing.title}",
          "item": "https://operis.pro/tr/ilanlar/{listing.slug}"
        }
      ]
    }
  ]
}
```

---

### ŞABLON 2: KULLANICI PROFİL SAYFASI (`ProfilePage` + `Person`)
- **Hedef URL:** `https://operis.pro/tr/profil/[handle]`
- **Koşul:** Yalnızca biyografisi ve uzmanlığı dolu olan, askıya alınmamış profillerde render edilir.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "name": "{profile.displayName} (@{profile.handle})",
      "url": "https://operis.pro/tr/profil/{profile.handle}",
      "mainEntity": {
        "@type": "Person",
        "name": "{profile.displayName}",
        "alternateName": "{profile.handle}",
        "jobTitle": "{profile.headline}",
        "description": "{profile.about}",
        "image": "{profile.avatarUrl}",
        "knowsAbout": ["React", "TypeScript", "Node.js", "PostgreSQL"]
      }
    }
  ]
}
```

---

### ŞABLON 3: MÜSTAKİL KATEGORİ AÇILIŞ SAYFASI (`CollectionPage` + `ItemList`)
- **Hedef URL:** `https://operis.pro/tr/kategori/[slug]`

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "name": "Backend Geliştirme İlanları & Freelance Yazılımcılar",
      "description": "Operis üzerindeki güncel, komisyonsuz ve doğrulanmış backend mühendisliği projeleri.",
      "url": "https://operis.pro/tr/kategori/backend-gelistirme",
      "inLanguage": "tr",
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": 12,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "url": "https://operis.pro/tr/ilanlar/fintech-icin-go-gelistirici-3f9a",
            "name": "Fintech Projesi İçin Kıdemli Go (Golang) Geliştirici"
          }
        ]
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://operis.pro/tr" },
        { "@type": "ListItem", "position": 2, "name": "Kategoriler", "item": "https://operis.pro/tr/kategoriler" },
        { "@type": "ListItem", "position": 3, "name": "Backend Geliştirme", "item": "https://operis.pro/tr/kategori/backend-gelistirme" }
      ]
    }
  ]
}
```

---

### ŞABLON 4: KURUMSAL VARLIK VE MARKA (`Organization` + `WebSite`)
- **Hedef URL:** `https://operis.pro/tr` ve `https://operis.pro/tr/hakkimizda`

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://operis.pro/#website",
      "url": "https://operis.pro/tr",
      "name": "Operis",
      "alternateName": "Operis Pro",
      "inLanguage": "tr",
      "publisher": { "@id": "https://operis.pro/#organization" }
    },
    {
      "@type": "Organization",
      "@id": "https://operis.pro/#organization",
      "name": "Operis",
      "legalName": "Vellium",
      "url": "https://operis.pro",
      "logo": "https://operis.pro/icon-512x512.png",
      "image": "https://operis.pro/og-image.png",
      "description": "Türkiye odaklı, %0 komisyonlu bağımsız yazılım mühendisliği ve doğrudan iş birliği ağı.",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+90-212-555-0100",
        "contactType": "customer service",
        "availableLanguage": ["Turkish", "English"]
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "İstanbul",
        "addressCountry": "TR"
      }
    }
  ]
}
```

---

### ŞABLON 5: YARDIM MERKEZİ & SSS (`HelpPage` + `FAQPage`)
- **Hedef URL:** `https://operis.pro/tr/yardim`
- **Not:** Google Ağustos 2023 güncellemesi uyarınca ticari sitelerde FAQ zengin snippet'leri gösterilmemektedir; ancak LLM ve semantik çıkarım modelleri (AEO) için şemanın varlığı yüksek anlamsal değer taşır (Evidence Level B).
