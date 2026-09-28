# Kalan sorunlar için çözüm planı ve uygulama sonucu

**Tarih:** 28 Eylül 2026

- [x] Turnstile: production ortamında eksik secret, ağ/HTTP/JSON hataları reddediliyor. Yerel test sağlayıcısı yalnızca eşleşen izole test DB'si ve runner kimliğiyle kullanılabiliyor; production kontrolü atlanmıyor.
- [x] Turnstile form yaşam döngüsü: giriş/2FA, kayıt, şifre ve iletişim formları her istekten sonra yeni token alıyor. Doğrulama hazır olana kadar gönderim bekliyor; etkileşim isteyen widget CSS ile gizlenmiyor. Script geç yüklendiğinde de widget temizleniyor. Yerel sağlayıcı aynı token'ın ikinci kullanımını reddediyor. Token'ın tek kullanımlık olması [Cloudflare belgesine](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/) dayanır.
- [x] CSP: istek başına nonce oluşturuluyor; Next.js request/response başlıkları ve Clerk eşleşiyor. Sayfalar dinamik, HTML yanıtları private/no-store.
- [x] Manifest: bozuk JSON'u onarıp diske yazan Next.js yaması kaldırıldı. Bağımlılık kilidi güncellendi; bozuk dosyanın değiştirilmeden reddedildiği regresyon testi eklendi.
- [x] Şema: tip/nullability, FK/PK/unique, migration hash'leri ve 848 PostgreSQL katalog tanımı denetleniyor. CHECK/default/indeks değişiklikleri de yakalanıyor. Yeni `0038_counter_offer_lookup_index` migration'ı eklendi; iki FK'nin Drizzle tanımı mevcut SET NULL davranışıyla eşleştirildi.
- [x] PDF: dağıtım URL'si açıkça gerekli. Auth hataları/yönlendirmeler reddediliyor. HTML fallback Chromium'da render edilip print çağrısı ve PDF çıktısıyla sınanıyor; sıkıştırılmış HTTP yanıtları doğru işleniyor. Manuel dağıtım smoke workflow'u hazır.
- [x] Erişilebilirlik: kontrast ve paletin klavye erişimi düzeltildi; masaüstü/mobil axe ve odak testleri geçti.
- [x] Dışa aktarım belleği: ilan ve revizyon gruplarında özyinelemeli sonuç tutma kaldırıldı; büyük alanlar PostgreSQL JSON metninden parça parça yazılıyor. 50 büyük ilan üzerinde şifreli çıktı bütünlüğü ve bellek sınırı testi geçti.
- [x] Dışa aktarım bağlantıları: production'daki tek bağlantılı havuzun snapshot/yazıcı kilitlenmesi giderildi. Okuyucuya iş ömrüyle sınırlı bir bağlantı ayrılıyor; tek slotlu havuz regresyonu geçti.
- [x] E2E hazırlığı: izole DB'ye yalnızca gerekli test hesapları ekleniyor; eski demo veri kümesine bağımlılık kaldırıldı. Bot sağlayıcısı yerelde taklit ediliyor; `.env` Redis ayarlarının testlere sızması engellendi. Testler güncel masaüstü/mobil filtre ve ayarlar akışlarına uyarlandı.
- [x] Son kontroller rapora işlendi: 6.176 birim, 95 entegrasyon, 24 masaüstü/mobil E2E ve 10 DOM erişilebilirlik testi geçti. Production build, TypeScript, lint, format ve sır taraması başarılı.
- [ ] Gerçek dağıtım: production environment altında `DEPLOYMENT_URL`, `SMOKE_CONTRACT_ID`, `SMOKE_AUTH_TOKEN` ile smoke workflow'u çalıştırılmalı.
- [ ] Operasyon: gerçek sağlayıcı teslimatı, yedekten dönüş ve alarm teslimi hedef ortamda kanıtlanmalı.

## Yayına geçiş

`docs/deployment/remaining-verification.md` uygulanmalıdır. Turnstile secret ve public site key build sırasında hazırlanmalı, yeni migration kontrollü dağıtım adımında uygulanmalıdır. Canlı veritabanında veya dış sağlayıcılarda bu çalışma kapsamında değişiklik yapılmadı.

Yerel doğrulamalar için sahipliği bu çalışmaya ait Docker PostgreSQL test veritabanı kullanıldı. Test runner her koşu için ayrı veritabanı oluşturup temizler. Gerçek yayın sonucu yerel testten çıkarılmaz. Nihai test sonuçları `YAYINA_HAZIRLIK_RAPORU_2026-09-27.md` içindedir.
