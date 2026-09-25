import {
  Send,
  GitCommit,
  ScrollText,
  Building2,
  Code2,
  ShieldCheck,
  Check,
  Copy,
  Download,
  X,
  Lock,
  Pin,
  Scale,
  Shield,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { MilestoneDto } from "@/src/modules/engagements/milestone-service";
import { MilestoneDeliverableUrlType } from "@/src/modules/engagements/milestone-synthesizer";
import type { IpAssignmentDeed } from "@/src/modules/engagements/ip-assignment/ip-assignment-types";
import { IpAssignmentDeedEngine } from "@/src/modules/engagements/ip-assignment/ip-assignment-engine";

interface MilestoneEvidenceViewerProps {
  // Deliverable Modal Props
  deliverableModalOpen: boolean;
  selectedMilestone: MilestoneDto | null;
  deliverableUrl: string;
  setDeliverableUrl: (v: string) => void;
  deliverableUrlType: MilestoneDeliverableUrlType;
  setDeliverableUrlType: (v: MilestoneDeliverableUrlType) => void;
  gitCommitHash: string;
  setGitCommitHash: (v: string) => void;
  deliverableNote: string;
  setDeliverableNote: (v: string) => void;
  isSubmittingDeliverable: boolean;
  actionError: string | null;
  onSubmitDeliverable: (status: "IN_PROGRESS" | "SUBMITTED") => void;
  onCloseDeliverableModal: () => void;

  // IP Deed Modal Props
  ipDeedModalOpen: boolean;
  selectedIpDeed: IpAssignmentDeed | null;
  copiedIpDeed: boolean;
  setCopiedIpDeed: (v: boolean) => void;
  onCloseIpDeedModal: () => void;

  isTr: boolean;
}

export function MilestoneEvidenceViewer({
  deliverableModalOpen,
  selectedMilestone,
  deliverableUrl,
  setDeliverableUrl,
  deliverableUrlType,
  setDeliverableUrlType,
  gitCommitHash,
  setGitCommitHash,
  deliverableNote,
  setDeliverableNote,
  isSubmittingDeliverable,
  actionError,
  onSubmitDeliverable,
  onCloseDeliverableModal,
  ipDeedModalOpen,
  selectedIpDeed,
  copiedIpDeed,
  setCopiedIpDeed,
  onCloseIpDeedModal,
  isTr,
}: MilestoneEvidenceViewerProps) {
  return (
    <>
      {/* Deliverable Submission Modal */}
      {deliverableModalOpen && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-400" />
                <span>
                  {selectedMilestone.sequenceNumber}. {selectedMilestone.title}
                </span>
              </h3>
              <button
                type="button"
                onClick={onCloseDeliverableModal}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">
                  {isTr
                    ? "Canlı Çalışma / Proje Linki (İsteğe Bağlı)"
                    : "Deliverable Link (Optional)"}
                </label>
                <div className="flex gap-2">
                  <select
                    value={deliverableUrlType}
                    onChange={(e) =>
                      setDeliverableUrlType(e.target.value as MilestoneDeliverableUrlType)
                    }
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-300 focus:outline-none"
                  >
                    <option value="CODE_REPO">{isTr ? "GitHub/GitLab" : "Code Repo"}</option>
                    <option value="STAGING_URL">
                      {isTr ? "Canlı Demo/Staging" : "Staging Demo"}
                    </option>
                    <option value="DESIGN_PROTOTYPE">
                      {isTr ? "Figma/Tasarım" : "Figma Design"}
                    </option>
                    <option value="DOC_WORKSPACE">
                      {isTr ? "Notion/Doküman" : "Doc Workspace"}
                    </option>
                    <option value="OTHER">{isTr ? "Diğer" : "Other"}</option>
                  </select>
                  <input
                    type="url"
                    value={deliverableUrl}
                    onChange={(e) => setDeliverableUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>
                    {isTr
                      ? "Bu bağlantı yalnızca işveren ve sizin aranızda gizli tutulur."
                      : "This link is confidential between parties."}
                  </span>
                </p>
              </div>

              {/* Git Commit Hash Input for FSEK m. 52 Pinning */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <GitCommit className="h-3.5 w-3.5 text-cyan-400" />
                    {isTr
                      ? "Git Commit Hash (FSEK m. 52 IP Tescil Pini)"
                      : "Git Commit Hash (FSEK IP Pin)"}
                  </label>
                  {deliverableUrl && !gitCommitHash && (
                    <button
                      type="button"
                      onClick={() => {
                        const extracted =
                          IpAssignmentDeedEngine.extractCommitHashFromUrl(deliverableUrl);
                        if (extracted) {
                          setGitCommitHash(extracted);
                        }
                      }}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      {isTr ? "URL'den Çıkar" : "Extract from URL"}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={gitCommitHash}
                  onChange={(e) => setGitCommitHash(e.target.value)}
                  placeholder={
                    isTr ? "Örn: 7f8a9b1c2d3e4f5a6b... (Tam veya kısa hash)" : "e.g. 7f8a9b1c..."
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 text-xs"
                />
                <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                  <ScrollText className="h-3 w-3 text-cyan-400 shrink-0" aria-hidden="true" />
                  <span>
                    {isTr
                      ? "FSEK m. 52 uyarınca ödeme onaylandığında bu commit hash'i resmi Fikri Mülkiyet Devir Senedine mühürlenir."
                      : "This commit hash will be pinned into the formal FSEK IP Assignment Deed upon payment confirmation."}
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">
                  {isTr ? "Teslimat Notu & Tamamlanan İşler" : "Handover Note & Summary"}
                </label>
                <textarea
                  rows={3}
                  value={deliverableNote}
                  onChange={(e) => setDeliverableNote(e.target.value)}
                  placeholder={
                    isTr
                      ? "Aşamada tamamlanan işlerin özeti, test yönergeleri vb."
                      : "Summary of completed work, testing instructions, etc."
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSubmitDeliverable("IN_PROGRESS")}
                disabled={isSubmittingDeliverable}
                className="text-xs cursor-pointer"
              >
                {isTr ? "Geliştiriliyor Olarak Kaydet" : "Mark In Progress"}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => onSubmitDeliverable("SUBMITTED")}
                disabled={isSubmittingDeliverable}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {isTr ? "Teslim Et & Onaya Sun" : "Submit for Approval"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FSEK IP Assignment Deed Modal */}
      {ipDeedModalOpen && selectedIpDeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-white max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <ScrollText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>
                      {isTr
                        ? "FSEK m. 48-52 Fikri Mülkiyet Devir Tescil Belgesi"
                        : "Formal Certificate of IP Assignment"}
                    </span>
                    <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      5846 s. FSEK m. 52
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isTr
                      ? "Mali Hakların Kapsamlı ve Kesin Devri Senedi • Git Commit Hash ile Mühürlü"
                      : "Statutory IP Assignment Deed Pinned to Git Commit Hash"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseIpDeedModal}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Meta Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">
                  {isTr ? "Sened Referans No (Deed ID):" : "Deed Reference ID:"}
                </span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {selectedIpDeed.deedId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">
                  {isTr ? "Hakediş Aşaması:" : "Milestone:"}
                </span>
                <span className="text-slate-200 font-medium">
                  #{selectedIpDeed.pinnedWork.milestoneSequence} -{" "}
                  {selectedIpDeed.pinnedWork.milestoneTitle}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">
                  {isTr ? "Düzenleme Zamanı:" : "Issued At:"}
                </span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {new Date(selectedIpDeed.issuedAt).toLocaleString("tr-TR")}
                </span>
              </div>
            </div>

            {/* Two Column Parties Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Assignor (Developer) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                    {isTr ? "Devreden (Yazılımcı / Eser Sahibi)" : "Assignor (Author / Developer)"}
                  </span>
                  <span className="font-mono text-[10px] text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                    ASSIGNOR
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-400">
                  <p>
                    <span className="text-slate-500">{isTr ? "Adı / Unvanı:" : "Name:"}</span>{" "}
                    <strong className="text-slate-200">{selectedIpDeed.assignor.legalName}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500">
                      {isTr ? "TCKN / VKN:" : "Tax / National ID:"}
                    </span>{" "}
                    <strong className="font-mono text-cyan-300">
                      {selectedIpDeed.assignor.vknOrTcknMasked ||
                        (isTr ? "Operis Doğrulanmış Hesap" : "Verified Account")}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">{isTr ? "E-posta:" : "Email:"}</span>{" "}
                    <span className="text-slate-300">{selectedIpDeed.assignor.email}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">{isTr ? "Yerleşim:" : "City:"}</span>{" "}
                    <span className="text-slate-300">{selectedIpDeed.assignor.city || "—"}</span>
                  </p>
                </div>
              </div>

              {/* Assignee (Client) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                    {isTr ? "Devralan (İşveren / Hak Sahibi)" : "Assignee (Client / Transferee)"}
                  </span>
                  <span className="font-mono text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    ASSIGNEE
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-400">
                  <p>
                    <span className="text-slate-500">{isTr ? "Adı / Unvanı:" : "Name:"}</span>{" "}
                    <strong className="text-slate-200">
                      {selectedIpDeed.assignee.companyName || selectedIpDeed.assignee.legalName}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">
                      {isTr ? "VKN / TCKN:" : "Tax / National ID:"}
                    </span>{" "}
                    <strong className="font-mono text-emerald-300">
                      {selectedIpDeed.assignee.vknOrTcknMasked ||
                        (isTr ? "Operis Doğrulanmış Kurum" : "Verified Entity")}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">{isTr ? "E-posta:" : "Email:"}</span>{" "}
                    <span className="text-slate-300">{selectedIpDeed.assignee.email}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">
                      {isTr ? "Ödenen Bedel:" : "Consideration:"}
                    </span>{" "}
                    <strong className="font-mono text-slate-200">
                      {Number(selectedIpDeed.consideration.amount).toLocaleString("tr-TR")}{" "}
                      {selectedIpDeed.consideration.currency}
                    </strong>{" "}
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({selectedIpDeed.consideration.paymentReference || "EFT/FAST"})
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Pinned Work & Commit Hash Box */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-cyan-950/20 to-slate-950 border border-cyan-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <GitCommit className="h-4 w-4" />
                  {isTr
                    ? "Tescil Edilen ve Devredilen Eser (Git Pin)"
                    : "Pinned Work & Git Repository"}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  FSEK m. 48/52 Belirlilik Şartı
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    {isTr ? "Eser / Yazılım Adı:" : "Work Title:"}
                  </span>
                  <span className="font-medium text-slate-200">
                    {selectedIpDeed.pinnedWork.milestoneTitle}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    {isTr ? "Kaynak Kod Deposu (Repo):" : "Repository:"}
                  </span>
                  <span className="font-mono text-[10px] text-cyan-300 break-all">
                    {selectedIpDeed.pinnedWork.repositoryUrl || "Operis Özel Depo Arşivi"}
                  </span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Pin className="h-3 w-3 text-cyan-400 shrink-0" aria-hidden="true" />
                    <span>
                      {isTr
                        ? "Mühürlenen Git Commit Hash (Kesin Teslimat İmzası):"
                        : "Pinned Git Commit Hash:"}
                    </span>
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    SHA-1 / Git Object ID
                  </span>
                </div>
                <div className="font-mono text-xs text-cyan-200 font-semibold break-all bg-black/60 p-2 rounded-xl border border-cyan-500/30">
                  {selectedIpDeed.pinnedWork.gitCommitHash}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[10px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-500 block">Master SHA-256 Digest:</span>
                  <span className="text-cyan-400/90 break-all">
                    {selectedIpDeed.masterDeedSha256.slice(0, 32)}...
                  </span>
                </div>
                {selectedIpDeed.consideration.paymentDualSeal && (
                  <div>
                    <span className="text-slate-500 block">Bağlı Banka Dual-Seal:</span>
                    <span className="text-emerald-400/90 break-all">
                      {selectedIpDeed.consideration.paymentDualSeal.slice(0, 32)}...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 5 Statutory Economic Rights (FSEK m. 52 Specificity List) */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  {isTr
                    ? "FSEK m. 52 Uyarınca Ayrı Ayrı Devredilen 5 Mali Hak:"
                    : "5 Statutory Economic Rights (Individually Assigned):"}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isTr
                    ? "Coğrafi: Sınırsız (Dünya Çapında) • Süre: Kanuni Koruma Süresi"
                    : "Worldwide • Perpetual"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[10px]">
                {selectedIpDeed.transferredRights.map((r) => (
                  <div
                    key={r.code}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1"
                  >
                    <div className="font-bold text-cyan-300 flex items-center justify-between">
                      <span>{r.fsekArticle}</span>
                      <span className="text-emerald-400 text-[9px]">DEVREDİLDİ</span>
                    </div>
                    <div className="font-semibold text-slate-200">{isTr ? r.nameTr : r.nameEn}</div>
                    <p className="text-slate-400 text-[9px] line-clamp-3 leading-tight">
                      {isTr ? r.scopeTr : r.scopeEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Moral Rights & Originality Warranty */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-[11px] text-slate-300">
              <div>
                <strong className="text-slate-200 flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-purple-400 shrink-0" aria-hidden="true" />
                  <span>
                    {isTr
                      ? "FSEK m. 16/2 Değişiklik İzni ve Manevi Haklar Muvafakati:"
                      : "Moral Rights & Refactoring Consent:"}
                  </span>
                </strong>
                <p className="text-slate-400 italic mt-0.5">
                  &ldquo;
                  {isTr ? selectedIpDeed.moralRightsWaiverTr : selectedIpDeed.moralRightsWaiverEn}
                  &rdquo;
                </p>
              </div>

              <div className="pt-1.5 border-t border-slate-800/80">
                <strong className="text-slate-200 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>
                    {isTr
                      ? "Özgünlük ve Üçüncü Şahıs Hakları Garantisi:"
                      : "Originality & Non-Infringement Warranty:"}
                  </span>
                </strong>
                <p className="text-slate-400 italic mt-0.5">
                  &ldquo;
                  {isTr
                    ? selectedIpDeed.originalityWarrantyTr
                    : selectedIpDeed.originalityWarrantyEn}
                  &rdquo;
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const md = IpAssignmentDeedEngine.formatDeedMarkdown(selectedIpDeed);
                    navigator.clipboard.writeText(md);
                    setCopiedIpDeed(true);
                    setTimeout(() => setCopiedIpDeed(false), 2000);
                  }}
                  className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800 gap-1.5 cursor-pointer"
                >
                  {copiedIpDeed ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-cyan-300">{isTr ? "Kopyalandı!" : "Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{isTr ? "Markdown Sözleşme Kopyala" : "Copy Deed Markdown"}</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800 gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isTr ? "Yazdır / PDF Tescil Belgesi" : "Print / PDF Deed"}</span>
                </Button>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onCloseIpDeedModal}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer"
              >
                {isTr ? "Kapat" : "Close"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
