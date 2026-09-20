# SÖZLEŞME EKİ-2: VERİ İŞLEYEN KİŞİSEL VERİ İŞLEME SÖZLEŞMESİ (DPA)
> **Yasal Dayanak:** 6698 Sayılı KVKK Madde 12 & Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) Madde 28  
> **Taraflar:** Acme Teknoloji ve Girişim A.Ş. (Veri Sorumlusu) — Can Demir (Kıdemli Yazılım Mimarı) (Veri İşleyen)

---

### EK-2: 6698 SAYILI KVKK m. 12 VE GDPR m. 28 UYARINCA BİLİŞİM VERİ İŞLEME VE BİLGİ GÜVENLİĞİ PROTOKOLÜ (DPA)

İşbu Protokol; taraflar arasındaki Ana Yazılım Sözleşmesinin ayrılmaz bir eki olup, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun (KVKK) 12. maddesi ve Kişisel Veri Güvenliği Rehberi uyarınca akdedilmiştir.

#### 1. TARAFLARIN SIFATLARI VE TEMEL İLKE
- **Veri Sorumlusu (İş Sahibi):** Acme Teknoloji ve Girişim A.Ş. — Kişisel verilerin işleme amaçlarını ve vasıtalarını belirleyen taraftır.
- **Veri İşleyen (Yüklenici):** Can Demir (Kıdemli Yazılım Mimarı) — Veri Sorumlusunun verdiği yetkiye dayanarak onun adına bilişim sistemleri üzerinde kişisel veri işleyen taraftır.

#### 2. İŞLEMENİN KAPSAMI, AMACI VE ERİŞİM SEVİYESİ
- **Tanımlanan Erişim Seviyesi:** Staging / Test Ortamında Salt-Okunur Erişim
- **İşlenen Kişisel Veri Kategorileri:**
- **Kimlik ve İletişim Bilgileri (Ad, Soyad, E-posta, Telefon, TCKN)**
- **Kullanıcı Hesap & Log Kayıtları (IP, Şifre Hashleri, Oturum Verisi)**
- **Finans ve İşlem Verileri (Siparişler, Faturalar, Ödeme Kayıtları)**
- **Değerlendirilen Risk Seviyesi:** **MEDIUM** (Risk Skoru: 39/100)

#### 3. YÜKLENİCİNİN (VERİ İŞLEYEN) KANUNİ YÜKÜMLÜLÜKLERİ
3.1. **Yalnızca Talimata Bağlılık:** Yüklenici, kişisel verileri münhasıran İş Sahibinin yazılı talimatları ve işbu sözleşmenin ifası amacıyla işleyebilir; kendi ticari veya şahsi amaçları için kopyalayamaz, işleyemez veya üçüncü taraflara aktaramaz.  
3.2. **Süresiz Gizlilik Yükümlülüğü:** Yüklenici ve projede görev alan uzmanlar, vakıf oldukları tüm kişisel veriler hakkında işbu sözleşme sona erse dahi süresiz bir sır saklama yükümlülüğü altındadır.  
3.3. **Yetkisiz Alt İşleyen Yasağı:** İş Sahibinin önceden verilmiş açık yazılı onayı olmaksızın hiçbir üçüncü taraf geliştirici, harici yapay zeka servisi veya bulut sağlayıcısı veriye erişemez.  
3.4. **Veri İhlali Bildirim Yükümlülüğü (SLA: 24 Saat):** Yüklenici, sistemlerinde veya yetkisi dahilindeki verilerde meydana gelebilecek herhangi bir sızıntı, yetkisiz erişim veya güvenlik şüphesini öğrendiği andan itibaren **en geç 24 saat içinde** İş Sahibine yazılı olarak bildirmekle yükümlüdür.  
3.5. **İlgili Kişi Hakları Desteği (KVKK m. 11):** İlgili kişilerin (kullanıcıların) veri silme, anonimleştirme veya bilgi taleplerinde Yüklenici teknik altyapıyı ivedilikle hazırlamakla yükümlüdür.  
3.6. **Sözleşme Sonu Veri İmhası:** İşbu sözleşmenin tamamlanması veya sona ermesi üzerine Yüklenici nezdindeki tüm yerel kopyalar, geçici veritabanları ve test verileri derhal silinecek ve İş Sahibine kanunen geçerli bir **"Kişisel Veri İmha Tutanağı"** teslim edilecektir.

#### 4. TAAHHÜT EDİLEN TEKNİK VE İDARİ TEDBİRLER
Yüklenici, KVKK m. 12 uyarınca aşağıdaki asgari güvenlik tedbirlerini eksiksiz uygulamayı taahhüt eder:
- [x] Uçtan Uca Şifreleme (TLS 1.3)
- [x] Durağan Veri Şifreleme (AES-256)
- [x] Çok Faktörlü Doğrulama (2FA/MFA)
- [x] Değiştirilemez Denetim Logları

