# Yayına hazırlık — yeni kod incelemesi

Tarih: 28 Eylül 2026. İncelenen durum: mevcut çalışma ağacı; yalnızca commit edilmiş sürüm değil.

## Karar

**Mevcut haliyle genel kullanıma yayın önerilmiyor.** Testler başarılı olsa da kimlik doğrulama, sunucudan URL erişimi ve imzalı sözleşme bütünlüğünde yayın öncesinde çözülmesi gereken sorunlar var. Aşağıdaki liste bu incelemede tespit edilen bulgulardır; tüm olası hataların yokluğunu garanti etmez.

Toplam **14 bulgu**: **6 P1**, **7 P2**, **1 P3**. P1 yüksek öncelikli yayın engeli; P2 işlevsel/operasyonel sorun; P3 bakım ve bağımlılık riski. P0 düzeyinde doğrulanmış bir bulgu yok. Koşula bağlı bulgularda gerekli koşul ayrıca yazılmıştır.

**Kod değiştirilmedi.** Önceki raporlar değiştirilmedi. Bu dosya yeni rapordur.

## Kapsam ve doğrulama

- 948 kaynak, test, şema, veri ve yapılandırma dosyası; toplam 310.313 satır envantere alındı, içerikleri otomatik tarandı. Satır toplamına büyük JSON dosyaları ve kilit dosyası dahildir.
- Dağılım: `src` 671, `scripts` 31, `db` 64, `tests` 160, `.github` 2, `deploy` 2, kök yapılandırmaları 18.
- `node_modules`, `.next`, Git içeriği ve üretilmiş test çıktıları uygulama kaynak envanterine alınmadı. Bağımlılıklar ayrıca paket güvenlik taramasıyla incelendi.
- Open Code Review kuralları kullanıldı. Otomatik tarama tüm envantere uygulandı; manuel inceleme kimlik doğrulama, yetki, API girdileri, sözleşmeler, depolama, bildirimler, veri işlemleri ve dağıtım sınırlarına yoğunlaştı. Her satırın manuel incelendiği iddia edilmiyor.
- Aşağıdaki komutlar bu incelemede yeniden çalıştırıldı:

| Kontrol | Güncel sonuç |
| --- | --- |
| `pnpm exec tsc --noEmit --incremental false` | Başarılı |
| `pnpm test:unit` | 134 dosya, 6.176 test başarılı |
| `pnpm lint` | Başarılı |
| `pnpm format:check` | Başarılı |
| `pnpm audit:secrets` | Başarılı; tarayıcı kapsamında gizli anahtar bulunmadı |
| `pnpm audit:i18n` | TR/EN 220 anahtar eşleşiyor |
| `pnpm audit:emoji` | Başarılı |
| `pnpm audit --prod --json` | 513 bağımlılıkta 2 moderate uyarı; high/critical yok |
| Gerçek SSRF yardımcı fonksiyonuna yerel deney | DNS kontrolünden sonra loopback erişimi doğrulandı |

Bu incelemede production build, gerçek PostgreSQL entegrasyon testleri ve tarayıcı E2E testleri yeniden çalıştırılmadı. Önceki çalışmanın başarılı sonuçları yeni denetimin test sonucu olarak sayılmadı. Canlı sunucu, gerçek Clerk/R2/e-posta hesapları ve üretim veritabanı üzerinde işlem yapılmadı.

## Bulgular

### R01 — P1 / security: Clerk girişinde yerel 2FA atlanıyor

**Konum:** `src/modules/auth/session.ts:202`, `src/app/api/auth/clerk-sync/route.ts:196`.

Clerk ile eşleşmiş ACTIVE kullanıcı için yerel `twoFactorEnabled` değeri oturum vermeyi engellemiyor. Session fallback, `twoFactorVerified: false` olan normal SESSION döndürüyor. Clerk sync yolu da yerel TOTP doğrulaması yapmadan imzalı Operis oturumu üretiyor. Böylece yerel 2FA açık bir hesap, geçerli Clerk oturumuyla normal kullanıcı API'lerine erişebiliyor.

**Koşul/etki:** Clerk etkin ve hesap bağlantılı olmalı. Bu, admin korumasının tamamen aşılması anlamına gelmez: `src/modules/admin/auth-guard.ts:52` ayrı 2FA kontrolü yapıyor. Sorun normal kullanıcı oturumunun yerel 2FA politikasını uygulamaması.

**Çözüm:** Her iki giriş yolunu aynı 2FA challenge akışına bağla; mevcut sağlayıcı oturumu tek başına yerel TOTP kanıtı sayılmamalı. Challenge tamamlanmadan normal SESSION/cookie üretme.

**Kabul testi:** Yerel 2FA açık, Clerk oturumu geçerli kullanıcı; hem cookiesiz session fallback hem clerk-sync için TOTP tamamlanana kadar korunan kullanıcı API'sinden erişim alamamalı.

### R02 — P1 / security: Şifre değişimi/sıfırlama eski Clerk oturumunu güvenilir biçimde iptal etmiyor

**Konum:** `src/app/api/auth/change-password/route.ts:102`, `src/app/api/auth/reset-password/route.ts:120`, `src/modules/auth/session.ts:203`, `src/app/api/auth/clerk-sync/route.ts:196`.

Yerel `authVersion` artırılıyor ancak bu iki akış uzak Clerk oturumlarını iptal etmiyor. Clerk sync geçerli uzak oturumdan kullanıcının güncel `authVersion` değerini okuyup yeni yerel cookie üretebiliyor; eski oturum ile yeni güvenlik sürümü arasında kalıcı bir bağ yok. Session fallback içindeki JWT `iat`/`updatedAt` karşılaştırması, sync yolundaki bu yeniden oturum üretimini engellemiyor.

**Etki:** Şifre sıfırlamayla erişimi kesilmesi beklenen, hâlâ geçerli Clerk oturumu yerel erişimi yeniden kazanabilir. `logout-other-sessions` uzak iptal uyguluyor; bu bulgu o uç noktanın iptal yapmadığı iddiası değildir.

**Çözüm:** Güvenlik değişikliklerini sağlayıcı oturum iptaliyle tamamla; Clerk session ID'sini yerel güvenlik sürümü/iptal kaydıyla bağla. Sync sırasında da bu bağı denetle. Sağlayıcı hatalarını görünür ve tekrar denenebilir tut.

**Kabul testi:** İkinci cihazın Clerk oturumu korunurken birinci cihazdan parola sıfırla; ikinci cihaz sync ve fallback ile yeniden erişememeli.

### R03 — P1 / security: 2FA yeniden yapılandırması kullanıcı okuma hatasında açık kalıyor

**Konum:** `src/app/api/auth/2fa/route.ts:118`, `:133`, `:136`, `:157`.

Mevcut 2FA durumunu okuyan SELECT hatası yutuluyor. `currentUser` null kalınca mevcut şifre/TOTP şartı atlanıyor. Sonraki UPDATE başarılı olursa, geçerli oturuma sahip istemci kendi ürettiği yeni secret ve ona ait kodla mevcut 2FA'yı değiştirebilir.

Demo kullanıcı ID'si için veritabanından okunan gerçek durum da ortam kontrolü olmadan bellek verisiyle değiştiriliyor. Bu ek risk, aynı ID'nin üretim veritabanında bulunması koşuluna bağlıdır; böyle bir üretim hesabının varlığı doğrulanmadı.

**Çözüm:** SELECT başarısızsa veya kullanıcı bulunamazsa işlemi sonlandır; üretimde demo fallback kullanma. Eski güvenlik sürümünü UPDATE koşuluna ekleyerek eşzamanlı değişimleri de yakala.

**Önerilen asgari koruma diff'i** — uygulanmadı; tam çözüm ayrıca demo ve eşzamanlılık davranışını kapsamalı:

```diff
     } catch {
-      // Fallback
+      return NextResponse.json({ error: "Security state unavailable" }, { status: 503 });
     }

-    if (session.userId === DEFAULT_USER.id) {
+    if (process.env.NODE_ENV !== "production" && session.userId === DEFAULT_USER.id) {
       currentUser = {
```

Null kullanıcı için ayrıca 401/404 ile dönüş zorunlu. Kabul testi, SELECT hata verirken UPDATE'nin çalışabilir olduğu durumu simüle etmeli; hiçbir 2FA değişikliği olmamalı.

### R04 — P1 / security: DNS kontrolü gerçek bağlantıyı sabitlemediği için SSRF mümkün

**Konum:** `src/modules/engagements/delivery-inspector.ts:163`, `:213`, `:216`.

`validateUrlSsrfSafe` DNS kayıtlarını denetliyor, ardından `fetchSsrfSafe` özgün hostname'e fetch yapıyor. Fetch DNS'i yeniden çözebildiğinden kontrol edilen IP ile bağlanılan IP farklı olabiliyor. Redirect başına kontrol yapılması bu aralığı kapatmıyor.

**Doğrulama:** Gerçek `DeliveryInspectorService.fetchSsrfSafe` çağrısında DNS kontrolü genel IP döndürecek, bağlantı çözümlemesi yalnızca yerel test sunucusuna gidecek şekilde izole edildi. Sonuç: `{"status":200,"loopbackServerHits":1}`. Dış veya üretim sistemine saldırı yapılmadı; deney, kontrol ile bağlantı arasındaki ayrılığı kanıtlıyor.

**Etki:** Kullanıcı tarafından verilen ve DNS'i değişebilen bir hedef üzerinden sunucunun erişebildiği iç ağ uç noktalarına istek yapılabilir; gerçek etki sunucunun ağ erişimine bağlıdır.

**Çözüm:** Onaylanan IP'ye bağlantıyı sabitleyen resolver/dispatcher kullan; TLS SNI ve Host doğruluğunu koru. Her redirect için aynı işlemi uygula. Ağ çıkışında iç ağ/metadata hedeflerini ayrıca sınırla.

**Kabul testi:** Kontrol sonrası DNS değişimi, IPv4/IPv6 özel aralıklar ve redirect zincirleri gerçek bağlantı katmanıyla sınanmalı; loopback sunucusu sıfır istek almalı.

### R05 — P1 / bug: İkinci imza sonrası hata sözleşmeyi tamamlanamaz durumda bırakabiliyor

**Konum:** `src/modules/contracts/contract-signing-service.ts:458`, `:498`, `:520`, `:599`, `:650`.

İkinci imza önce `PARTIALLY_SIGNED` olarak bağımsız UPDATE ile kalıcılaştırılıyor. Belge derleme ve `FULLY_SIGNED` kaydı daha sonra ayrı adımlarda yapılıyor. Derleme veya son UPDATE hata verirse iki imza mevcutken derlenmiş belge/mühür eksik kalabilir. Aynı tarafın tekrar imzalaması önceki `signedAt` kontrolünde reddediliyor. İncelenen akışta bu ara durumu tamamlayan bir kurtarma işlemi yok.

**Çözüm:** İmza ve son belgeyi atomik kaydet veya kalıcı, idempotent bir FINALIZING işi tasarla. Aynı imza isteği güvenli biçimde finalizasyonu tekrar deneyebilmeli.

**Kabul testi:** İkinci imza kaydından sonra derleme ve son DB yazımına ayrı ayrı hata enjekte et; tekrar deneme aynı belgeyi tek kez tamamlamalı.

### R06 — P1 / bug: İmzalama ekranından indirilen PDF mühürlenen belgeden üretilmiyor

**Konum:** `src/components/contracts/unified-contract-signing-hub.tsx:522`, `src/app/api/work/[id]/contract/pdf/route.ts:27`, `src/app/api/work/[id]/contract/route.ts:350`.

İmzalama ekranındaki PDF düğmesi genel sözleşme PDF yolunu çağırıyor. Bu yol saklanmış `compiledMarkdown`/`compiledHtml` ve `sha256Seal` paketini okumak yerine sözleşmeyi güncel verilerden tekrar oluşturuyor. Generator çağrısında paket imzaları ve seçilen sözleşmeler de aktarılmıyor. Böylece imzalı paketin PDF çıktısı, kullanıcıların onayladığı sabit içerik ile eşleşmeyebilir ve imzaları içermeyebilir.

**Çözüm:** FULLY_SIGNED paket için PDF'yi saklanan değişmez belge içeriğinden üret; taslak üretimini ayrı tut. Dil/şablon parametreleri imzalanan metni sessizce değiştirmemeli.

**Kabul testi:** İmzalama sonrası kaynak ilan/profil verisini değiştir; indirilen belge aynı imzaları ve onaylanan metni korumalı. Taslak indirme ile imzalı belge indirme ayrımı görünür olmalı.

### R07 — P2 / bug: Mühürlenen sözleşmeye sahte taraf e-postası yazılıyor

**Konum:** `src/modules/contracts/contract-signing-service.ts:588`.

İkinci imzayı atan gerçek kullanıcının e-postası yerine role göre `client@operis.local` veya `contractor@operis.local` yazılıyor. Bu veri derlenen ve SHA-256 özeti alınan sözleşmeye giriyor.

**Çözüm:** İki tarafın kimliğini yetkili veritabanı kayıtlarından ayrı ayrı al ve imzalanan sürüme kaydet. Eksik zorunlu kimlik bilgisi varsa placeholder ile tamamlamak yerine finalizasyonu durdur.

**Kabul testi:** Her iki imzalama sırası için gerçek taraf e-postalarını doğrula; `.local` placeholder içeren sözleşme oluşmamalı.

### R08 — P2 / bug: Geçici imza dosyaları yetim kalabiliyor; temizlik başarısı yanlış kaydediliyor

**Konum:** `src/modules/contracts/contract-signing-service.ts:417`, `:458`, `:473`, `:646`, `:694`; `src/modules/storage/r2-client.ts:251`.

Dosya yüklemesi tekrarlı imza/sürüm kontrollerinden önce yapılıyor; sonraki retlerde telafi silmesi yok. Başarılı finalizasyonda `ephemeralCleanedAt` silmeden önce yazılıyor. Silme yardımcısı başarısızlıkları false/sayı olarak döndürüyor fakat çağıran sonuç sayısını kontrol etmiyor. Temizlendi işaretli kayıtların dosyaları R2'de kalabilir.

**Çözüm:** Ön doğrulamayı yüklemeden önce yap; kalıcı kayda bağlanamayan nesneler için telafi temizliği uygula. Temizlik işini tekrar denenebilir kaydet; başarı alanını yalnızca tüm hedefler silindiğinde yaz. Süre aşımına bağlı depolama yaşam döngüsü ekle.

**Kabul testi:** Sürüm çakışması, tekrar imza ve R2 DeleteObject hatalarında nesne sayısını ve temizlik durumunu doğrula.

### R09 — P2 / bug: R2 yapılandırılmadığında avatar fallback'i profil doğrulamasıyla çelişiyor

**Konum:** `src/modules/storage/r2-client.ts:150`, `src/app/api/upload/avatar/route.ts:107`, `src/modules/profiles/services/profile-data.service.ts:536`.

Yükleme yardımcısı R2 yoksa göreli `/uploads/avatars/...` URL'si, disk hatasında data URL döndürüyor. Profil servisi ise yalnızca geçerli harici HTTPS URL kabul ediyor. Bu yüzden dosya yazılmış olsa bile profil güncellemesi başarısız oluyor. Fallback üretimde de çalışabilir.

**Koşul:** R2 yapılandırılmamış olmalı. Doğru R2 yapılandırması olan ortamda bu özel hata tetiklenmez.

**Çözüm:** Üretimde depolama gereksinimini başlangıçta doğrula ve eksikte açık hata ver; geliştirme fallback'i için ayrı, güvenli ve doğrulayıcıyla tutarlı URL modeli kullan.

**Kabul testi:** R2 açık/kapalı ve disk yazılamaz durumları; başarılı yanıt ancak kaydedilen ve tekrar okunabilen avatar için dönmeli.

### R10 — P2 / bug: İletişim formundaki ek dosya gönderilmiyor

**Konum:** `src/components/contact/contact-form.tsx:404`, `src/app/api/contact/route.ts:51`, `:100`.

Formda seçilen dosyanın yalnızca adı ve boyutu JSON'a ekleniyor. Sunucu da bunları ileti metnine yazıyor; dosya baytları veya kalıcı dosya bağlantısı taşınmıyor. Kullanıcı ek seçebilmesine rağmen destek ekibine dosya ulaşmıyor.

**Çözüm:** Dosya boyutu/türü ve erişim kontrollü gerçek yükleme akışı kurup iletiye dosya referansını bağla; bu işlev sunulmayacaksa ek seçimini arayüzden kaldır.

**Kabul testi:** Bilinen içerikli dosya gönder; alıcı tarafında aynı dosyanın indirilebildiğini doğrula. Ad/boyut metnini görmek yeterli değildir.

### R11 — P2 / bug: Tekrarlanan bildirimler okunmamış sayısını artırıyor

**Konum:** `src/hooks/use-realtime-notifications.ts:54`, `src/app/api/notifications/stream/route.ts:68`, `:102`.

Bildirim listesi ID'ye göre tekilleştiriliyor fakat `setUnreadCount(prev + 1)`, ses/animasyon ve toast koşulsuz çalışıyor. SSE bağlantısı son bir dakikayı tekrar gönderiyor ve 45 saniyede kapanıyor; REST başlangıç yüklemesi ve sekmeler arası yayın da aynı kaydı yeniden ulaştırabilir. Okunmuş kayıtlar için de sayaç artabilir.

**Çözüm:** Liste, sayaç ve yan etkileri tek bir idempotent olay işlemesinde güncelle. Aynı ID'yi tekrar işleme; `readAt` durumunu dikkate al. React state updater içine yan etki koyma.

**Kabul testi:** Aynı ID'yi REST, SSE, reconnect ve BroadcastChannel üzerinden tekrar gönder; sayı yalnızca yeni okunmamış kayıt için bir kez değişmeli.

### R12 — P2 / bug: Çok süreçli ortamda gerçek zamanlı bildirimler kaçabiliyor

**Konum:** `src/modules/notifications/pubsub.ts:38`, `src/app/api/notifications/stream/route.ts:68`.

Pub/sub yalnızca süreç içi EventEmitter. Bildirimi üreten worker ile SSE bağlantısını tutan worker farklıysa canlı olay karşıya ulaşmıyor. Yeniden bağlantıda yalnızca son dakikanın ilk 10 kaydı sorgulanıyor; cursor/Last-Event-ID tabanlı tamamlama yok. Yoğun trafik veya daha uzun kopuşta bazı kayıtlar canlı arayüzde hiç görünmeyebilir. Veritabanındaki kayıtların silindiği iddia edilmiyor.

**Koşul:** Çok worker/çok instance veya bağlantı kesintisi ve toplu bildirim.

**Çözüm:** Paylaşılan olay taşıyıcısı ve kalıcı cursor üzerinden sayfalı telafi kullan. Tek süreç yayınlanacaksa bu kapasite sınırını açıkça doğrula.

**Kabul testi:** İki ayrı uygulama sürecinde üretici ve SSE alıcısını ayır; 10'dan fazla bildirim ve bir dakikadan uzun kopuş sonrası tüm kayıtlar tek kez görünmeli.

### R13 — P2 / security: İstemci IP başlıklarının güven sınırı dağıtıma bağlı

**Konum:** `src/lib/security/rate-limit.ts:324`.

IP seçimi `cf-connecting-ip`, ardından diğer yönlendirme başlıklarını doğrudan kabul ediyor. Uygulamaya doğrudan erişilebiliyorsa veya ön proxy bu başlıkları temizlemiyorsa istemci farklı IP bildirebilir. Bu durum IP bazlı limitleri ve güvenlik kayıtlarının doğruluğunu zayıflatır.

**Koşul:** Güvenilir edge'in başlıkları zorunlu olarak yeniden yazması ve origin erişimini sınırlandırması üretimde doğrulanmalı. Mevcut dağıtımda sömürülebilirlik doğrulanmadı; bunu her Cloudflare dağıtımında açık var şeklinde yorumlamayın.

**Çözüm:** Yalnızca seçili dağıtım sağlayıcısının doğrulanmış başlığını kabul et; origin'i güvenilir proxy ile sınırla ve gelen sahte başlıkları edge'de sil.

**Kabul testi:** Gerçek yayın zincirine sahte IP başlıkları gönder; rate-limit anahtarı istemcinin seçtiği değere dönüşmemeli.

### R14 — P3 / maintainability: next-intl için iki bağımlılık güvenlik uyarısı

**Konum:** `package.json`, `pnpm-lock.yaml`; yüklü sürüm `next-intl@3.26.5`.

Üretim bağımlılık denetimi iki moderate advisory döndürdü. Ancak paket eşleşmesi tek başına uygulamada sömürülebilirlik kanıtı değildir:

- [Open redirect advisory](https://github.com/advisories/GHSA-8f24-v5vv-gm5j): `localePrefix: 'as-needed'` koşuluyla açıklanıyor. Projede `src/proxy.ts:9` değeri `always`; belirtilen tetikleyici mevcut değil.
- [Precompile prototype pollution advisory](https://github.com/advisories/GHSA-4c35-wcg5-mm9h): deneysel mesaj ön derleme ve saldırgan kontrollü katalog girdilerine bağlı. Proje kaynaklarında bu ön derleme ayarı bulunmadı; saldırgan kontrollü çeviri kataloğu doğrulanmadı.

**Çözüm:** Her iki düzeltmeyi içeren uyumlu sürüme planlı yükseltme yap; major sürüm geçişini dil yönlendirme, SSR ve çeviri testleriyle doğrula. Denetim önerisi en az 4.9.2; doğrudan sürüm numarası değiştirmenin uyum garantisi yok.

**Kabul testi:** Üretim bağımlılık taraması temiz olmalı; TR/EN rotaları, özel yönlendirmeler ve mesaj yüklemesi regresyon testlerinden geçmeli.

## Yayın öncesi ayrıca doğrulanması gerekenler

Bunlar kanıtlanmış yeni kod hatası olarak bulgu sayısına eklenmedi:

1. Hedef ortamda temiz production build, PostgreSQL migration/şema uyumu, entegrasyon ve E2E paketi yeniden çalışmalı.
2. Gerçek Clerk ile 2FA, parola sıfırlama, cihaz/oturum iptali ve hesap bağlantısı uçtan uca sınanmalı.
3. Gerçek R2 erişimi, avatarların okunabilirliği, imza dosyalarının silinmesi ve depolama izinleri doğrulanmalı.
4. Gerçek e-posta/SMS sağlayıcısı, Turnstile, worker ve zamanlanmış işlerin teslimat/hata davranışı sınanmalı.
5. Gerçek yayın URL'sinde PDF indirme, CSP, cookie, proxy/IP başlıkları ve HTTPS davranışı doğrulanmalı.
6. Yedekten geri yükleme, hata izleme ve yayın geri alma süreci hedef ortamda kanıtlanmalı.

## Önerilen düzeltme sırası

Önce R01–R04 güvenlik sınırları; sonra R05–R07 sözleşme bütünlüğü. Ardından R08–R10 dosya işlevleri, R11–R12 bildirimler. R13 yayın altyapısı ile birlikte kapatılmalı; R14 uyumluluk testli bağımlılık yükseltmesiyle ele alınmalı.

R01–R06 çözülmeden ve ilgili kabul testleri eklenmeden genel kullanıma yayın önerilmez. R2/Clerk gibi özellikleri kapatmak yalnızca gerçekten kapatıldığı ve erişilemez olduğu kanıtlanan akışların riskini azaltır; diğer bulguları çözmez.

Öneriler bu raporda bırakıldı; kaynak dosyalara düzeltme uygulanmadı.
