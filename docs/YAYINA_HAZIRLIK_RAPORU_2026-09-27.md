# Operis — Yayına hazırlık: kalan doğrulamalar

**İlk inceleme:** 27 Eylül 2026  
**Son güncelleme:** 28 Eylül 2026  
**Karar:** Rapordaki kod düzeltmeleri tamamlandı ve yerel kontroller geçti. Hedef yayın ortamı ve operasyon kanıtları olmadan yayın hazırlığı tamamlandı denemez.

Önceki rapordaki giderilen CSP, Turnstile, manifest, şema denetimi ve erişilebilirlik maddeleri çıkarıldı. Kullanıcının son talebi doğrultusunda kod düzeltmeleri yapıldı. Uygulama ayrıntıları `KALAN_SORUNLAR_COZUM_PLANI.md` dosyasındadır.

## B07 — P2: Son dağıtımda sözleşme PDF/yazdırma kontrolü

Yerel PDF üretimi ve HTML fallback kontrolü doğrulandı. `scripts/verify-deployment-pdf.ts` artık HTML'yi gerçek Chromium'da, yanıtın CSP başlıklarıyla render ediyor; print çağrısını ve çıktı oluşmasını denetliyor. Auth hataları, yönlendirmeler ve eksik hedef bilgileri başarısız sayılıyor.

**Kalan iş:** Gerçek dağıtım URL'si, test sözleşmesi ve yetkili test oturumu ile `.github/workflows/deployment-smoke.yml` çalıştırılmalı. Hedef ortam bilgileri bu çalışma için sağlanmadığından canlı kontrol yapılmadı. Yerel başarı son dağıtımı kanıtlamaz.

## Yayın ortamı yapılandırması ve operasyon kanıtları

- Build sırasında `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, çalışma ortamında `TURNSTILE_SECRET_KEY` hazır olmalı. Production'da eksik secret ve sağlayıcı hatası işlemi reddeder.
- `0038_counter_offer_lookup_index` migration'ı kontrollü dağıtımda uygulanmalı; hedef veritabanında `pnpm audit:schema` sonucu doğrulanmalı. Katalog referansı PostgreSQL 16 üzerinde oluşturuldu; farklı ana sürümün çıktısı incelenmelidir.
- Nonce içeren dinamik HTML'nin CDN'de ortak cache'e alınmadığı doğrulanmalı.
- Gerçek e-posta/SMS sağlayıcısı teslimatı, izole ortama yedekten dönüş ve alarmın test alıcısına teslimi için ortam/tarih/işlem kimliğiyle kanıt kaydedilmeli. Bu kontroller yerel sağlayıcı taklidiyle kapanmaz.

Adımlar: `docs/deployment/remaining-verification.md`.

## Yerel doğrulama durumu

| Kontrol | Sonuç |
| --- | --- |
| Birim testleri | 134 dosya, 6.176 test başarılı |
| Entegrasyon testleri | 16 dosya, 95 test başarılı; şema sapmaları, tek slotlu havuz, büyük ilan/revizyon aktarımı dahil |
| Tarayıcı E2E | Masaüstü/mobil Chromium: 24/24 başarılı; 6 axe/odak testi, girişte tek kullanımlık token, filtreler, gerçek worker ile indirme, yetki/iptal/süre aşımı dahil |
| Production build | Başarılı; Sentry/OpenTelemetry bağımlılığının dinamik require uyarısı sürüyor, build'i engellemiyor |
| DOM erişilebilirlik | 10 test başarılı |
| Yerel PDF runtime | Başarılı; 35.746 bayt PDF üretildi |
| PDF HTML fallback | Normal ve gzip yanıt başarılı; script'i engelleyen CSP beklenen şekilde başarısız |
| PDF smoke oturumu | Yerel HTTP fixture: uygulamanın fp_session çereziyle başarı, geçersiz oturumda başarısız exit doğrulandı |
| TypeScript / lint / format | Başarılı; son Turnstile form değişikliklerinde TypeScript ve hedefli lint tekrarlandı |
| Kaynak kod sır taraması | Başarılı |

Yayın veritabanına migration uygulanmadı ve dağıtım yapılmadı. Test veritabanları yerel ve koşuya özeldir. E2E runner'ın `.env` Redis ayarlarını devralması saptanıp kapatıldı; sonraki testler yerel PostgreSQL istek sınırı denetimini kullanır.
