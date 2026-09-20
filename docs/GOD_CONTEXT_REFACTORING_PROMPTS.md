# Operis Platform — God-Context & Monolitik Dosya Refactoring Rehberi

Bu doküman, Operis kod tabanında tespit edilen **23 kritik monolitik dosyanın (God Components, God Services ve God Schema)** tek tek, kontrollü ve sıfır regresyon güvencesiyle parçalanması (*modular decomposition*) için hazırlanmış **kıdemli yazılım mimarı düzeyindeki prompt yönergelerini** içerir.

Her bölüm, bir kodlama ajanına (AI Coding Agent) doğrudan kopyalanıp gönderilmeye hazır, bağımsız bir prompt protokolü olarak kurgulanmıştır.

---

## 📑 İçindekiler

### Bölüm 1: Frontend God Components (11 Dosya)
1. [`src/components/listings/listing-wizard-form.tsx`](#1-listing-wizard-formtsx-2068-satır--40-usestate)
2. [`src/components/engagements/milestones/milestone-timeline-tracker.tsx`](#2-milestone-timeline-trackertsx-2121-satır--32-usestate)
3. [`src/components/engagements/match-details-view.tsx`](#3-match-details-viewtsx-1801-satır--21-usestate)
4. [`src/components/security/security-settings-view.tsx`](#4-security-settings-viewtsx-1311-satır--26-usestate)
5. [`src/components/profile/public-profile-view.tsx`](#5-public-profile-viewtsx-1254-satır--9-usestate)
6. [`src/components/profile/profile-settings-form.tsx`](#6-profile-settings-formtsx-1245-satır--36-usestate)
7. [`src/components/profile/profile-edit-modals.tsx`](#7-profile-edit-modalstsx-1224-satır--28-usestate)
8. [`src/components/settings/settings-view.tsx`](#8-settings-viewtsx-1134-satır--26-usestate)
9. [`src/components/engagements/contract-draft-modal.tsx`](#9-contract-draft-modaltsx-1057-satır--16-usestate)
10. [`src/components/categories/category-list-interactive.tsx`](#10-category-list-interactivetsx-1036-satır--18-hook)
11. [`src/components/listings/unified-listings-hub.tsx`](#11-unified-listings-hubtsx-1030-satır--18-usestate)

### Bölüm 2: Backend God Services & Modules (11 Dosya)
12. [`src/modules/offers/service.ts`](#12-srcmodulesoffersservicets-2874-satır)
13. [`src/modules/listings/service.ts`](#13-srcmoduleslistingsservicets-2666-satır)
14. [`src/modules/admin/service.ts`](#14-srcmodulesadminservicets-2038-satır)
15. [`src/modules/engagements/service.ts`](#15-srcmodulesengagementsservicets-1669-satır)
16. [`src/modules/engagements/milestone-service.ts`](#16-srcmodulesengagementsmilestone-servicets-1651-satır)
17. [`src/modules/privacy/export-reader.ts`](#17-srcmodulesprivacyexport-readerts-1570-satır)
18. [`src/modules/contracts/dossier-service.ts`](#18-srcmodulescontractsdossier-servicets-1521-satır)
19. [`src/modules/listings/wizard/templates.ts`](#19-srcmoduleslistingswizardtemplatests-1304-satır)
20. [`src/modules/contracts/acceptance-engine.ts`](#20-srcmodulescontractsacceptance-enginets-1205-satır)
21. [`src/modules/profiles/service.ts`](#21-srcmodulesprofilesservicets-1022-satır)
22. [`src/modules/privacy/export-jobs.ts`](#22-srcmodulesprivacyexport-jobsts-1014-satır)

### Bölüm 3: Veritabanı God Schema (1 Dosya)
23. [`db/schema/index.ts`](#23-dbschemaindexts-1230-satır)

---

## 🏛️ Evrensel Mimari Kurallar ve Değişmezler (Invariants)

Aşağıdaki promptların tamamı çalıştırılırken şu 4 temel kural istisnasız korunmalıdır:
1. **Zero Regression:** Mevcut arayüzün tasarımı, renkleri, CSS sınıfları, animasyonları, API istekleri ve dönüş tipleri birebir korunmalıdır.
2. **Strict Type Safety:** `any` tipi kullanılmamalı, `tsc --noEmit` sıfır hata ile tamamlanmalıdır.
3. **Alibaba OpenCodeReview Compliance:** Kesinlikle iç içe üçlü operatör (`nested ternary`), `var` deklarasyonu veya gevşek eşitlik (`==`) eklenmemelidir.
4. **Test Suite Integrity:** `npm run test:unit` (104 test dosyası, 5.938 test) %100 oranında geçmeye devam etmelidir.

---

# BÖLÜM 1: FRONTEND GOD COMPONENTS

---

### 1. `listing-wizard-form.tsx` (2.068 satır | 40 useState)

```markdown
Sen Kıdemli bir React & Next.js Mimarisin.

GÖREV:
`src/components/listings/listing-wizard-form.tsx` (2.068 satır, 40 useState, 6 useEffect) dosyasındaki monolitik God Component yapısını parçala ve temiz, modüler bir mimariye dönüştür.

MEVCUT ANTİ-PATTERN VE RİSKLER:
- 7 adımlı ilan sihirbazının tüm form alanları, doğrulama kuralları, yapay zeka PRD entegrasyonu ve bütçe/zaman hesaplamaları tek bir devasa bileşene yığılmış durumdadır.
- Herhangi bir metin girişinde 40 state'in tamamı re-render tetiklemekte, performans kaybına yol açmaktadır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. Durum Yönetimi: `useListingWizardReducer` veya `useListingWizardState` adında bir Custom Hook / Reducer oluştur (`src/components/listings/wizard/hooks/use-listing-wizard-state.ts`). Formun devasa 40 useState alanını mantıksal alt state modellerine ayır (BasicInfoState, BudgetState, TimelineState, ScopeState, ReviewState).
2. Adım Bileşenleri: Her sihirbaz adımını bağımsız, hafif bileşenlere ayır:
   - `src/components/listings/wizard/steps/step-basic-info.tsx`
   - `src/components/listings/wizard/steps/step-budget.tsx`
   - `src/components/listings/wizard/steps/step-timeline.tsx`
   - `src/components/listings/wizard/steps/step-scope-deliverables.tsx`
   - `src/components/listings/wizard/steps/step-ai-prd-architect.tsx`
   - `src/components/listings/wizard/steps/step-review-publish.tsx`
3. Orkestrasyon: Ana `ListingWizardForm` dosyasını sadece adımların navigasyonunu ve state aktarımını yöneten ~200 satırlık temiz bir orkestratör haline getir.

KABUL KRİTERLERİ (DEĞİŞMEZLER):
- Formun tüm doğrulama kuralları, Zod entegrasyonu ve hata mesajları birebir korunmalıdır.
- Tasarım, Tailwind sınıfları, micro-animation ve i18n çevirileri bozulmamalıdır.
- Sıfır nested ternary kuralına (%100 Alibaba OCR uyumu) uyulmalıdır.
- `npm run typecheck` ve `npm run test:unit` 0 hata ile geçmelidir.
```

---

### 2. `milestone-timeline-tracker.tsx` (2.121 satır | 32 useState)

```markdown
Sen Kıdemli bir React & State Machine Mimarisin.

GÖREV:
`src/components/engagements/milestones/milestone-timeline-tracker.tsx` (2.121 satır, 32 useState, 33 hook) dosyasındaki hakediş takip monolitini parçala.

MEVCUT ANTİ-PATTERN VE RİSKLER:
- Hakediş onaylama, itiraz açma, delil yükleme, süre uzatımı, ödeme mutabakatı ve zaman tüneli çizimi tek bir devasa dosyada toplanmıştır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. Durum Yönetimi: Hakediş aksiyonlarını ve modal kontrollerini yöneten `useMilestoneTracker` hook'unu dışarı çıkar (`src/components/engagements/milestones/hooks/use-milestone-tracker.ts`).
2. Alt Bileşenler:
   - `src/components/engagements/milestones/components/milestone-timeline-node.tsx` (Tek bir adımın görseli)
   - `src/components/engagements/milestones/components/milestone-evidence-viewer.tsx` (Delil/dosya görüntüleyici)
   - `src/components/engagements/milestones/components/milestone-dispute-trigger.tsx` (İtiraz aksiyonları)
   - `src/components/engagements/milestones/components/milestone-payout-summary.tsx` (Ödeme özeti)
3. Ana Bileşen: `MilestoneTimelineTracker` bileşenini salt layout ve bağlayıcı olarak sadeleştir.

KABUL KRİTERLERİ:
- Hakediş onay mekanizması, API çağrıları ve optimistic UI güncellemeleri korunmalıdır.
- Hiçbir iç içe üçlü operatör eklenmemelidir.
- `npm run typecheck` ve `npm run test:unit` %100 başarılı olmalıdır.
```

---

### 3. `match-details-view.tsx` (1.801 satır | 21 useState)

```markdown
Sen Kıdemli bir Frontend Mimarisin.

GÖREV:
`src/components/engagements/match-details-view.tsx` (1.801 satır, 21 useState) dosyasındaki işbirliği eşleşme detay arayüzünü modüler alt parçalara ayır.

MEVCUT ANTİ-PATTERN VE RİSKLER:
- Müşteri ve freelancer panelleri, sözleşme paketi detayları, ödeme emanet durumu ve geçmiş pazarlık adımları tek bir dosyaya sıkışmıştır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/components/engagements/match-details/match-summary-card.tsx`: Tarafların kimlik ve sözleşme durumunu gösteren üst kart.
2. `src/components/engagements/match-details/match-escrow-status.tsx`: Emanet kasa ve ödeme akış durumu.
3. `src/components/engagements/match-details/match-action-toolbar.tsx`: İptal, onay, mesajlaşma ve dosya teslim butonları.
4. `useMatchDetailsActions.ts`: API mutasyonlarını ve dialog durumlarını izole eden hook.

KABUL KRİTERLERİ:
- Görsel ve fonksiyonel regresyon olmamalıdır.
- Strict TypeScript & Alibaba OCR kuralları korunmalıdır.
- `npm run typecheck` ve `npm run test:unit` hatasız tamamlanmalıdır.
```

---

### 4. `security-settings-view.tsx` (1.311 satır | 26 useState)

```markdown
Sen Kıdemli bir Güvenlik ve Frontend Mimarisin.

GÖREV:
`src/components/security/security-settings-view.tsx` (1.311 satır, 26 useState) dosyasındaki güvenlik ayarları monolitini modüllere böl.

MEVCUT ANTİ-PATTERN VE RİSKLER:
- 2FA (TOTP/SMS) kurulumu, aktif oturumlar/cihaz listesi, parola değiştirme formu, kurtarma kodları ve güvenlik anahtarları tek bir bileşendedir.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/components/security/sections/two-factor-auth-section.tsx`: 2FA QR kod ve doğrulama akışı.
2. `src/components/security/sections/active-sessions-section.tsx`: Aktif oturumlar tablosu ve oturum kapatma.
3. `src/components/security/sections/password-change-section.tsx`: Parola yenileme ve güçlülük göstergesi.
4. `src/components/security/sections/security-keys-section.tsx`: WebAuthn / Passkey yönetimi.
5. Ana görünüm sadece sekmeleri ve başlığı koordine etmelidir.

KABUL KRİTERLERİ:
- Hassas güvenlik verileri, Clerk oturum yönetimi ve hata göstergeleri bozulmamalıdır.
- `npm run typecheck` ve `npm run test:unit` firesiz geçmelidir.
```

---

### 5. `public-profile-view.tsx` (1.254 satır | 9 useState)

```markdown
Sen Kıdemli bir UI/UX ve Frontend Mimarisin.

GÖREV:
`src/components/profile/public-profile-view.tsx` (1.254 satır) dosyasını temiz bileşen hiyerarşisine kavuştur.

MEVCUT ANTİ-PATTERN VE RİSKLER:
- Profil üst bilgisi (Hero), şirket doğrulama rozeti, beceri radar grafiği, portföy projeleri, müşteri yorumları ve iletişim formu 1.200 satırlık tek bir JSX içinde yer almaktadır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/components/profile/sections/public-profile-hero.tsx` (Avatar, unvan, bio, şirket rozeti, sosyal linkler)
2. `src/components/profile/sections/public-profile-portfolio.tsx` (Portföy projeleri vitrini ve filtreleme)
3. `src/components/profile/sections/public-profile-reviews.tsx` (İki taraflı değerlendirmeler ve puanlar)
4. `src/components/profile/sections/public-profile-sidebar.tsx` (Müsaitlik durumu, saatlik ücret, hızlı teklif butonu)

KABUL KRİTERLERİ:
- SSR / SEO meta verileri ve responsive düzen birebir korunmalıdır.
- `npm run typecheck` ve `npm run test:unit` 0 hata ile çalışmalıdır.
```

---

### 6. `profile-settings-form.tsx` (1.245 satır | 36 useState)

```markdown
Sen Kıdemli bir Form & Durum Yönetimi Mimarisin.

GÖREV:
`src/components/profile/profile-settings-form.tsx` (1.245 satır, 36 useState, 5 useEffect) dosyasındaki aşırı yerel durum parçalanmasını çöz.

MEVCUT ANTİ-PATTERN VE RİSKLER:
- 36 adet useState bağımsız olarak tanımlanmış, profil güncelleme formu her harfte yeniden render edilmektedir.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `useProfileFormReducer`: Form durumunu tek bir yapı altında toplayan tip güvenli bir Reducer tanımla.
2. Sekme Bileşenleri:
   - `src/components/profile/settings/profile-general-tab.tsx` (İsim, unvan, biyografi, iletişim kanalları)
   - `src/components/profile/settings/profile-billing-tab.tsx` (Vergi numarası, fatura adresi)
   - `src/components/profile/settings/profile-notifications-tab.tsx` (E-posta ve push tercihleri)
   - `src/components/profile/settings/profile-portfolio-tab.tsx` (Yetenekler ve linkler)

KABUL KRİTERLERİ:
- Profil kaydetme API payload'ı ve validasyonlar bozulmamalıdır.
- Alibaba OCR nested ternary kuralına tam uyum korunmalıdır.
- `npm run typecheck` ve `npm run test:unit` %100 başarılı olmalıdır.
```

---

### 7. `profile-edit-modals.tsx` (1.224 satır | 28 useState)

```markdown
Sen Kıdemli bir Frontend Mimarisin.

GÖREV:
`src/components/profile/profile-edit-modals.tsx` (1.224 satır, 28 useState) dosyasında tek bir dosyaya yığılmış 6 farklı bağımsız modalı ayrı dosyalara çıkar.

MEVCUT ANTİ-PATTERN:
- EditBioModal, EditSkillsModal, EditSocialLinksModal, EditAvailabilityModal, EditBillingModal ve EditPortfolioModal tek bir dosyada iç içe tanımlanmıştır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/components/profile/modals/edit-bio-modal.tsx`
2. `src/components/profile/modals/edit-skills-modal.tsx`
3. `src/components/profile/modals/edit-social-links-modal.tsx`
4. `src/components/profile/modals/edit-availability-modal.tsx`
5. `src/components/profile/modals/edit-billing-modal.tsx`
6. `src/components/profile/modals/edit-portfolio-modal.tsx`
7. `src/components/profile/profile-edit-modals.tsx` dosyasını yalnızca bu modalları dışa aktaran bir barrel dosya (index) haline getir (geriye dönük import uyumluluğu için).

KABUL KRİTERLERİ:
- Tüm importlar geriye dönük uyumlu kalmalıdır.
- `npm run typecheck` ve `npm run test:unit` 0 hata ile çalışmalıdır.
```

---

### 8. `settings-view.tsx` (1.134 satır | 26 useState)

```markdown
Sen Kıdemli bir Arayüz Mimarisin.

GÖREV:
`src/components/settings/settings-view.tsx` (1.134 satır, 26 useState) dosyasını temiz sekme tabanlı bileşenlere ayrıştır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. Ayarlar panelindeki her bir sekmeyi ayrı bir bileşene taşı:
   - `src/components/settings/tabs/account-settings-tab.tsx`
   - `src/components/settings/tabs/preferences-settings-tab.tsx`
   - `src/components/settings/tabs/billing-settings-tab.tsx`
   - `src/components/settings/tabs/privacy-gdpr-tab.tsx`
2. Ana `SettingsView` bileşenini yalnızca URL query/hash tabanlı sekme yönlendiricisi olarak bırak.

KABUL KRİTERLERİ:
- Hesap silme ve KVKK veri indirme akışları eksiksiz korunmalıdır.
- `npm run typecheck` ve `npm run test:unit` 0 hata ile geçmelidir.
```

---

### 9. `contract-draft-modal.tsx` (1.057 satır | 16 useState)

```markdown
Sen Kıdemli bir Hukuk Teknolojileri & Frontend Mimarisin.

GÖREV:
`src/components/engagements/contract-draft-modal.tsx` (1.057 satır, 16 useState, 23 import) dosyasındaki sözleşme taslak modalını parçala.

MEVCUT ANTİ-PATTERN:
- Sözleşme metni düzenleyici, iki dilli (TR/EN) karşılaştırma görünümü, W3C Blob yazdırma motoru ve dijital imza mutabakatı tek bileşendedir.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/components/engagements/contracts/contract-bilingual-editor.tsx`: Sözleşme maddeleri düzenleme alanı.
2. `src/components/engagements/contracts/contract-print-preview.tsx`: W3C Blob URL ile yazdırma ve önizleme motoru.
3. `src/components/engagements/contracts/contract-signature-pad.tsx`: Dijital imza onay kutusu ve kimlik doğrulaması.
4. Ana modalı temiz bir dialog sarmalayıcısı haline getir.

KABUL KRİTERLERİ:
- W3C Blob yazdırma güvenliği korunmalı, asla `document.write` eklenmemelidir.
- `npm run typecheck` ve `npm run test:unit` %100 geçmelidir.
```

---

### 10. `category-list-interactive.tsx` (1.036 satır | 18 hook)

```markdown
Sen Kıdemli bir Frontend Mimarisin.

GÖREV:
`src/components/categories/category-list-interactive.tsx` (1.036 satır) dosyasını hiyerarşik alt bileşenlere böl.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/components/categories/category-grid-card.tsx`: Tek bir ana kategori kartı ve alt kategori açılır menüsü.
2. `src/components/categories/category-search-filter.tsx`: Kategori arama çubuğu ve filtre çipleri.
3. `src/components/categories/category-benchmark-badge.tsx`: Piyasa ortalama fiyat ve talep rozetleri.

KABUL KRİTERLERİ:
- Arama ve filtreleme performansı korunmalı, sıfır regresyon sağlanmalıdır.
- `npm run typecheck` ve `npm run test:unit` 0 hata ile çalışmalıdır.
```

---

### 11. `unified-listings-hub.tsx` (1.030 satır | 18 useState)

```markdown
Sen Kıdemli bir React & Search UI Mimarisin.

GÖREV:
`src/components/listings/unified-listings-hub.tsx` (1.030 satır, 18 useState, 35 hook) dosyasındaki ilan keşif merkezini modüler bileşenlere ayır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `useListingsHubFilterState`: URL sync ve filtreleme durumunu yöneten hook (`src/components/listings/hooks/use-listings-filter.ts`).
2. `src/components/listings/hub/listings-search-header.tsx`: Arama girişi ve sıralama seçimi.
3. `src/components/listings/hub/listings-filter-sidebar.tsx`: Bütçe, süre, şirket onaylı ve kategori filtre paneli.
4. `src/components/listings/hub/listings-view-mode-toggle.tsx`: Grid / Liste / Kompakt görünüm geçişleri.

KABUL KRİTERLERİ:
- URL senkronizasyonu (`useSearchParams`), batch offer seçimleri ve sayfalama bozulmamalıdır.
- `npm run typecheck` ve `npm run test:unit` 0 hata ile çalışmalıdır.
```

---

# BÖLÜM 2: BACKEND GOD SERVICES & MODULES

---

### 12. `src/modules/offers/service.ts` (2.874 satır)

```markdown
Sen Kıdemli bir Backend & Domain-Driven Design (DDD) Mimarisin.

GÖREV:
Operis kod tabanının en büyük servis dosyası olan `src/modules/offers/service.ts` (2.874 satır) monolitini temiz, modüler domain servislerine ayrıştır.

MEVCUT ANTİ-PATTERN VE RİSKLER:
- Teklif oluşturma, güncelleme, geri çekme, pazarlık (karşı teklif) durum makinesi (FSM), squad teklifleri, bütçe validasyonları, outbox bildirimleri ve transaction yönetimi tek bir dosyada toplanmıştır.
- Herhangi bir teklif kuralı değişikliği 3.000 satırlık devasa dosyayı etkilemektedir.

UYGULANACAK REFACTORING STRATEJİSİ:
1. Domain Servislerine Bölme:
   - `src/modules/offers/services/offer-creation.service.ts`: Yeni teklif verme, bütçe kısıt kontrolleri ve ilan sahibi bildirimi.
   - `src/modules/offers/services/offer-lifecycle.service.ts`: Teklif geri çekme, güncelleme, kabul ve ret işlemleri.
   - `src/modules/offers/services/counter-offer.service.ts`: Karşı teklif durum makinesi (FSM), pazarlık turları ve bütçe sınırları.
   - `src/modules/offers/services/squad-offer.service.ts`: Ekip/squad teklif dağılımları ve ortak paylaşımlar.
   - `src/modules/offers/services/offer-query.service.ts`: İlan teklifleri listeleme, filtreleme ve analitik okumaları.
2. Geriye Dönük Uyumluluk (Facade):
   - `src/modules/offers/service.ts` dosyasını, alt servislerin fonksiyonlarını re-export eden veya delege eden temiz bir Facade (Giriş Kapısı) haline getir.
   - Projedeki hiçbir route veya testteki import yolu kırılmamalıdır (`export * from ...`).

KABUL KRİTERLERİ:
- PostgreSQL veritabanı transaction (`db.transaction`) kilitleri ve outbox bildirim garantisi korunmalıdır.
- `npm run typecheck` 0 hata vermelidir.
- `npm run test:unit` (özellikle `tests/unit/offers*.test.ts`) %100 geçmelidir.
```

---

### 13. `src/modules/listings/service.ts` (2.666 satır)

```markdown
Sen Kıdemli bir Backend Mimarisin.

GÖREV:
`src/modules/listings/service.ts` (2.666 satır) monolitik ilan servisini bağımsız servis katmanlarına ayrıştır.

MEVCUT ANTİ-PATTERN:
- İlan CRUD operasyonları, arama/filtreleme sorguları, ömür döngüsü (aktivasyon, süre dolumu, yenileme), hiring intent skoru hesaplaması ve klonlama operasyonları tek bir servis dosyasında birikmiştir.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/modules/listings/services/listing-crud.service.ts`: İlan oluşturma, düzenleme, silme ve detay getirme.
2. `src/modules/listings/services/listing-lifecycle.service.ts`: İlan yayınlama, süre uzatma, pasife alma ve arşivleme.
3. `src/modules/listings/services/listing-search.service.ts`: Çok kriterli arama, sıralama ve sayfalama sorguları.
4. `src/modules/listings/services/listing-clone.service.ts`: Mevcut ilandan şablon çıkarma ve klonlama.
5. `src/modules/listings/service.ts`: Dışa aktarılan merkezi Facade servisi olarak koru.

KABUL KRİTERLERİ:
- Bütçe kontrol kısıtları (`check_constraints`) ve RLS kuralları korunmalıdır.
- `npm run typecheck` ve `npm run test:unit` (özellikle `tests/unit/listing*.test.ts`) 0 hata ile geçmelidir.
```

---

### 14. `src/modules/admin/service.ts` (2.038 satır)

```markdown
Sen Kıdemli bir Backend & Güvenlik Mimarisin.

GÖREV:
`src/modules/admin/service.ts` (2.038 satır) yönetim servisini modüler alt servislere ayır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/modules/admin/services/admin-moderation.service.ts`: İlan onaylama, reddetme, kötüye kullanım ve rapor inceleme.
2. `src/modules/admin/services/admin-users.service.ts`: Kullanıcı askıya alma, banlama, rol değiştirme ve doğrulama rozeti verme.
3. `src/modules/admin/services/admin-disputes.service.ts`: Uyuşmazlık hakemliği, para iadesi kararları ve hakediş tahkimi.
4. `src/modules/admin/services/admin-metrics.service.ts`: Platform büyüme, gelir ve sistem sağlık metrikleri.
5. `src/modules/admin/service.ts`: Facade re-export katmanı.

KABUL KRİTERLERİ:
- Admin yetki kontrolleri (`ADMIN_ROLE` doğrulamaları) ve audit log kayıtları eksiksiz çalışmalıdır.
- `npm run typecheck` ve `npm run test:unit` firesiz geçmelidir.
```

---

### 15. `src/modules/engagements/service.ts` (1.669 satır)

```markdown
Sen Kıdemli bir Sözleşme & İş Mantığı Mimarisin.

GÖREV:
`src/modules/engagements/service.ts` (1.669 satır) işbirliği ana servisini ayrıştır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/modules/engagements/services/engagement-lifecycle.service.ts`: İşbirliği başlatma, tamamlama, iptal ve fesih protokolleri.
2. `src/modules/engagements/services/engagement-contracts.service.ts`: Sözleşme paketleri, versiyonlama ve CAS hash doğrulama.
3. `src/modules/engagements/services/engagement-handover.service.ts`: Nihai teslim tutanağı ve kaynak kod devir onayı.
4. `src/modules/engagements/service.ts`: Facade export katmanı.

KABUL KRİTERLERİ:
- Tüm veritabanı kilitleri, versiyon CAS kontrolleri ve durum geçişleri korunmalıdır.
- `npm run typecheck` ve `npm run test:unit` %100 başarılı olmalıdır.
```

---

### 16. `src/modules/engagements/milestone-service.ts` (1.651 satır)

```markdown
Sen Kıdemli bir Finans & Hakediş Mimarısın.

GÖREV:
`src/modules/engagements/milestone-service.ts` (1.651 satır) dosyasını temiz sorumluluklara böl.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/modules/engagements/milestones/milestone-status.service.ts`: Hakediş adımları durum geçişleri (PENDING, IN_PROGRESS, SUBMITTED, APPROVED, DISPUTED).
2. `src/modules/engagements/milestones/milestone-evidence.service.ts`: Teslim delili ekleme, GitHub commit/PR bağlama ve dosya hash'leri.
3. `src/modules/engagements/milestones/milestone-payout.service.ts`: Emanet hesaptan serbest bırakma ve kısmi ödeme mutabakatı.
4. `milestone-service.ts`: Facade export.

KABUL KRİTERLERİ:
- Hakediş bütçe toplamı ile sözleşme bütçesi denkliği kısıtları korunmalıdır.
- `npm run typecheck` ve `npm run test:unit` 0 hata ile geçmelidir.
```

---

### 17. `src/modules/privacy/export-reader.ts` (1.570 satır)

```markdown
Sen Kıdemli bir Veri Mimarisi & KVKK/GDPR Uzmanısın.

GÖREV:
`src/modules/privacy/export-reader.ts` (1.570 satır) monolitik veri dışa aktarma okuyucusunu parçala.

MEVCUT ANTİ-PATTERN:
- Kullanıcının profil, ilan, teklif, sözleşme, mesaj, inceleme ve ödeme verilerini okuyan onlarca devasa SQL sorgusu tek bir fonksiyonda toplanmıştır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. Her tablo alanı için bağımsız okuyucu fonksiyonları (`readers/`) klasörüne taşı:
   - `src/modules/privacy/readers/profile-data-reader.ts`
   - `src/modules/privacy/readers/listings-data-reader.ts`
   - `src/modules/privacy/readers/offers-data-reader.ts`
   - `src/modules/privacy/readers/engagements-data-reader.ts`
   - `src/modules/privacy/readers/finance-data-reader.ts`
2. Ana `export-reader.ts` dosyasını bu okuyuculardan gelen stream veya JSON parçalarını birleştiren bir orkestratör yap.

KABUL KRİTERLERİ:
- PII (Kişisel Veri) maskeleme ve şifreleme anahtarları kuralları korunmalıdır.
- `npm run typecheck` ve `npm run test:unit` %100 başarılı olmalıdır.
```

---

### 18. `src/modules/contracts/dossier-service.ts` (1.521 satır)

```markdown
Sen Kıdemli bir Hukuk & Evrak Mimarisi Uzmanısın.

GÖREV:
`src/modules/contracts/dossier-service.ts` (1.521 satır) uyuşmazlık delil dosyası derleyicisini ayrıştır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/modules/contracts/dossier/dossier-compiler.service.ts`: Zaman damgalı delil ve mesaj kayıtlarını toplayan servis.
2. `src/modules/contracts/dossier/dossier-integrity.service.ts`: SHA-256 hash zinciri ve delil değiştirilmezlik kontrolü.
3. `src/modules/contracts/dossier/dossier-export.service.ts`: Hakem heyeti için PDF / JSON arşiv paketi üretici.
4. `dossier-service.ts`: Facade export katmanı.

KABUL KRİTERLERİ:
- Kriptografik özetleme ve kanıt zinciri bütünlüğü korunmalıdır.
- `npm run typecheck` ve `npm run test:unit` 0 hata ile çalışmalıdır.
```

---

### 19. `src/modules/listings/wizard/templates.ts` (1.304 satır)

```markdown
Sen Kıdemli bir TypeScript & Şablon Mimarısın.

GÖREV:
`src/modules/listings/wizard/templates.ts` (1.304 satır) tek parça şablon dosyasını sektörlere göre ayrıştır.

MEVCUT ANTİ-PATTERN:
- 10 farklı platform sektörüne ait tüm hazır ilan şablonları, bütçe aralıkları, teslim kalemleri ve öneri metinleri tek bir dev dosyaya yazılmıştır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. Şablonları sektör bazlı bağımsız veri dosyalarına ayır:
   - `src/modules/listings/wizard/templates/web-development.ts`
   - `src/modules/listings/wizard/templates/mobile-development.ts`
   - `src/modules/listings/wizard/templates/ai-data-science.ts`
   - `src/modules/listings/wizard/templates/cloud-devops.ts`
   - `src/modules/listings/wizard/templates/design-creative.ts`
   - `src/modules/listings/wizard/templates/blockchain-security.ts`
2. `src/modules/listings/wizard/templates.ts` dosyasında bu alt şablonları birleştiren tip güvenli bir `LISTING_TEMPLATES_REGISTRY` sözlüğü oluştur.

KABUL KRİTERLERİ:
- Şablon id'leri ve içerik metinleri birebir korunmalıdır.
- `npm run typecheck` ve `npm run test:unit` 0 hata ile geçmelidir.
```

---

### 20. `src/modules/contracts/acceptance-engine.ts` (1.205 satır)

```markdown
Sen Kıdemli bir İş Kuralı ve Kalite Güvence Mimarisin.

GÖREV:
`src/modules/contracts/acceptance-engine.ts` (1.205 satır) kabul kriterleri motorunu modüler kurallara böl.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/modules/contracts/acceptance/acceptance-rules-evaluator.ts`: Kriterlerin otomatik doğrulanması (CI/CD test raporu, kod kapsamı, statik analiz eşikleri).
2. `src/modules/contracts/acceptance/acceptance-signoff.service.ts`: Tarafların el sıkışma (handshake) ve nihai kabul onayı.
3. `acceptance-engine.ts`: Temiz Facade giriş noktası.

KABUL KRİTERLERİ:
- Otomatik kabul kuralları ve zaman aşımı hesaplamaları korunmalıdır.
- `npm run typecheck` ve `npm run test:unit` %100 başarılı olmalıdır.
```

---

### 21. `src/modules/profiles/service.ts` (1.022 satır)

```markdown
Sen Kıdemli bir Backend Mimarisin.

GÖREV:
`src/modules/profiles/service.ts` (1.022 satır) profil yönetim servisini parçala.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/modules/profiles/services/profile-data.service.ts`: Temel profil CRUD ve bio/iletişim yönetimi.
2. `src/modules/profiles/services/company-verification.service.ts`: GİB VKN/TCKN algoritma doğrulaması ve onay rozeti.
3. `src/modules/profiles/services/availability.service.ts`: Müsaitlik rozeti ve saatlik ücret güncellemeleri.
4. `src/modules/profiles/service.ts`: Facade export.

KABUL KRİTERLERİ:
- VKN/TCKN Modül 10/11 doğrulama algoritmaları bozulmamalıdır.
- `npm run typecheck` ve `npm run test:unit` 0 hata ile çalışmalıdır.
```

---

### 22. `src/modules/privacy/export-jobs.ts` (1.014 satır)

```markdown
Sen Kıdemli bir Dağıtık Sistemler ve Arka Plan İşleri Mimarisin.

GÖREV:
`src/modules/privacy/export-jobs.ts` (1.014 satır) veri dışa aktarma işleri kuyruk yöneticisini ayrıştır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. `src/modules/privacy/jobs/export-lease.manager.ts`: Çoklu worker eşzamanlılık kilitleme (lease/fencing) mekanizması.
2. `src/modules/privacy/jobs/export-bundler.service.ts`: ZIP parçalama, AWS S3 / R2 presigned URL yükleme ve süresi dolan dosyaları temizleme.
3. `export-jobs.ts`: Facade export katmanı.

KABUL KRİTERLERİ:
- Worker lease zaman aşımı ve veri tabanı kilit mekanizması bozulmamalıdır.
- `npm run typecheck` ve `npm run test:unit` 0 hata ile geçmelidir.
```

---

# BÖLÜM 3: VERİTABANI GOD SCHEMA

---

### 23. `db/schema/index.ts` (1.230 satır)

```markdown
Sen Kıdemli bir Veritabanı & Drizzle ORM Mimarisin.

GÖREV:
`db/schema/index.ts` (1.230 satır) dosyasında tek bir dosyada tanımlanmış tüm veritabanı tablolarını Drizzle ORM modüler şema mimarisine dönüştür.

MEVCUT ANTİ-PATTERN VE RİSKLER:
- 20'den fazla tablo (users, profiles, listings, offers, engagements, milestones, dossiers, reviews, notifications, audit_logs, outbox, categories vb.) tek bir dosyada tanımlıdır.
- Herhangi bir tabloda indeks veya sütun eklenmesi 1.200 satırlık devasa dosyayı değiştirmekte ve migration çakışmalarına yol açmaktadır.

UYGULANACAK REFACTORING STRATEJİSİ:
1. Modüler Şema Dosyaları Oluştur (`db/schema/tables/`):
   - `auth.ts`: `users`, `sessions`, `accounts` tabloları.
   - `profiles.ts`: `profiles`, `companyVerifications`, `userSkills`.
   - `listings.ts`: `listings`, `categories`, `categoryFollows`, `savedListings`.
   - `offers.ts`: `offers`, `offerRevisions`, `counterOffers`.
   - `engagements.ts`: `engagements`, `contracts`, `milestones`, `dossiers`.
   - `communication.ts`: `notifications`, `liveAlerts`, `outboxEvents`.
   - `governance.ts`: `reports`, `auditLogs`, `disputes`.
2. İlişkiler (Relations): Tablolar arası `relations()` tanımlarını `db/schema/relations.ts` dosyasına topla.
3. Giriş Noktası (`db/schema/index.ts`):
   - `db/schema/index.ts` dosyasını sadece tüm alt şemaları ve ilişkileri dışa aktaran bir barrel dosya haline getir:
     ```ts
     export * from "./tables/auth";
     export * from "./tables/profiles";
     export * from "./tables/listings";
     // ... diğer modüller
     export * from "./relations";
     ```

KABUL KRİTERLERİ (ÇOK KRİTİK):
- Drizzle ORM tablo adları, sütun adları, yabancı anahtarlar (foreign keys), check constraint'leri ve indeksler BİREBİR AYNI kalmalıdır.
- Yeni bir veritabanı migration'ı (`drizzle-kit generate`) çalıştırıldığında "0 değişiklik" üretmelidir (schema diff = 0).
- Tüm projedeki `import * as schema from "@/db/schema"` veya `import { listings } from "@/db/schema"` importları eksiksiz çalışmalıdır.
- `npm run typecheck` ve `npm run test:unit` 0 hata ile geçmelidir.
```

---

## 🚀 Önerilen Refactoring Sıralaması (Execution Roadmap)

En düşük riskten en yüksek riske doğru önerilen uygulama sırası:

| Aşama | Odak | Dosyalar | Neden? |
|---|---|---|---|
| **Faz 1: Düşük Risk / UI Modalları** | Bağımsız Modallar | 7, 9, 10 | Diğer bileşenlere az bağımlıdır, kolayca ayrıştırılır. |
| **Faz 2: Bağımsız Servisler** | Şablonlar & Raporlar | 19, 17, 18, 20, 22 | Veri akışı basittir, testleri hazırdır. |
| **Faz 3: Profil & Ayarlar** | Kullanıcı Paneli | 4, 5, 6, 8, 21 | Kullanıcı deneyimini hızlandırır, state yükünü azaltır. |
| **Faz 4: Veritabanı Şeması** | Drizzle ORM | 23 | Drizzle şeması modülerleşirse sonraki servis refactoringleri çok daha temiz ilerler. |
| **Faz 5: İşbirlikleri & Hakedişler** | Engagements & Milestones | 2, 3, 15, 16 | Finansal akışlar ve hakediş durum makineleri modülerleşir. |
| **Faz 6: Çekirdek İlan & Teklif Motoru** | Listings & Offers | 1, 11, 12, 13, 14 | Platformun kalbidir. Önceki fazlar tamamlanınca en güvenli şekilde refactor edilir. |
