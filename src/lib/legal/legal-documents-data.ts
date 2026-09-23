export interface LegalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocumentModel {
  key: string;
  title: string;
  subtitle: string;
  version: string;
  lastUpdated: string;
  badge: string;
  highlight: string;
  contentHash?: string;
  sections: LegalSection[];
}

export const LEGAL_DOCUMENTS: Record<string, Record<"tr" | "en", LegalDocumentModel>> = {
  terms: {
    tr: {
      key: "terms",
      title: "Kullanım Koşulları",
      subtitle: "Vellium — Yasal Kullanım Şartları (Operis bir Vellium ürünüdür)",
      version: "v1.0",
      contentHash: "ff911a49d0ee9dde62f088860828958515183140ddb58a8f5475668039d82c2a",
      lastUpdated: "07.09.2026",
      badge: "Hukuki Güvence & Aracı Hizmet Sağlayıcı",
      highlight:
        "Platform yalnızca tarafları bir araya getiren bağımsız bir keşif ağıdır. Komisyon kesmez (%0 komisyon), emanetçi (escrow) veya ödeme kuruluşu değildir, taraflar arasındaki sözleşmenin tarafı ve garantörü olamaz.",
      sections: [
        {
          title: "1. Taraflar ve Hizmetin Hukuki Niteliği",
          paragraphs: [
            'İşbu Kullanım Koşulları ("Sözleşme"), Operis platformunun işleticisi olan Vellium ("Şirket") ile sisteme üye olan kullanıcı ("Kullanıcı") arasında akdedilmiştir. Operis bir Vellium ürünüdür.',
            "Platform; 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve 5651 sayılı Kanun uyarınca münhasıran bir 'Aracı Hizmet Sağlayıcı' ve 'Yer Sağlayıcı' niteliğindedir.",
          ],
          bullets: [
            "Platform, Kullanıcılar tarafından paylaşılan proje veya teklif içeriklerinin doğruluğunu araştırmakla yükümlü değildir.",
            "Kullanıcılar sisteme girdikleri tüm verilerin hukuki ve cezai sorumluluğunu şahsen üstlenir.",
          ],
        },
        {
          title: "2. İş İlişkisinin ve Temsilciliğin Kesin Reddi",
          paragraphs: [
            "Platform ile Kullanıcılar arasında veya Kullanıcıların kendi aralarında hiçbir surette 4857 sayılı İş Kanunu veya 5510 sayılı Sosyal Sigortalar Kanunu kapsamında işçi-işveren, alt işveren veya asıl işveren ilişkisi kurulamaz.",
          ],
          bullets: [
            "Platform, bir özel istihdam bürosu (İŞKUR aracısı) veya iş bulma ajansı değildir.",
            "Kullanıcılar bağımsız girişimci / yüklenici statüsündedir; hiçbir vekalet, temsilcilik veya adi ortaklık doğmaz.",
          ],
        },
        {
          title: "3. Emanet (Escrow), Ödeme ve Vergi Sorumsuzluğu",
          paragraphs: [
            "Platform para tutmaz, emanet hesabı (escrow) sunmaz, hakediş dağıtmaz ve komisyon kesintisi yapmaz (%0 Komisyon).",
            "Mali ve vergisel yükümlülükler tamamen tarafların uhdesindedir:",
          ],
          bullets: [
            "Her türlü ödeme doğrudan tarafların kendi aralarında kararlaştıracağı banka veya yasal finans kanalları üzerinden yapılır.",
            "Faturalandırma, KDV, stopaj, serbest meslek makbuzu (SMM) ve gelir vergisi beyanları tarafların şahsi mükellefiyetindedir.",
          ],
        },
        {
          title: "4. Yazılım Kalitesi, Güvenlik Zafiyetleri ve Siber Olaylar",
          paragraphs: [
            "Freelancer tarafından teslim edilen yazılımların çalışabilirliği, kalitesi, performans düzeyi veya siber güvenlik zafiyeti (backdoor, zero-day, malware vb.) içermemesi hususunda Platform hiçbir garanti vermez.",
            "Kaynak kod denetimi, penetrasyon testleri ve kabul testlerinin (UAT) yürütülmesi münhasıran İşveren'in sorumluluğundadır.",
          ],
        },
        {
          title: "5. Fikri Mülkiyet Hakları (5846 Sayılı FSEK)",
          paragraphs: [
            "Kod, tasarım ve mimari üzerindeki telif ve fikri hakların devri, 5846 sayılı FSEK uyarınca tarafların kendi aralarında bağımsız olarak akdedeceği yazılı sözleşmelere tabidir. Platform telif uyuşmazlıklarının tarafı değildir.",
          ],
        },
        {
          title: "6. Azami Sorumsuzluk ve Tazminat Sınırı",
          paragraphs: [
            "Yürürlükteki mevzuatın izin verdiği azami ölçüde; ağır kusur ve kasıt halleri müstesna olmak üzere, Platform kâr kaybı, veri kaybı veya iş kesintisinden kaynaklanan hiçbir dolaylı veya arızi zarardan sorumlu tutulamaz.",
            "Platformun herhangi bir sebeple sorumlu tutulması halinde azami mali mesuliyeti, uyuşmazlık konusu işlem için Platform'a fiilen ödenen tutarla (0 TL) veya her halükarda azami 100 Türk Lirası ile sınırlıdır.",
          ],
        },
        {
          title: "7. Kullanıcının Rücu ve Tazmin Yükümlülüğü (Indemnity)",
          paragraphs: [
            "Kullanıcı; kanunları veya üçüncü kişi haklarını ihlal etmesi sebebiyle Platform aleyhine doğabilecek her türlü idari para cezası, tazminat ve dava masraflarını Platform'un ilk talebi üzerine faiziyle birlikte nakden ve defaten ödemeyi kabul ve taahhüt eder.",
          ],
        },
        {
          title: "8. Yetkili Mahkeme ve Delil Sözleşmesi",
          paragraphs: [
            "İşbu Sözleşme Türkiye Cumhuriyeti Kanunlarına tabidir. Doğabilecek her türlü uyuşmazlıkta İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri münhasıran yetkilidir.",
            "HMK m. 193 uyarınca; Platformun sunucu kayıtları, kriptografik SHA-256 onay özetleri ve veri tabanı logları kesin ve bağlayıcı delil niteliğindedir.",
          ],
        },
      ],
    },
    en: {
      key: "terms",
      title: "Terms of Service",
      subtitle: "Vellium — Binding User Terms (Operis is a product of Vellium)",
      version: "v1.0",
      contentHash: "d8d560732d20e5bc48fe3534a6e0c775a868e5f92cc08fc34b016ad2f3a1e887",
      lastUpdated: "07.09.2026",
      badge: "Intermediary Protection & Legal Disclaimer",
      highlight:
        "The Platform is strictly an independent information society matching network. We take 0% commission, do not hold funds in escrow, and are not party or guarantor to contracts between users.",
      sections: [
        {
          title: "1. Parties and Intermediary Status",
          paragraphs: [
            "This Agreement is between Vellium ('Company', operator of the Operis platform; Operis is a product of Vellium) and the registered user ('User').",
            "The Platform operates exclusively as an intermediary service and hosting provider under applicable digital commerce statutes.",
          ],
          bullets: [
            "The Platform is not obligated to pre-screen or verify user-generated postings or proposals.",
            "Users bear full civil and criminal liability for their published content and communications.",
          ],
        },
        {
          title: "2. Disavowal of Employment and Agency",
          paragraphs: [
            "No employer-employee, agency, partnership, or labor relationship is created between the Platform and Users under applicable labor codes.",
            "The Platform is not an employment agency or staffing firm; no guarantee of placement, hire, or revenue is given.",
          ],
        },
        {
          title: "3. Financial & Tax Disclaimers",
          paragraphs: [
            "The Platform never holds funds in custody or escrow and takes 0% commission from project contracts.",
            "All payments and statutory tax obligations (VAT, reverse charges, withholding, invoices) are handled directly between users.",
          ],
        },
        {
          title: "4. Code Quality & Security Disclaimers",
          paragraphs: [
            "The Platform provides zero warranty regarding source code defects, security flaws, backdoors, malware, or open-source license infringements.",
            "Source code reviews, penetration testing, and user acceptance testing (UAT) are strictly the client's sole responsibility.",
          ],
        },
        {
          title: "5. Limitation of Liability",
          paragraphs: [
            "To the maximum extent permitted by applicable law, the Platform shall not be liable for any consequential, indirect, punitive, or loss-of-profit damages.",
            "In any event, the Platform's total aggregate liability is capped at the amount paid by User to Platform (0 USD / 0 TRY) or 100 TRY maximum.",
          ],
        },
        {
          title: "6. Governing Law & Jurisdiction",
          paragraphs: [
            "Governed by the laws of the Republic of Turkey. Central courts of Istanbul (Caglayan) have exclusive jurisdiction.",
            "Server logs, audit trails, and SHA-256 hashes constitute definitive, conclusive legal evidence.",
          ],
        },
      ],
    },
  },
  privacy: {
    tr: {
      key: "privacy",
      title: "Gizlilik ve KVKK Aydınlatma Metni",
      subtitle: "6698 Sayılı KVKK Madde 10 ve GDPR Kapsamında Bilgilendirme",
      version: "v1.0",
      contentHash: "c9316aae2e98ef68eb0fd33ee51139f0ee8d6e569747c29752bf0a6cddc9e68f",
      lastUpdated: "07.09.2026",
      badge: "AES-256 Şifreli • KVKK Uyumlu",
      highlight:
        "T.C. Kimlik Numarası (TCKN), biyometrik veri veya adli sicil kaydı asla toplanmaz. Telefon numaranız ve yasal kimlik verileriniz uygulama katmanında AES-256-GCM ile şifrelenir, e-posta adresiniz hesap kimliği olarak güvenli saklanır; iletişim verileriniz karşılıklı eşleşme olmadan karşı tarafa kesinlikle açılmaz.",
      sections: [
        {
          title: "1. Veri Sorumlusunun Kimliği",
          paragraphs: [
            "6698 sayılı Kişisel Verilerin Korunması Kanunu ('KVKK') uyarınca veri sorumlusu Vellium'dur (Operis bir Vellium ürünüdür).",
          ],
        },
        {
          title: "2. İşlenen Veriler ve Veri Minimizasyonu",
          paragraphs: ["Sistemimiz yalnızca hizmetin ifası için asgari düzeydeki verileri işler:"],
          bullets: [
            "Kimlik & İletişim: Yasal ad, soyad, doğum tarihi (18+ yaş teyidi için), ikamet ili/ülkesi, doğrulanmış e-posta ve telefon.",
            "İşlem Güvenliği: Scrypt parola özetleri, oturum token'ları, SHA-256 onay logları, IP adresleri.",
            "Toplanmayan Veriler: TCKN, nüfus cüzdanı fotokopisi, adli sicil, dini inanç, sağlık veya biyometrik veriler asla toplanmaz.",
          ],
        },
        {
          title: "3. İşleme Amaçları ve Hukuki Sebepler",
          paragraphs: [
            "Verileriniz KVKK m. 5 uyarınca; sözleşmenin kurulması ve ifası (üyelik, ilan, şifreli teklifler), kanuni yükümlülükler (5651 s. erişim logları) ve meşru menfaat (dolandırıcılık tespiti, siber güvenlik) kapsamında işlenir.",
          ],
        },
        {
          title: "4. Kriptografik Koruma: AES-256-GCM ve Kör İndeksleme",
          paragraphs: [
            "Hassas veriler veri tabanına yazılmadan önce uygulama katmanında AES-256-GCM ile şifrelenir. Fiziksel sızıntılarda veriler okunamaz.",
            "Telefon numaralarının tekilliği, verinin kendisi açılmadan özel HMAC-SHA256 kör indeksleme (blind indexing) ile denetlenir.",
          ],
        },
        {
          title: "5. Veri Aktarımı ve Satış Yasağı",
          paragraphs: [
            "Platform kişisel verilerinizi asla üçüncü kişilere satmaz veya pazarlamacılara kiralamaz.",
            "İletişim bilgileriniz eşleşme teyit edilene kadar rakiplere ve ilan sahibine kapalı tutulur. Yalnızca teklif kabul edildiğinde tarafların birbirine iletişim bilgisi açılır.",
          ],
        },
        {
          title: "6. İlgili Kişinin Hakları (KVKK Madde 11)",
          paragraphs: [
            "Verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini isteme, silinmesini veya yok edilmesini talep etme haklarına sahipsiniz.",
            "Taleplerinizi privacy@vellium.dev adresine iletebilirsiniz. Başvurular 30 gün içinde ücretsiz sonuçlandırılır.",
          ],
        },
      ],
    },
    en: {
      key: "privacy",
      title: "Privacy Notice",
      subtitle: "Notice Pursuant to Turkish Data Protection Law (KVKK) & GDPR",
      version: "v1.0",
      contentHash: "612eeaddaaf2c4ff0d353211d7ac1f0b6a16271d0aeecb174af102dbc4dd7602",
      lastUpdated: "07.09.2026",
      badge: "AES-256 Encrypted • Privacy by Design",
      highlight:
        "We strictly never collect national ID numbers (TCKN) or biometric data. Phone numbers and legal identity details are encrypted with AES-256-GCM, while account emails are stored securely for authentication; contact details are never revealed until mutual offer acceptance.",
      sections: [
        {
          title: "1. Data Controller",
          paragraphs: [
            "Vellium acts as data controller under applicable privacy statutes (Operis is a product of Vellium).",
          ],
        },
        {
          title: "2. Data Minimization",
          paragraphs: [
            "We collect only essential identity (first/last name, birthdate for 18+ check) and contact details (email, phone). National IDs and sensitive biometric data are strictly prohibited and never collected.",
          ],
        },
        {
          title: "3. Cryptographic Security",
          paragraphs: [
            "Application-level AES-256-GCM encryption for stored names and phone numbers.",
            "HMAC-SHA256 blind indexing for phone lookup without decryption.",
            "Salted Scrypt key derivation for password security.",
          ],
        },
        {
          title: "4. Zero Sale of Data",
          paragraphs: [
            "We never sell, rent, or trade personal data to marketing brokers or third parties.",
            "Contact data remains shielded until mutual project match confirmation.",
          ],
        },
        {
          title: "5. Data Subject Rights",
          paragraphs: [
            "You may exercise your rights to access, rectification, and erasure by emailing privacy@vellium.dev.",
          ],
        },
      ],
    },
  },
  "matching-disclaimer": {
    tr: {
      key: "matching-disclaimer",
      title: "Eşleştirme ve Sorumluluk Reddi",
      subtitle: "Platform Rolü ve Mali/Hukuki Muafiyet Bildirimi",
      version: "v1.0",
      contentHash: "083797d7d865eae2f6982e5b57631fdfc91134eb0ae1c0cffaf433c73f0ca992",
      lastUpdated: "07.09.2026",
      badge: "Kesin Sorumluluk Reddi • Aracı Muafiyeti",
      highlight:
        "Platform; para toplamaz, ödeme tutmaz, emanetçi (escrow) hizmeti sunmaz, sözleşmelerin garantörü veya tarafı değildir, taraflar arasındaki ticari uyuşmazlıklarda hakemlik veya mahkeme rolü üstlenmez.",
      sections: [
        {
          title: "1. Ödeme Almaz ve Tutmaz",
          paragraphs: [
            "Kullanıcılar arasında hiçbir para transferi platform üzerinden gerçekleştirilmez. Platform emanet hesabı (escrow), dijital cüzdan, ödeme garantisi veya alacak sigortası sunmaz.",
            "Platform 6493 sayılı Kanun kapsamında bir ödeme veya elektronik para kuruluşu değildir.",
          ],
        },
        {
          title: "2. Hizmet Sözleşmesinin Tarafı Değildir",
          paragraphs: [
            "İlan sahibi ile teklif veren arasındaki teklif kabulü bir eşleşme ve doğrudan iletişim kanalı açma işlemidir.",
            "Bu işlem platformun taraf, kefil veya garantör olduğu bir nihai hizmet sözleşmesi teşkil etmez. Taraflar arasındaki hukuki ilişki doğrudan kendi aralarındadır.",
          ],
        },
        {
          title: "3. Ticari Uyuşmazlık Çözümü Sağlamaz",
          paragraphs: [
            "Kullanıcılar arasındaki ticari, hukuki, teknik veya mali anlaşmazlıklar kullanıcıların kendi aralarında veya yetkili adli merciler önünde çözümlenir; platform hakemlik, tahkim, arabuluculuk veya mahkeme rolü üstlenmez.",
          ],
        },
        {
          title: "4. Bağımsız Anlaşma Yükümlülüğü",
          paragraphs: [
            "Taraflar proje kapsamını, ücretini, teslimat aşamalarını, ödeme yöntemini, fatura ve vergi yükümlülüklerini ve varsa yazılı sözleşmelerini bağımsız olarak doğrudan kendi aralarında belirlemekle yükümlüdür.",
          ],
        },
        {
          title: "5. Kod Zafiyetleri ve Siber Güvenlik Sorumsuzluğu",
          paragraphs: [
            "Freelancer tarafından üretilen ve teslim edilen kod veya mimarilerin güvenlik açığı, arka kapı veya malware içermemesine yönelik olarak Platform hiçbir garanti vermez.",
            "Yazılımın penetrasyon testleri ve kabul denetimleri tamamen İşveren'in sorumluluğundadır.",
          ],
        },
        {
          title: "6. Yürürlük ve Kabul",
          paragraphs: [
            "Yürürlükteki mevzuatın izin verdiği azami ölçüde; kullanıcılar bu şartları peşinen kabul ederek platform hizmetlerinden faydalanır.",
          ],
        },
      ],
    },
    en: {
      key: "matching-disclaimer",
      title: "Matching & Liability Disclaimer",
      subtitle: "Platform Role and Commercial Exemption Notice",
      version: "v1.0",
      contentHash: "94f09ea9ab6ad2f84af32096d3e25e55497daaa0dba9ee535cd012b128c6bbb4",
      lastUpdated: "07.09.2026",
      badge: "Absolute Disclaimer • Intermediary Status",
      highlight:
        "The Platform does not hold funds, operate escrow, or act as party/guarantor to any project contract, nor does it adjudicate counterparty disputes.",
      sections: [
        {
          title: "1. Does Not Receive or Hold Funds",
          paragraphs: [
            "No financial transactions take place through the platform. The platform does not provide escrow, wallet, or payment guarantees.",
          ],
        },
        {
          title: "2. Is Not Party to Service Contracts",
          paragraphs: [
            "Offer acceptance opens a private match and bilateral communication channel. It does not constitute a platform-guaranteed contract.",
          ],
        },
        {
          title: "3. Does Not Adjudicate Commercial Disputes",
          paragraphs: [
            "Disputes regarding deliverables or payments must be settled directly between counterparties or before competent judicial authorities; the platform does not act as an arbitrator.",
          ],
        },
        {
          title: "4. Independent Duty to Agree Terms",
          paragraphs: [
            "Users are directly responsible for agreeing project milestones, payment channels, invoicing/tax duties, and written contracts outside the platform.",
          ],
        },
        {
          title: "5. Code Security Disclaimer",
          paragraphs: [
            "The Platform provides zero warranty that deliverables are free from zero-day vulnerabilities or backdoors. Code audits are strictly the client's sole responsibility.",
          ],
        },
      ],
    },
  },
  "acceptable-use": {
    tr: {
      key: "acceptable-use",
      title: "Kabul Edilebilir Kullanım Politikası",
      subtitle: "5237 Sayılı TCK ve Siber Güvenlik Esasları",
      version: "v1.0",
      contentHash: "9068c0def79422d3089cd48c26f4a568b058c83d8be36a39cbd6def7a3ba2aa0",
      lastUpdated: "17.09.2026",
      badge: "Siber Güvenlik & Kötüye Kullanım Kalkanı",
      highlight:
        "Zararlı yazılım, izinsiz sızma testleri, sahte projeler ve dolandırıcılık teşebbüsleri derhal engellenir; sorumlular hakkında adli mercilere suç duyurusunda bulunulur.",
      sections: [
        {
          title: "1. Yasaklı Yazılım ve Siber Saldırı Faaliyetleri",
          paragraphs: [
            "Malware, ransomware, exploit üretimi, yetkisiz penetrasyon testleri ve bot saldırıları kesinlikle yasaktır.",
          ],
        },
        {
          title: "2. Dolandırıcılık ve Sahte İlan Yasağı",
          paragraphs: [
            "Gerçek bütçesi bulunmayan hayalet ilanlar, sahte teklif havuzları ve kimlik avı girişimleri kalıcı hesap feshine tabidir.",
          ],
        },
        {
          title: "3. Müeyyideler ve Cezai Başvuru",
          paragraphs: [
            "İhlal tespitinde hesaplar derhal silinir, IP adresleri engellenir ve TCK bilişim suçları uyarınca savcılığa bildirilir.",
          ],
        },
      ],
    },
    en: {
      key: "acceptable-use",
      title: "Acceptable Use Policy",
      subtitle: "Cybersecurity & Community Integrity Standards",
      version: "v1.0",
      contentHash: "88453406407239c0a51c43c4e59c7f2b372185ed694d92492f447b85ea7abc28",
      lastUpdated: "17.09.2026",
      badge: "Cybersecurity Shield",
      highlight:
        "Malware, unauthorized pentesting, fake briefs, and fraud schemes result in immediate termination and legal prosecution.",
      sections: [
        {
          title: "1. Prohibited Cyber Activities",
          paragraphs: [
            "Zero tolerance for malware, exploit payloads, unauthorized penetration tests, or denial of service tools.",
          ],
        },
        {
          title: "2. Enforcement & Sanctions",
          paragraphs: [
            "Violating profiles face immediate permanent ban, IP blocking, and referral to cybercrime authorities.",
          ],
        },
      ],
    },
  },
  cookies: {
    tr: {
      key: "cookies",
      title: "Çerez Politikası",
      subtitle: "KVKK Çerez Uygulamaları Rehberi Uyarınca Bilgilendirme",
      version: "v1.0",
      contentHash: "e564cfa36e4c63367f525121a537dd93426a576ca09fac19a6fa2f554aba10f7",
      lastUpdated: "17.09.2026",
      badge: "Sıfır Reklam Takibi • Yalnızca Zorunlu Çerez",
      highlight:
        "Platformumuzda üçüncü taraf reklam, pazarlama veya profil çıkarma çerezi KESİNLİKLE KULLANILMAZ. Sadece teknik olarak zorunlu oturum ve güvenlik çerezleri yer alır.",
      sections: [
        {
          title: "1. Zorunlu Oturum Çerezleri",
          paragraphs: [
            "fp_session (HttpOnly oturum doğrulama) ve Cloudflare güvenlik çerezleri haricinde hiçbir izleme çerezi kullanılmaz.",
          ],
        },
        {
          title: "2. Çerez Yönetimi",
          paragraphs: [
            "Tarayıcınızın ayarlarından çerezleri dilediğiniz an silebilir veya engelleyebilirsiniz.",
          ],
        },
      ],
    },
    en: {
      key: "cookies",
      title: "Cookie Policy",
      subtitle: "Strictly Technical Essential Cookies Notice",
      version: "v1.0",
      contentHash: "0e35b60f9c46c46f98b196d3e036bcab26026b957889dbf9f4fef0e115928c64",
      lastUpdated: "17.09.2026",
      badge: "Zero Third-Party Trackers",
      highlight:
        "We deploy zero third-party advertising or profiling cookies. Only strictly necessary session tokens and security cookies are used.",
      sections: [
        {
          title: "1. Strictly Essential Cookies",
          paragraphs: [
            "fp_session and Cloudflare security tokens safeguard authenticated sessions against hijacking.",
          ],
        },
      ],
    },
  },
  "intellectual-property": {
    tr: {
      key: "intellectual-property",
      title: "Fikri Mülkiyet ve Telif Hakları Politikası",
      subtitle: "5846 Sayılı FSEK ve Uyar-Kaldır Bildirim Prosedürü",
      version: "v1.0",
      contentHash: "c83b96edf0209f302e8842a1e2eec033c38580534fd34c7a5d3e3b6c657aa336",
      lastUpdated: "17.09.2026",
      badge: "5846 FSEK • 48 Saat Uyar-Kaldır",
      highlight:
        "Geliştirilen kodların ve tasarımların mali hak devri iki taraf arasındaki P2P sözleşmeye tabidir. Telif ihlali bildirimleri 48 saat içinde incelenerek gereği yapılır.",
      sections: [
        {
          title: "1. Eser Sahipliği ve Hak Devri",
          paragraphs: [
            "Kod mülkiyeti FSEK m. 48-52 uyarınca tarafların bağımsız sözleşmesine tabidir; platform telif devrinin tarafı değildir.",
          ],
        },
        {
          title: "2. Uyar-Kaldır İhbar Kanalı",
          paragraphs: [
            "Telif hakkı ihlali iddiaları legal@vellium.dev adresine iletilir ve 48 saat içinde sonuçlandırılır.",
          ],
        },
      ],
    },
    en: {
      key: "intellectual-property",
      title: "Intellectual Property & Copyright Policy",
      subtitle: "Statutory Notice & Takedown Protocol",
      version: "v1.0",
      contentHash: "16dc7bf1c403226a037fae38d28832ca6795765076370d059ebfc26d29c32961",
      lastUpdated: "17.09.2026",
      badge: "Copyright Protection",
      highlight:
        "Code and asset IP rights transfer is strictly governed by bilateral user contracts. Valid DMCA/FSEK takedown notices processed within 48 hours.",
      sections: [
        {
          title: "1. Code Ownership & Transfer",
          paragraphs: [
            "IP transfer remains governed by direct bilateral agreements; the platform does not assume ownership or warranty.",
          ],
        },
      ],
    },
  },
  consent: {
    tr: {
      key: "consent",
      title: "Açık Rıza ve İletişim İzinleri Metni",
      subtitle: "6698 Sayılı KVKK m. 5/1 Uyarınca İsteğe Bağlı Onaylar",
      version: "v1.0",
      contentHash: "0683680da726e8ac7040b5c75011742b77cf240a7fca6a5170321b4460c894d9",
      lastUpdated: "17.09.2026",
      badge: "Ayrık Açık Rıza • Dilediğiniz An İptal",
      highlight:
        "Aydınlatma metninden ayrılmış, özgür iradeye dayalı rıza metnidir. Teklif kabul edildiğinde doğrudan iletişim kanallarının açılmasını kapsar; dilediğiniz an tek tıkla geri alabilirsiniz.",
      sections: [
        {
          title: "1. Açık Rıza Kapsamı",
          paragraphs: [
            "Yalnızca karşılıklı eşleşme halinde doğrudan iletişim verilerinin karşı tarafa açılması ve isteğe bağlı bülten izinlerini kapsar.",
          ],
        },
        {
          title: "2. Rızanın Geri Alınması",
          paragraphs: [
            "Hesap ayarlarından veya privacy@vellium.dev üzerinden rızanızı dilediğiniz an geri alabilirsiniz.",
          ],
        },
      ],
    },
    en: {
      key: "consent",
      title: "Explicit Consent & Communications",
      subtitle: "Discretionary Privacy & Direct Handshake Consent",
      version: "v1.0",
      contentHash: "413d243e8eb2af1920cff73a87118194fd9c8bb2ced1fb9ddb311ce4c0414476",
      lastUpdated: "17.09.2026",
      badge: "Revocable Consent",
      highlight:
        "Covers bilateral contact disclosure upon offer acceptance and optional news updates. Freely revocable anytime via settings.",
      sections: [
        {
          title: "1. Scope of Consent",
          paragraphs: [
            "Unlocks phone and email exclusively to the verified matched counterparty upon bilateral agreement.",
          ],
        },
      ],
    },
  },
  "dispute-resolution": {
    tr: {
      key: "dispute-resolution",
      title: "Uyuşmazlık Çözümü ve Arabuluculuk İlkeleri",
      subtitle: "6325 Sayılı Kanun ve Doğrudan Çözüm Kılavuzu",
      version: "v1.0",
      contentHash: "b63a4beba793c450ccda019976ce66bfe6cc887ed36b394e741526253b06ea45",
      lastUpdated: "17.09.2026",
      badge: "Arabuluculuk & Kesin Dava Muafiyeti",
      highlight:
        "Platform ticari veya teknik uyuşmazlıklarda hakem veya mahkeme değildir. Taraflar önce 14 gün doğrudan müzakere eder, ardından resmi arabuluculuk yoluna başvurur; Operis davalı gösterilemez.",
      sections: [
        {
          title: "1. Platform Hakem Değildir",
          paragraphs: [
            "Operis emanet hesabı tutmaz, ifa denetlemez. Taraflar ihtilaflarını münhasıran birbirleriyle çözer.",
          ],
        },
        {
          title: "2. Kademeli Çözüm Yolu",
          paragraphs: [
            "Önce 14 gün doğrudan müzakere, ardından 6325 sayılı Kanun uyarınca resmi arabuluculuk yolu önerilir.",
          ],
        },
      ],
    },
    en: {
      key: "dispute-resolution",
      title: "Dispute Resolution & Mediation Principles",
      subtitle: "Autonomous Dispute Protocol & Mediation Framework",
      version: "v1.0",
      contentHash: "5f3c88edcee94f981fd6348773a370ca4e52ce535413e5ef7cb544519148bbb0",
      lastUpdated: "17.09.2026",
      badge: "Direct Mediation",
      highlight:
        "The platform is not an arbitrator. Counterparties negotiate directly for 14 days then proceed to independent mediation; Operis holds lawsuit immunity.",
      sections: [
        {
          title: "1. No Platform Adjudication",
          paragraphs: [
            "Operis holds zero escrow and acts as neither court nor arbiter.",
          ],
        },
      ],
    },
  },
  contact: {
    tr: {
      key: "contact",
      title: "Kurumsal Bilgiler, Yasal Künye ve İletişim",
      subtitle: "TTK m. 1524 ve 6563 Sayılı ETK Uyarınca Resmi Şirket Bilgileri",
      version: "v1.0",
      contentHash: "e1cad5b6ad507eb8eeeea4ff107bfcea1adaa6db841fef74ab6be6e1edef4642",
      lastUpdated: "17.09.2026",
      badge: "Resmi Şirket Künyesi • ETBİS Kayıtlı",
      highlight:
        "Vellium tarafından işletilmektedir. Operis bir Vellium ürünüdür. MERSİS, KEP ve resmi tebligat kanalları aşağıda yer almaktadır.",
      sections: [
        {
          title: "1. Şirket Bilgileri",
          paragraphs: [
            "Unvan: Vellium (Operis bir Vellium ürünüdür) | MERSİS: 0123456789000001 | İstanbul V.D. 1234567890 | Adres: Büyükdere Cad. No: 199 İstanbul, Türkiye.",
          ],
        },
        {
          title: "2. Resmi İletişim ve KEP",
          paragraphs: [
            "Resmi KEP: vellium@hs01.kep.tr | Hukuk Masası: legal@vellium.dev | Müşteri Desteği: support@vellium.dev | Genel İletişim: contact@vellium.dev | Telefon: +90 (212) 555 0100",
          ],
        },
      ],
    },
    en: {
      key: "contact",
      title: "Corporate Legal Identity & Contact",
      subtitle: "Official Disclosures Pursuant to Commercial Statutes",
      version: "v1.0",
      contentHash: "7dfc338c0f73c958a117aae0458891b7999678131062528bd26cc8bc65a44b38",
      lastUpdated: "17.09.2026",
      badge: "Official Corporate Entity",
      highlight:
        "Operated under Vellium. Operis is a proprietary product of Vellium. Registered address, corporate ID, and legal compliance channels.",
      sections: [
        {
          title: "1. Entity Details",
          paragraphs: [
            "Company: Vellium (Operis is a product of Vellium) | Address: Buyukdere Cad. No: 199 Istanbul, Turkey | Support: support@vellium.dev | Legal: legal@vellium.dev | Contact: contact@vellium.dev | KEP: vellium@hs01.kep.tr",
          ],
        },
      ],
    },
  },
};
