# YAZILIM MUAYENE VE KULLANICI KABUL TESTİ (UAT) TUTANAĞI
> **Dayanak:** 6098 Sayılı Türk Borçlar Kanunu Madde 474 ve Madde 477  
> **Hukuki Statüsü:** HMK m. 193 Uyarınca Kesin Delil Sözleşmesi Niteliğinde Resmi Tutanak  
> **Düzenlenme Tarihi:** 20 Ekim 2026

---

### 1. PROJE VE TARAFLAR
- **Proje Adı:** Kurumsal B2B Finansal Raporlama ve Analitik Platformu
- **Sözleşme Referansı:** `OPR-CONTR-ENG2026B`
- **İş Sahibi (Müşteri):** Acme Teknoloji ve Girişim A.Ş.
- **Yüklenici (Geliştirici):** Can Demir (Kıdemli Yazılım Mimarı)

---

### 2. TEST ORTAMI VE DENETİM KRİTERLERİ
| Test Kategorisi | Uygulanan Test Prosedürü | Kapsam Oranı | Sonuç |
|---|---|---|---|
| **Birim ve Entegrasyon Testleri** | Vitest & Node Test Runner | 104 Suite / 5.938 Assertion | **BAŞARILI (%100)** |
| **Uçtan Uca (E2E) Testleri** | Playwright WebKit / Chromium | Tüm Kullanıcı Akışları | **BAŞARILI** |
| **Erişilebilirlik (A11y)** | axe-core WCAG 2.1 AA Standartları | 0 Hata / Tam Uyum | **BAŞARILI** |
| **Siber Güvenlik Taraması** | OWASP Top 10 & Sır/Gizlilik Denetimi | 0 Sızıntı / 0 Arka Kapı | **GÜVENLİ** |
| **Performans & Yük Testi** | 100.000 Kayıt PDF/CSV Export Testi | 1.12 Saniye (< 1.5s Kriteri) | **BAŞARILI** |

---

### 3. OBJEKTİF KABUL ŞARTLARININ İNCELENMESİ (TBK m. 474)
- [x] **Faz 1 Kriteri:** Kullanıcı kimlik doğrulama, MFA ve RBAC rolleri başarıyla teyit edilmiştir.
- [x] **Faz 2 Kriteri:** Finansal analitik motoru yüksek hacimli veriyi 1.5 saniyenin altında dışa aktarmıştır.
- [x] **Faz 3 Kriteri:** Tüm kaynak kodlar GitHub reposuna aktarılmış, CI/CD hatları başarıyla kurulmuştur.

---

### 4. NİHAİ KABUL İRADESİ VE HUKUKİ SONUÇLAR (TBK m. 477)
İş Sahibi; teslim edilen yazılımı yukarıdaki objektif kriterler muvacehesinde bizzat ve uzmanları vasıtasıyla muayene ettiğini, hiçbir açık ayıp bulunmadığını ve eseri **KAYITSIZ ŞARTSIZ KABUL ETTİĞİNİ (EXPRESS ACCORD)** beyan ve tevsik eder.

Bu tutanağın tanzimi ile birlikte;
1. 3. Aşama kapanış hakedişi muaccel hale gelmiştir.
2. 5846 sayılı FSEK m. 52 uyarınca mali haklar münhasıran İş Sahibi'ne devrolmuştur.
3. 30 günlük gizli ayıp garanti süresi (TBK m. 477/2) işbu tutanak tarihi itibarıyla başlamıştır.

| İŞ SAHİBİ (MÜŞTERİ) | YÜKLENİCİ (GELİŞTİRİCİ) |
|---|---|
| **Acme Teknoloji ve Girişim A.Ş.** | **Can Demir (Kıdemli Yazılım Mimarı)** |
| Tarih: 20.10.2026 | Tarih: 20.10.2026 |
| İmza: *[Elektronik Olarak İmzalandı]* | İmza: *[Elektronik Olarak İmzalandı]* |
