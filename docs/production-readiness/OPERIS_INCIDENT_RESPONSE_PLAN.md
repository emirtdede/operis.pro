# OPERIS — OLAY MÜDAHALE PLANI (INCIDENT RESPONSE PLAN & RUNBOOKS)

**Versiyon:** 1.0.0-PROD  
**Kapsam:** Operis Prodüksiyon Altyapısı (`https://operis.pro`, Supabase PostgreSQL, Cloudflare R2, Resend, Netgsm, Inngest, Vercel)  
**Doküman Sahibi:** DevSecOps & SRE Incident Response Ekibi  
**Yürürlük Tarihi:** Canlıya Geçiş (Go-Live) Öncesi Zorunlu

---

## 1. ACİL DURUM SEVİYE MATRİSİ (INCIDENT SEVERITY LEVELS)

| Seviye | Tanım | Hedef MTTA (Fark Etme) | Hedef MTTR (Çözüm) | İletişim & Eskalasyon |
|---|---|---|---|---|
| **SEV-1 (CRITICAL)** | Sistemin tamamen çökmesi, veri sızıntısı, root/admin ele geçirilmesi, ödeme/sözleşme veri bozulması | < 5 dakika | < 30 dakika | On-call SRE, Principal Engineer, Hukuk & KVKK Ekibi, CEO/Kurucu |
| **SEV-2 (HIGH)** | İlan yayınlama veya teklif verme fonksiyonunun durması, e-posta gönderim kesintisi, artan 5xx hataları (>%3) | < 15 dakika | < 2 saat | SRE & Backend Lead |
| **SEV-3 (MEDIUM)** | Kısmi arayüz hatası, arka plan senkronizasyonunda gecikme, raporlama gecikmesi | < 1 saat | < 1 iş günü | İlgili Ürün Ekibi |
| **SEV-4 (LOW)** | Kozmetik hatalar, düşük etkili arama gecikmesi, tekil kullanıcı bildirimleri | < 4 saat | Planlı Sprint | Destek & QA Ekibi |

---

## 2. GENEL OLAY MÜDAHALE YAŞAM DÖNGÜSÜ (6-STAGE LIFECYCLE)

Her olayda istisnasız aşağıdaki 6 adım işletilir:
1. **DETECTION (Tespit):** Alerting, log analizi veya kullanıcı bildirimi ile anomalinin doğrulanması.
2. **CONTAINMENT (Sınırlandırma):** Hasarın yayılmasının durdurulması (oturumların iptali, IP bloklama, devreden çıkarma).
3. **MITIGATION (Geçici Çözüm):** Sistemin temel işlevlerine dönmesi için acil müdahale (traffic rerouting, feature flag).
4. **RECOVERY (Kalıcı Kurtarma):** Kök nedenin ortadan kaldırılması ve normal çalışma durumuna dönüş.
5. **VERIFICATION (Doğrulama):** Smoke testler, metrik takibi ve veri bütünlüğü kontrolleri ile sistemin sağlığının kanıtlanması.
6. **POSTMORTEM (Öğrenme):** 48 saat içinde suçlayıcı olmayan (blameless) kök neden raporu hazırlanması ve önleyici aksiyonların Jira'ya atanması.

---

## 3. SENARYO BAZLI RUNBOOK'LAR (INCIDENT RUNBOOKS)

---

### SENARYO 1: VERİTABANI KESİNTİSİ (DATABASE OUTAGE)
**Tetikleyici:** Sentry/Uptime robot 500 hataları fırlatıyor, loglarda `ECONNREFUSED` veya `Tenant or user not found / pooler error`.

1. **DETECTION:**
   - Datadog/Supabase Dashboard üzerinde `Active Connections` ve `CPU %` tavan yapmış veya sıfıra inmiş.
   - `/api/health` endpoint'i `503 Service Unavailable` dönüyor.
2. **CONTAINMENT:**
   - Vercel üzerinde `DATABASE_URL` bağlantısının Session Pooler (:5432) yerine Transaction Pooler (:6543) üzerinden aktığı doğrulanır.
   - Trafik patlaması varsa Cloudflare Under Attack modu devreye sokulur.
3. **MITIGATION:**
   - Supabase Dashboard üzerinden Pooler restart edilir (`Restart pooler`).
   - Gerekirse connection limit artırılır veya asılı kalan idle transaction'lar sonlandırılır:
     ```sql
     SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
     WHERE state = 'idle in transaction' AND state_change < now() - INTERVAL '5 minutes';
     ```
4. **RECOVERY:**
   - Veritabanı servisinin hazır olduğu `pg_isready` ile doğrulanır.
   - Vercel deployment'ı yeniden tetiklenerek connection pool yeniden oluşturulur.
5. **VERIFICATION:**
   - `/api/health` çağrılır (`{ "status": "healthy", "database": "connected" }`).
   - Canlıda tekil bir ilan açılıp view sayısının başarıyla arttığı doğrulanır.
6. **POSTMORTEM:**
   - Bağlantı havuzu (pooler) boyutları incelenir, Lambda concurrency limiti optimize edilir.

---

### SENARYO 2: VERİ BOZULMASI VEYA YANLIŞLIKLA SİLİNME (DATA CORRUPTION / ACCIDENTAL DELETE)
**Tetikleyici:** Tutarsız state, eksik kullanıcı/ilan tabloları, `FOREIGN KEY violation` hataları.

1. **DETECTION:**
   - Kullanıcılardan gelen "projelerim görünmüyor" şikayetleri veya cron loglarındaki relational query hataları.
2. **CONTAINMENT:**
   - Anında bakım modu aktifleştirilir (Vercel middleware üzerinden `MAINTENANCE_MODE=true` bayrağı ile API yazma istekleri 503 ile durdurulur).
3. **MITIGATION:**
   - Hasar tespiti yapılır: Hangi tablolar etkilendi?
   - Supabase Point-in-Time Recovery (PITR) kullanılarak bozulmanın meydana geldiği dakikanın (T-1 dakika) öncesine ait yalıtılmış bir geçici branch/clone DB oluşturulur.
4. **RECOVERY:**
   - Yalnızca etkilenen satırlar/tablolar geçici klondan ana veritabanına `INSERT ... ON CONFLICT` ile geri yüklenir.
   - İlişkisel bütünlük (`engagements`, `offers`, `listings`) cross-check edilir.
5. **VERIFICATION:**
   - `pnpm audit:schema` çalıştırılarak veritabanı şeması ve Drizzle modeli doğrulanır.
   - `scripts/check-db-schema-sync.ts` ile tüm 48 tablonun durumu taranır.
   - Bakım modu kapatılır.
6. **POSTMORTEM:**
   - Yetkisiz silme scripti veya migration hatası incelenir; migration çalıştırma kuralları güncellenir.

---

### SENARYO 3: GİZLİ ANAHTAR SIZINTISI (LEAKED SECRET / CREDENTIAL COMPROMISE)
**Tetikleyici:** GitHub Secret Scanning alert, GitGuardian bildirimi, loglara düşen `AUTH_SECRET`, `PII_ENCRYPTION_KEY` veya `ADMIN_MASTER_KEY`.

1. **DETECTION:**
   - Sızan anahtarın kapsamı ve türü belirlenir: Google OAuth secret, Resend API key, Supabase service role key, Auth Secret.
2. **CONTAINMENT:**
   - İlgili sağlayıcı konsolundan (örn. Google Cloud Console veya Resend Dashboard) sızan anahtar anında **REVOKE** edilir / silinir.
3. **MITIGATION:**
   - Yeni bir güçlü anahtar üretilir:
     - `openssl rand -hex 32` (Auth secret & PII keys)
   - Vercel Environment Variables ekranında yeni anahtar güncellenir.
   - Canlı deployment tetiklenir (`vercel --prod`).
   - Eğer `AUTH_SECRET` sızmışsa, tüm kullanıcıların veritabanındaki `auth_version` alanı artırılarak aktif sahte oturumlar geçersiz kılınır:
     ```sql
     UPDATE users SET auth_version = auth_version + 1;
     ```
4. **RECOVERY:**
   - PII anahtarı sızmışsa, `scripts/backfill-pii-keys.ts` çalıştırılarak mevcut şifrelenmiş veriler yeni anahtarla yeniden şifrelenir (re-encryption cycle).
5. **VERIFICATION:**
   - `scripts/check-secrets.ts` çalıştırılır.
   - Giriş yapılarak yeni oturum çerezlerinin doğruluğu test edilir.
6. **POSTMORTEM:**
   - Anahtarın repoya nasıl girdiği (commit diff, PR) araştırılır; pre-commit hook'lar sıkılaştırılır.

---

### SENARYO 4: KULLANICI VEYA YÖNETİCİ HESABININ ELE GEÇİRİLMESİ (ACCOUNT TAKEOVER)
**Tetikleyici:** Şüpheli IP'den ardışık şifre değişiklikleri, yetkisiz ilan silme veya bakiye/sözleşme tahrifatı bildirimleri.

1. **DETECTION:**
   - `security_events` tablosunda `SUSPICIOUS_ACTIVITY` veya `LOGIN_SUCCESS` coğrafi uyumsuzlukları.
2. **CONTAINMENT:**
   - Hedef hesabın oturumu anında sonlandırılır ve hesap askıya alınır:
     ```sql
     UPDATE users SET status = 'SUSPENDED', auth_version = auth_version + 1 WHERE id = '<TARGET_USER_ID>';
     ```
   - İlgili kullanıcının IP adresi `ip_blocks` tablosuna eklenir.
3. **MITIGATION:**
   - Kullanıcının şifresi ve 2FA TOTP secret'ı sıfırlanır.
   - Saldırgan tarafından yapılan son teklifler ve ilan değişiklikleri denetlenir.
4. **RECOVERY:**
   - Kullanıcı ile telefon (SMS doğrulaması) üzerinden kimlik teyidi yapılır.
   - Hesap durumu `ACTIVE` durumuna getirilir ve güvenli şifre sıfırlama bağlantısı gönderilir.
5. **VERIFICATION:**
   - Kullanıcının yeni şifre ve 2FA ile sorunsuz giriş yaptığı doğrulanır.
6. **POSTMORTEM:**
   - Brute force veya credential stuffing ihtimaline karşı rate-limit kuralları sıkılaştırılır.

---

### SENARYO 5: VERİ SIZINTISI ŞÜPHESİ (DATA LEAK / EXFILTRATION SUSPICION)
**Tetikleyici:** Anormal export-jobs hacmi, scraper bot aktivitesi, yetkisiz endpoint erişimi.

1. **DETECTION:**
   - Upstash / Cloudflare üzerinde `/api/listings/feed` veya `/api/account/export` rotalarında anormal bant genişliği.
2. **CONTAINMENT:**
   - İlgili endpoint'e anında katı rate limit konulur (`GcraLimiter` limit 10/min'den 1/min'e düşürülür).
   - Şüpheli IP blokları Cloudflare WAF üzerinden tamamen engellenir.
   - `export_jobs` tablosundaki `PROCESSING` durumundaki işler iptal edilir (`FAILED`).
3. **MITIGATION:**
   - Hangi verilerin sızdığı (public ilanlar mı yoksa PII mi?) tespit edilir.
   - Operis PII verileri AES-256-GCM Envelope v2 ile şifreli tutulduğundan, ham veritabanı dump'ı alınsa bile şifrelenmiş alanlar (ad, soyad, telefon, doğum tarihi) anahtarsız okunamaz.
4. **RECOVERY:**
   - Açık barındıran endpoint yamalanır veya kapatılır.
   - Sızıntı doğrulanırsa 6698 sayılı KVKK Madde 12 uyarınca **72 saat içinde Kişisel Verileri Koruma Kurulu'na ve ilgililere bildirim** süreci başlatılır (**HUKUK UZMANI DOĞRULAMASI GEREKİR**).
5. **VERIFICATION:**
   - Veri bütünlüğü ve audit logları doğrulanır.
6. **POSTMORTEM:**
   - Resmi KVKK raporu ve teknik kök neden analizi hazırlanır.

---

### SENARYO 6: DDOS / KAYNAK TÜKETME SALDIRISI (RESOURCE EXHAUSTION / BOT ATTACK)
**Tetikleyici:** Vercel edge istek sayısında 100x sıçrama, Cloudflare CPU %90+, database connection spike.

1. **DETECTION:**
   - Cloudflare ve Datadog üzerinde HTTP 429 ve 503 patlaması.
2. **CONTAINMENT:**
   - Cloudflare Dashboard -> **Security** -> **Under Attack Mode** anında açılır (ziyaretçilere JS/Turnstile challenge uygulanır).
   - Bot Fight Mode aktifleştirilir.
3. **MITIGATION:**
   - Cloudflare WAF kuralı ile `/api/` rotalarına agresif IP bazlı rate-limiting (dakikada 30 istek) uygulanır.
   - Agresif arama yapan botların User-Agent ve ASN'leri engellenir.
4. **RECOVERY:**
   - Trafik normale döndüğünde Under Attack Mode aşamalı olarak "High" güvenlik seviyesine indirilir.
5. **VERIFICATION:**
   - Sitenin gerçek kullanıcılar için açılış hızı (TTFB < 300ms) doğrulanır.
6. **POSTMORTEM:**
   - WAF kuralları kalıcı hale getirilir.

---

### SENARYO 7: E-POSTA / SMS SAĞLAYICI KESİNTİSİ (RESEND / NETGSM OUTAGE)
**Tetikleyici:** E-posta doğrulama veya SMS bildirimlerinin gitmemesi, outbox tablosunda `status = 'FAILED'` birikmesi.

1. **DETECTION:**
   - `outbox_events` tablosunda `status = 'FAILED'` olan kayıtların 50'yi aşması.
   - Sentry üzerinde `Resend network error` veya `Netgsm HTTP 500` hataları.
2. **CONTAINMENT:**
   - Sistem mimarisi gereği Operis e-postaları doğrudan istek anında senkron bloke etmez; Outbox pattern ve Resend Pool fallback'i kullanır.
   - Bu sayede kullanıcı kaydı veya işlem kesintiye uğramaz.
3. **MITIGATION:**
   - Sağlayıcının statü sayfası kontrol edilir (status.resend.com).
   - Uzayan kesintilerde yedek SMTP / Twilio sağlayıcısına geçiş için `EMAIL_PROVIDER=smtp` veya `SMS_PROVIDER=twilio` environment variable'ları aktif edilir.
4. **RECOVERY:**
   - Sağlayıcı normale döndüğünde Inngest outbox runner (`processOutboxJob`) tetiklenerek kuyruktaki bekleyen e-postalar gönderilir:
     ```sql
     UPDATE outbox_events SET status = 'PENDING', next_attempt_at = now() WHERE status = 'FAILED';
     ```
5. **VERIFICATION:**
   - Test e-postası tetiklenerek iletildiği onaylanır.
6. **POSTMORTEM:**
   - Failover otomasyonu gözden geçirilir.
