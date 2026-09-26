# Operis kod denetim raporu

Tarih: 23 Eylül 2026. İncelenen sürüm: çalışma klasörünün mevcut hali; önceden var olan commit edilmemiş değişiklikler dahil. Kod, yapılandırma ve veritabanında değişiklik yapılmadı. Bu rapor depo dışında oluşturuldu.

## Sonuç

**36 bulgu: 1 P0 (kritik), 17 P1 (yüksek), 18 P2 (orta).** Öncelikli riskler oturumsuz hesap ele geçirme, hakediş/bakım işlemlerinde yetkisiz erişim, tek tarafın çift taraflı sözleşme oluşturabilmesi, imzalı kapsamın değiştirilmesi, kalıcı HTML enjeksiyonu ve veritabanı bağlantı hatasında süreç çökmesidir.

P0: acil müdahale gerektiren hesap/sistem güvenliği sorunu. P1: önemli güvenlik, veri bütünlüğü veya kullanılabilirlik kaybı. P2: belirli koşullarda iş akışı bozulması, yarış durumu veya yanlış sonuç.

## Kapsam ve yöntem

- src, db, scripts, tests ve i18n altında **819 TS/TSX/JS/SQL dosyası, 190.690 satır** envantere alındı; JS/TS dosyaları TypeScript ayrıştırıcısıyla tarandı. Bunların dağılımı: src 617, db 50, scripts 21, tests 130, i18n 1. Kök yapılandırmaları ve public betiği ayrıca envanter/kontrol kapsamındaydı.
- Tüm proje için TypeScript kontrolü ve ESLint çalıştırıldı. API girişleri, servis çağrı zincirleri, sorgular, yetki kontrolleri, durum geçişleri, üretim/test dalları, HTML üretimi, arayüz–API bağlantıları ve şema kısıtları risk odaklı ayrıntılı incelendi.
- AGENTS.md, yerel Next.js Route Handler kılavuzu ve open-code-review becerisinin OCR preview/rule çıktıları kullanıldı. İnceleme yalnız git diff ile sınırlandırılmadı.
- Bu kapsam **her satırın elle doğrulandığı veya bütün olası hataların kesin bulunduğu anlamına gelmez**. Otomatik genel tarama ile ayrıntılı çağrı zinciri incelemesi farklı kapsam katmanlarıdır. Rapor, bu incelemede kanıtı kurulabilen bulguların tamamını listeler; üretim verisi, ağ geçidi ayarları ve canlı şema ayrıca doğrulanmadı.

## Çalıştırılan doğrulamalar

| Kontrol | Sonuç |
|---|---|
| pnpm exec tsc --noEmit --incremental false | Başarılı, çıkış kodu 0 |
| pnpm exec eslint . --quiet | Başarılı, hata yok; uyarılar bu komutta gösterilmez |
| pnpm exec vitest run --config vitest.unit.config.ts --reporter=dot | 107 dosya, 5.964 test geçti |
| Sözleşme üreticisinde HTML nitelik enjeksiyonu | rawEventAttributeInHtml=true |
| Yalnız imza görselini değiştirerek mühür karşılaştırması | HTML değişti, markdown SHA-256 aynı kaldı |
| DB bağlantısı kurmadan havuz error olayı | Dinleyici sayısı 0; olay senkron olarak istisna fırlattı |

Entegrasyon/E2E, canlı veritabanı ve gerçek hesaplarda istismar çalıştırılmadı. Üretim build'i çalıştırılmadı; prebuild canlı veritabanı şema kontrolü içeriyor. Testlerin geçmesi rapordaki sorunları çürütmüyor: özellikle hakediş ve bakım testleri VITEST koşulunda farklı bellek içi yola giriyor. Clerk sync testindeki başarı senaryosu da body kimliği/e-postasıyla oturum oluşturmayı kabul ediyor. Bu yüzden 5.964 testin geçmesi üretim akışlarının güvenli olduğunu kanıtlamıyor.

## Bulgular

### 01. [P0] Clerk senkronizasyonuyla oturumsuz hesap ele geçirme

**Konum:** [src/app/api/auth/clerk-sync/route.ts:32](C:/Users/DEDE-/Desktop/operis/src/app/api/auth/clerk-sync/route.ts:32)

**Sorun ve etki:** Clerk anahtarları yapılandırılmışken auth().userId boş olsa da body.clerkUserId kabul ediliyor; email de body’den alınabiliyor. currentUser() null dönerken iki alanın dolu olması yeterli. syncClerkUser e-posta eşleşmesiyle mevcut kullanıcıyı bağladıktan sonra uç nokta o kullanıcının gerçek rolüyle fp_session imzalıyor. Hedef aktif bir yönetici ise yönetici oturumu da oluşabilir; parola ve 2FA doğrulanmıyor.

**Tetiklenme / kanıt:** Oturumsuz istek + mevcut kullanıcı e-postası + istemcinin belirlediği Clerk kimliği. Gerçek hesaplarda istismar denenmedi; tüm çağrı zinciri ve mevcut clerk-sync-route testi incelendi.

**Düzeltme yönü:** Clerk oturumunu zorunlu tut; kimliği ve doğrulanmış e-postayı yalnızca sunucuda doğrulanan aynı Clerk kullanıcısından al; body kimliği/e-postasıyla oturum oluşturma. E-posta üzerinden hesap birleştirmeye ayrıca doğrulama uygula.

### 02. [P1] Hakediş işlemlerinde nesne ve taraf yetkisi bulunmuyor

**Konum:** [src/modules/engagements/milestones/milestone-payout.service.ts:124](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/milestones/milestone-payout.service.ts:124)

**Sorun ve etki:** API giriş yapılmış olmasını kontrol ediyor; servis milestoneId ile kaydı bulup değiştiriyor. Kullanıcının işveren/yüklenici olması ve milestone.engagementId’nin URL’deki engagementId ile eşleşmesi kontrol edilmiyor. markPayment, revertPayment, confirmPayment, disputePayment ve sertifika okuma etkileniyor. MilestoneStatusService.updateMilestonePlan/updateDeliverable/acceptDeliverable da taraf yetkisini doğrulamıyor.

**Tetiklenme / kanıt:** İşle ilgisiz, giriş yapmış bir kullanıcı hakediş/iş UUID’sini biliyorsa ödeme/teslim durumunu değiştirebilir veya belge okuyabilir. UUID tahmin zorluğu erişim kontrolü değildir.

**Düzeltme yönü:** Her işlemde iş katılımcısını, işlem rolünü ve hakedişin işe aidiyetini aynı veritabanı işlemi içinde doğrula.

### 03. [P1] Bakım sözleşmelerinde okuma/yazma ve saat kaydı yetki açığı

**Konum:** [src/modules/engagements/retainer-service.ts:348](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/retainer-service.ts:348)

**Sorun ve etki:** activateRetainer ve cancelRetainer kullanıcı kimliğini _userId olarak alıp kullanmıyor. proposeRetainer dışarıdan bir kullanıcıyı clientUserId yapabiliyor. getRetainerDetails katılımcı olmasa da veriyi döndürüyor. logHours input.userId’yi kullanmıyor; log API’si URL’deki iş kimliğini de yok sayıyor.

**Tetiklenme / kanıt:** Giriş yapmış üçüncü kişi başka işe bakım teklifi açabilir, etkinleştirebilir/iptal edebilir ve retainerId üzerinden borca etki eden saat ekleyebilir.

**Düzeltme yönü:** Katılımcı ve rol kontrolünü servis düzeyinde zorunlu yap; retainerId ile engagementId bağını doğrula; teklif sahibinin kendi teklifini karşı taraf adına onaylamasını engelle.

### 04. [P1] Sözleşmenin iki tarafı aynı kullanıcı tarafından imzalanabiliyor

**Konum:** [src/modules/contracts/contract-signing-service.ts:319](C:/Users/DEDE-/Desktop/operis/src/modules/contracts/contract-signing-service.ts:319)

**Sorun ve etki:** İşe katılım kontrolü var; ancak CLIENT/CONTRACTOR rolü input.role’den belirleniyor. Kullanıcının engagement.ownerUserId veya freelancerUserId olmasıyla bu rol eşleştirilmiyor. API de rolü body’den geçiriyor. Bir taraf sırasıyla iki rolü kullanarak iki imza alanını doldurabilir.

**Tetiklenme / kanıt:** İşin meşru katılımcısı önce CLIENT, ardından CONTRACTOR rolüyle imza gönderir; iki signedAt dolduğunda FULLY_SIGNED üretilebilir.

**Düzeltme yönü:** İmza rolünü veritabanındaki taraf kimliğinden türet; istemcinin rol seçimini yetki kaynağı yapma; iki imzalayanın doğru ve farklı taraflar olduğunu doğrula.

### 05. [P1] İmza gönderimi mevcut imzanın kapsamını ve tamamlanmış sözleşmeyi değiştirebiliyor

**Konum:** [src/modules/contracts/contract-signing-service.ts:349](C:/Users/DEDE-/Desktop/operis/src/modules/contracts/contract-signing-service.ts:349)

**Sorun ve etki:** submitSignature içindeki selectedContracts doğrudan istemciden geliyor ve karşı tarafın mevcut imzası temizlenmeden kaydediliyor. updateSelectedContracts içindeki imza geçersizleştirme ve FULLY_SIGNED koruması burada uygulanmıyor. submitSignature tamamlanmış paketi de yeniden imzalamayı engellemiyor.

**Tetiklenme / kanıt:** A tarafı X kapsamını imzaladıktan sonra B, Y kapsamını submitSignature ile gönderir; A’nın eski imzası Y altında kullanılır. Aynı yol tamamlanmış paketi yeniden derleyebilir.

**Düzeltme yönü:** İmzayı sabit paket sürümü ve içerik hash’ine bağla; imza isteğinde kapsam değiştirmeyi yasakla; FULLY_SIGNED paketleri değiştirilemez yap.

### 06. [P1] Sözleşme sürüm kontrolü atomik değil

**Konum:** [src/modules/contracts/contract-signing-service.ts:342](C:/Users/DEDE-/Desktop/operis/src/modules/contracts/contract-signing-service.ts:342)

**Sorun ve etki:** expectedVersion yalnızca önceden okunan değerle JavaScript tarafında karşılaştırılıyor; UPDATE WHERE koşulu version içermiyor. updateSelectedContracts, imza yazımı ve son derleme ayrı işlemler. İki eşzamanlı istek aynı sürümü geçerek birbirinin değişikliğini ezebilir veya eski kapsamı derleyebilir.

**Tetiklenme / kanıt:** İmza ve kapsam güncellemesi ya da iki imza isteği aynı anda başlar. Her ikisi aynı currentVersion’ı okur ve güncelleme yapar.

**Düzeltme yönü:** UPDATE ... WHERE version = expectedVersion ve etkilenen satır kontrolü veya satır kilitli transaction kullan; kapsam, imzalar, derleme ve final durumu tek tutarlılık sınırında yönet.

### 07. [P1] Sözleşme veritabanı hataları başarılı imza gibi gösteriliyor

**Konum:** [src/modules/contracts/contract-signing-service.ts:384](C:/Users/DEDE-/Desktop/operis/src/modules/contracts/contract-signing-service.ts:384)

**Sorun ve etki:** Veritabanı okuma/yazma hataları üretimde de inMemoryPackages’a düşüyor. Final sözleşme yazımı başarısız olsa bile FULLY_SIGNED yanıtı ve bildirim üretilebiliyor. R2 imzaları final kalıcı yazımdan önce siliniyor. Başka süreç veya yeniden başlatma bu bellek durumunu göremez.

**Tetiklenme / kanıt:** Veritabanı kesintisi, unique çakışması veya final UPDATE hatası sırasında kullanıcı imzalama başarısı görür; kalıcı kayıt aynı sonucu taşımaz.

**Düzeltme yönü:** Bellek alternatifini yalnız testlerle sınırla; kalıcı kayıt hatasında başarısız dön; dosya temizliğini başarılı commit sonrasına taşı.

### 08. [P1] İmza alanından kalıcı HTML/JavaScript enjeksiyonu

**Konum:** [src/modules/contracts/generator.ts:714](C:/Users/DEDE-/Desktop/operis/src/modules/contracts/generator.ts:714)

**Sorun ve etki:** signatureDataUrl yalnız data: önekiyle kontrol ediliyor; renderSignatureBlock değeri HTML img src niteliğine kaçışsız yerleştiriyor. Tırnak ve olay niteliği eklenebiliyor. Derlenen HTML contract/package?format=html üzerinden text/html olarak sunuluyor; mevcut CSP script-src unsafe-inline içeriyor.

**Tetiklenme / kanıt:** Yerel, ağsız üretici kontrolünde imza girdisindeki onerror niteliğinin HTML çıktısına aynen girdiği doğrulandı: rawEventAttributeInHtml=true. Tarayıcıda veya gerçek kullanıcıya karşı istismar çalıştırılmadı.

**Düzeltme yönü:** İmzayı sınırlı boyutta, izinli raster MIME/base64 biçiminde doğrula ve yeniden kodla; bütün HTML niteliklerine uygun kaçış uygula; belge görüntülemesini izole et.

### 09. [P1] Teslimat denetleyicisinin SSRF koruması yönlendirmelerle aşılabiliyor

**Konum:** [src/modules/engagements/delivery-inspector.ts:206](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/delivery-inspector.ts:206)

**Sorun ve etki:** Başlangıç URL’si DNS/IP kontrolünden geçiriliyor, fakat fetch redirect: follow ile sonraki adresleri kontrolsüz izliyor. Repo ve commit kontrolü de yönlendirme izliyor. DNS kontrolündeki sonuç bağlantıya sabitlenmediğinden ikinci DNS çözümlemesiyle hedef değişimi de engellenmiyor.

**Tetiklenme / kanıt:** İzinli genel IP’deki bir URL özel ağa/loopback adresine yönlendirir. inspect API’si giriş kontrolü yapıyor ancak iş katılımını doğrulamıyor.

**Düzeltme yönü:** Yönlendirmeleri manual işle ve her adımı doğrula; bağlantıyı doğrulanmış IP’ye sabitle veya güvenli egress katmanı kullan; iş katılımını kontrol et.

### 10. [P1] PostgreSQL havuzunun hata olayı süreci düşürebiliyor

**Konum:** [src/lib/db/index.ts:41](C:/Users/DEDE-/Desktop/operis/src/lib/db/index.ts:41)

**Sorun ve etki:** Pool oluşturulurken error dinleyicisi eklenmiyor. Kurulu pg-pool, boşta bağlantı koptuğunda pool.emit('error', ...) çağırıyor. Bu olay sorgunun try/catch sınırının dışında oluşabilir ve dinleyicisiz EventEmitter hata fırlatır.

**Tetiklenme / kanıt:** Veritabanı yeniden başlaması/ağ kopması sırasında boşta bağlantının hata üretmesi. Ağsız kontrolde poolErrorListenerCount=0 ve unhandledPoolEventThrows=true doğrulandı.

**Düzeltme yönü:** Havuz oluşturulur oluşturulmaz error dinleyicisi ekle; hatayı kaydet ve sağlıksız bağlantıların temizlenmesini yönet. Süreç düzeyi davranışı kontrollü kesinti testiyle doğrula.

### 11. [P1] Hakediş okuma ve silme sorguları yanlış sütunu kullanıyor

**Konum:** [src/modules/engagements/milestones/milestone-status.service.ts:105](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/milestones/milestone-status.service.ts:105)

**Sorun ve etki:** getMilestones, engagementMilestones.engagementId yerine engagementMilestones.id = engagementId sorguluyor. updateMilestonePlan satır 396’da aynı hatayı yapıyor. Normal UUID’lerde mevcut plan bulunamıyor/silinemiyor; GET yeni plan ekliyor. Şemadaki engagementId+sequenceNumber indeksi unique değil.

**Tetiklenme / kanıt:** Gerçek veritabanında aynı işin hakediş ekranını tekrar açmak yeni satırlar üretir; yapılan ödeme/teslim işlemleri sonraki okumada görünmez. Plan düzenleme eski planın yanına yenisini ekler.

**Düzeltme yönü:** İki sorguda doğru yabancı anahtarı kullan; iş+sıra tekilliğini sağla; ilk oluşturma ve plan değiştirmeyi transaction ve eşzamanlılık kontrolüyle yap.

### 12. [P1] Hakediş ödeme durumları ve denetim geçmişi korunmuyor

**Konum:** [src/modules/engagements/milestones/milestone-payout.service.ts:583](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/milestones/milestone-payout.service.ts:583)

**Sorun ve etki:** Durum güncellemeleri yalnız id ile yapılıyor. CONFIRM_PAID için MARKED_PAID ön koşulu, REVERT için kesinleşmemiş ödeme şartı ve kapalı iş kontrolü yok. auditTrailJson ayrı SELECT sonrasında tümüyle yazılıyor; eşzamanlı olaylar birbirini silebilir.

**Tetiklenme / kanıt:** Henüz bildirilmemiş ödeme teyit edilebilir; kesinleşmiş ödeme tekrar UNPAID yapılabilir. Aynı anda iki işlemde denetim izinin yalnız biri kalabilir.

**Düzeltme yönü:** İzinli durum geçişlerini WHERE koşuluna ekle; iş durumunu doğrula; satır kilidi/atomik olay ekleme ve tekrar istek idempotency’si uygula.

### 13. [P1] Ödeme/IP devir belgelerinde gerçek taraf yerine sabit kimlik kullanılıyor

**Konum:** [src/modules/engagements/milestones/milestone-payout.service.ts:520](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/milestones/milestone-payout.service.ts:520)

**Sorun ve etki:** Üretim yolunda payerUserId ve assigneeUserId 'employer'; taraf isimleri/e-postaları örnek değerler. getSettlementCertificate ayrıca payeeUserId olarak belgeyi isteyen userId’yi kullanıyor. İşveren kendi belgesini istediğinde alacaklı kendisi olur. Banka/kanal da gerçek kayıt yerine varsayılanlarla yeniden üretiliyor.

**Tetiklenme / kanıt:** Teyit edilmiş bir ödeme belgesini farklı katılımcılar indirir; aynı ödeme için taraf içeriği değişir ve yanlış kimlikler gösterilir.

**Düzeltme yönü:** Tarafları engagement kaydından, transferi kalıcı denetim kaydından al; teyit anında değiştirilemez belge snapshot’ı sakla ve aynı belgeyi döndür.

### 14. [P1] Sözleşme mührü imza görselinin bütünlüğünü kapsamıyor

**Konum:** [src/modules/contracts/generator.ts:708](C:/Users/DEDE-/Desktop/operis/src/modules/contracts/generator.ts:708)

**Sorun ve etki:** sha256Fingerprint yalnız markdown üzerinden hesaplanıyor. İmza görseli markdown’a dahil edilmeden HTML’e ekleniyor; imzalama servisi de markdown hash’ini mühür olarak kullanıyor. Görsel değişimi aynı mühürle farklı imzalı HTML üretir.

**Tetiklenme / kanıt:** Yerel kontrolde yalnız signatureDataUrl değiştirildi: htmlDifferent=true ve differentSignatureImagesSameMarkdownSeal=true.

**Düzeltme yönü:** İmza görsellerinin hash’lerini, taraf kimliklerini, kapsamı ve sürümü kanonik imzalanan veriye dahil et; belge doğrulamasında bu manifesti kontrol et.

### 15. [P1] Değişiklik talepleri üçüncü kişilerce okunabiliyor

**Konum:** [src/modules/engagements/change-request-service.ts:359](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/change-request-service.ts:359)

**Sorun ve etki:** getChangeRequests _viewerUserId parametresini kullanmıyor ve iş UUID’siyle tüm kayıtları döndürüyor. GET API’si yalnız giriş kontrolü yapıyor. Bütçe, kapsam, taraf kimlikleri ve üretilmiş zeyilname içeriği açığa çıkıyor.

**Tetiklenme / kanıt:** İşe taraf olmayan giriş yapmış kullanıcı bilinen iş UUID’sinin change-requests uç noktasını çağırır.

**Düzeltme yönü:** Listelemeden önce iş katılımını doğrula; bu kontrolü servis katmanında da zorunlu tut.

### 16. [P1] Değişiklik talebi yazma hatalarında sahte başarı ve veri kaybı

**Konum:** [src/modules/engagements/change-request-service.ts:279](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/change-request-service.ts:279)

**Sorun ve etki:** Oluşturma hataları üretimde bellek listesine yazılıyor; onay/ret/iptal UPDATE hataları yutuluyor ve başarılı kayıt döndürülüyor. Veritabanı sonradan erişilebilir olduğunda bellek kaydı okunmayabilir. Bildirim ile kalıcı sözleşme durumu ayrışır.

**Tetiklenme / kanıt:** DB yazımı başarısız olurken API başarı döner; süreç değişince oluşturulan zeyilname veya yanıt kaybolur.

**Düzeltme yönü:** Üretimde kalıcılık başarısızlığını istemciye bildir; kayıt ve kritik bildirim/outbox durumunu transaction içinde tut; bellek alternatifini testlerle sınırla.

### 17. [P2] Değişiklik taleplerinde sıra ve durum yarışları

**Konum:** [src/modules/engagements/change-request-service.ts:202](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/change-request-service.ts:202)

**Sorun ve etki:** Bekleyen talep kontrolü ve nextSeq hesaplaması kilitsiz. Şemada iş+sıra indeksi unique değil. Yanıtlama/iptal de PENDING kontrolünü önce okuyor, UPDATE koşuluna status eklemiyor.

**Tetiklenme / kanıt:** İki oluşturma isteği aynı sıra numarasıyla iki PENDING kayıt açabilir. Aynı talepte onay ve iptal yarışırsa son yazan diğer sonucu ezer; bildirimler çelişir.

**Düzeltme yönü:** İş bazında kilit, tek aktif talep/sıra kısıtları ve koşullu durum güncellemeleri kullan.

### 18. [P2] Farklı para birimindeki zeyilname tutarları doğrudan toplanıyor

**Konum:** [src/modules/engagements/change-request-service.ts:373](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/change-request-service.ts:373)

**Sorun ve etki:** Her onaylı talebin additionalBudget değeri doğrudan toplam tutara ekleniyor; currency son onaylı kayıttan alınıyor. Oluşturma iş para birimine eşitlik zorunluluğu getirmiyor.

**Tetiklenme / kanıt:** 100 USD ve 100 TRY onaylı talep 200 ve son kaydın para birimiyle raporlanır.

**Düzeltme yönü:** İşin para birimini zorunlu kıl veya toplamları para birimi bazında ayrı hesapla; dönüşüm varsa sabitlenen kur ve tarihini sakla.

### 19. [P2] Bakım sözleşmesi tekrar etkinleştirilince mükerrer dönem açılıyor

**Konum:** [src/modules/engagements/retainer-service.ts:438](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/retainer-service.ts:438)

**Sorun ve etki:** activateRetainer PROPOSED durumunu doğrulamadan ACTIVE yazar ve her çağrıda periodIndex=1 ekler. Güncelleme ve dönem ekleme transaction değil; şemada retainer+dönem tekilliği yok.

**Tetiklenme / kanıt:** Çift tıklama/istek tekrarı birden fazla ilk dönem üretir; ikinci yazım başarısızsa ACTIVE sözleşme dönemsiz kalabilir. CANCELLED sözleşme de yeniden etkinleşebilir.

**Düzeltme yönü:** PROPOSED -> ACTIVE geçişini ve ilk dönem eklemeyi tek transaction yap; tekillik ve idempotency ekle.

### 20. [P2] Aylık bakım dönem yenilemesi ve saat devri uygulanmıyor

**Konum:** [src/modules/engagements/retainer-service.ts:529](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/retainer-service.ts:529)

**Sorun ve etki:** Üretim kodunda yalnız ilk dönem oluşturuluyor. logHours son dönemi bitiş tarihi veya sözleşme durumu kontrolü yapmadan kullanıyor. calculatePeriodMetrics çağrılarına önceki kullanılmayan saatler ve gerçek dönem tarihleri aktarılmıyor; varsayılan tarihler bugün/30 gün sonrası.

**Tetiklenme / kanıt:** İkinci ayda saatler ilk aya birikir, rollover 0 kalır ve ekrandaki dönem tarihi her okumada kayar; iptal edilmiş sözleşmeye saat yazılabilir.

**Düzeltme yönü:** Dönem kapatma/açma akışı ekle; gerçek tarih ve önceki dönem bakiyesini kullan; saat girişini aktif sözleşme ve geçerli dönemle sınırla.

### 21. [P2] Bakım saatleri eşzamanlı girişte kayboluyor; görev kaydı saklanmıyor

**Konum:** [src/modules/engagements/retainer-service.ts:548](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/retainer-service.ts:548)

**Sorun ve etki:** hoursLogged okunup input.hours ekleniyor ve mutlak değer olarak yazılıyor. İki işlem aynı eski toplamı okuyabilir. taskDescription ve date servis arayüzünde olsa da üretimde saklanmıyor; yalnız toplam saat tutuluyor.

**Tetiklenme / kanıt:** 10 saatlik kayda eşzamanlı +2 ve +3 girilirse 15 yerine 12/13 kalabilir. Hangi görev için kim tarafından saat yazıldığı sonradan doğrulanamaz.

**Düzeltme yönü:** Saatleri ayrı değiştirilemez log kayıtları olarak sakla; dönem toplamını atomik hesapla/güncelle; kullanıcı, görev ve zamanı koru.

### 22. [P2] Bakım iptali bildirim süresini uygulamıyor

**Konum:** [src/modules/engagements/retainer-service.ts:608](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/retainer-service.ts:608)

**Sorun ve etki:** Sözleşme ve yanıt cari ay sonunda, cancellationNoticeDays ihbarıyla iptal anlatıyor; kod doğrudan CANCELLED ve cancelledAt=şimdi yazıyor. İhbar sonu veya dönem sonu için alan/planlama kullanılmıyor.

**Tetiklenme / kanıt:** Dönem ortasında iptal, metinde vaat edilen gelecekteki fesih ile farklı durum oluşturur; saat kaydı servisi de bu iptali dikkate almaz.

**Düzeltme yönü:** İhbar zamanı ve effectiveCancellationAt sakla; durumu dönem/ihbar sonuna göre değiştir ve bütün servislerde aynı kuralı uygula.

### 23. [P2] Admin girişinde authVersion aktarılmıyor

**Konum:** [src/app/api/admin/auth/session/route.ts:152](C:/Users/DEDE-/Desktop/operis/src/app/api/admin/auth/session/route.ts:152)

**Sorun ve etki:** Admin kullanıcı sorgusu authVersion seçmiyor; createSessionToken çağrısı da göndermiyor. Token sürümü varsayılan 1 olur; getVerifiedSession veritabanındaki sürümle eşitlik arıyor.

**Tetiklenme / kanıt:** Parola/2FA veya oturum iptaliyle authVersion değeri 2+ olmuş yönetici doğru anahtarla başarılı giriş yanıtı alır, sonraki istekte oturumu geçersizdir.

**Düzeltme yönü:** Güncel authVersion’ı seç ve token oluşturulurken aktar.

### 24. [P2] Clerk e-posta değişiklikleri yerel hesaba yansımıyor

**Konum:** [src/modules/auth/clerk-sync-service.ts:181](C:/Users/DEDE-/Desktop/operis/src/modules/auth/clerk-sync-service.ts:181)

**Sorun ve etki:** Mevcut Clerk kimliği bulunduğunda email/emailVerified güncellenmiyor; emailEnc/emailHmac yalnız boşsa dolduruluyor. user.updated webhook’u aynı yola giriyor. Eski e-posta ve doğrulama durumu kalıyor.

**Tetiklenme / kanıt:** Kullanıcı Clerk’te birincil e-postasını değiştirir; yerel bildirim ve parola sıfırlama akışları eski e-posta verisini kullanmaya devam edebilir.

**Düzeltme yönü:** Doğrulanmış birincil e-posta değişimini plaintext/şifreli/blind-index alanları ve doğrulama durumuyla atomik senkronize et; kimlik çakışmasını açıkça yönet.

### 25. [P2] Clerk kullanıcı oluşturma atomik değil; eksik profil kalıcılaşabiliyor

**Konum:** [src/modules/auth/clerk-sync-service.ts:319](C:/Users/DEDE-/Desktop/operis/src/modules/auth/clerk-sync-service.ts:319)

**Sorun ve etki:** users, private identity, profiles ve acceptances ayrı ayrı yazılıyor. Handle benzersizliği önce sorgulanıyor; eşzamanlı oluşturma çakışabilir. users yazıldıktan sonra profil yazımı başarısız olursa sonraki sync existingByClerkId yolundan dönüyor ve eksik profili oluşturmuyor.

**Tetiklenme / kanıt:** Webhook ve ilk giriş aynı anda çalışır veya profil eklemesi hata verir; kullanıcı var fakat profil yok durumunda kalır.

**Düzeltme yönü:** Tüm ilk oluşturmayı transaction/upsert ve çakışma tekrarıyla yap; mevcut kullanıcı onarımında eksik profili de tamamla.

### 26. [P2] OAuth senkronizasyonu kullanıcı eylemi olmadan kabul kaydı üretiyor

**Konum:** [src/modules/auth/clerk-sync-service.ts:130](C:/Users/DEDE-/Desktop/operis/src/modules/auth/clerk-sync-service.ts:130)

**Sorun ve etki:** recordInitialLegalAcceptances her yeni kullanıcı için terms/privacy/matching-disclaimer acceptedAt kaydı oluşturuyor; kullanıcı onayı, gördüğü dil ve belge sürümü input olarak alınmıyor. user.created webhook’u da bu metodu tetikliyor. Hata halinde gerçek belge içeriği yerine sabit metnin hash’i yazılabiliyor.

**Tetiklenme / kanıt:** Kullanıcı yerel metinleri görmeden Clerk hesabı oluşturur; Operis kabul tablosunda onay vermiş gibi kayıt oluşur. Bu teknik kayıt doğruluğu bulgusudur; hukuki geçerlilik değerlendirmesi değildir.

**Düzeltme yönü:** Onay kaydını açık kullanıcı eylemine ve sunucuda doğrulanan belge sürümü/hash’ine bağla; senkronizasyon ile kabul işlemini ayır.

### 27. [P1] Karşı teklif kabulü kullanıcı engeli ve aktif hesap kurallarını atlıyor

**Konum:** [src/modules/offers/services/counter-offer.service.ts:390](C:/Users/DEDE-/Desktop/operis/src/modules/offers/services/counter-offer.service.ts:390)

**Sorun ve etki:** Normal acceptOffer akışı aktif taraf hesapları, karşılıklı engelleme ve ilan aktivasyon döngüsünü doğruluyor. acceptCounterOffer bu kontrolleri yapmadan eşleşme oluşturuyor; yalnız karşı teklif alıcısı ve teklif/ilan durumu kontrol ediliyor.

**Tetiklenme / kanıt:** Karşı teklif gönderildikten sonra teklif sahibi askıya alınır veya taraflar birbirini engeller; diğer aktif taraf karşı teklifi kabul ederek normal kabulde engellenecek eşleşmeyi oluşturabilir.

**Düzeltme yönü:** Normal kabul ile karşı teklif kabulünü aynı domain kuralları ve kullanıcı çifti kilidi üzerinden yürüt.

### 28. [P2] Teklif kabul yollarında ters kilit sırası deadlock üretebilir

**Konum:** [src/modules/offers/services/counter-offer.service.ts:398](C:/Users/DEDE-/Desktop/operis/src/modules/offers/services/counter-offer.service.ts:398)

**Sorun ve etki:** Karşı teklif kabulü önce teklif, sonra ilan satırını kilitliyor. Normal EngagementLifecycleService.acceptOffer ilanı, sonra teklifi kilitliyor. Aynı kayıtlara eşzamanlı iki akış erişirse dairesel bekleme oluşabilir.

**Tetiklenme / kanıt:** Normal kabul ve karşı teklif kabulü aynı teklif/ilan üzerinde yarışır; PostgreSQL işlemlerden birini deadlock hatasıyla iptal eder. İstek için otomatik tekrar görünmüyor.

**Düzeltme yönü:** Tüm kabul/güncelleme akışlarında tek kilit sırası kullan; transaction tekrarını uygun hata kodlarıyla sınırla.

### 29. [P2] Süresi dolan karşı teklifin EXPIRED yazımı geri alınıyor

**Konum:** [src/modules/offers/services/counter-offer.service.ts:375](C:/Users/DEDE-/Desktop/operis/src/modules/offers/services/counter-offer.service.ts:375)

**Sorun ve etki:** Transaction içinde EXPIRED güncellemesinden hemen sonra throw yapılıyor. Transaction rollback ile bu güncellemeyi de geri alıyor. Teklif veritabanında PENDING kalıyor.

**Tetiklenme / kanıt:** Süresi geçmiş karşı teklif kabul edilmeye çalışılır; istemci süre hatası alırken kayıt PENDING kalır, bekleyen pazarlık göstergeleri yanlış kalabilir.

**Düzeltme yönü:** Süre dolumu sonucunu transaction’dan normal sonuç olarak döndürüp commit sonrasında hata yanıtı üret veya ayrı süre sonlandırma işlemi kullan.

### 30. [P2] Süresi geçen tek taraflı değerlendirmeler otomatik açılmıyor

**Konum:** [src/modules/reviews/service.ts:784](C:/Users/DEDE-/Desktop/operis/src/modules/reviews/service.ts:784)

**Sorun ve etki:** autoRevealExpiredReviews tanımlı fakat src/scripts içinde çağrısı yok. Worker, cron ve Inngest bakım yollarına bağlı değil. Profil sorguları yalnız isRevealed=true kayıtları döndürüyor.

**Tetiklenme / kanıt:** Taraflardan biri değerlendirme yapar, diğeri yapmaz; 14 günlük pencere dolsa da değerlendirme görünmez kalır.

**Düzeltme yönü:** Süre sonu açma işini mevcut bakım akışına bağla ve tekrar çalıştırılabilir hale getir.

### 31. [P2] Eşzamanlı karşılıklı değerlendirmeler gizli kalabiliyor

**Konum:** [src/modules/reviews/service.ts:268](C:/Users/DEDE-/Desktop/operis/src/modules/reviews/service.ts:268)

**Sorun ve etki:** Karşı tarafın değerlendirmesi transaction dışında sorgulanıyor. İki taraf aynı anda gönderdiğinde her ikisi diğerini yok görüp isRevealed=false ekleyebilir. Transaction kullanımı önceden okunan shouldReveal değerini korumuyor.

**Tetiklenme / kanıt:** İki tarafın değerlendirmesi aynı anda kaydedilir; ikisi de var olmasına rağmen ikisi de gizli kalır. Otomatik açma işinin bağlı olmaması etkiyi uzatır.

**Düzeltme yönü:** İş satırını kilitleyerek ekleme ve iki tarafın varlığını aynı transaction içinde tekrar kontrol et.

### 32. [P2] CSP doğrudan R2 avatar yüklemesini engelliyor

**Konum:** [next.config.ts:39](C:/Users/DEDE-/Desktop/operis/next.config.ts:39)

**Sorun ve etki:** connect-src listesinde R2 depolama alan adı yok. header-edit-modal tarayıcıdan presigned R2 uploadUrl adresine fetch PUT yapıyor. Global CSP bu dış bağlantıyı engeller.

**Tetiklenme / kanıt:** R2 yapılandırılmış üretimde kullanıcı avatar yükler; tarayıcı CORS değerlendirmesine ulaşmadan CSP ihlaliyle isteği durdurabilir.

**Düzeltme yönü:** Yalnız kullanılan R2 upload origin’ini connect-src listesine ekle; gerçek tarayıcıda CSP ve R2 CORS’u birlikte doğrula.

### 33. [P2] Ayarlar ekranındaki parola değiştirme yanlış API’ye gidiyor

**Konum:** [src/components/settings/settings-view.tsx:153](C:/Users/DEDE-/Desktop/operis/src/components/settings/settings-view.tsx:153)

**Sorun ve etki:** Form /api/account/password çağırıyor; bu route depoda yok. Gerçek uç nokta /api/auth/change-password. İstemci ayrıca 8 karakter yeterli sayarken sunucu minimum 12 ve ek kurallar istiyor.

**Tetiklenme / kanıt:** Ayarlar ekranından geçerli parolayla değişiklik denemesi 404 alır; ayrı güvenlik sayfasındaki doğru uç nokta bu formu düzeltmez.

**Düzeltme yönü:** Formu mevcut parola değiştirme API’sine bağla ve doğrulama kurallarını ortaklaştır.

### 34. [P2] Ayarlar ekranındaki veri dışa aktarma tamamlanamıyor

**Konum:** [src/components/settings/settings-view.tsx:174](C:/Users/DEDE-/Desktop/operis/src/components/settings/settings-view.tsx:174)

**Sorun ve etki:** İş oluşturulunca exportStatus yalnız PROCESSING yapılıyor. Sonrasında durum sorgusu, tamamlanma güncellemesi veya indirme bağlantısı yok. PrivacyGdprTab yalnız iş kimliği ve durumu gösteriyor. Ayrı güvenlik bileşeninde daha tam akış var.

**Tetiklenme / kanıt:** Bu sekmeden dışa aktarım isteyen kullanıcı iş hazır olsa bile bekleme durumu görür ve bu ekrandan dosyasını indiremez.

**Düzeltme yönü:** Mevcut export durum/indirme bileşenini yeniden kullan veya job polling, hazır dosya indirme ve hata/iptal akışlarını bağla.

### 35. [P1] Şirket doğrulama rozeti yalnız checksum ile veriliyor

**Konum:** [src/modules/profiles/services/company-verification.service.ts:97](C:/Users/DEDE-/Desktop/operis/src/modules/profiles/services/company-verification.service.ts:97)

**Sorun ve etki:** verifyCompany VKN/TCKN biçimi ve checksum, şirket adı metni ve tekrar kullanım kontrolü sonrası doğrudan isCompanyVerified=true ve VERIFIED yazıyor. Şirket adı/numara ilişkisi veya kullanıcının şirket temsil yetkisi doğrulanmıyor. Arayüz bunu Doğrulanmış Kurumsal olarak sunuyor.

**Tetiklenme / kanıt:** Checksum’u geçerli bir numarayı bilen kullanıcı başka bir şirket adıyla doğrulanmış rozet alabilir. Bu tespit checksum algoritmasının doğruluğuna değil kimlik doğrulama adımının eksikliğine dayanıyor.

**Düzeltme yönü:** Checksum sonucunu biçim doğrulaması olarak sakla; doğrulanmış rozet için bağımsız şirket/temsil yetkisi kanıtı ve onay akışı kullan.

### 36. [P2] İlk sözleşme imzası veritabanı durumunu PARTIALLY_SIGNED yapmıyor

**Konum:** [src/modules/contracts/contract-signing-service.ts:352](C:/Users/DEDE-/Desktop/operis/src/modules/contracts/contract-signing-service.ts:352)

**Sorun ve etki:** İlk imzanın updatePayload’u imza alanlarını ve version’ı yazıyor fakat status’u değiştirmiyor. Tek taraflı dal PARTIALLY_SIGNED yanıtı ve olay gönderse de DB PENDING_SIGNATURES kalıyor; getOrInitPackage status’u doğrudan satırdan okuyor.

**Tetiklenme / kanıt:** Bir taraf imzaladıktan sonra sayfa yenilenir veya başka süreç paketi okur; API’nin önceki başarı yanıtıyla kalıcı durum tutarsız görünür.

**Düzeltme yönü:** Tek taraflı imza kaydında status=PARTIALLY_SIGNED güncellemesini aynı atomik işleme ekle; son durum hesaplamasını imza alanlarıyla tutarlı tut.

## Ek çapraz referanslar

- Oturum açığının hesap bağlama tarafı: [src/modules/auth/clerk-sync-service.ts:235](C:/Users/DEDE-/Desktop/operis/src/modules/auth/clerk-sync-service.ts:235); mevcut test: [tests/unit/clerk-sync-route.test.ts:93](C:/Users/DEDE-/Desktop/operis/tests/unit/clerk-sync-route.test.ts:93).
- Hakediş API'si: [src/app/api/work/[id]/milestones/[milestoneId]/payment/route.ts:85](C:/Users/DEDE-/Desktop/operis/src/app/api/work/[id]/milestones/[milestoneId]/payment/route.ts:85); servis delegasyonu: [src/modules/engagements/milestone-service.ts:132](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/milestone-service.ts:132).
- Bakım saat API'sinde iş kimliğinin yok sayılması: [src/app/api/work/[id]/retainer/log/route.ts:44](C:/Users/DEDE-/Desktop/operis/src/app/api/work/[id]/retainer/log/route.ts:44).
- İmza API'sinin body rolünü iletmesi: [src/app/api/work/[id]/contract/sign/route.ts:91](C:/Users/DEDE-/Desktop/operis/src/app/api/work/[id]/contract/sign/route.ts:91); derlenmiş HTML sunumu: [src/app/api/work/[id]/contract/package/route.ts:61](C:/Users/DEDE-/Desktop/operis/src/app/api/work/[id]/contract/package/route.ts:61).
- Hakediş planını silen ikinci yanlış sütun: [src/modules/engagements/milestones/milestone-status.service.ts:396](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/milestones/milestone-status.service.ts:396); tekil olmayan sıra indeksi: [db/schema/tables/engagements.ts:268](C:/Users/DEDE-/Desktop/operis/db/schema/tables/engagements.ts:268).
- Normal kabul akışındaki doğru kurallar ve kilit sırası: [src/modules/engagements/services/engagement-lifecycle.service.ts:50](C:/Users/DEDE-/Desktop/operis/src/modules/engagements/services/engagement-lifecycle.service.ts:50).
- Değişiklik taleplerinin GET uç noktası: [src/app/api/work/[id]/change-requests/route.ts:41](C:/Users/DEDE-/Desktop/operis/src/app/api/work/[id]/change-requests/route.ts:41).
- Avatarı doğrudan R2'ye gönderen istemci: [src/components/profile/modals/header-edit-modal.tsx:127](C:/Users/DEDE-/Desktop/operis/src/components/profile/modals/header-edit-modal.tsx:127).
- Çalışan parola değiştirme uç noktası: [src/app/api/auth/change-password/route.ts:51](C:/Users/DEDE-/Desktop/operis/src/app/api/auth/change-password/route.ts:51).

## Önceliklendirme

1. **Önce erişim ve imza güvenliği:** 01–09, 15 ve 27. Hesap ele geçirme, yetkisiz veri değişimi ve imza bütünlüğü giderilmeden bu akışlar güvenilir sayılmamalı.
2. **Ardından kalıcılık ve kullanılabilirlik:** 10–14, 16–22 ve 36. Yanlış SQL sütunu, veri kaybını örten fallback'ler, durum geçişleri ve faturalama dönemi akışları.
3. **Sonra senkronizasyon ve kullanıcı akışları:** 23–26, 28–35. Yetkilendirme ve veri bütünlüğü regresyon testleri gerçek üretim servis dalını çalıştırmalı; yalnız bellek içi alternatifin testi yeterli değil.

Bu rapordaki düzeltme yönleri öneridir; hiçbir düzeltme uygulanmadı. Çökme ile istek hatası ayrımı korunmuştur: 10 numaralı bulgu süreç seviyesinde istisna riskidir; diğer birçok hata yanlış başarı, yetkisiz işlem, veri tutarsızlığı veya HTTP hata yanıtı üretir ve tek başına bütün Node sürecinin çöktüğünü kanıtlamaz.

