import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Clock,
  FileWarning,
  Scale,
  ShieldAlert,
  FileText,
  Building2,
  ExternalLink,
  HelpCircle,
  Gavel,
  Briefcase,
  Users,
} from "lucide-react";
import { ReportForm } from "@/src/components/reports/report-form";
import { getSession } from "@/src/modules/auth/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  return {
    title: isTr
      ? "İhlal & Şikayet Bildirim Merkezi — Güvenlik, Denetim & Uyum | Operis"
      : "Trust, Safety & Incident Response Hub — Security & Compliance | Operis",
    description: isTr
      ? "Operis topluluk güvenliği, dolandırıcılık önleme, FSEK/telif hakları ve uyuşmazlık çözümü için 5651 ve KVKK standartlarında resmi ihbar masası."
      : "Official incident intake desk for scam prevention, DMCA/IP copyright protection, and neutral dispute resolution under statutory cyber regulations.",
    alternates: {
      canonical: isTr ? "/tr/sikayet-bildir" : "/en/report",
      languages: {
        tr: "/tr/sikayet-bildir",
        en: "/en/report",
      },
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ type?: string; target?: string }>;
}) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  setRequestLocale(locale);
  const session = await getSession();
  const isTr = locale === "tr";

  // Trust & Safety Platform Metrics
  const safetyMetrics = [
    {
      value: "< 2 Saat",
      label: isTr ? "Acil Triage SLA" : "Urgent Triage SLA",
      detail: isTr ? "Finansal risk ve dolandırıcılıkta 7/24 anlık müdahale" : "24/7 Rapid response on financial risks & fraud",
      color: "text-rose-400 border-rose-500/20 bg-rose-500/10",
    },
    {
      value: "%100",
      label: isTr ? "Gizlilik Güvencesi" : "Confidentiality",
      detail: isTr ? "İhbarcı kimliği karşı tarafa asla ifşa edilmez" : "Whistleblower identity strictly masked & protected",
      color: "text-blue-400 border-blue-500/20 bg-blue-500/10",
    },
    {
      value: "%99.4",
      label: isTr ? "Hakem Çözüm Başarısı" : "Dispute Resolution",
      detail: isTr ? "Çift taraflı dijital delil inceleme ve emanet koruma" : "Bilateral evidence audit & secure escrow freeze",
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    },
    {
      value: "5651 & FSEK",
      label: isTr ? "Yasal Uyum Zırhı" : "Statutory Defense",
      detail: isTr ? "Resmi Yer Sağlayıcı Uyar-Kaldır & KEP Entegrasyonu" : "Statutory Notice & Takedown via registered KEP",
      color: "text-purple-400 border-purple-500/20 bg-purple-500/10",
    },
  ];

  // 4 Specialized Intake Desks
  const specializedDesks = [
    {
      icon: ShieldAlert,
      title: isTr ? "Dolandırıcılık & Sahte İlan Masası" : "Fraud & Scam Investigation",
      email: "dolandiricilik@operis.pro",
      sla: isTr ? "< 2 - 4 Saat" : "< 2 - 4 Hours",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      desc: isTr
        ? "Platform dışı ödeme yönlendirmeleri, sahte portföy linkleri, kimlik hırsızlığı ve hesap gaspı girişimleri."
        : "Off-platform payment solicitation, counterfeit portfolios, identity impersonation, and unauthorized credential abuse.",
    },
    {
      icon: Scale,
      title: isTr ? "Fikri Mülkiyet & Telif Masası (FSEK)" : "Intellectual Property & Copyright",
      email: "telif@operis.pro",
      sla: isTr ? "< 12 İş Saati" : "< 12 Business Hours",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      desc: isTr
        ? "Kaynak kod hırsızlığı, tescilli marka gaspı, lisans sözleşmesi ihlalleri ve FSEK Ek Madde 4 Uyar-Kaldır bildirimleri."
        : "Unauthorized source code duplication, trademark infringement, license breaches, and statutory Notice & Takedown requests.",
    },
    {
      icon: ShieldCheck,
      title: isTr ? "Kişisel Veri, Taciz & Etik Masası" : "Privacy, Harassment & Conduct",
      email: "uyum@operis.pro",
      sla: isTr ? "< 6 İş Saati" : "< 6 Business Hours",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      desc: isTr
        ? "Doxxing, KVKK veri ifşası, platform dışı tehdit, şantaj veya profesyonel etik kurallarına aykırı davranışlar."
        : "Doxxing, personal data leaks under privacy law, extortion, off-platform harassment, and ethical code breaches.",
    },
    {
      icon: Briefcase,
      title: isTr ? "Sözleşme & Emanet Hesap Uyuşmazlıkları" : "Milestone & Escrow Dispute Board",
      email: "hakemlik@operis.pro",
      sla: isTr ? "< 24 İş Saati" : "< 24 Business Hours",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      desc: isTr
        ? "Şartnameye aykırı teslimatlar, haksız onay geciktirmeleri veya emanet bakiye iade anlaşmazlıklarında bağımsız tahkim."
        : "Unfulfilled deliverables, unjustified milestone approvals, or escrow disbursement disputes evaluated by neutral arbiters.",
    },
  ];

  // 4-Stage Soruşturma & Uyuşmazlık Çözüm Süreci
  const resolutionLifecycle = [
    {
      step: "01",
      icon: Clock,
      title: isTr ? "Şifreli Tescil & Triage" : "Encrypted Logging & Triage",
      time: isTr ? "0 - 2 Saat" : "0 - 2 Hours",
      desc: isTr
        ? "Bildiriminiz sistemde kriptografik zaman damgasıyla tescillenir ve aciliyet derecesine göre önceliklendirilir."
        : "Your report is logged with an immutable cryptographic timestamp and categorized according to urgency score.",
    },
    {
      step: "02",
      icon: Users,
      title: isTr ? "Çift Taraflı Dijital İnceleme" : "Bilateral Digital Evidence Audit",
      time: isTr ? "2 - 12 Saat" : "2 - 12 Hours",
      desc: isTr
        ? "Moderatörlerimiz proje şartnamesi, mesajlaşma logları, teslim edilen dosyalar ve IP verilerini objektif olarak kıyaslar."
        : "Senior auditors inspect project scopes, timestamped message history, submitted files, and device telemetry.",
    },
    {
      step: "03",
      icon: Lock,
      title: isTr ? "Geçici Koruma & Escrow Blokajı" : "Protective Escrow Freeze",
      time: isTr ? "Gerektiğinde Anlık" : "Immediate if Necessary",
      desc: isTr
        ? "Finansal kayıp veya devam eden ihlal riski varsa, şüpheli ilan dondurulur ve emanet hesap bakiyesi güvenceye alınır."
        : "If active fraud or capital risk is detected, suspect listings and project escrow balances are locked immediately.",
    },
    {
      step: "04",
      icon: Gavel,
      title: isTr ? "Nihai Yaptırım & Gerekçeli Rapor" : "Final Enforcement & Decision",
      time: isTr ? "Dosya Kapanışı" : "Case Closed",
      desc: isTr
        ? "Kural ihlali yapan hesap kalıcı olarak uzaklaştırılır, haksız işlemler iptal edilir ve bildirim sahibine gerekçe raporlanır."
        : "Violating accounts receive permanent suspensions, refunds are executed, and a formal justification report is issued.",
    },
  ];

  // Trust & Safety FAQ
  const safetyFaq = [
    {
      qTr: "Şikayet ettiğim kişi veya ajans benim şikayet ettiğimi öğrenebilir mi?",
      qEn: "Can the reported user or agency find out that I reported them?",
      aTr: "Hayır. Operis Muhbirlik ve Gizlilik Politikası uyarınca tüm bildirimler katı biçimde anonim tutulur. Karşı tarafa yalnızca ihlale konu olan genel içerik veya kural bildirilir; ihbarcının kullanıcı adı, e-postası veya kişisel verileri hiçbir koşulda paylaşılmaz.",
      aEn: "Never. In accordance with Operis Whistleblower Protections, all reports remain strictly confidential. The reported entity only receives general notice of the rule violation; your handle, email, and identity are never disclosed.",
    },
    {
      qTr: "İnceleme süresince emanet hesaptaki (escrow) proje ödemesi ne olur?",
      qEn: "What happens to the escrow payment while the dispute is investigated?",
      aTr: "Aktif bir uyuşmazlık veya dolandırıcılık ihbarı açıldığında, ilgili dönüm noktasına (milestone) ait emanet bakiye anında dondurulur. İki tarafın da rızası olmadan veya Operis Hakem Kurulu nihai gerekçeli kararını açıklamadan fonlar hiçbir tarafa aktarılmaz.",
      aEn: "Upon opening a formal dispute, funds in the affected milestone are immediately placed under escrow lock. No funds can be released or withdrawn until both parties agree or the Operis Arbitration Board issues its final ruling.",
    },
    {
      qTr: "Telif hakkı (FSEK / DMCA) ihlallerinde hangi resmi belgeler gereklidir?",
      qEn: "What official documentation is required for copyright (IP / DMCA) claims?",
      aTr: "Hak sahibi olduğunuza dair orijinal kaynak kod deposu linki (commit geçmişiyle), noter tescil belgesi, Kültür Bakanlığı telif kaydı veya marka tescil belgesi sunulmalıdır. Ayrıca ihlalin yer aldığı tam Operis ilan URL'si belirtilmelidir.",
      aEn: "You must provide clear proof of authorship (original repo with verifiable commit history, trademark certificate, or notary deposit) along with the exact Operis URLs containing the infringing work.",
    },
    {
      qTr: "Haksız veya kötü niyetli bir ihbarla karşılaşırsam savunma hakkım var mı?",
      qEn: "Do I have a right of defense if a false or malicious report is filed against me?",
      aTr: "Evet. Tarafsızlık ilkemiz gereğince şüpheliye 24 saatlik savunma ve karşı kanıt sunma süresi tanınır. Asılsız, karalama amaçlı veya rekabeti engellemeye yönelik kötü niyetli ihbarlar sistem loglarından tespit edilerek ihbarı yapan hesap hakkında yaptırım uygulanır.",
      aEn: "Yes. In line with fair arbitration, respondents receive a formal notification to submit counter-evidence within 24 hours. Knowingly false, defamatory, or anti-competitive reports are heavily penalized.",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
          <span>{isTr ? "Operis Platformuna Dön" : "Return to Operis Platform"}</span>
        </Link>
      </div>

      {/* Hero Header */}
      <header className="space-y-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 shadow-sm">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isTr ? "5651 & KVKK UYUMLU GÜVENLİK VE UYUŞMAZLIK MERKEZİ" : "STATUTORY COMPLIANCE & INCIDENT HUB"}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
          {isTr ? "Güvenlik, Denetim & İhlal Bildirim Merkezi" : "Trust, Safety & Incident Response Hub"}
        </h1>

        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
          {isTr
            ? "Operis topluluğunun dürüstlüğünü, finansal güvenliğini ve fikri mülkiyet haklarını korumak için bağımsız denetmenlerimiz ve 5651 Uyar-Kaldır protokolümüz 7/24 hizmetinizdedir."
            : "Protecting ecosystem integrity, escrow capital, and intellectual property. Our independent arbitration board and statutory takedown desks operate around the clock."}
        </p>
      </header>

      {/* 4 Trust & Safety Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {safetyMetrics.map((m, idx) => (
          <div
            key={idx}
            className="p-5 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl space-y-2 shadow-sm"
          >
            <div className={`inline-flex px-2.5 py-1 rounded-lg text-sm font-mono font-extrabold border ${m.color}`}>
              {m.value}
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">{m.label}</h2>
              <p className="text-[11px] text-[var(--color-text-tertiary)] leading-snug mt-1">
                {m.detail}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* 4 Specialized Intake Desks */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
            {isTr ? "ÖZEL İNCELEME MASALARI" : "SPECIALIZED RESPONSE DESKS"}
          </h2>
          <p className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-primary)]">
            {isTr ? "Her İhlal Türüne Özel Yetkili Birim" : "Dedicated Units for Every Incident"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specializedDesks.map((desk, idx) => {
            const Icon = desk.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl space-y-4 hover:border-[var(--color-border-strong)] transition-all shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`p-3 rounded-2xl border ${desk.color}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                      <Clock className="h-3 w-3 text-blue-400" />
                      <span>{desk.sla}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                      {desk.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mt-1.5">
                      {desk.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--color-border-subtle)]/60 flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-tertiary)]">
                    {isTr ? "Doğrudan Masası:" : "Direct Desk:"}
                  </span>
                  <a
                    href={`mailto:${desk.email}`}
                    className="font-mono font-semibold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>{desk.email}</span>
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Terminal Card (The Interactive Form) */}
      <section className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/90 backdrop-blur-2xl p-6 sm:p-12 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32" />

        {/* Section Header */}
        <div className="space-y-3 text-center max-w-2xl mx-auto relative">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-sm">
            <FileWarning className="h-7 w-7" aria-hidden="true" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            {isTr ? "Resmi İhlal & Şikayet Başvuru Formu" : "Formal Incident & Violation Intake Form"}
          </h2>

          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {isTr
              ? "Şüpheli durumu, hedef bağlantısını ve delillerinizi girerek güvenli vaka kaydı oluşturun. Bildiriminiz kriptografik olarak kaydedilir."
              : "Provide incident context, target identifiers, and evidence links. Your filing is cryptographically indexed and queued for neutral adjudication."}
          </p>
        </div>

        {/* Confidentiality Guarantee Banner */}
        <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs">
          <Lock className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <span className="font-bold text-[var(--color-text-primary)] block">
              {isTr ? "100% Gizlilik ve Muhbirlik Koruma Zırhı" : "100% Whistleblower Protection Guarantee"}
            </span>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {isTr
                ? "Kimliğiniz, kullanıcı adınız ve şikayet kayıtlarınız şikayet edilen kullanıcı veya ajansa ASLA ifşa edilmez. Tüm soruşturmalar bağımsız Operis denetim protokolü üzerinden yürütülür."
                : "Your identity, handle, and contact details are strictly confidential and NEVER disclosed to the reported entity under any circumstance."}
            </p>
          </div>
        </div>

        {/* The Form */}
        <div className="pt-2 relative">
          <ReportForm
            locale={locale}
            defaultTargetType={sp.type || "listing"}
            defaultTargetIdentifier={sp.target || ""}
            hasSession={Boolean(session?.userId)}
          />
        </div>
      </section>

      {/* 4-Stage Investigation & Resolution Lifecycle */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
            {isTr ? "DENETİM METODOLOJİSİ" : "RESOLUTION WORKFLOW"}
          </h2>
          <p className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-primary)]">
            {isTr ? "Bildirim Sonrası 4 Aşamalı Soruşturma Süreci" : "4-Stage Investigation & Enforcement Lifecycle"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resolutionLifecycle.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-xl space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold font-mono text-[var(--color-border-strong)]">
                    {stage.step}
                  </span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {stage.title}
                  </h3>
                  <span className="text-[10px] font-mono text-blue-400 block font-semibold">
                    {stage.time}
                  </span>
                </div>

                <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
                  {stage.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5651 & FSEK Statutory Notice & Takedown Protocol */}
      <section className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider text-purple-400 bg-purple-500/10 uppercase">
              {isTr ? "Yasal Mevzuat Çerçevesi" : "Statutory Framework"}
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              {isTr
                ? "5651 Sayılı Kanun & FSEK m. 52 Uyar-Kaldır Bildirim Protokolü"
                : "Statutory Notice & Takedown Protocol (5651 & Copyright Act)"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-purple-300">
              {isTr ? "Resmi Tebligat Masası" : "Official Legal Desk"}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {isTr
            ? "Operis Teknoloji ve Yazılım Çözümleri A.Ş., 5651 Sayılı Kanun kapsamında 'Yetkili Yer Sağlayıcı' sıfatını haizdir. Platformda yer alan kullanıcı içeriklerinden doğan hak ihlallerinde, Fikir ve Sanat Eserleri Kanunu (FSEK) Ek Madde 4 gereğince 'Uyar-Kaldır' (Notice & Takedown) mekanizması işletilir."
            : "Operis Teknoloji ve Yazılım Çözümleri A.Ş. operates as a certified Hosting Provider under Law No. 5651. For intellectual property violations, statutory Notice & Takedown procedures are strictly executed under relevant copyright statutes."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-4 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] space-y-2">
            <h3 className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-purple-400" />
              <span>{isTr ? "Resmi Tebligat & KEP Bilgileri" : "Registered Legal Addresses"}</span>
            </h3>
            <ul className="space-y-1.5 text-[11px] text-[var(--color-text-tertiary)]">
              <li>
                <strong className="text-[var(--color-text-secondary)]">{isTr ? "Ticari Unvan:" : "Entity:"}</strong>{" "}
                Operis Teknoloji ve Yazılım Çözümleri A.Ş.
              </li>
              <li>
                <strong className="text-[var(--color-text-secondary)]">KEP:</strong>{" "}
                <code className="text-purple-400 font-mono">operis.teknoloji@hs01.kep.tr</code>
              </li>
              <li>
                <strong className="text-[var(--color-text-secondary)]">UETS:</strong>{" "}
                <code className="text-purple-400 font-mono">25987-14235-89654</code>
              </li>
              <li>
                <strong className="text-[var(--color-text-secondary)]">{isTr ? "E-Posta:" : "Legal Email:"}</strong>{" "}
                <a href="mailto:hukuk@operis.pro" className="text-purple-400 hover:underline">
                  hukuk@operis.pro
                </a>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] space-y-2">
            <h3 className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-purple-400" />
              <span>{isTr ? "Zorunlu Hukuki Asgari Unsurlar" : "Mandatory Notice Requirements"}</span>
            </h3>
            <ul className="space-y-1 text-[11px] text-[var(--color-text-tertiary)] list-disc list-inside">
              <li>{isTr ? "Hak sahibi olduğunu tevsik eden tescil veya sözleşme belgesi" : "Proof of copyright ownership or license agreement"}</li>
              <li>{isTr ? "İhlale konu eserin Operis platformundaki tam sayfa URL'si" : "Exact Operis URL of the infringing listing or asset"}</li>
              <li>{isTr ? "Başvuranın açık kimlik, unvan, TCKN/VKN ve iletişim bilgileri" : "Legal entity identity, tax ID, and contact details"}</li>
              <li>{isTr ? "Elektronik imza veya ıslak imzalı başvuru dilekçesi" : "Qualified electronic signature or signed legal petition"}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trust & Safety FAQ */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{isTr ? "GÜVENLİK & ŞİKAYET SSS" : "TRUST & SAFETY FAQ"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-primary)]">
            {isTr ? "Sıkça Sorulan Sorular ve Yasal Güvenceler" : "Frequently Asked Questions & Guarantees"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safetyFaq.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 space-y-2.5 shadow-sm"
            >
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-start gap-2">
                <span className="text-blue-400 font-mono text-xs mt-0.5">Q.</span>
                <span>{isTr ? item.qTr : item.qEn}</span>
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed pl-5">
                {isTr ? item.aTr : item.aEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Law Enforcement Inquiries Banner */}
      <section className="p-6 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <Scale className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-[var(--color-text-primary)] block">
              {isTr
                ? "Adli Makamlar, Savcılık & Emniyet Müzekkereleri"
                : "Law Enforcement & Judicial Authority Inquiries"}
            </span>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              {isTr
                ? "Cumhuriyet Başsavcılıkları ve kolluk kuvvetlerinin resmi müzekkere talepleri için adli irtibat kanalı:"
                : "Official expedited channel for judicial court orders, prosecutor requests, and cybercrime units:"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="mailto:adli@operis.pro"
            className="font-mono text-xs font-semibold px-4 py-2 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] hover:border-blue-500/40 text-blue-400 hover:text-blue-300 transition-colors"
          >
            adli@operis.pro
          </a>
        </div>
      </section>
    </main>
  );
}
