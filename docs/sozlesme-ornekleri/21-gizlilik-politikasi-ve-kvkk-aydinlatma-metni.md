# GIZLILIK VE KVKK AYDINLATMA METNI
> **Alt Başlık:** 6698 Sayılı KVKK Madde 10 ve GDPR Kapsamında Bilgilendirme  
> **Sürüm:** v1.0 | **Son Güncelleme:** 07.09.2026 | **Rozet:** AES-256 Şifreli • KVKK Uyumlu  
> **Kriptografik İçerik Özeti (SHA-256):** `c9316aae2e98ef68eb0fd33ee51139f0ee8d6e569747c29752bf0a6cddc9e68f`  

---

### ÖZET VE VURGU
> T.C. Kimlik Numarası (TCKN), biyometrik veri veya adli sicil kaydı asla toplanmaz. Telefon numaranız ve yasal kimlik verileriniz uygulama katmanında AES-256-GCM ile şifrelenir, e-posta adresiniz hesap kimliği olarak güvenli saklanır; iletişim verileriniz karşılıklı eşleşme olmadan karşı tarafa kesinlikle açılmaz.

---

### 1. Veri Sorumlusunun Kimliği
6698 sayılı Kişisel Verilerin Korunması Kanunu ('KVKK') uyarınca veri sorumlusu Vellium'dur (Operis bir Vellium ürünüdür).

### 2. İşlenen Veriler ve Veri Minimizasyonu
Sistemimiz yalnızca hizmetin ifası için asgari düzeydeki verileri işler:

- Kimlik & İletişim: Yasal ad, soyad, doğum tarihi (18+ yaş teyidi için), ikamet ili/ülkesi, doğrulanmış e-posta ve telefon.
- İşlem Güvenliği: Scrypt parola özetleri, oturum token'ları, SHA-256 onay logları, IP adresleri.
- Toplanmayan Veriler: TCKN, nüfus cüzdanı fotokopisi, adli sicil, dini inanç, sağlık veya biyometrik veriler asla toplanmaz.

### 3. İşleme Amaçları ve Hukuki Sebepler
Verileriniz KVKK m. 5 uyarınca; sözleşmenin kurulması ve ifası (üyelik, ilan, şifreli teklifler), kanuni yükümlülükler (5651 s. erişim logları) ve meşru menfaat (dolandırıcılık tespiti, siber güvenlik) kapsamında işlenir.

### 4. Kriptografik Koruma: AES-256-GCM ve Kör İndeksleme
Hassas veriler veri tabanına yazılmadan önce uygulama katmanında AES-256-GCM ile şifrelenir. Fiziksel sızıntılarda veriler okunamaz.

Telefon numaralarının tekilliği, verinin kendisi açılmadan özel HMAC-SHA256 kör indeksleme (blind indexing) ile denetlenir.

### 5. Veri Aktarımı ve Satış Yasağı
Platform kişisel verilerinizi asla üçüncü kişilere satmaz veya pazarlamacılara kiralamaz.

İletişim bilgileriniz eşleşme teyit edilene kadar rakiplere ve ilan sahibine kapalı tutulur. Yalnızca teklif kabul edildiğinde tarafların birbirine iletişim bilgisi açılır.

### 6. İlgili Kişinin Hakları (KVKK Madde 11)
Verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini isteme, silinmesini veya yok edilmesini talep etme haklarına sahipsiniz.

Taleplerinizi privacy@vellium.dev adresine iletebilirsiniz. Başvurular 30 gün içinde ücretsiz sonuçlandırılır.

