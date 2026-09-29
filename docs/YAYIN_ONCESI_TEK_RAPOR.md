# Operis yayın öncesi tek rapor

**Durum tarihi:** 29 Eylül 2026  
**Kapsam:** Açık ürün sorunları, dış ortam doğrulamaları, yayın kapıları, canlıya geçiş ve yayın sonrası kontroller.  
**Kural:** Bu dosya yayın hazırlığı için tek görev ve durum kaynağıdır. Tamamlanan maddeler dosyadan silinir; sonuçları tekrar eden ayrı rapor oluşturulmaz.

## Mevcut karar

**Yayın kararı: HAYIR.** Yerel kod doğrulamaları güçlü olsa da canlı migration, gerçek sağlayıcı, edge/origin güvenliği, yedek geri yükleme, worker/observer kurulumu ve hukuki onay kanıtları bulunmuyor. Aşağıdaki P0 maddeleri tamamlanmadan üretim trafiği açılmamalıdır.

### Doğrulanmış yerel taban

- Node `24.19.0` ve pnpm `10.5.2` ile frozen kurulum; TypeScript, ESLint, Prettier, secrets, i18n ve emoji denetimleri başarılıdır.
- Birim testlerinde 141 dosya ve 6.256 test; erişilebilirlik paketinde 10/10; SEO paketinde 21/21 test başarılıdır.
- Yalıtılmış PostgreSQL 17 üzerinde migration ve şema denetimi başarılıdır: Drizzle modeli, migration hash'leri ve katalog 51 tablo/580 kolonla eşleşmiştir.
- Yerel PostgreSQL custom-format yedek/geri yükleme smoke testi ayrı veritabanında 51 tablo ve 42 migration kaydıyla başarılıdır; bu test üretim verisi, RPO veya PITR kanıtı değildir.
- Tam entegrasyon koşusu tek ve kesintisiz çalışmada 20 dosya ve 124/124 testle başarılıdır. Test dosyaları, süreç genelindeki DB bağlayıcısı ve PII advisory lock nedeniyle seri çalışacak şekilde sabitlenmiştir.
- Güvenli production build ve aynı koşudaki masaüstü/mobil Playwright senaryoları 24/24 başarılıdır. E2E sağlayıcı çağrıları yerel stub'lara yönlendirilmiştir.
- Üretim bağımlılıklarıyla ayrı frozen kurulumda `tsx 4.23.13` ve worker giriş noktası çalışmıştır. `tsx` artık runtime bağımlılığıdır.
- Headless Chromium PDF denetimi 35.746 bayt vektör PDF üretmiştir. i18n denetiminde TR/EN kataloglarında 220 anahtar eşleşmiştir.
- `pnpm audit --prod --json` 29 Eylül 2026 tarihinde 578 üretim bağımlılığı için sıfır bilinen açık bildirdi. Üretim lisans envanterinde 445 paket girdisi taranmıştır.
- Canlı mevcut sürümde HTTPS ve sertifika doğrulaması başarılıdır; `www` ana domaine yönlenir, `robots.txt` ve `sitemap.xml` 200 döner, sitemap'teki 262 URL'nin tamamı 200'dür. Ana sayfada canonical, TR/EN/x-default hreflang vardır ve global `noindex` yoktur.
- Yapılandırma şablonu ve production guard'ları HTTPS origin eşitliğini, demo/test değişkenlerinin kapalı olmasını ve gerekli secret/hukuk alanlarını fail-closed doğrular.
- Kodda filtreli liste noindex/canonical politikası, auth ve dashboard noindex kuralları, sitemap kapsamı, özel sayfalardan JSON-LD temizliği, saatlik JobPosting ücreti, dinamik ilan OpenGraph görseli ve ilan yaşam döngüsü IndexNow çağrıları uygulanmıştır. SEO paketi CI kapısına eklenmiştir.
- Uzak `.env` veritabanında `0039`–`0041` başarıyla uygulanmıştır: `clerk_revocation_jobs`, `notification_stream_counters`, `signature_storage_jobs`, `notifications.stream_sequence` ve `users.sessions_invalid_before` canlı veritabanında oluşturulmuş, Drizzle şeması ile canlı PostgreSQL 51 tablo ve 580 kolonla %100 eşleşmiştir.
- Bu doğrulamalar üretim altyapısını, gerçek sağlayıcı teslimatını veya canlı trafik davranışını kanıtlamaz.

## P0 — Yayını engelleyen işler

### 1. Sürüm ve artefaktı sabitle

- [ ] Yayın commit'i, artefakt kimliği, hedef ortam, sorumlu kişi ve değişiklik kapsamını kaydet.
- [ ] Temiz checkout'ta Node `24.19.0` ve pnpm `10.5.2` ile `pnpm install --frozen-lockfile` çalıştır.
- [ ] Aynı artefakta lint, typecheck, format, secrets, şema, birim, entegrasyon, a11y, build ve production E2E kapılarını tek kesintisiz süreçte geçir.
- [ ] Resmî SBOM'u üret; lisans envanterini politika sahibiyle onayla ve dependency audit sonucuyla birlikte sürüm kaydına ekle.

### 2. Üretim ortamı ve gizli değerler

- [ ] `APP_URL`, `AUTH_URL` ve `NEXT_PUBLIC_APP_URL` değerlerini tek HTTPS origin'e sabitle; preview/development adresi kalmadığını doğrula.
- [ ] `NODE_ENV=production` kullan; test bypass, demo/quick-login ve `VITEST` değişkenlerinin bulunmadığını doğrula.
- [ ] `AUTH_SECRET`, PII encryption keyring/version ve `PII_HMAC_KEY` değerlerini secret manager üzerinden sağla; rotasyon ve geri dönüş prosedürünü prova et.
- [ ] Runtime veritabanı rolünü en az yetkili yap; migration rolünü ayır; TLS, havuz boyutu ve statement timeout değerlerini yük testine göre sabitle.
- [ ] Clerk, R2, Turnstile, Resend, SMS, Sentry/izleme ve proxy güven değişkenlerinin build-time/runtime kapsamını doğrula.
- [ ] Turnstile doğrulamasının gerçek sağlayıcı URL'sine gittiğini ve fail-closed davrandığını kanıtla.

### 3. Migration, veri güvenliği ve geri dönüş

- [ ] Üretim benzeri veri kopyasında `0038`–`0041` migration'larını sırayla uygula; süre, kilit ve backfill etkisini kaydet.
- [ ] Migration'ları tek migrator ile çalıştır; web ve worker uyumluluk sırasını doğrula.
- [ ] Yayın öncesi şifreli yedek al ve kimliğini kaydet. Ayrı veritabanına gerçek restore yap; tablo/satır/FK sayıları, şifreli PII okuma ve oturum açmayı doğrula.
- [ ] RPO/RTO, PITR, saklama süresi, off-site kopya ve backup failure alarmını onayla.
- [ ] Önceki artefakta yeni şema ve yeni ciphertext ile geri dönüş provası yap; migration geri alma yerine ileri düzeltme gerektiren sınırları yazılı hale getir.
- [ ] Üretimde demo/seed hesabı ve örnek gizli veri bulunmadığını doğrula.

### 4. Gerçek sağlayıcı ve çok örnekli dayanıklılık

- [ ] **Clerk / R02:** İki cihazda oturum aç; cihaz A'dan “diğer oturumları kapat”; cihaz B'nin ikinci web örneğine yönlenen isteğinin de reddedildiğini ve restart sonrası reddin sürdüğünü kanıtla.
- [ ] **R2 / R08:** Gerçek bucket'ta sözleşme imzala; DB key/version ile objeyi eşleştir; yeniden imzalama ve reconciler sonrası yalnız aktif prefix'in erişilebilir olduğunu, önceki prefix'in temizlendiğini kanıtla.
- [ ] **Edge / R13:** CDN üzerinden imzalı güven zincirini doğrula; doğrudan origin ve sahte `x-forwarded-for`/`x-real-ip` isteklerini reddet; gerçek istemci IP'si ve hız sınırının iki instance'ta tutarlı olduğunu göster.
- [ ] Resend domain doğrulaması ile DKIM/SPF/DMARC kayıtlarını tamamla; gerçek e-posta ve SMS teslimatını, timeout/429/5xx tekrarlarını, idempotency'yi, dead-letter ve maliyet alarmını test et.
- [ ] R2 CORS, object visibility, content type/boyut, presigned URL süresi ve yetkisiz erişim negatif testlerini gerçek ortamda geçir.

### 5. Worker, observer ve alarm zinciri

- [ ] Web, worker ve bağımsız observer süreçlerini hedef platformda ayrı ölçeklenen servisler olarak kur; reboot ve rolling deploy sonrasında otomatik başladıklarını kanıtla.
- [ ] Worker artefaktının outbox, bakım, Clerk iptal ve R2 imza güvenilirlik işlerini gerçekten çalıştırdığını doğrula.
- [ ] Worker'ı öldürerek heartbeat alarmını; DB erişimini keserek maintenance/reliability alarmını tetikle; alarmın uygulamadan bağımsız kanaldan nöbetçiye ulaştığını kanıtla.
- [ ] SIGTERM, lease devri ve iki worker eşzamanlı çalışırken yinelenen teslimat üretmeme davranışını test et.
- [ ] Dead-letter, backlog, gecikmiş güvenilirlik işi, disk, log rotasyonu, bellek/CPU ve sağlayıcı hata oranı alarmlarını aç.

### 6. Edge ve güvenlik kabulü

- [ ] DNS, sertifika, HTTPS zorlaması, canonical host ve www yönlendirmesini doğrula; origin'i yalnız güvenilir proxy/CDN kaynaklarına kapat.
- [ ] Cookie, CSRF, CORS, logout, password reset ve session revocation negatif senaryolarını production benzeri ortamda çalıştır.
- [ ] İki normal kullanıcı, admin ve suspended hesap ile IDOR/rol/katılımcı erişim testlerini geçir; kullanıcı A'nın kullanıcı B verisini okuyamadığını kanıtla.
- [ ] Özel cevaplarda CDN/browser cache izolasyonunu ve `no-store` davranışını canlı header'larla doğrula.
- [ ] CSP'nin production çıktısında beklenen nonce/politikayı ürettiğini ve istemci hatası oluşturmadığını doğrula.
- [ ] İstek gövdesi, upload, SSRF, rate limit ve provider callback imza sınırlarını negatif testlerle doğrula.
- [ ] Repository geçmişi ve yayın artefaktında secret taraması yap; bulunan gerçek anahtarları döndür.

### 7. Uçtan uca ürün kabulü

- [ ] İki gerçek hesapla kayıt, e-posta/telefon doğrulama, profil, ilan, teklif, sözleşme, imza, iş teslimi, kabul/itiraz, bildirim ve hesap kapatma yolculuğunu tamamla.
- [ ] Ücretsiz kayıt ve ilan yayını; aynı hesabın ilan ve teklif verebilmesi; Following/All akışları; kategori takip gizliliği; yedi günlük sona erme, yeniden etkinleştirme ve ilk yayın tarihinin korunması davranışlarını kabul testinde doğrula.
- [ ] Teklif gizliliği, reddedilen teklifin yeniden gönderilmesi, yinelenen bekleyen teklifin engellenmesi, eşzamanlılıkta tek kabul, özel iletişim devri, karşılıklı tamamlama ve yalnız tamamlanan işin kamuya açılması kurallarını doğrula.
- [ ] Üründe yorum, puanlama, sohbet, ödeme/escrow ve kullanıcı dosya yükleme akışlarının açılmadığını; TCKN, cinsiyet ve doğum yeri tutulmadığını; e-posta/telefonun özel kaldığını doğrula.
- [ ] Aynı teklif/imza/teslim üzerinde eşzamanlı istek yarışlarını ve çok sekmeli yenileme davranışını test et.
- [ ] Admin moderasyon, askıya alma ve denetim izi senaryolarını doğrula.
- [ ] TR/EN, light/dark/black, 320 px ve geniş ekran, klavye, screen reader, reduced motion, Firefox ve WebKit kabulünü tamamla.
- [ ] Ham i18n anahtarı, eksik yerelleştirilmiş e-posta, yanlış tarih/para biçimi, emoji veya raster ikon olmadığını; hukuki kabullerin sürümlendiğini doğrula.
- [ ] Ağ kesintisi, timeout, sayfa yenileme, session expiry ve saat dilimi sınırlarını doğrula.
- [ ] Dağıtılmış ortamda PDF smoke testini `DEPLOYMENT_URL` ile çalıştır; yetkili örnek sözleşme için PDF üretme/indirme ve font/runtime sağlığını kanıtla.

### 8. Hukuk, gizlilik ve operasyon sahipliği

- [ ] Platform işletmecisi unvanı, adresi, vergi/KEP ve destek iletişimlerini kesinleştir; uygulama metinleriyle eşleştir.
- [ ] Kullanım koşulları, gizlilik/KVKK, çerez, açık rıza, eşleştirme sorumluluk reddi ve sözleşme şablonlarını yetkili hukuk danışmanına onaylat.
- [ ] KVKK veri envanteri, işleme amacı/hukuki sebep, saklama-imha takvimi, veri işleyen listesi ve yurt dışı aktarım mekanizmasını onayla.
- [ ] ETBİS ve platform sınıflandırması gerekliliklerini hukuk/mali müşavir ile karara bağla.
- [ ] Hesap silme ve veri dışa aktarma davranışını onaylı saklama politikasıyla eşleştir.
- [ ] Destek, güvenlik olayı, abuse, veri sahibi başvurusu ve nöbetçi sahiplerini/SLA'larını kaydet.

## P1 — Trafik açılmadan önce tamamlanacak arama ve performans işleri

### 9. Search Console ve canlı keşfedilebilirlik

- [ ] Google Search Console domain mülkünü ve Bing Webmaster Tools'u doğrula; DNS değişikliği öncesi TTL ve geri dönüş planını kaydet.
- [ ] Bu çalışma ağacından üretilecek yeni artefakt deploy edildikten sonra canlı `robots.txt`, `sitemap.xml`, canonical, hreflang/x-default, global noindex yokluğu, sitemap kapsamı ve tüm sitemap URL'lerinin 200 olduğunu yeniden doğrula.
- [ ] JobPosting ve Breadcrumb yapılandırılmış verilerini Google Rich Results canlı testinde doğrula.
- [ ] Gerçek `INDEXNOW_KEY` değerini secret manager üzerinden sağla; yayınlama, güncelleme, sona erme, yeniden etkinleştirme ve silme olaylarının API yanıtlarını gözlemle.
- [ ] Sitemap'i GSC ve Bing'e gönder; ana sayfa, ilan listesi, bir kategori, aktif ilan ve profil URL'si için canlı URL denetimi yap.
- [ ] Cloudflare/WAF'ın doğrulanmış Googlebot, Bingbot ve OAI-SearchBot isteklerini engellemediğini loglardan kanıtla.

### 10. Performans ve maliyet

- [ ] Temsilî üretim verisiyle en az 30 dakika beklenen tepe ve 10 dakika 2× tepe yük testi yap; kabul eşiklerini yayın sahibiyle onayla. Başlangıç hedefi p95 API < 1 sn ve 5xx < %1'dir.
- [ ] DB havuzu, yavaş sorgu, lock, kuyruk gecikmesi, worker kapasitesi, bellek ve CPU sonuçlarını kaydet; darboğazları gider.
- [ ] Sağlayıcı kotaları, bant genişliği, R2 saklama, e-posta/SMS, log ve gözlem maliyeti için bütçe alarmı tanımla.

## Go-live yürütme sırası

- [ ] P0 açık sayısını `0` yap; kabul edilen P1 istisnalarını sahibi, bitiş tarihi ve riskiyle kaydet.
- [ ] Son karar kaydına commit/artefakt, backup kimliği, restore kanıtı, migration süresi, rollback artefaktı, nöbetçi ve onaylayanları ekle.
- [ ] Sıra: yedek al → yazma trafiğini durdur → `0038`–`0041` migration'larını çalıştır → worker/observer → web → readiness → sınırlı trafik → smoke → tam trafik.
- [ ] Smoke: ana sayfa, auth, ilan arama/detay, teklif, sözleşme/PDF, imza, bildirim, admin, gerçek e-posta/SMS ve worker heartbeat.
- [ ] Geri dönüş eşiklerini önceden belirle: 5xx, auth hatası, migration/veri bütünlüğü, kuyruk gecikmesi, provider hata oranı ve güvenlik ihlali.
- [ ] İlk 15 dakika ve 1 saatte hata/latency/DB/queue/provider metriklerini izle; 24 saat sonunda yayın kaydını kapat.

## Yayın sonrası zorunlu takip

- [ ] **24 saat:** 4xx/5xx, auth, worker, dead-letter, sağlayıcı teslimatı, robots/sitemap erişimi ve bot loglarını incele.
- [ ] **72 saat:** GSC/Bing tarama ve IndexNow sonuçlarını; soft-404, canonical ve yapılandırılmış veri uyarılarını incele.
- [ ] **7 gün:** Restore alarmı, RPO/RTO, maliyet, kuyruk gecikmesi, güvenlik olayları, indeks kapsamı ve Core Web Vitals'ı gözden geçir.
- [ ] **30 gün:** Kategori indeks oranı, organik trafik, AI referral, ilan tazeliği, kapasite ve hukuki/operasyonel SLA sonuçlarını raporla.

## Güncelleme yöntemi

Bir madde gerçek ortam kanıtıyla tamamlandığında bu dosyadan silinir. Yeni görevler aynı öncelik başlığı altında eklenir. Test logları ve ekran görüntüleri bu dizinde kalıcılaştırılmaz; CI artefaktı veya imzalı sürüm kaydı olarak saklanır.
