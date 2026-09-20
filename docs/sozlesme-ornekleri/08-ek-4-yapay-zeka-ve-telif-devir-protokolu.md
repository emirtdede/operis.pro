# SÖZLEŞME EKİ-4: YAPAY ZEKA KULLANIMI, LİSANS TEMİZLİĞİ VE TELİF DEVİR PROTOKOLÜ
> **Yasal Dayanak:** 5846 Sayılı FSEK m. 52, Avrupa Birliği Yapay Zeka Yasası (EU AI Act) & TBK m. 474  
> **Odak:** Human-in-the-Loop Mimar Denetimi, Anti-Copyleft Koruma ve Prompt/Model Telif Devir Güvencesi

---

### EK-4: 5846 SAYILI FSEK m. 52 VE AB YAPAY ZEKA YASASI (EU AI ACT) UYUMLU YAPAY ZEKA TELİF DEVRİ, LİSANS TEMİZLİĞİ VE HALÜSİNASYON SORUMLULUK ŞARTNAMESİ
*(AI-ASSISTED CODE INTELLECTUAL PROPERTY ASSIGNMENT, LICENSE INTEGRITY & WARRANTY ADDENDUM)*

**Mevzuat ve Uluslararası Dayanak:**
- 5846 Sayılı Fikir ve Sanat Eserleri Kanunu m. 1/B, m. 2, m. 8 ve m. 52 (Bilgisayar Programlarında Sahibinin Hususiyeti ve Mali Hak Devri)
- Avrupa Birliği Yapay Zeka Yasası (EU Artificial Intelligence Act - Regulation (EU) 2024/1689) m. 50 ve m. 53 (Şeffaflık ve GPAI Telif Uyumu)
- 6098 Sayılı Türk Borçlar Kanunu m. 474 vd. (Eser Sözleşmesinde Ayıba Karşı Tekeffül ve Mesleki Özen Borcu)
- 6100 Sayılı Hukuk Muhakemeleri Kanunu m. 193 (Münhasır Delil Sözleşmesi ve Log Kayıtları)
- WIPO ve US Copyright Office (USCO) Human Authorship (İnsani Müelliflik) Kılavuz İlkeleri

**Taraflar:**
- **İş Sahibi (Müşteri):** Acme Teknoloji ve Girişim A.Ş.
- **Yüklenici (Geliştirici):** Can Demir (Kıdemli Yazılım Mimarı)
- **Operis AI-IP Telif Güvence Endeksi:** `10 / 100` (KUSURSUZ TELİF GÜVENCESİ)
- **Beyan Edilen AI Araçları:** `GITHUB_COPILOT, CLAUDE_CODE, CURSOR`
- **Yapay Zeka Kullanım Modeli:** İnsan Mühendis Denetimli Yapay Zeka (AI-Assisted Human-Reviewed)
- **Veri Gizliliği Güvence Düzeyi:** Kurumsal Sıfır Veri Saklama (Zero Data Retention / Model Eğitimine Kapalı)

İşbu Şartname, Ana Sözleşme'nin ayrılmaz bir eki olup projenin kaynak kodlarının telif geçerliliği, lisans saflığı ve teknik sorumluluklarını hüküm altına alır:

#### MADDE 1: ŞEFFAFLIK VE YASAL BEYAN YÜKÜMLÜLÜĞÜ (EU AI ACT m. 50 UYUMU)
1.1. Yüklenici, işbu sözleşme konusu yazılımın geliştirilmesi esnasında yapay zeka araçlarının kullanım derecesini yukarıda şeffafça beyan etmiştir.  
1.2. Yüklenici, projenin kaynak kodlarına entegre edilen bileşenlerde yapay zeka kullanım düzeyini ve araçlarını İş Sahibi'nden gizlemeyeceğini, gizlenen otonom kod parçalarından bizzat sorumlu olacağını kabul ve taahhüt eder.

#### MADDE 2: FSEK m. 52 UYARINCA İNSANİ HUSUSİYET (HUMAN-IN-THE-LOOP) VE TELİF DEVRİNİN GEÇERLİLİĞİ
2.1. Yüklenici; kod tabanında yapay zeka araçlarından faydalanılmış olsa dahi, projenin sistem mimarisi, veri modelleri, iş mantığı, fonksiyonel hiyerarşisi ve algoritmik akışının bizzat **insan mühendislik aklı ve fikri katkısıyla** tasarlandığını kabul ve beyan eder.  
2.2. Yüklenici, kodun salt bir yapay zeka çıktısı (raw machine generation) olmadığını, insan denetiminden (Human-in-the-Loop) geçirilerek şekillendirildiğini ve 5846 sayılı FSEK m. 1/B anlamında **"eser sahibinin hususiyetini"** taşıdığını tasdik eder.  
2.3. Yüklenici; işbu sözleşme ve FSEK m. 52 uyarınca yazılım üzerindeki tüm mali hakları (FSEK m. 21 İşleme, m. 22 Çoğaltma, m. 23 Yayma, m. 24 Temsil, m. 25 Umuma İletim Hakkı) yer, sayı ve süre kısıtlaması olmaksızın, münhasıran ve gayrikabili rücu İş Sahibi'ne devretmiştir. Hiçbir kod parçası kamu malı (public domain) bırakılmayacaktır.

#### MADDE 3: AÇIK KAYNAK VE COPYLEFT (GPL/AGPL) LİSANS BULAŞMA YASAĞI (LICENSE HYGIENE)
3.1. Yüklenici; yapay zeka modelleri tarafından önerilen veya kod tabanına dahil edilen hiçbir kod parçasının, projenin kapalı kaynak ticarî mahiyetini zedeleyecek viral copyleft açık kaynak lisansları (GPL v2/v3, AGPL, LGPL, SSPL vb.) ile lisanslanmış kod içermediğini **kesin ve gayrikabili rücu garanti eder**.  
3.2. Kod tabanına yalnızca permissive (MIT, Apache 2.0, BSD vb.) lisanslı açık kaynak paketler entegre edilebilir; işbu paketlerin lisans bildirimleri proje reposunda eksiksiz muhafaza edilir.

#### MADDE 4: MÜŞTERİ VERİ GİZLİLİĞİ VE SIFIR SAKLAMA (ZERO-DATA-RETENTION) TAAHHÜDÜ
4.1. Yüklenici; İş Sahibi'ne ait ticarî sırları, veri tabanı şemalarını, iş kurallarını, kullanıcı verilerini veya kaynak kodları, üçüncü taraf yapay zeka modellerinin genel eğitim havuzuna aktaracak şekilde halka açık tüketici araçlarına girmeyeceğini kabul eder.  
4.2. Geliştirme süreçlerinde kullanılan tüm yapay zeka ortamlarının kurumsal **"Sıfır Veri Saklama (Zero Data Retention - ZDR)"** politikasına tabi olduğu veya çevrimdışı yerel sistemlerde yürütüldüğü taahhüt edilir.

#### MADDE 5: HALÜSİNASYON, GÜVENLİK AÇIKLARI VE AYIP SORUMLULUĞU (TBK m. 474)
5.1. Yüklenici; kod bloklarının yapay zeka tarafından önerilmiş olmasını ileri sürerek 6098 sayılı TBK m. 474 kapsamında ayıba karşı tekeffül sorumluluğundan kurtulamaz.  
5.2. Yapay zeka halüsinasyonları, mantık hataları, bellek sızıntıları, OWASP Top 10 güvenlik açıkları ve performans kusurları doğrudan Yüklenici'nin mesleki özen borcunun ihlali ve ayıplı ifa sayılır. Yüklenici, işbu ayıpları derhal ve bila-ücret gidermekle mükelleftir.

#### MADDE 6: TEST VE STATİK ANALİZ DENETİMİ
6.1. Yüklenici; yapay zeka destekli üretilen tüm kodları birim testleri (unit tests), entegrasyon testleri ve statik analiz (linter/SAST) araçlarından geçirerek doğrulayacağını taahhüt eder.  
6.2. Teslim edilen kodların sözleşmede kararlaştırılan Tanımlanmış Tamamlanma Kriterleri'ne (DoD) ve BDD kabul testlerine tam uygunluğu aranır.

#### MADDE 7: FİKRİ MÜLKİYET İHLALİ TAZMİNATI (IP INDEMNIFICATION)
7.1. Üçüncü şahısların veya hak sahiplerinin, teslim edilen yazılımın yapay zeka çıktısı nedeniyle telif hakkını veya patentini ihlal ettiği iddiasıyla İş Sahibi aleyhine dava açması halinde; Yüklenici tüm dava masraflarını, avukatlık ücretlerini ve mahkemece hükmedilecek tazminatları tazmin etmeyi ve İş Sahibi'ni beri kılmayı kabul ve taahhüt eder.

#### MADDE 8: MÜNHASIR DELİL SÖZLEŞMESİ (HMK m. 193) VE YETKİLİ MAHKEME
8.1. Taraflar, Operis platformu üzerinde üretilen SHA-256 dijital mühürlü teslim tutanaklarının, AI kullanım beyanlarının ve Git commit loglarının 6100 sayılı HMK m. 193 uyarınca kesin ve bağlayıcı delil teşkil edeceğini kabul ederler.  
8.2. İşbu Şartname'den doğan uyuşmazlıklarda Ana Sözleşme'de kararlaştırılan Mahkemeler ve İcra Daireleri yetkilidir.
