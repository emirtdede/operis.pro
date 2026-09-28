# Operis — Güvenlik Danışma Değerlendirmesi ve Risk Analizi (next-intl)

**Tarih:** 27 Eylül 2026  
**Kapsam:** `pnpm audit --prod --json` çıktısındaki `next-intl@3.26.5` danışma kayıtları  
**Sonuç:** İstismar edilemez (Non-exploitable in current architecture) / Üretim güvenliği onaylandı.

---

## 1. GHSA-8f24-v5vv-gm5j (CVE-2026-40299) — Open Redirect

- **Başlık:** Open Redirect in `next-intl` middleware with `localePrefix: 'as-needed'`
- **Şiddet:** Moderate (CVSS 4.2)
- **Etkilenen Yapılandırma:** `createMiddleware` içinde `localePrefix: 'as-needed'` kullanımı.
- **Operis Durumu:**
  - Operis middleware yapılandırması [src/proxy.ts](file:///c:/Users/DEDE-/Desktop/operis/src/proxy.ts#L8) dosyasında yer almaktadır:
    ```typescript
    const intlMiddleware = createMiddleware({
      locales,
      defaultLocale: "tr",
      localePrefix: "always",
      localeDetection: false,
    });
    ```
  - Projede `localePrefix: "always"` zorunlu tutulmaktadır. Her URL açıkça `/tr/` veya `/en/` önekine sahip olmak zorundadır.
  - Bağıl yönlendirmelerde şema göreli (`//attacker.com`) veya kontrol karakterleri ile middleware kandırma koşulu `as-needed` öneki gerektirdiğinden Operis üzerinde **istismar edilemez**.

---

## 2. GHSA-4c35-wcg5-mm9h (CWE-1321) — Prototype Pollution

- **Başlık:** Prototype pollution with `experimental.messages.precompile` via attacker-controlled translation catalog keys
- **Şiddet:** Moderate (CVSS 4.2)
- **Etkilenen Yapılandırma:** Next.js eklentisinde `experimental.messages.precompile: true` bayrağı açıkken ve dış/güvensiz kaynaklardan `__proto__` anahtarlı JSON çeviri dosyaları derleme sürecine verildiğinde.
- **Operis Durumu:**
  - [next.config.ts](file:///c:/Users/DEDE-/Desktop/operis/next.config.ts) içinde hiçbir `experimental.messages` veya `precompile` bayrağı tanımlı değildir.
  - Operis çeviri katalogları (`messages/tr.json` ve `messages/en.json`) kaynak kod deposunda statik olarak tutulmakta ve CI aşamasında `pnpm audit:i18n` ile anahtar bütünlüğü denetlenmektedir.
  - Kullanıcılar veya üçüncü taraf entegrasyonlar derleme anında JSON mesaj yükleyemez. Dolayısıyla prototip kirlenmesi **istismar edilemez**.

---

## 3. Politika ve Yükseltme Stratejisi

Next.js 16.3.6 ile `next-intl` v4.x arasında TypeScript augmentation ve import API breaking change değişiklikleri bulunmaktadır. Mevcut mimaride iki zafiyetin de tetiklenme koşulları bulunmadığından, gereksiz regresyon riski almamak adına `next-intl@3.26.5` sürümü güvenle korunmakta ve bu değerlendirme ile belgelenmektedir.
