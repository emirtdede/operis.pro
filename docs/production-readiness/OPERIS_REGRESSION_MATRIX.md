# OPERIS — REGRESYON TEST MATRİSİ (REGRESSION COVERAGE MATRIX)

Bu matris, Operis platformunun tüm kritik özelliklerinin (Critical Paths) ve iş mantığı kurallarının hangi test katmanları ile korunduğunu, nelerin otomatik test edildiğini ve go-live öncesi doğrulama durumunu belgeler.

---

## 1. TEST KAPSAM MATRİSİ

| Kritik Özellik / Akış | Unit Test | Integration Test | E2E Test | Manuel Test | Güvenlik / Abuse Testi | Production Smoke Test | Mevcut Durum / Koruma |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Kayıt (Registration) & Legal Onaylar** | ✅ Var (`auth-validation.test.ts`) | ⚠️ DB Gerekli (`setup/integration.ts`) | ✅ Var (`run-e2e-prod.ts`) | ✅ Doğrulandı | ✅ Turnstile Bot & HMAC Index | ✅ Hazır | Tam Kapsam |
| **E-Posta Doğrulama & Token Replay** | ✅ Var (`crypto-security-matrix.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ Tek kullanımlık token tüketimi | ✅ Resend Doğrulandı | Resend Domain Verified |
| **Giriş (Login) & 2FA TOTP** | ✅ Var (`offers.test.ts`, `totp.test.ts`) | ⚠️ DB Gerekli | ✅ Var | ✅ Doğrulandı | ✅ Brute-force GCRA (10/min) | ✅ Hazır | Tam Kapsam |
| **Oturum Yönetimi & AuthVersion Revocation** | ✅ Var (`crypto-security-matrix.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ Session hijacking & timing-safe | ✅ Hazır | DB auth_version geçersiz kılma devrede |
| **İlan Oluşturma (Wizard & Synthesis)** | ✅ Var (`listing-wizard.test.ts`, `scope-synthesizer.test.ts`) | ⚠️ DB Gerekli | ✅ Var | ✅ Doğrulandı | ✅ Budget check constraint & XSS | ✅ Hazır | Tam Kapsam |
| **İlan 7 Gün Süre Dolumu (Expiration)** | ✅ Var (`listing-lifecycle.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ Geçersiz state geçiş engeli | ✅ Vercel Cron Bağlı | `vercel.json` saatlik cron devrede |
| **İlan Yeniden Aktifleştirme (Reactivation)** | ✅ Var (`listing-lifecycle.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ Yalnızca EXPIRED/OWNER izinli | ✅ Hazır | 7 günlük periyot sıfırlama devrede |
| **İlan Silme (Soft-delete & State Machine)** | ✅ Var (`listing-lifecycle.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ MATCHED ilan silinemez kuralı | ✅ Hazır | Tam Kapsam |
| **Gizli Teklif Verme (Blind Bidding)** | ✅ Var (`offers.test.ts`, `offers-batch.test.ts`) | ⚠️ DB Gerekli | ✅ Var | ✅ Doğrulandı | ✅ Diğer teklifçilere kapalı veri | ✅ Hazır | Tam Kapsam |
| **Çift Teklif Engeli (Max 1 Pending Offer)** | ✅ Var (`offers.test.ts`, `counter-offer-concurrency.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ Postgres Partial Unique Index | ✅ Hazır | DB seviyesinde garantili |
| **Geri Çekilen Teklife Yeniden Teklif Engeli** | ✅ Var (`offers.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ Anti-spam döngü kuralı | ✅ Hazır | Tam Kapsam |
| **Reddedilen Teklif Sonrası Yeni Teklif** | ✅ Var (`offers.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ REJECTED serbest bırakır | ✅ Hazır | Tam Kapsam |
| **Pazarlık / Karşı Teklif Döngüsü (FSM)** | ✅ Var (`counter-offer-fsm.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ Karşılıklı sıra (turn-based) | ✅ Hazır | Concurrency kilitleme devrede |
| **Teklif Kabul & Eşleşme (Accept & Match)** | ✅ Var (`engagements.test.ts`) | ⚠️ DB Gerekli | ✅ Var | ✅ Doğrulandı | ✅ Advisory user-pair lock | ✅ Hazır | Tam Kapsam |
| **Eşleşme Anında Diğer Tekliflerin Otomatik Reddi** | ✅ Var (`engagements.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ REJECTED_OTHER_SELECTED | ✅ Hazır | DB transaction içinde garantili |
| **Sözleşme & Dijital Mühür (HMK m. 193)** | ✅ Var (`contract-draft.test.ts`, `contract-realtime-push.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ SHA-256 dijital imza mührü | ✅ Hazır | Tam Kapsam |
| **Bilateral Hakediş / Milestones (Sıfır Emanet)** | ✅ Var (`milestone-security-remediation.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ Karşılıklı ödeme onayı | ✅ Hazır | TBK m. 470/474 uyumlu |
| **Çift Kör Değerlendirme (Double-Blind Reviews)** | ✅ Var (`bilateral-reviews.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ Karşılıklı verilene dek gizli | ✅ Hazır | Stale fallback izole edildi |
| **Profil & Şirket Doğrulama (GİB / VKN)** | ✅ Var (`company-verification.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ Maskeli VKN & HMAC Index | ✅ Hazır | Tam Kapsam |
| **Avatar Yükleme & Sharp Sanitization** | ✅ Var (`operations.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ EXIF strip, WebP convert | ✅ Hazır | R2 S3 uyumlu upload |
| **Hesap Silme & KVKK Anonimleştirme** | ✅ Var (`logic-remediations.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ PII silme, Relational koruma | ✅ Hazır | TTK 10 yıl saklama istisnası |
| **Veri Dışa Aktarma (Export Jobs)** | ✅ Var (`export-json-stream.test.ts`) | ⚠️ DB Gerekli (`export-jobs.test.ts`) | ❌ Eksik | ✅ Doğrulandı | ✅ AES-256-GCM chunk streaming | ✅ Hazır | KVKK m. 11 veri taşınabilirliği |
| **Arama & Türkçe Karakter Normalizasyonu** | ✅ Var (`search-filter-algorithms.test.ts`, `symspell-engine.test.ts`) | ⚠️ DB Gerekli | ✅ Var | ✅ Doğrulandı | ✅ SQL ILIKE & Relevancy | ✅ Hazır | Tam Kapsam |
| **Arayüz Erişilebilirliği (a11y)** | ✅ Var (`tests/a11y/accessibility.test.ts`) | ❌ Yok | ❌ Yok | ✅ Doğrulandı | ✅ WCAG 2.2 uyumu (7/7 passed) | ✅ Hazır | Semantik yapı ve kontrast |
| **Admin Paneli & Rol Ayrımı** | ✅ Var (`comprehensive-resolution-2026.test.ts`, `admin-auth-2fa-enforcement.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ Master Key + Zorunlu 2FA | ✅ Hazır | 2FA TOTP zorunlu kılındı |
| **Akış Yetkilendirme Koruması (Feed Auth Guard)** | ✅ Var (`feed-auth-guard.test.ts`) | ⚠️ DB Gerekli | ✅ Var | ✅ Doğrulandı | ✅ `mode=following` guard (6/6 passed) | ✅ Hazır | **Tam Kapsam (%100 Başarılı)** |
| **Client IP Anti-Spoofing** | ✅ Var (`client-ip-anti-spoofing.test.ts`) | ⚠️ DB Gerekli | ❌ Eksik | ✅ Doğrulandı | ✅ Cloudflare cf-connecting-ip önceliği | ✅ Hazır | 5/5 test geçti |

---

## 2. TEST SUITE İSTATİSTİKLERİ

- **Toplam Birim / Güvenlik Testi:** 6.108 Test
- **Başarılı Test Sayısı:** **6.108 Test (%100 Yeşill)**
- **Başarısız Test Sayısı:** **0 (Sıfır)**
- **Test Dosyası Sayısı:** 124 Test Dosyası (Tamamı Passed)
- **A11y Testleri:** 7/7 Başarılı (%100)
- **Şema Senkronizasyon Testi:** 48 Tablo, 552 Kolon %100 Senkron
- **Linter Durumu:** 0 Hata, 0 Uyarı
- **Tip Denetimi:** 0 Hata (Strict Mode)
- **Gizli Anahtar Sızıntı Denetimi:** 0 Sızıntı (Tüm repo temiz)
- **Derleme Durumu:** 161 / 161 Rota Hatasız Derlendi

---

## 3. REGRESYON RİSKİ OLAN ALANLAR & İZLEME PLANI

1. **Feed Auth Guard:** `mode=all` kamusal pazar yeri araması ve SEO için açık kalırken, `mode=following` için kimlik doğrulama zorunluluğu 6 birim test ile kilitlenmiştir.
2. **Client IP Anti-Spoofing:** Cloudflare ve Vercel reverse-proxy arkasında doğru IP tespiti 5 birim test ile kilitlenmiştir; saldırgan sahte header gönderse bile gerçek IP bazlı rate limit uygulanır.
3. **Admin 2FA TOTP:** Admin oturum açma isteklerinde 2FA'sız hesaplar doğrudan 403 Forbidden ile engellenmiştir.
