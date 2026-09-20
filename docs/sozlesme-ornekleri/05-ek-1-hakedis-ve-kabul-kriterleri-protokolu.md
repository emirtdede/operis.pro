# SÖZLEŞME EKİ-1: OBJEKTİF KABUL KRİTERLERİ VE DEFINITION OF DONE PROTOKOLÜ
> **Yasal Dayanak:** 6098 Sayılı TBK m. 470 (Eser Sözleşmesi), m. 474 (Ayıp Muayenesi) & m. 477 (Kabul Rejimi)  
> **İlke:** Objektif BDD Kriterleri Şartı — İşverenin Subjektif veya Keyfi Ret Hakkı Yasaklanmıştır.

---

### EK-1: TARAFLARCA KARARLAŞTIRILAN OBJEKTİF KABUL KRİTERLERİ (DEFINITION OF DONE)

İşbu sözleşme kapsamında teslim edilecek yazılım ve teknik eserlerin Türk Borçlar Kanunu (TBK) m. 470 ve m. 474 hükümleri uyarınca 'Ayıpsız ve Sözleşmeye Uygun İfası' taraflarca mutabık kalınan aşağıdaki objektif kriterlere bağlanmıştır. İşveren, aşağıdaki kriterlerin sağlandığı durumlarda keyfi ret hakkına sahip olmayıp, yalnızca bu maddelerdeki somut eksiklikleri gerekçe göstererek revizyon talep edebilir:

#### Faz 1: Altyapı & Yetkilendirme Kriterleri

* [x] **Kullanıcı kimlik doğrulama, MFA ve rol tabanlı yetkilendirme (RBAC) uçtan uca çalışmalıdır.**
  * *Teknik Doğrulama (BDD):* `GIVEN Kullanıcı geçerli e-posta ve şifreyle 2FA kodunu girdiğinde | WHEN Giriş butonuna tıkladığında | THEN JWT oturum token'ı oluşturulmalı ve yetkili dashboard ekranına yönlendirilmelidir.`

#### Faz 2: Çekirdek İş Mantığı & Entegrasyon Kriterleri

* [x] **Finansal raporlama modülü 100.000 satır veriyi 1.5 saniye altında CSV ve PDF formatında dışa aktarmalıdır.**
  * *Teknik Doğrulama (BDD):* `GIVEN Sistemde 100.000 satır işlem kaydı bulunduğunda | WHEN Kullanıcı 'Dönem Sonu Raporu İndir' butonuna bastığında | THEN Sistem CPU tüketimi %40'ı aşmadan, 1.5 saniye içinde imzalı PDF dosyasını üretmelidir.`

#### Faz 3: Çıktı, Test & Nihai Teslimat Kriterleri

* [x] **Tüm kaynak kodlar %85+ test kapsamı ile GitHub Actions CI/CD hattında yeşil geçmelidir.**
  * *Teknik Doğrulama (BDD):* `GIVEN Ana dala (main) yeni sürüm etiketi (tag) atıldığında | WHEN Otomatik linter ve test paketleri koşturulduğunda | THEN 0 kritik güvenlik zafiyeti ve %85 üzeri kapsama ile staging sunucusuna otomatik deploy olmalıdır.`

