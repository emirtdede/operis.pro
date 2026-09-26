# OPERIS — YAYIN SONRASI OPERASYONEL DENETİM PLANI (POST-LAUNCH CHECKLIST)

Bu doküman, Operis canlıya alındıktan sonra sistem kararlılığını, veri bütünlüğünü, güvenlik duruşunu, SEO performansını ve ölçeklenebilirliğini garanti altına almak için periyodik olarak yürütülecek denetim adımlarını içerir.

---

## 1. İLK SAAT KONTROLLERİ (FIRST HOUR)

- [ ] **Sentry Hata Akışı:** Gerçek zamanlı Sentry stream'i izlenmeli. Beklenmeyen 5xx, uncaught promise veya hydration hataları var mı?
- [ ] **DB Bağlantı Havuzu (Pool Saturation):** Supabase `Active Connections` metriği izlenmeli. Serverless fonksiyonların bağlantıları zamanında serbest bırakıp bırakmadığı kontrol edilmeli.
- [ ] **Auth Akış Başarısı:** İlk kullanıcı kayıtlarının ve oturum açma işlemlerinin başarı oranı doğrulanmalı (`/api/auth/register` ve `/api/auth/login`).
- [ ] **Edge Response Latency (TTFB):** Vercel Analytics üzerinde TTFB değerinin Türkiye genelinde < 250ms olduğu teyit edilmeli.
- [ ] **Canlı Güvenlik Başlıkları:** Production yanıtlarında CSP, HSTS, X-Content-Type-Options ve SameSite cookie bayrakları doğrulanmalı.

---

## 2. İLK 24 SAAT KONTROLLERİ (FIRST 24 HOURS)

- [ ] **İlan Yayınlama & Feed Senkronizasyonu:** Açılan ilanların ana akışta (`/tr/ilanlar`), arama motorunda ve radar bildirimlerinde hatasız göründüğü doğrulanmalı.
- [ ] **Teklif Gizliliği Doğrulaması (Blind Bidding Leak Check):** Veritabanı sorgularında ve API yanıtlarında teklif fiyatlarının veya açıklamalarının üçüncü şahıslara sızmadığı loglardan teyit edilmeli.
- [ ] **Resend E-posta İletim Oranı:** Resend Dashboard üzerinden Delivery Rate (>%98.5), Bounce Rate (<%1) ve Spam Complaint (<%0.05) kontrol edilmeli.
- [ ] **Netgsm SMS Kredisi & OTP Doğrulama Oranı:** Gönderilen SMS OTP kodlarının başarıyla kullanıcıya ulaştığı ve doğrulama dönüşüm oranının >%85 olduğu izlenmeli.
- [ ] **Cron & Arka Plan Görevleri:** `operis-scheduled-maintenance` durable function'ının saat başı eksiksiz çalıştığı Inngest dashboard'undan izlenmeli.
- [ ] **Log Hijyeni Kontrolü:** Vercel ve Supabase loglarında hiçbir şifre, auth secret, PII veya ham API anahtarının düz metin yazılmadığı doğrulanmalı.

---

## 3. İLK 3 GÜN KONTROLLERİ (FIRST 3 DAYS)

- [ ] **Kullanıcı Kayıp (Drop-Off) Noktaları:** PostHog funnel analizi ile kullanıcıların kayıt, ilan açma veya teklif verme adımlarında nerede takıldığı analiz edilmeli.
- [ ] **Pazarlık & Karşı Teklif Döngüsü:** Kullanıcılar arasındaki counter-offer döngülerinde concurrency veya turn-based kilitlenme (deadlock) olup olmadığı kontrol edilmeli.
- [ ] **Cloudflare WAF Tehdit Raporu:** Engellenen şüpheli IP'ler, credential stuffing denemeleri ve taranan güvenlik açıklarının raporu incelenmeli.
- [ ] **Google Search Console İndeks Durumu:** Googlebot tarama hataları (Crawl Errors), 404 sayfalar ve sitemap işleme durumu kontrol edilmeli.
- [ ] **Core Web Vitals:** Real User Monitoring (RUM) metrikleri:
  - **LCP (Largest Contentful Paint):** < 2.5s
  - **CLS (Cumulative Layout Shift):** < 0.1
  - **INP (Interaction to Next Paint):** < 200ms

---

## 4. İLK HAFTA KONTROLLERİ (FIRST WEEK)

- [ ] **7 Günlük İlan Yaşam Döngüsü Doğrulaması:** Canlıya alınan ilk ilanların tam 7. gün sonunda otomatik olarak `INACTIVE_EXPIRED` durumuna geçtiği, ilan sahibine bildirim ulaştığı ve ilanın kamusal aramadan kalktığı canlı veride kanıtlanmalı.
- [ ] **İlan Yeniden Aktifleştirme (Reactivation):** Süresi dolan bir ilanın sahibi tarafından sorunsuz biçimde yeniden 7 gün süreyle aktifleştirilebildiği doğrulanmalı.
- [ ] **İlk Tamamlanan Projeler & Değerlendirmeler:** Tamamlanan ilk iş birliklerinde çift kör (double-blind) değerlendirme sisteminin her iki taraf da puan verene kadar gizliliği koruduğu teyit edilmeli.
- [ ] **Cloudflare R2 Depolama Hacmi:** Yüklenen avatarların boyutları, bant genişliği maliyetleri ve optimize WebP dönüşümleri denetlenmeli.
- [ ] **Haftalık Yedekleme Doğrulaması:** Supabase otomatik yedeklerinin test ortamına restore edilerek kurtarma tatbikatı (DR Drill) yapılmalı.

---

## 5. İLK AY KONTROLLERİ (FIRST MONTH)

- [ ] **KVKK & Veri Saklama Uyumu:** Kullanıcı tarafından silinen hesapların tüm PII verilerinin anonimleştiği ve ilişkisel bütünlüğün korunduğu denetlenmeli.
- [ ] **Pazar Yeri Abuse & Dolandırıcılık Taraması:** Platform dışına ödeme/iletişim yönlendirmeye çalışan hesaplar, spam ilanlar ve sahte profiller incelenmeli.
- [ ] **Veritabanı İndeks Performansı:** `pg_stat_user_tables` ve `pg_stat_statements` çalıştırılarak full-table scan yapan yavaş sorgular (slow queries > 100ms) tespit edilip optimize edilmeli.
- [ ] **Altyapı Maliyet & Kapasite Analizi:** Vercel serverless invocation maliyeti, Supabase compute tier'ı ve Upstash Redis kapasitesi değerlendirilmeli.

---

## 6. AYLIK VE ÜÇ AYLIK RUTİN KONTROLLER (RECURRING AUDITS)

### AYLIK RUTİN:
- [ ] `pnpm audit` ile tüm bağımlılık ağacının CVE taraması.
- [ ] SSL sertifikaları ve domain yenileme sürelerinin kontrolü.
- [ ] Admin işlem loglarının (`admin_audit_log`) incelenmesi ve olağandışı yönetici işlemlerinin denetimi.
- [ ] Kırık link (broken link / 404) taraması.

### 3 AYLIK RUTİN:
- [ ] PII şifreleme anahtarlarının rotasyonu tatbikatı (`scripts/backfill-pii-keys.ts`).
- [ ] Kapsamlı penetrasyon testi (Pen-test) ve OWASP ASVS kontrolü.
- [ ] Hukuki metinlerin (Kullanım Koşulları, Gizlilik Politikası, KVKK Aydınlatma Metni) güncel mevzuatla uyumunun hukuk danışmanı ile gözden geçirilmesi (**HUKUK UZMANI DOĞRULAMASI GEREKİR**).
- [ ] Felaket kurtarma (Disaster Recovery RTO/RPO) tatbikatı.
