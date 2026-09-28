# Yayın doğrulama adımları

## Kod ve yerel testler

- `pnpm test:unit`, `pnpm test:a11y`, `pnpm typecheck`, `pnpm lint`.
- Ayrı PostgreSQL test veritabanı için `TEST_DATABASE_URL` tanımlanır. `pnpm test:integration` ve `pnpm test:e2e:prod` yalnızca test veritabanında çalıştırılır.
- `pnpm audit:schema` salt okunur çalışır: sütun tipi/nullability, FK/PK/unique tanımları, check varlığı, indeks varlığı/unique/geçerlilik ve migration timestamp/hash denetlenir. Ayrıca CHECK/default/indeks tanımları `db/migrations/meta/schema-catalog.json` ile karşılaştırılır. Yeni migration sonrasında `TEST_DATABASE_URL` ile `pnpm exec tsx scripts/capture-schema-baseline.ts` çalıştırılır; script yeni izole veritabanına tüm migration’ları uygulayıp referansı üretir. Referans değişikliği kod incelemesine dahildir. PostgreSQL ana sürümü değişirken katalog çıktıları yeniden değerlendirilmelidir.
- `0038_counter_offer_lookup_index` migration'ı yayın prosedürüyle uygulanır; bu çalışma canlı veritabanına migration uygulamaz.

## Production yapılandırması

- `TURNSTILE_SECRET_KEY` ve build sırasında `NEXT_PUBLIC_TURNSTILE_SITE_KEY` zorunludur. Secret eksikse veya Cloudflare doğrulaması başarısızsa korunan işlem reddedilir; eski strict bayrağına ihtiyaç yoktur. `TURNSTILE_VERIFY_URL` canlı ortamda tanımlanmaz; yalnızca izole E2E runner yerel sağlayıcı için kullanabilir.
- Nonce kullanan sayfalar dinamik render edilir ve HTML yanıtları `private, no-store` taşır. CDN bu HTML yanıtlarını paylaşılmış cache'e almamalıdır.
- Next.js manifest onarım yaması kaldırılmıştır. Bozuk artefakt değiştirilerek devam edilmez; temiz build yeniden dağıtılır.
- Dışa aktarım işçisi, tek bağlantılı uygulama havuzunda çalışırken snapshot okumak için bir ek bağlantı açar ve iş sonunda kapatır. Bağlantı bütçesinde her aktif aktarım için bu ek bağlantı hesaba katılmalıdır.

## Gerçek dağıtım PDF kontrolü

GitHub `production` environment altında `DEPLOYMENT_URL` değişkeni ile mevcut test sözleşmesi ve katılımcı oturumuna ait `SMOKE_CONTRACT_ID`, `SMOKE_AUTH_TOKEN` secret'ları tanımlanır. `Deployed contract PDF verification` workflow'u dağıtımdan sonra çalıştırılır. Oturum token'ı komut satırına veya rapora yazılmaz.

`SMOKE_CONTRACT_ID`, mevcut sözleşmenin `/api/work/{id}/contract/pdf` adresindeki çalışma/engagement kimliğidir. `SMOKE_AUTH_TOKEN`, katılımcının uygulama `fp_session` oturum çerezi değeridir; Clerk token'ı değildir.

Kontrol eksik parametreyi, auth hatalarını, bulunamayan sözleşmeyi ve yönlendirmeyi reddeder. PDF için MIME/içerik kontrolleri; HTML için gerçek Chromium render, print çağrısı ve çıktı üretimi yapılır. Harici alt kaynaklar bu smoke kontrolünde yüklenmez. Yerel fixture başarısı gerçek dağıtımın kanıtı değildir.

## Operasyon doğrulamaları

Yayın sahibi hedef ortamda test alıcısına sağlayıcı teslimatı, izole ortama yedekten dönüş ve test alarmının teslimini doğrular. Her işlem için tarih, ortam, işlem kimliği ve sonuç saklanır; gerçek kullanıcıya bildirim gönderilmez. Bu kanıtlar olmadan operasyon hazırlığı tamamlandı sayılmaz.
