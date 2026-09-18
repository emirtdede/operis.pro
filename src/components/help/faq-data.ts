export type FAQAudience = "client" | "freelancer" | "general";

export interface FAQItem {
  id: string;
  category: "listings" | "commission" | "offers" | "matching" | "legal" | "safety";
  targetAudience?: FAQAudience;
  tags: string[];
  questionTr: string;
  questionEn: string;
  answerTr: string;
  answerEn: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  // 1. İLANLAR & 168 SAATLİK CANLILIK RADARI
  {
    id: "freshness-rule",
    category: "listings",
    targetAudience: "general",
    tags: ["168 saat", "radar", "canlılık", "arşiv", "tazeleme", "bayat ilan", "freshness"],
    questionTr: "1 Haftalık (168 saat) canlılık döngüsü kuralı nedir ve nasıl işler?",
    questionEn: "What is the 1-week (168-hour) freshness cycle rule and how does it work?",
    answerTr:
      "Operis'te açılan her ilan, yayınlandığı andan itibaren tam 168 saat (7 gün) boyunca akışta ve aramada canlı kalır. 168 saatin sonunda ilan otomatik olarak pasife ve arşive alınır. İlan sahibi tek bir tıkla ilanını 1 hafta daha ücretsiz olarak yeniden tazeleyebilir (renew). Bu kural sayesinde radarımızda aylarca unutulmuş, terkedilmiş veya yanıt verilmeyen bayat 'hayalet ilanlar' barınmaz; mühendisler yalnızca acil ve aktif ihtiyaçlara teklif verir.",
    answerEn:
      "Every listing on Operis remains live in the feed and search for exactly 168 hours (7 days) from the moment of publication. At the end of 168 hours, it automatically moves to archive. The listing owner can renew it for another week with a single click at zero cost. This ensures the feed is never cluttered with abandoned ghost postings, so engineers only invest time in genuinely active opportunities.",
  },
  {
    id: "who-can-post-and-limits",
    category: "listings",
    targetAudience: "client",
    tags: ["ilan sınırı", "ücret", "ilan açma", "kimler ilan verebilir", "kota", "ücretsiz"],
    questionTr: "Kimler ilan yayınlayabilir? İlan sınırı veya ücreti var mı?",
    questionEn: "Who can post a listing? Is there a posting limit or cost?",
    answerTr:
      "E-posta doğrulaması tamamlanmış tüm kişi, girişimci ve tüzel şirketler Operis'te tamamen ücretsiz ilan yayınlayabilir. Platform kalitesini korumak, aracı botları ve spam ilan kirliliğini engellemek amacıyla her hesap aynı anda en fazla 3 aktif ilana sahip olabilir. Bir ilan kapandığında veya tamamlandığında yeni ilan açma hakkı tekrar açılır.",
    answerEn:
      "Any person, startup founder, or enterprise with a verified email can post listings 100% free of charge. To uphold curation quality and deter spam bots, each account may have up to 3 concurrently active listings. Once a listing is closed or completed, the quota slot immediately frees up.",
  },
  {
    id: "listing-approval-instant",
    category: "listings",
    targetAudience: "client",
    tags: ["ilan onayı", "moderatör", "bekleme süresi", "anında yayında", "hızlı ilan"],
    questionTr: "İlanlarda ön onay veya moderatör bekleme süresi var mı? Ne zaman yayına girer?",
    questionEn: "Is there an approval queue or moderator delay? When does a listing go live?",
    answerTr:
      "Operis'te bürokratik moderatör onay kuyrukları yoktur. İlanınızı oluşturduğunuz anda otomatik güvenlik ve spam filtrelerinden geçer ve saniyeler içinde doğrudan 168 saatlik radara canlı olarak girer. Mühendisler ilanınızı anında görür ve şifreli tekliflerini iletmeye başlar.",
    answerEn:
      "There are zero bureaucratic approval delays. Once submitted, your listing passes automated security and spam heuristics and immediately enters the live 168-hour radar within seconds. Qualified engineers can inspect the brief and submit encrypted proposals instantly.",
  },
  {
    id: "budget-types-and-transparency",
    category: "listings",
    targetAudience: "client",
    tags: ["bütçe", "sabit fiyat", "saatlik bütçe", "şeffaflık", "tahmini bütçe"],
    questionTr: "İlan açarken bütçe belirtmek zorunlu mu? Hangi bütçe tipleri desteklenir?",
    questionEn: "Is specifying a budget mandatory? What budget types are supported?",
    answerTr:
      "Evet, gerçekçi ve şeffaf bir çalışma ortamı için bütçe belirtmek zorunludur. 'Sabit Fiyat' (örneğin 25.000 TL - 50.000 TL) veya 'Saatlik Ücret' aralığı belirleyebilirsiniz. Bütçesi net belirtilen ilanlar, belirsiz ilanlara kıyasla %85 daha hızlı ve yüksek nitelikli teklifler almaktadır.",
    answerEn:
      "Yes, stating a budget range is required to ensure realistic expectations. You can specify a 'Fixed-Price' range or an 'Hourly Rate' tier. Listings with clearly stated budgets receive 85% faster responses and significantly higher quality proposals from seasoned engineers.",
  },
  {
    id: "cancel-or-edit-listing",
    category: "listings",
    targetAudience: "client",
    tags: ["ilan düzenleme", "ilan iptali", "ilan kapatma", "güncelleme", "yayından kaldırma"],
    questionTr: "İlanımda değişiklik yapabilir miyim veya süresinden önce yayından kaldırabilir miyim?",
    questionEn: "Can I edit my listing or withdraw it before the 168 hours expire?",
    answerTr:
      "Evet. İlan yönetim panelinizden ilanınızın metnini, bütçesini veya aradığınız teknoloji yığınını dilediğiniz an güncelleyebilirsiniz. Uygun mühendisi bulduğunuzda veya ilanınız ertelendiğinde tek tıkla 'İlanı Kapat' diyerek radardan kaldırabilirsiniz.",
    answerEn:
      "Yes. You can edit your listing scope, budget range, or technology stack tags at any time from your dashboard. If you've already found your engineer or put the listing on hold, you can close or archive the listing immediately with one click.",
  },

  // 2. %0 KOMİSYON & ÖDEME MODELİ
  {
    id: "zero-commission-model",
    category: "commission",
    targetAudience: "general",
    tags: ["%0 komisyon", "komisyonsuz", "kesinti", "gizli ücret", "ücretsiz model", "doğrudan kazanç"],
    questionTr: "%0 komisyon modeli gerçekte nasıl çalışıyor? Gizli bir kesinti veya aidat var mı?",
    questionEn: "How does the 0% commission model really work? Are there hidden cuts or subscription fees?",
    answerTr:
      "Operis'te kesinlikle hiçbir komisyon (%0), teklif jetonu, para çekme kesintisi veya gizli üyelik aidatı yoktur. İlan sahibi ile mühendis anlaştıkları bütçenin %100'ünü doğrudan birbirlerine aktarır. Operis, bağımsız mühendislerin hak ettiği emeği aracı komisyonlarına kaptırmadığı açık ve doğrudan bir ekosistemdir.",
    answerEn:
      "There are strictly zero commissions (0%), no bid token fees, no payout deductions, and no hidden monthly fees. Clients and engineers contract and settle 100% of the agreed amount directly with each other. Operis operates as an open matching infrastructure that preserves full earnings for creators.",
  },
  {
    id: "escrow-and-intermediary",
    category: "commission",
    targetAudience: "general",
    tags: ["escrow", "havuz hesabı", "emanet", "para transferi", "finansal aracı"],
    questionTr: "Operis ödemelere aracılık ediyor mu (Escrow / Havuz hesabı)?",
    questionEn: "Does Operis hold funds in escrow or act as a payment intermediary?",
    answerTr:
      "Hayır. Operis bir ödeme kuruluşu veya finansal aracı (escrow) değildir. Platform havuzunda kullanıcı parası tutulmaz; bu sayede haftalarca para blokesi yaşanmaz ve %10-20 platform haracı ödenmez. Taraflar anlaşma sağladığında kendi banka hesapları üzerinden güvenli doğrudan transferle çalışır.",
    answerEn:
      "No. Operis is not a financial intermediary or escrow custodian. We do not hold client funds in a custody pool. This eliminates multi-week payout holds and avoids the traditional 10-20% intermediary fees. Parties settle directly through their own bank accounts.",
  },
  {
    id: "safe-payment-milestones",
    category: "commission",
    targetAudience: "general",
    tags: ["güvenli ödeme", "hakediş", "milestone", "avans", "banka transferi", "3 kademe"],
    questionTr: "Ödemeler nasıl güvenceye alınır? Hangi ödeme takvimi tavsiye edilir?",
    questionEn: "How are payments safeguarded without platform escrow? What payment schedule is recommended?",
    answerTr:
      "Güvenli ve şeffaf çalışma için '3 Kademeli Hakediş (Milestone) Modeli'ni tavsiye ediyoruz: 1. Aşama: İşe başlama ve mimari onayında %30 Avans. 2. Aşama: Çalışır prototip/alfa aşaması demosu sonrası %40 Ara Ödeme. 3. Aşama: Kod incelemesi, canlıya alma ve nihai kabul sonrası kalan %30 Son Ödeme. Bu yöntem her iki tarafı da eşit derecede korur.",
    answerEn:
      "We recommend the standardized '3-Stage Milestone Payment Model': Stage 1: 30% upfront advance upon contract signing and architecture approval. Stage 2: 40% interim payment upon live staging/prototype demo. Stage 3: Remaining 30% upon final acceptance, source code handover, and production deployment.",
  },
  {
    id: "advance-payment-insistence",
    category: "commission",
    targetAudience: "freelancer",
    tags: ["avans", "avanssız iş", "hakediş güvencesi", "ödeme takvimi", "garanti"],
    questionTr: "İşveren avans ödemek istemezse veya iş bitiminde tüm parayı teklif ederse ne yapmalıyım?",
    questionEn: "What if the client refuses to pay an upfront advance and offers 100% on completion?",
    answerTr:
      "Asla avans almadan (en az %30) ve sözleşme imzalamadan kod yazmaya başlamayın. 'İş bitince hepsini ödeyeceğim' modeli bağımsız yazılımcıların mağduriyet yaşadığı en yaygın senaryodur. Müşteriye Operis'in tavsiye ettiği 3 Kademeli Hakediş Standardı'nı gösterin: Proje aşamalara bölündüğünde hem müşteri çıktıyı görmeden tüm parayı riske atmaz hem de siz emeğinizin karşılığını adım adım alırsınız.",
    answerEn:
      "Never start coding without an advance payment (minimum 30%) and a signed agreement. Promising '100% upon completion' is the single most common cause of freelancer non-payment disputes. Point the client to Operis's 3-Stage Milestone Standard: phasing payments protects both client cash flow and developer engineering effort.",
  },
  {
    id: "currencies-and-international",
    category: "commission",
    targetAudience: "general",
    tags: ["döviz", "yurt dışı", "SWIFT", "Wise", "kripto", "USD", "EUR"],
    questionTr: "Yabancı para birimiyle (USD/EUR) veya yurt dışı hesaplarla (Wise/SWIFT) çalışabilir miyiz?",
    questionEn: "Can we transact in foreign currencies (USD/EUR) or use cross-border rails (Wise/SWIFT)?",
    answerTr:
      "Evet. Operis tarafların ödeme yöntemine veya para birimine müdahale etmez. Türk Lirası, Dolar veya Euro cinsinden faturalandırma yapabilir; FAST, havale, Wise veya SWIFT gibi dilediğiniz yasal bankacılık kanalını sözleşmenizde belirleyerek kullanabilirsiniz.",
    answerEn:
      "Yes. Operis does not restrict your payment currency or transaction methods. You may contract in TRY, USD, or EUR, and settle payments using any legal banking rail such as FAST, SEPA, Wise, or SWIFT as agreed in your mutual bilateral contract.",
  },

  // 3. ŞİFRELİ KÖR TEKLİFLER & FİYATLANDIRMA
  {
    id: "encrypted-blind-bidding",
    category: "offers",
    targetAudience: "freelancer",
    tags: ["şifreli teklif", "AES-256", "kör teklif", "fiyat kırma", "gizlilik", "undercutting"],
    questionTr: "Teklifler neden şifrelidir (AES-256 kör teklif)? Rakiplerim teklifimi görebilir mi?",
    questionEn: "Why are proposals encrypted (AES-256 blind bids)? Can competitors see my proposal or rate?",
    answerTr:
      "Hayır, teklifiniz rakiplerinize, arama motorlarına ve üçüncü şahıslara tamamen kapalıdır. Teklifinizin metni, bütçesi ve teslim süresi veritabanında AES-256-GCM ile şifrelenir ve yalnızca ilan sahibi tarafından çözülür. Bu sayede açık teklifli platformlarda yaşanan teklif kopyalama ve fiyat kırma savaşı (race to the bottom) tamamen önlenir; her mühendis emeğinin gerçek değerini sunar.",
    answerEn:
      "No. Your proposal is completely invisible to competitors, search engines, and third parties. Proposal text, rate, and delivery timeline are encrypted with AES-256-GCM at rest and can only be decrypted by the listing owner. This eliminates bid scraping and toxic undercutting, empowering engineers to price based on true merit.",
  },
  {
    id: "no-connects-or-pitch-fees",
    category: "offers",
    targetAudience: "freelancer",
    tags: ["connects", "teklif jetonu", "teklif ücreti", "ücretsiz teklif", "para kesintisi"],
    questionTr: "Teklif verirken ücret ödüyor muyum (Upwork Connects gibi bir sistem var mı)?",
    questionEn: "Do I have to pay to submit proposals (like Upwork Connects or tokens)?",
    answerTr:
      "Kesinlikle hayır. Operis'te teklif vermek tamamen ücretsizdir. Teklif başına ücret, kredi veya jeton satılmaz. Kalite ve spam kontrolü; yapay zeka içerik denetimi, hesap güvenilirlik skoru ve hız sınırlamalarıyla (rate limiting) sağlanır.",
    answerEn:
      "Strictly no. Submitting proposals on Operis is 100% free. We never charge for connects or proposal tokens. Spam prevention is enforced through automated content heuristics, developer credibility scores, and intelligent rate limiting.",
  },
  {
    id: "edit-or-withdraw-proposal",
    category: "offers",
    targetAudience: "freelancer",
    tags: ["teklif düzenleme", "teklif geri çekme", "teklif revize", "fiyat güncelleme"],
    questionTr: "Teklifimi gönderdikten sonra güncelleyebilir veya geri çekebilir miyim?",
    questionEn: "Can I edit or withdraw my proposal after submitting it?",
    answerTr:
      "İlan sahibi teklifinizi henüz kabul etmediği sürece, panelinizden teklif metnini, fiyatınızı veya teslimat sürenizi dilediğiniz gibi güncelleyebilir veya teklifinizi tamamen geri çekebilirsiniz. İlan sahibi tarafından onaylanan teklifler ise sözleşme aşamasına geçtiği için kilitlenir.",
    answerEn:
      "As long as the listing creator has not yet accepted your proposal, you can freely update your pitch, proposed rate, and timeline, or retract the proposal completely. Once accepted, the proposal snapshot is locked to ensure contract integrity.",
  },
  {
    id: "how-to-write-winning-proposal",
    category: "offers",
    targetAudience: "freelancer",
    tags: ["kazandıran teklif", "teklif taktikleri", "başarılı teklif", "portfolyo", "brief"],
    questionTr: "Teklifimin kabul edilme şansını nasıl artırabilirim?",
    questionEn: "How can I increase the acceptance chances of my proposal?",
    answerTr:
      "1. Kopyala-yapıştır genel metinlerden kaçının; müşterinin brief'inde belirttiği spesifik teknik problemi ele alın. 2. İlanın teknoloji yığınına birebir uyan en fazla 1-2 canlı referans veya GitHub reposu paylaşın. 3. İşi nasıl aşamalara (milestone) böleceğinizi ve teslim takviminizi net belirtin. Bu yaklaşımı benimseyen mühendislerin teklif kabul oranı 4 kat daha yüksektir.",
    answerEn:
      "1. Avoid generic copy-paste templates; address the client's specific architectural pain points directly. 2. Share 1-2 focused live links or GitHub repositories showcasing identical tech stack experience. 3. Outline your phased milestones and delivery schedule clearly. Engineers adopting this tailored approach experience a 4x higher acceptance rate.",
  },

  // 4. EŞLEŞME & DOĞRUDAN İLETİŞİM
  {
    id: "how-to-choose-best-developer",
    category: "matching",
    targetAudience: "client",
    tags: ["mühendis seçimi", "en iyi yazılımcı", "teklif değerlendirme", "portfolyo inceleme", "github"],
    questionTr: "Gelen teklifler arasından en doğru mühendisi nasıl seçebilirim?",
    questionEn: "How do I choose the best developer from the submitted proposals?",
    answerTr:
      "1. Şifreli kör teklifte mühendisin sunduğu mimari çözüm yaklaşımını ve problem analizi derinliğini inceleyin. 2. Teklifinde paylaştığı benzer canlı proje ve açık GitHub reposunu kontrol edin. 3. Profilindeki doğrulanmış hesap rozetlerine (GitHub, LinkedIn) bakın. 4. Anlaşma öncesinde çalışma alanından 10-15 dakikalık kısa bir teknik keşif görüşmesi (Google Meet / Zoom) talep edin.",
    answerEn:
      "1. Evaluate the engineer's architectural breakdown and problem comprehension in their proposal. 2. Review their provided live demos and open GitHub repositories for matching tech stacks. 3. Look for verified social trust badges (GitHub, LinkedIn). 4. Request a quick 10-15 minute discovery video sync via the bilateral workspace prior to awarding.",
  },
  {
    id: "matching-bilateral-workspace",
    category: "matching",
    targetAudience: "general",
    tags: ["eşleşme", "iletişim", "telefon", "e-posta", "çalışma alanı", "el sıkışma"],
    questionTr: "İlan sahibi teklifimi kabul edince ne olur? İletişim nasıl kurulur?",
    questionEn: "What happens when the client accepts my proposal? How is communication unlocked?",
    answerTr:
      "İlan sahibi teklifinizi onayladığı anda sistem iki taraf arasında özel bir 'İkili El Sıkışma ve Çalışma Alanı' açar. Her iki tarafın doğrulanmış telefon numarası, e-postası ve tercih edilen iletişim kanalları (WhatsApp, Slack, Google Meet, Zoom, Teams) anında görünür hale gelir.",
    answerEn:
      "The instant the listing creator accepts your proposal, a private 'Bilateral Handshake Workspace' unlocks. Verified phone numbers, email addresses, and communication preferences (WhatsApp, Slack, Google Meet, Zoom, Teams) are revealed to both parties.",
  },
  {
    id: "outside-communication-allowed",
    category: "matching",
    targetAudience: "general",
    tags: ["platform dışı iletişim", "WhatsApp serbest mi", "telefon yasağı", "iletişim özgürlüğü"],
    questionTr: "Platform dışı iletişim kurmak yasak mı? (WhatsApp, Slack, Telefon ile görüşebilir miyiz?)",
    questionEn: "Is off-platform communication prohibited? Can we communicate via WhatsApp, Slack, or Phone?",
    answerTr:
      "Hayır, diğer platformların aksine Operis'te iletişim ambargosu veya platform dışı iletişim yasağı KESİNLİKLE YOKTUR. Tam aksine doğrudan iletişim teşvik edilir. Dilediğiniz araçla (telefon görüşmesi, WhatsApp, Slack, Zoom, Google Meet veya yüz yüze) görüşebilir ve projenizi en verimli şekilde yürütebilirsiniz.",
    answerEn:
      "No! Unlike restrictive platforms that ban users for exchanging contact details, Operis strictly encourages direct communication. You have 100% freedom to connect via phone, WhatsApp, Slack, Google Meet, Zoom, or face-to-face meetings without penalties.",
  },
  {
    id: "quick-ping-feature",
    category: "matching",
    targetAudience: "general",
    tags: ["hızlı ping", "quick ping", "acil bildirim", "sms", "cooldown"],
    questionTr: "Hızlı Ping (Quick Ping) özelliği nedir ve nasıl çalışır?",
    questionEn: "What is the Quick Ping feature and how does it work?",
    answerTr:
      "Eşleşme sağlandıktan sonra acil durumlar veya kritik proje güncellemeleri için karşı tarafa doğrudan anlık bildirim ve SMS uyarısı gönderen bir özelliktir. Taciz ve spam bildirimleri önlemek amacıyla iki ping arasında 15 dakikalık bekleme süresi (cooldown) ve gece nezaket filtresi (00:00-08:00 arası sessiz mod) bulunur.",
    answerEn:
      "Quick Ping is an instant notification trigger inside your mutual workspace for urgent project checkpoints. To prevent spam fatigue, it features a 15-minute cooldown between pings and a night courtesy guard (silent delivery between 00:00 and 08:00 in the counterparty's timezone).",
  },
  {
    id: "unresponsive-counterparty",
    category: "matching",
    targetAudience: "general",
    tags: ["cevap vermiyor", "ulaşılamıyor", "iptal", "eşleşme iptali", "geri alma"],
    questionTr: "Eşleşme kurulduktan sonra taraflardan biri yanıt vermezse ne yapılmalıdır?",
    questionEn: "What should I do if the counterparty becomes unresponsive after matching?",
    answerTr:
      "Çalışma alanındaki 'Ulaşılamıyor Bildir' butonunu kullanabilirsiniz. Sistem karşı tarafa acil durum hatırlatması iletir. 48 saat boyunca hiçbir kanaldan geri dönüş alınamazsa, ilan sahibi eşleşmeyi iptal edip ilanını tekrar radara alabilir; mühendis ise zaman kaybı yaşamadan profilini serbest bırakabilir.",
    answerEn:
      "You can trigger the 'Report Unresponsive' action in the workspace. Our system sends an automated high-priority reminder. If no response is received within 48 hours, the listing owner can reset the match and resume radar discovery, while the engineer is freed without penalties.",
  },

  // 5. YASAL MEVZUAT, SÖZLEŞME & FİKRİ MÜLKİYET
  {
    id: "tax-invoicing-smm",
    category: "legal",
    targetAudience: "freelancer",
    tags: ["vergi", "fatura", "e-SMM", "stopaj", "KDV", "arızi kazanç", "genç girişimci", "2026 mevzuat"],
    questionTr: "Freelance çalışırken fatura kesmek zorunda mıyım? (e-SMM, e-Arşiv, Genç Girişimci istisnası)",
    questionEn: "Am I legally required to issue invoices? (e-SMM, e-Archive, Youth Entrepreneur exemption)",
    answerTr:
      "Türkiye 2026 vergi mevzuatı gereğince: Süreklilik arz eden bağımsız yazılım/tasarım hizmeti sunan mühendisler serbest meslek mükellefiyeti açarak e-Serbest Meslek Makbuzu (e-SMM) veya şahıs/limited şirketi üzerinden e-Arşiv Fatura düzenlemelidir. 18-29 yaş arası ilk kez iş kuran mühendisler 3 yıl boyunca 'Genç Girişimci Kazanç İstisnası'ndan yararlanabilir. Tek seferlik küçük işlerde yıllık yasal sınır altındaki kazançlar arızi kazanç kapsamında değerlendirilebilir. Ayrıntılar için mali müşavirinize danışmanız tavsiye edilir.",
    answerEn:
      "Under Turkish tax regulations: Independent contractors providing regular development services should issue electronic receipts (e-SMM) or corporate e-Archive invoices. First-time entrepreneurs aged 18-29 can leverage the Youth Entrepreneur tax exemption. Irregular one-off projects below annual statutory limits may qualify as occasional income (arızi kazanç). We recommend consulting a certified CPA.",
  },
  {
    id: "intellectual-property-fsek",
    category: "legal",
    targetAudience: "client",
    tags: ["telif hakkı", "fikri mülkiyet", "FSEK", "kaynak kod", "mali haklar", "hak devri"],
    questionTr: "Yazılım ve tasarımın telif hakları (fikri mülkiyet) kime aittir? (FSEK m. 52 devri)",
    questionEn: "Who owns the intellectual property and source code? (FSEK Article 52 transfer)",
    answerTr:
      "5846 sayılı Fikir ve Sanat Eserleri Kanunu (FSEK) uyarınca bir yazılımın veya tasarımın manevi hakları her zaman onu üreten mühendise aittir ve devredilemez. Ancak mali haklar (işleme, çoğaltma, yayma, umuma iletim) yazılı sözleşmeyle müşteriye devredilebilir. Operis'in tavsiye ettiği standart sözleşmede: 'Proje bedeli eksiksiz ödendiği anda yazılımın tüm mali hakları ve kaynak kod mülkiyeti müşteriye geçer' hükmü uygulanır.",
    answerEn:
      "Under Copyright Law (FSEK), moral authorship rights remain permanently with the creator. However, economic exploitation rights (reproduction, distribution, public transmission) are assignable via written contract under FSEK Art. 52. Our standard contract stipulate that full economic rights and source code ownership transfer to the client upon full payment clearance.",
  },
  {
    id: "client-bug-warranty",
    category: "legal",
    targetAudience: "client",
    tags: ["garanti", "hata düzeltme", "bug fix", "ayıp", "kabul kriteri"],
    questionTr: "Teslim aldığım yazılımda hata (bug) çıkarsa garanti süresi var mıdır?",
    questionEn: "Is there a bug warranty period for the delivered software?",
    answerTr:
      "Operis standart sözleşme şablonunda teslimat sonrasında 14 ila 30 günlük bir 'Ayıp ve Hata Garanti Süresi' tavsiye edilir. Bu süre zarfında yazılımcı, proje brief'inde taahhüt edilen işlevlerde meydana gelen teknik hataları (bug) ücretsiz olarak düzeltmekle yükümlüdür. Ancak bu garanti yeni özellik veya tasarım değişikliklerini kapsamaz; yeni talepler ek ücrete tabidir.",
    answerEn:
      "Our standard contract templates recommend a 14 to 30-day post-delivery 'Defect & Bug Warranty Period'. During this window, the engineer is obligated to remedy technical bugs contradicting agreed specifications at zero additional charge. This does not cover out-of-scope feature additions, which require separate billing.",
  },
  {
    id: "nda-and-confidentiality",
    category: "legal",
    targetAudience: "general",
    tags: ["NDA", "gizlilik sözleşmesi", "ticari sır", "taslak sözleşme", "sözleşme şablonu"],
    questionTr: "Gizlilik Sözleşmesi (NDA) imzalamak gerekir mi? Operis taslak sunuyor mu?",
    questionEn: "Should we sign a Non-Disclosure Agreement (NDA)? Does Operis provide templates?",
    answerTr:
      "Özellikle özgün fikri mülkiyet, patentlenebilir algoritmalar veya ticari sırlar içeren projelerde işe başlamadan önce mutlaka karşılıklı NDA imzalanmalıdır. Operis panelindeki Yasal Merkez üzerinden Türkiye 2026 mevzuatına tam uyumlu 'Standart İkili Gizlilik Sözleşmesi' ve 'Yazılım Eser Sözleşmesi' taslaklarını tek tıkla indirip kullanabilirsiniz.",
    answerEn:
      "For proprietary algorithms, trade secrets, or unreleased product concepts, executing a bilateral NDA before code inspection is essential. You can download our legally vetted 2026-compliant 'Standard Bilateral NDA' and 'Software Services Agreement' templates directly from our Legal Hub.",
  },
  {
    id: "operis-legal-standing-5651",
    category: "legal",
    targetAudience: "general",
    tags: ["5651 kanun", "yer sağlayıcı", "sorumluluk reddi", "dava", "yasal statü"],
    questionTr: "Operis taraflar arasındaki ticari uyuşmazlıklarda veya davalarda taraf olur mu?",
    questionEn: "Is Operis a legal party or guarantor in commercial disputes between users?",
    answerTr:
      "Hayır. 5651 sayılı Kanun ve 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun uyarınca Operis 'Yer Sağlayıcı' ve bağımsız bir ilan eşleştirme platformudur. Tarafların birbirlerine olan borç, taahhüt, ayıplı ifa veya telif ihlallerinin tarafı veya kefili değildir. Tarafların haklarını koruması için yazılı sözleşmeyle çalışmaları esastır.",
    answerEn:
      "No. Under Law No. 5651 and Law No. 6563, Operis operates strictly as an 'Intermediary Hosting Provider'. Operis is never a party, guarantor, or surety to commercial obligations, code defects, or payment defaults between users. Parties protect their legal standing through their mutual written contracts.",
  },

  // 6. GÜVENLİK, DOLANDIRICILIK ÖNLEME & UYUŞMAZLIK
  {
    id: "project-delay-or-cancellation",
    category: "safety",
    targetAudience: "client",
    tags: ["gecikme", "proje iptali", "yarıda bırakma", "fesih", "sözleşme cezası"],
    questionTr: "Yazılımcı projeyi geciktirirse veya yarıda bırakırsa ne yapmalıyım?",
    questionEn: "What happens if the developer causes delays or abandons the project?",
    answerTr:
      "3 Kademeli Hakediş modeli bu riski sıfırlar. Yalnızca teslim edilen ve onaylanan aşamanın ödemesini yapmış olursunuz. Proje başında imzalanan sözleşmede 'günlük gecikme cezası' ve 'haklı nedenle fesih' maddesi bulunmalıdır. Yazılımcı taahhüdünü yerine getiremezse sözleşmeyi feshedip mevcut kod teslimini alabilir ve kalan bütçeyle başka bir mühendisle devam edebilirsiniz.",
    answerEn:
      "The 3-Tier Milestone Model mitigates this risk by ensuring you only pay for verified, completed stages. Your contract should stipulate reasonable delay penalties and formal termination terms. If a contractor defaults, you terminate pursuant to contract terms, retain all deliverables to date, and re-allocate remaining capital to a new hire.",
  },
  {
    id: "scam-prevention-freelancers",
    category: "safety",
    targetAudience: "freelancer",
    tags: ["dolandırıcılık önleme", "güvenlik", "avanssız çalışma", "kod teslimi", "scam"],
    questionTr: "Freelance çalışırken dolandırıcılıktan ve ödeme alamamaktan nasıl korunurum?",
    questionEn: "How can freelancers protect themselves from non-payment and fraudulent clients?",
    answerTr:
      "1. Asla sözleşmesiz ve avans almadan işe başlamayın (en az %30 avans talep edin). 2. Nihai ödeme hesabınıza geçmeden kaynak kodları, veritabanı şifrelerini veya sunucu yetkilerini teslim etmeyin. 3. İncelemeleri kendi test/staging sunucunuzda veya ekran paylaşımıyla yapın. 4. 'Ücretsiz deneme projesi yapın, beğenirsek işe alacağız' tuzaklarına kesinlikle düşmeyin.",
    answerEn:
      "1. Never write code without a written contract and a verified advance payment (minimum 30%). 2. Never hand over raw source code, repository admin rights, or production server credentials until the final payment clears. 3. Host interim demos on your own staging environment or screen-share. 4. Reject uncompensated 'spec work' or free trial assignments.",
  },
  {
    id: "client-asking-for-deposit-scam",
    category: "safety",
    targetAudience: "freelancer",
    tags: ["para isteme", "teminat dolandırıcılığı", "sigorta ücreti", "kırmızı bayrak", "sahte iş"],
    questionTr: "İşveren işe başlamak için benden para/teminat talep ederse ne yapmalıyım?",
    questionEn: "What if a prospective client asks me for an upfront deposit or verification fee?",
    answerTr:
      "KESİNLİKLE HİÇBİR ŞEKİLDE PARA GÖNDERMEYİN. 'Teminat bedeli, dosya masrafı, ekipman sigortası veya yazılım lisansı' adı altında para isteyen tüm profiller %100 dolandırıcıdır. Gerçek bir işveren işe alacağı mühendisten asla para istemez. Böyle bir durumla karşılaştığınızda hesabı derhal Operis İhbar Masası'na bildirin.",
    answerEn:
      "STRICTLY NEVER SEND FUNDS. Any listing creator requesting an upfront 'security deposit, registration fee, insurance charge, or software license fee' is 100% fraudulent. Legitimate clients NEVER ask contractors for money. If you encounter this, report the profile immediately to our Abuse Desk.",
  },
  {
    id: "scope-creep-and-revisions",
    category: "safety",
    targetAudience: "freelancer",
    tags: ["revizyon", "kapsam kayması", "scope creep", "ek istekler", "anlaşmazlık"],
    questionTr: "İşveren teslimatı beğenmezse veya sınırsız revizyon talep ederse ne olur?",
    questionEn: "What happens if a client demands endless revisions or complains about deliverables?",
    answerTr:
      "Kapsam kayması (scope creep) sorununu önlemenin yolu baştan yazılı sınırlar çizmektir. Sözleşmenize 'İşbu fiyata en fazla 2 tur makul revizyon dahildir; iş tanımı dışındaki yeni özellik ve tasarım değişiklikleri saatlik ek ücrete tabidir' maddesini ekleyin. Teslimatları önceden üzerinde anlaşılan 'Kabul Kriterleri' (Acceptance Criteria) listesine göre test edip teslim tutanağı ile onaylatın.",
    answerEn:
      "Prevent scope creep by defining strict boundaries upfront. Include a clause in your agreement: 'This milestone includes up to 2 rounds of minor revisions; features beyond the original brief are billed at the agreed hourly rate.' Measure deliverables strictly against mutually signed Acceptance Criteria.",
  },
  {
    id: "abuse-reporting-and-blacklist",
    category: "safety",
    targetAudience: "general",
    tags: ["şikayet", "kötüye kullanım", "ihbar", "kara liste", "engelleme", "moderatör"],
    questionTr: "Kötü niyetli veya kural ihlali yapan bir kullanıcıyla karşılaşırsam ne yapmalıyım?",
    questionEn: "What should I do if I encounter a malicious actor or bad-faith counterparty?",
    answerTr:
      "Operis platformunda dürüstlük ve saygı kırmızı çizgimizdir. Şüpheli davranış sergileyen, tacizde bulunan veya dolandırıcılık girişiminde bulunan hesapları 'Kötüye Kullanım Bildir' butonundan ekran görüntüleriyle birlikte iletebilirsiniz. Moderasyon ekibimiz ihlali doğruladığı takdirde ilgili kullanıcının hesabı, IP'si ve telefon numarası kalıcı olarak kara listeye alınır ve platformdan men edilir.",
    answerEn:
      "Integrity and professionalism are non-negotiable on Operis. If you encounter harassment, breach of trust, or fraudulent behavior, click 'Report Abuse' and submit relevant logs or screenshots. Upon investigation, verified violators have their accounts, phone numbers, and IP ranges permanently blacklisted.",
  },
];
