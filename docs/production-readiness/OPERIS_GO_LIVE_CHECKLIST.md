# OPERIS — CANLIYA GEÇİŞ KONTROL LİSTESİ (GO-LIVE EXECUTION RUNBOOK)

Bu doküman, Operis platformunun yayına alınma günü ve anında uygulanacak saat bazlı operasyonel kontrol adımlarını tanımlar.

---

## 1. T-24 SAAT (GÜN ÖNCESİ HAZIRLIK & FREEZE)

- [ ] **Kod Dondurma (Feature Freeze):** Canlıya çıkacak sürüm haricinde `main` dalına hiçbir yeni özellik veya refactoring commit'i alınmamalı.
- [ ] **Veritabanı Yedeklemesi:** Supabase üzerinden manuel tam snapshot (Backup) alınmalı ve test PITR klonunun başarıyla çalıştığı doğrulanmalı.
- [ ] **Tüm Ortam Değişkenleri Denetimi:** Vercel Production Environment Variables tablosu `src/config/env.ts` şemasına göre tek tek kontrol edilmeli.
- [ ] **E-Posta & SMS Bakiyesi:** Resend hesap kotası ve Netgsm SMS bakiyesi kontrol edilmeli (minimum 10.000 SMS / 50.000 e-posta kapasitesi).
- [ ] **Cloudflare SSL/TLS:** Cloudflare SSL/TLS modu **Full (Strict)** olarak ayarlanmalı, Universal SSL ve Edge Certificates geçerlilik süreleri kontrol edilmeli.
- [ ] **On-Call Nöbet Çizelgesi:** Launch günü nöbetçi SRE, Backend, Frontend ve Hukuk sorumlularının iletişim kanalları (Slack/WhatsApp War Room) açılmalı.

---

## 2. T-4 SAAT (INFRASTRUCTURE & SERVICE READINESS)

- [ ] **Supabase Transaction Pooler Doğrulaması:** `DATABASE_URL` portunun `:6543` olduğu teyit edilmeli.
- [ ] **Inngest Cloud Bağlantısı:** Inngest dashboard'unda production webhook URL'sinin (`https://operis.pro/api/inngest`) aktif ve senkron olduğu test edilmeli.
- [ ] **Upstash Redis Bağlantısı:** Redis REST URL ve Token ile ping atılarak yanıt süresinin < 25ms olduğu teyit edilmeli.
- [ ] **R2 Bucket İzinleri:** Test avatarı yüklenip silinerek Cloudflare R2 yazma/okuma izinleri doğrulanmalı.
- [ ] **CI/CD Pipeline Yeşil:** Son commit üzerinde GitHub Actions CI workflow'unun (Typecheck, Lint, Test, Schema Sync) eksiksiz yeşil geçtiği görülmeli.

---

## 3. T-1 SAAT (FINAL DRY RUN & READINESS)

- [ ] **Staging / Preview Smoke Test:** Staging ortamında kayıt, ilan açma, teklif verme, karşı teklif ve sözleşme akışı baştan sona denenmeli.
- [ ] **Sentry & PostHog Test Sinyali:** Canlı projeye test hatası ve test event'i gönderilerek dashboard'lara düştüğü doğrulanmalı.
- [ ] **DNS TTL Düşürme:** `operis.pro` DNS A/CNAME kayıtlarının TTL süresi 300 saniyeye (5 dk) düşürülmeli (acil rollback gerekirse hızlı yönlendirme için).
- [ ] **Status Page Hazırlığı:** Olası aksilik anında kullanıcıları bilgilendirecek status page / maintenance banner hazır tutulmalı.

---

## 4. DEPLOYMENT (CANLIYA ÇIKIŞ ANI — T-0)

- [ ] **Canlıya Dağıtım:** Vercel üzerinden onaylı `production` deployment'ı tetiklenmeli:
  ```bash
  vercel --prod
  ```
- [ ] **Build Çıktısı Doğrulaması:** Build loglarında sıfır hata, sıfır secret uyarısı ve sayfa derlemelerinin eksiksiz tamamlandığı izlenmeli.
- [ ] **DNS & Domain Yönlendirmesi:** `https://operis.pro` ve `https://www.operis.pro` adreslerinin yeni deployment'a yönlendiği teyit edilmeli.

---

## 5. DEPLOYMENT + 5 DAKİKA (SANITY CHECK)

- [ ] **Ana Sayfa:** `https://operis.pro/tr` ve `https://operis.pro/en` HTTP 200 dönüyor mu?
- [ ] **Güvenlik Başlıkları:** `curl -I https://operis.pro/tr` ile `Strict-Transport-Security`, `X-Frame-Options: DENY`, `Content-Security-Policy` başlıklarının geldiği teyit edilmeli.
- [ ] **SSL Sertifikası:** Tarayıcıda geçerli Let's Encrypt / Cloudflare SSL kilidi görünüyor mu?
- [ ] **Sitemap & Robots:** `https://operis.pro/sitemap.xml` ve `https://operis.pro/robots.txt` sayfalarının hatasız yüklendiği doğrulanmalı.

---

## 6. DEPLOYMENT + 15 DAKİKA (CRITICAL USER JOURNEY SMOKE)

- [ ] **Gerçek Kayıt Testi:** Yeni bir test kullanıcısı ile kayıt olunmalı, aktivasyon e-postasının geldiği ve tıklandığında doğrulandığı görülmeli.
- [ ] **İlan Oluşturma:** Test ilanı açılmalı, 7 günlük `active_until` süresinin doğru set edildiği doğrulanmalı.
- [ ] **Gizli Teklif Testi:** İkinci bir tarayıcı/kullanıcıdan ilana teklif verilmeli; teklifin üçüncü kişilere kapalı olduğu, yalnızca ilan sahibine göründüğü doğrulanmalı.
- [ ] **Arama & Filtre:** `/tr/ilanlar` sayfasında yeni açılan ilanın anında listelendiği doğrulanmalı.
- [ ] **Profil Avatar Yükleme:** Profil resmi yüklenip R2 üzerinden WebP formatında yüklendiği görülmeli.

---

## 7. DEPLOYMENT + 1 SAAT (TRAFFIC STABILIZATION)

- [ ] **Sentry Hata Oranı:** Sentry üzerinde unhandled exception veya crash var mı? (Hata oranı <%0.1 olmalı).
- [ ] **Postgres Bağlantı Sayısı:** Supabase üzerinde connection count izlenmeli; spike veya pool doygunluğu var mı?
- [ ] **TTFB & Edge Gecikmesi:** Vercel Analytics / Speed Insights üzerinde ortalama TTFB < 200ms olduğu teyit edilmeli.
- [ ] **Outbox Kuyruğu:** `outbox_events` tablosunda `status = 'PENDING'` veya `'FAILED'` kaydı birikmiş mi?

---

## 8. DEPLOYMENT + 6 SAAT (MID-TERM OPERATIONAL CHECK)

- [ ] **İlk Cron Döngüsü:** Bakım cron'unun (`operis-scheduled-maintenance`) çalıştığı, süresi dolan ilanları ve süresi dolan OTP'leri başarıyla temizlediği doğrulanmalı.
- [ ] **Bot & Abuse İzleme:** Cloudflare WAF loglarında anormal scraping veya DDoS denemesi var mı?
- [ ] **Kullanıcı Geri Bildirimleri:** Destek ve iletişim formuna gelen mesajlar taranmalı.

---

## 9. DEPLOYMENT + 24 SAAT (DAY 1 POST-MORTEM)

- [ ] **Tüm 24 Saatlik Metrikler:** Toplam tekil ziyaretçi, kayıt tamamlama oranı, ilan yayınlama sayısı.
- [ ] **DNS TTL Yükseltme:** Kararlı çalışan sistemde DNS TTL değerleri standart 86400 (1 gün) seviyesine çekilmeli.
- [ ] **E-Posta Bounce & Spam Oranı:** Resend Dashboard üzerinden bounce oranı (<%1) ve spam şikayet oranı (<%0.05) teyit edilmeli.

---

## 10. DEPLOYMENT + 72 SAAT & + 7 GÜN

- [ ] **+72 SAAT:** Google Search Console üzerinden sitemap dizine ekleme (indexing) durumu kontrol edilmeli.
- [ ] **+72 SAAT:** 3 gün önce açılan ilanlara gönderilen tekliflerin ve mesajlaşmaların veri tabanı sağlığı kontrol edilmeli.
- [ ] **+7 GÜN:** Açılan ilk ilanların tam 7. gün sonunda `INACTIVE_EXPIRED` durumuna geçtiği ve ilan sahibine bildirim gittiği canlıda kanıtlanmalı.
- [ ] **+7 GÜN:** Haftalık tam güvenlik taraması ve bağımlılık kontrolü yapılmalı.
