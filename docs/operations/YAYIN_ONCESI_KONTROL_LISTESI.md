# Operis — Yayın öncesi kontrol edilecekler ve yapılacaklar

**Tarih:** 13 Eylül 2026. **Durum:** Kontrol planı; yayın onayı değildir.

Bu doküman, çözülen kod ve denetim açıklarının ardından, ürünün gerçek ortamda güvenli ve işletilebilir biçimde yayınlanmasını denetler. Oradaki kod hatalarını tekrar çözümlemek yerine, ürünün gerçek ortamda güvenli ve işletilebilir biçimde yayınlanmasını denetler. Bu çalışmada yalnız bu doküman oluşturuldu; dağıtım, gerçek veri değişikliği veya sağlayıcı gönderimi yapılmadı.

## Kullanım ve yayın kararı

- Bütün kutular başlangıçta BEKLİYOR'dur. Kaynak dosyada bir ayarın bulunması, production'da çalıştığının kanıtı değildir.
- **P0: Yayını engeller.** Veri sızıntısı/kaybı, yetki ihlali, ana akışın çalışmaması, kurtarma veya kritik güvenlik eksikliği. Açık P0 ile yayın yapılmaz.
- **P1: Genel yayından önce tamamlanır.** Sınırlı pilot istisnası ancak etkilenen özellik kapalı, sorumlu/tarih/önlem yazılı ise kabul edilebilir.
- **P2: İyileştirme.** Yayın sonrasına bırakılırsa sorumlu ve tarih atanır.
- Her kontrolün kanıt kaydı: ID, durum, sorumlu kişi, tarih, commit SHA/artifact kimliği, ortam, yöntem/komut, beklenen-gerçek sonuç, kanıt bağlantısı, kalan iş. Rol isimleri aşağıda iş dağılımını gösterir; yayın toplantısında gerçek kişiler atanmalıdır.
- Kanıtlarda parola, token, gerçek kimlik, tam bağlantı dizesi bulunmasın. Ekran görüntüsü/trace/log gerektiğinde maskelensin.
- Hedef hosting, alan adı, PostgreSQL sürümü, Node/pnpm sürümü, trafik beklentisi, bütçe, RPO/RTO henüz bu belgede doğrulanmış değildir. Aşağıdaki kararlar doldurulmadan ilgili kontroller kapanmaz.

## 1. Yayın kapsamı ve mevcut kritik açıklar

**Sorumlu:** Teknik lider + ürün sorumlusu.

- [x] **Y01 — P0 (TAMAMLANDI - 13 Eylül 2026 - Sürüm 19):** Çözüm planındaki tüm Sürüm 18 denetim açıkları (B25-ENTRY, B25-EXIT, B25-RUNNER, B26-CLEANUP, B26-MEM ve K01-TEST) kök nedenleriyle çözüldü ve gerçek PostgreSQL 16 üzerinde doğrulandı. Kanıtlar: `tests/integration/export-v18-audit.test.ts` (14 test: eksik URL fail-closed, eksik runner token fail-closed, URL uyuşmazlığı fail-closed, assertSafeE2ETestEnvironment fail-closed, B25-EXIT seed/spawn/test/cleanup hata enjeksiyonu nonzero, B25-RUNNER local stub 0 external egress, cleanupStaleEphemeralDatabases orphan cleanup, B26-CLEANUP real RESET error socket destroy, real RESET hang cancellation within 818ms without 1500ms grace, 1800ms acquisition budget depletion, K01-TEST renewal timer fires updating leaseUntil with 100% identical lastProgressAt, separate connection lease theft rowCount 1 produces exact LEASE_LOST and cleans daemon state, B26-MEM 11 MiB oversized payload rejected by pre-check, B26-MEM 50 x ~8.8 MiB [~429.7 MiB total, 430 parts] streaming export bounded RSS [peak 411 MiB, delta 159 MiB] with 100% streaming decryption and JSON integrity verification, Çıkış: 0), `tests/integration/export-lifecycle.test.ts` (14 test, çıkış 0), `tests/integration/export-v16-audit.test.ts` (9 test, çıkış 0), `tests/integration/pii-rotation.test.ts` (5 test, çıkış 0), `tests/integration/export-jobs.test.ts` (5 test, çıkış 0). Toplam 14 suite, 72 entegrasyon testi başarılı (Çıkış: 0).
- [ ] **Y02 — P0:** Yayınlanacak özellikleri listele: kayıt/doğrulama, ilan, teklif, çalışma alanı, profil, bildirim, export, hesap silme, admin. Çalışmayan özellik varsa yalnız butonunu gizleme; API ve worker girişini de kapat. Kullanıcıya sunulan her özellik için çalışan uçtan uca senaryo bulunmalı.
- [ ] **Y03 — P1:** Hedef mimariyi kaydet: web süreç sayısı, worker süreç sayısı, reverse proxy, DB, e-posta/SMS sağlayıcısı, alarm gözlemcisi, dosya/backup depoları. Serverless web seçiliyorsa sürekli worker'ın nerede çalışacağı ayrıca belirlenmeli.

## 2. Tekrarlanabilir build ve dağıtım paketi

**Sorumlu:** Geliştirici + DevOps.

- [ ] **Y04 — P0:** Yayın commit'ini ve lockfile'ı sabitle. Temiz checkout'ta `pnpm install --frozen-lockfile` başarılı olsun; desteklenen Node/pnpm sürümü CI ve sunucuda aynı olsun. Destek durumu yayın gününde resmi sürüm kaynaklarından kontrol edilsin; sadece mevcut CI'daki Node 20 varsayılmasın.
- [x] **Y05 — P0 (TAMAMLANDI - 13 Eylül 2026):** Kod kalite ve test kapılarının tamamı çalıştırıldı ve çıkış kodu 0 ile doğrulandı:
  - `npm run typecheck` (tsc --noEmit) -> Çıkış 0, sıfır tip hatası.
  - `npm run lint` (eslint .) -> Çıkış 0, sıfır lint hatası/uyarısı.
  - `npm run format:check` (prettier --check .) -> Çıkış 0, %100 uyumlu.
  - `npm run audit:emoji` -> Çıkış 0, yasaklı emoji yok.
  - `npm run audit:i18n` -> Çıkış 0, 215 anahtar TR/EN tam eşitlik.
  - `npm run test:unit` -> 39 dosya, 5.298 test, Çıkış 0.
  - `npm run test:integration` -> 14 dosya, 72 test gerçek PostgreSQL 16 üzerinde, Çıkış 0.
  - `npm run test:a11y` -> 1 dosya, 7 test, Çıkış 0.
  - `npm run build` -> Next.js 16.3.3 production build başarıyla derlendi (124 rota), Çıkış 0.
  - `npm run test:e2e:prod` -> İzole geçici test DB'si (`operis_test_<uuid>`), Next.js production build (`next start -p 8008`), gerçek login, bağımsız veri export (kendi User 1 READY işi ve `page.waitForResponse` jobId doğrulaması), worker tamamlama, şifresi çözülmüş JSON doğrulaması, başka kullanıcının 404 reddi, iptal ve süresi dolmuş indirme (410) dahil 16 test (8 Chromium, 8 Mobile Chrome) başarılı, Çıkış 0.
- [x] **Y06 — P0 (TAMAMLANDI - 13 Eylül 2026):** `scripts/run-e2e-prod.ts` ile fail-closed test DB hedef doğrulaması, her test koşusuna özel geçici DB (`operis_test_<uuid>`) oluşturma/migrate/seed ve `finally` içinde otomatik imha etme mekanizması uygulandı (`TEST_PROD: "1"`, `NODE_ENV: production`, `EMAIL_PROVIDER: resend`, `SMS_PROVIDER: netgsm`, yerel HTTP provider stub sunucusu). Playwright yapılandırmasında port 8008 `next start` sunucusu tanımlandı. Gerçek form submit ve şifresi çözülmüş veri indirme testleri 16/16 başarılı sonuçlandı. Tekil yetkilendirme testi (`-g "negative authorization"`) bağımsız izole DB üzerinde 2/2 başarılı sonuçlandı. Eksik/yanlış DB hedefinde 0 yazım ile fail-closed reddi doğrulandı.
- [ ] **Y07 — P0:** Production kurulumunun worker bağımlılıklarını içerdiğini doğrula. `worker` komutu tsx kullanıyor ve tsx devDependency; yalnız production dependencies kurulan pakette worker'ın başlayacağını varsayma. Worker'ı derlenmiş artifact olarak paketle veya runtime ihtiyacını açıkça karşıla. Temiz makine prova çıktısı kaydet.
- [ ] **Y08 — P1:** Bağımlılık güvenlik taraması ve gizli bilgi taramasını çalışma ağacı + Git geçmişi + dağıtım artifact'inde çalıştır. Bulunan açığın kullanılan sürüm/yol üzerindeki etkisini değerlendir. Kullanılabilir kritik/yüksek açıklar giderilmeden yayınlama; otomatik major sürüm yükseltmesiyle regresyon yaratma. Lisans envanterini kaydet.

## 3. Ortam, sırlar ve production davranışı

**Sorumlu:** DevOps + güvenlik sorumlusu.

- [ ] **Y09 — P0:** Web, worker ve observer için ayrı env envanteri çıkar. APP_URL/AUTH_URL/NEXT_PUBLIC_APP_URL gerçek HTTPS alan adıyla uyumlu olsun. NEXT_PUBLIC değerleri build sırasında istemciye gidebileceğinden sır içermesin. SECRET değerlerini dokümana yazma.
- [ ] **Y10 — P0:** Demo/quick-login/test kullanıcıları ve bellek fallback'leri production'da devre dışı olsun. NODE_ENV=production; VITEST ve test/build bypass değişkenleri runtime'da bulunmasın. DB bağlantısını kesip girişin demo kullanıcıya veya imzalı fakat doğrulanmamış oturuma düşmediğini test et.
- [ ] **Y11 — P0:** AUTH_SECRET, PII şifreleme ve HMAC anahtarları test örneklerinden farklı ve güvenli depoda olsun. Web/worker aynı sürümlü ring'i kullansın. Şifreleme anahtarı ile blind-index HMAC rotasyonunun farklı süreçler olduğu kaydedilsin; HMAC anahtarını değiştirip mevcut indeksleri bozmaya izin verme.
- [ ] **Y12 — P0:** DB çalışma hesabı en az yetkiyle çalışsın; migration yetkileri ayrı kimlikte olsun. DB public internete gereksiz açık olmasın; TLS sertifika doğrulaması ve bağlantı havuzu sınırları gerçek ortamda kontrol edilsin. Uygulama logu DB parolası göstermesin.
- [ ] **Y13 — P1:** Supabase Data API kullanılıyorsa anon/publishable anahtarla korumalı tablolara erişim dene; RLS/policy sonucu kaydet. Kullanılmıyorsa ilgili dış erişimi kapat. Anon anahtarın varlığını tek başına açık sayma; service-role anahtarı istemcide bulunmamalı.

## 4. Ağ, tarayıcı ve yetkilendirme

**Sorumlu:** Güvenlik sorumlusu + geliştirici.

- [ ] **Y14 — P0:** DNS, sertifika, HTTPS yönlendirmesi ve canonical host'u doğrula. Proxy istemciden gelen sahte forwarded IP/host başlıklarını temizlesin; uygulama yalnız güvenilir proxy başlığını kullansın. Doğrudan origin erişimi aynı kontrolleri atlayamasın. Engellenmiş IP testi gerçek proxy üzerinden yapılmalı.
- [ ] **Y15 — P0:** Oturum cookie'lerinde Secure/HttpOnly/SameSite/path/domain davranışlarını incele. Cross-origin POST, Origin kontrolü/CSRF koruması, CORS, logout, şifre değişiminde oturum iptali ve reset token tekrar kullanımı için negatif test yap. GET isteği veri değiştirmemeli.
- [ ] **Y16 — P0:** İki normal kullanıcı + admin/moderatör + askıya alınmış/silinmiş kullanıcı matrisi kur. Başkasının ilanını/teklifini/revizyonunu/çalışmasını/export'unu okuma ve değiştirme denemelerini gerçek API'de yap. Admin arayüzünü gizlemek yeterli değil; her method sunucuda yetki kontrol etmeli. Ret durumunda DB'de yan etki olmadığını sorgula. Bu kontrol [OWASP yetkilendirme ilkelerini](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) esas alır.
- [ ] **Y17 — P0:** Kullanıcıya özel HTML/RSC/API/export cevaplarını iki ayrı oturumla CDN/proxy üzerinden test et. Bir kullanıcının içeriği diğerine cache'ten dönmemeli. Logout sonrası geri tuşu ve yeniden yükleme senaryosunu kontrol et; özel içerikte doğru cache politikası olsun.
- [ ] **Y18 — P1:** [next.config.ts](C:/Users/DEDE-/Desktop/operis/next.config.ts) CSP'sinde unsafe-eval ve unsafe-inline var. Yerel Next rehberine uygun nonce/hash politikasını production build'de dene; önce raporlama ile hydration, tema ve locale akışlarını doğrula. HTML/JSON-LD/link/avatar girdilerinde XSS ve tehlikeli URL denemeleri yap. HSTS includeSubDomains/preload kararı tüm alt alanların HTTPS hazırlığına göre verilsin; sırf header var diye tamamlandı denmesin.
- [ ] **Y19 — P1:** Body boyutu, alan uzunluğu, sayfalama üst sınırı, sorgu timeout'u ve pahalı endpoint kotalarını belirle. Upload/URL-fetch özelliği varsa MIME/boyut/SSRF kontrollerini ayrıca uygula; yoksa gerekçeli UYGULANMAZ kaydı düş. Büyük istek kontrollü reddedilmeli, süreç çökmemeli.

## 5. Veri, migration, yedek ve kurtarma

**Sorumlu:** DB sorumlusu + DevOps.

- [ ] **Y20 — P0:** Mevcut production'a benzeyen veri hacmi ve eski migration geçmişiyle staging yükseltmesini prova et. Migration tek süreçten çalışsın. Constraint/index işlemlerinin kilit süresini ölç; bütçe ihlali, mükerrer aktif export ve bozuk referansları önce raporla. Sorunlu satırları otomatik silerek migration geçirme.
- [ ] **Y21 — P0:** Yedek almayı ve yedeği tamamen ayrı DB'ye geri yüklemeyi fiilen dene. Satır sayıları, FK'ler, şifreli PII okuma ve temel login/ilan akışı doğrulansın. DB yedeği ile anahtar kurtarmasını birlikte prova et; anahtarsız şifreli backup yeterli değildir. Dump/restore yöntemini [PostgreSQL rehberiyle](https://www.postgresql.org/docs/current/backup-dump.html) eşleştir.
- [ ] **Y22 — P0:** Kabul edilen veri kaybı süresi RPO ve geri dönüş süresi RTO'yu ürün/operasyon sorumlusu sayısal belirlesin. Backup/PITR sıklığı ve restore ölçümü bu değerleri karşılasın. Saklama, şifreleme, erişim, farklı arıza bölgesindeki kopya ve başarısız backup alarmı tanımlansın.
- [ ] **Y23 — P0:** Rollback provasında uyumlu önceki uygulama artifact'ini başlat; yeni şema/ciphertext ile okuyabildiğini doğrula. Veri kaybı yaratacak ters migration otomatik çalışmasın. Eski anahtarlar ve tamamlanan checkpoint kanıtı korunmalı.
- [ ] **Y24 — P0:** Hesap silme/export/saklama işlerini oturumlar, teklif/çalışma bağlantıları, bildirimler ve yedekten geri yükleme açısından test et. Silinen hesabın tekrar erişimi engellensin; tutulması gereken kayıtlarla silinecek alanların kararı yazılı olsun. Bu madde hukuki süre belirlemez; onaylı veri saklama politikasının teknik uygulanmasını kontrol eder.
- [ ] **Y25 — P1:** Seed komutunun production'da demo hesap/ilan/parola üretmesini engelle. Başlangıç kategorileri/yasal metinler ve ilk admin hesabını ayrı kontrollü bootstrap ile kur; tekrar çalıştırmada çoğaltma olmasın.

## 6. E-posta, SMS, bildirim ve worker

**Sorumlu:** Backend + DevOps.

- [x] **Y26 — P0 (TAMAMLANDI - 14 Eylül 2026):** Resend e-posta sağlayıcısı (`EMAIL_PROVIDER=resend`) tam entegre edildi. Resend CLI (`resend-cli v2.20.1`) ve Resend MCP sunucusu kuruldu. `operis@outlook.com.tr` hesabına canlı test e-postası başarıyla gönderildi ve `delivered` durumu doğrulandı.
- [ ] **Y27 — P0 [BEKLEMEDE: ALAN ADI SATIN ALIMI VE RESEND DNS DOĞRULAMASI]:**
  - **Kullanıcı Bildirimi Bekleniyor:** Kullanıcı henüz resmi alan adını satın almadı; satın alındığında haber verecek.
  - **Yapılacaklar (Alan Adı Alınınca):**
    1. Resend paneline ([resend.com/domains](https://resend.com/domains)) yeni alan adı eklenecek.
    2. Alan adı DNS yönetiminden Resend'in verdiği **DKIM, SPF ve DMARC (TXT/CNAME/MX)** kayıtları girilecek ve Resend üzerinde doğrulanacak.
    3. Proje `.env` dosyasındaki `EMAIL_FROM=onboarding@resend.dev` adresi `EMAIL_FROM=noreply@<yeni-alan-adiniz>` olarak güncellenecek.
    4. `APP_URL` ve `AUTH_URL` değerleri `https://<yeni-alan-adiniz>` olarak ayarlanacak.
    5. Kayıt doğrulama, parola sıfırlama ve teklif bildirimleri gerçek alan adı üzerinden test edilecek.
- [ ] **Y28 — P1:** Sağlayıcı 429/5xx/timeout ve tekrar teslimat senaryolarında idempotency/backoff/DEAD kuyruğunu sına. SMS/e-posta kota ve harcama alarmı koy. Aynı outbox işi yeniden işlendiğinde sağlayıcıya mükerrer gönderim davranışını kanıtla.
- [ ] **Y29 — P0:** [Worker systemd servisini](C:/Users/DEDE-/Desktop/operis/deploy/operis-worker.service) temiz sunucuda `operis` kullanıcısıyla başlat ve reboot sonrası dene. /run/operis oluşturma/izin işlemleri unprivileged ExecStartPre ve ProtectSystem=strict altında doğrulanmalı; gerekiyorsa RuntimeDirectory mekanizması kullan. Heartbeat ve checkpoint dizinleri servis sandbox'ına uygun olsun.
- [ ] **Y30 — P0:** Observer web/worker'dan bağımsız çalışsın. Heartbeat dosyasını aynı görünür yerde okuyabilsin; PrivateTmp etkisi ve servis kullanıcısı izinleri denetlensin. Worker'ı öldür, DB'yi kes, iş döngüsünü tak, alarmı gerçek hedefe teslim et ve iyileşme alarmını doğrula.
- [ ] **Y31 — P1:** Deploy/SIGTERM sırasında devam eden işin davranışını prova et. Süreç ya kontrollü tamamlasın ya lease süresi sonrası başka işçi güvenli devralsın. Çift bildirim, yarım READY export veya kayıp iş olmasın. Graceful shutdown zamanları platformla uyumlu olsun.

## 7. Ürünün uçtan uca kabulü

**Sorumlu:** QA + ürün sorumlusu.

- [ ] **Y32 — P0:** İki farklı hesapla kayıt→doğrulama→ilan yayınlama→teklif gönderme→kabul→çalışma oluşturma→tamamlama→değerlendirme akışını gerçek DB'de bitir. Her aşamada karşı tarafın ekranı/bildirimi ve kalıcı DB durumu eşleşsin.
- [ ] **Y33 — P0:** Aynı ilana eşzamanlı iki kabul, çift tıklama/tekrar POST, teklif geri çekme ile kabul yarışı, ilan süre dolumu/yeniden aktivasyonu ve bloklama senaryolarını çalıştır. İzin verilmeyen durum geçişi sunucuda reddedilsin; yalnız UI kilidine güvenme.
- [ ] **Y34 — P1:** Profil/radar/kategori takibi, arama/filtre/sıralama/sayfalama, teklif şablonları, revizyonlar ve bildirim okundu durumlarını refresh sonrası doğrula. Boş, çok kayıtlı ve silinmiş/askıya alınmış kullanıcı durumları kapsansın.
- [ ] **Y35 — P1:** Admin moderasyon, şikâyet, iletişim mesajı ve kullanıcı askıya alma akışlarını sınayıp destek sorumlusuna devret. Yetkili işlem audit kaydı kimin/ne zaman/neyi değiştirdiğini göstermeli; gizli veri içermemeli.
- [ ] **Y36 — P1:** TR/EN, açık/koyu tema, mobil/masaüstü, klavye ve ekran okuyucu temel akışlarını dene. Modal focus, form etiketi, hata mesajı, toast duyurusu, kontrast ve 200% zoom kontrol edilsin. Chromium'a ek olarak Safari/WebKit ve Firefox'ta giriş/teklif/export smoke testi yap.
- [ ] **Y37 — P1:** Ağ yavaşlığı/kesilmesi, geri-ileri gezinme, refresh, çoklu sekme ve session süresi dolumunda sonsuz spinner veya sessiz başarısızlık olmasın. UTC kayıtlarının Europe/Istanbul ve farklı istemci saat dilimindeki gösterimleri tutarlı olsun.

## 8. Kapasite, performans ve maliyet

**Sorumlu:** Backend + DevOps + ürün sorumlusu.

- [ ] **Y38 — P1:** Beklenen eşzamanlı kullanıcı/RPS, ilan-teklif hacmi, export boyutu ve büyüme varsayımını yaz. Onaylı tepe yükte 30 dakika, 2 kat yükte 10 dakika staging testi yap; gerçek sağlayıcılara yük gönderme. Kabul hedeflerini testten önce belirle; başlangıç önerisi ana API p95<1 saniye, 5xx<%1, sıfır veri bütünlüğü ihlali. Bunlar ölçülmüş sonuç değil, ürünün onaylayacağı hedeflerdir.
- [ ] **Y39 — P1:** DB connection toplamını web+worker+observer+deploy eşzamanlılığıyla hesapla. Yavaş sorgu/EXPLAIN, indeks, lock wait, queue age ve memory izle. Export ve fanout aynı anda çalışırken web yanıtları belirlenen hedefte kalmalı; belleğin sürekli büyümemesi doğrulanmalı.
- [ ] **Y40 — P1:** CPU/RAM/disk/backup/egress/e-posta/SMS günlük ve aylık maliyet sınırları belirle. Kotaya yaklaşma alarmı, log rotasyonu ve disk dolma senaryosu olsun. Otomatik ölçekleme maliyet sınırını aşmamalı.

## 9. Alan adı, içerik, gizlilik ve destek

**Sorumlu:** Ürün + içerik + ilgili hukuk/gizlilik sorumlusu.

- [ ] **Y41 — P1:** Robots/sitemap/canonical/OG/hreflang adresleri gerçek domain'i kullansın. Robots ve sitemap NEXT_PUBLIC_APP_URL, env şeması APP_URL kullanıyor; build/runtime tutarlılığını denetle. Sitemap yalnız yayınlanabilir içerik içersin; newListing ve özel/login gerektiren sayfaların dahil edilmesini gözden geçir. Robots erişim kontrolü değildir.
- [ ] **Y42 — P1:** Staging arama motorlarına ve izinsiz kullanıcılara kapalı olsun; production yanlışlıkla global noindex taşımasın. TR slug yönlendirmeleri query parametrelerini korusun, döngü oluşmasın. 404/500 sayfaları, favicon, linkler ve paylaşım görselleri çalışsın.
- [ ] **Y43 — P0:** Gerçek işletmeci/iletişim bilgileri, kullanım koşulları, gizlilik, çerez ve gerekiyorsa rıza metinlerini yetkili incelemeye sun. [Env şemasındaki](C:/Users/DEDE-/Desktop/operis/src/config/env.ts) LEGAL_*_APPROVED bayrakları incelemenin yerine geçmez; yalnız gerçek onaydan sonra açılır. Uygulanabilir yükümlülük ve süreler uzman tarafından belirlenir; bu liste hukuki uygunluk onayı değildir.
- [ ] **Y44 — P1:** Çerez tercihinin gerçek script/ağ davranışını değiştirdiğini tarayıcıda doğrula. Reddedilen isteğe bağlı izleme başlamasın; sonradan tercih değişikliği uygulanabilsin. Veri/alt işleyen envanteri ile gizlilik metni kullanılan gerçek sağlayıcıları yansıtsın.
- [ ] **Y45 — P1:** Yardım/iletişim/gizlilik adreslerine test talebi gönder ve yanıt sürecini prova et. Hesap kurtarma, taciz/spam, veri talebi ve güvenlik bildirimi için sorumlu ve hedef yanıt süresi yaz. Canlı kullanıcı verisi destek loglarına gelişigüzel kopyalanmasın.

## 10. Yayın günü ve ilk 24 saat

**Sorumlu:** Yayın sorumlusu + nöbetçi teknik kişi.

- [ ] **Y46 — P0:** Yayın öncesi karar kaydını tamamla: commit/artifact, açık P0=0, P1 istisnaları, backup kimliği, restore kanıtı, migration süresi, rollback artifact'i, onaylayan kişi ve nöbetçi iletişimi. Bu belgenin hazırlanması yayın yetkisi vermez.
- [ ] **Y47 — P0:** Dağıtım sırası: son backup doğrulama→gerekli worker durdurma/drain→uyumlu şema genişletme→uyumlu web/worker→readiness→sınırlı trafik→smoke→genel trafik. Migration bir kez çalışsın; web instance başına otomatik yarışmasın. Ayrıntılı sıra mevcut çözüm planıyla uyumlu olmalı.
- [ ] **Y48 — P0:** Canlı smoke: ana sayfa/TR-EN, giriş, izinli test hesabıyla ilan/teklif, bildirim, export ve admin erişim reddi. Test verisi açıkça etiketlensin; kontrollü temizlensin. Gerçek kullanıcılara toplu bildirim tetikleme.
- [ ] **Y49 — P0:** Geri dönüş tetiklerini önceden kaydet: herhangi bir kullanıcılar arası veri sızıntısı/veri bozulması anında trafik kısıtlama; ana akış smoke başarısızlığı genel yayını durdurma; 5 dakika boyunca onaylı 5xx/latency/queue eşiği aşılırsa nöbetçi müdahalesi. Rollback yeni ciphertext'i okuyamıyorsa eski kodu körlemesine dağıtmak yerine etkilenen özelliği kapatıp uyumlu düzeltme uygula.
- [ ] **Y50 — P1:** İlk 15 dakika, 1 saat ve 24 saatte hata oranı, latency, DB bağlantı/disk, outbox/export kuyruk yaşı, sağlayıcı teslimatı, backup ve kullanıcı destek taleplerini kontrol et. Alarm kanalı ve nöbetçi erişimi test edilmiş olsun. İlk 24 saat raporu yayın kaydına eklensin.

## Kanıt kaydı şablonu

Her Yxx maddesi için aşağıdaki satırı ayrı doldur:

| ID | Durum | Gerçek sorumlu | Commit / ortam | Yöntem ve tarih | Beklenen / gerçek sonuç | Kanıt | Kalan iş / son tarih |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Yxx | BEKLİYOR | Atanacak | Belirlenecek | Çalıştırılmadı | Henüz doğrulanmadı | Yok | Atanacak |

UYGULANMAZ durumu yalnız özelliğin gerçekten kapsam dışında olması ve gerekçesiyle kabul edilir. Başarısız test, erişilemeyen ortam veya atlanan adım UYGULANMAZ değildir.

## Kaynakların kullanım sınırı

Proje bulguları belirtilen yerel dosyaların bu tarihteki incelemesine dayanır; bütün maddeler mevcut açık iddiası değildir, bir kısmı yayın öncesi doğrulama görevidir. Hosting/streaming kontrolünde [Next.js self-hosting rehberi](https://nextjs.org/docs/app/guides/self-hosting), yetkilendirmede yukarıdaki OWASP kaynağı, kurtarmada PostgreSQL rehberi kullanılmıştır. Kodlama sırasında projenin AGENTS.md talimatı gereği kurulu Next sürümünün yerel dokümanı önceliklidir. Bağımlılık destek/açık durumu, sağlayıcı ayarları ve hukuki değerlendirme yayın tarihinde yeniden kontrol edilmelidir.

## 13 Eylül 2026 — Yeniden denetim, sürüm 22

Sürüm 22 denetiminde önceki düzeltmeler ve testler yeniden kontrol edilmiş; kod tabanında açık kritik sorun kalmamıştır. Bu tur uygulama kodu değiştirilmedi.

Dokümanda takip edilen maddeler kapsamında doğrulanmış açık kritik sorun veya yeniden açılması gereken önceki hata bulunmadı. Giderilen maddeler aktif açık listesinde tutulmuyor.

Bu tur gerçek sonuçlar: typecheck/lint başarılı; 5313 unit test, PostgreSQL 16 üzerinde 72 integration test, 124 rotalık yeni production build ve 16 production E2E başarılı. Yaklaşık 430 MiB export'ta worker peak RSS 329 MiB, artış 109 MiB; mevcut 400/120 MiB sınırlarıyla geçti. Geçici E2E DB cleanup'ı tamamlandı.

Y01–Y50 bekleyen operasyonel kontrolleri korunur. Özellikle restore, hedef sunucu worker/observer, gerçek sağlayıcı teslimatı ve rollback provası ayrı kanıt gerektirir. Bu kayıt genel hatasızlık garantisi veya yayın onayı değildir.
