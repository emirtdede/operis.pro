import {
  CheckCircle2,
  Clock,
  ExternalLink,
  DollarSign,
  Undo2,
  Code2,
  Globe,
  Palette,
  FileText,
  ShieldCheck,
  Send,
  AlertTriangle,
  Info,
  FileCheck,
  ScrollText,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  MilestoneDto,
  DeliverableStatus,
  PaymentLedgerStatus,
} from "@/src/modules/engagements/milestone-service";
import { MilestoneDeliverableUrlType } from "@/src/modules/engagements/milestone-synthesizer";
import {
  getMilestoneCardBgClass,
  getMilestoneSeqBadgeClass,
} from "../types";

interface MilestoneTimelineNodeProps {
  milestone: MilestoneDto;
  isTr: boolean;
  isLoadingIpDeed: boolean;
  onOpenDeliverableModal: (m: MilestoneDto) => void;
  onAcceptDeliverable: (m: MilestoneDto) => void;
  onOpenPaymentModal: (m: MilestoneDto) => void;
  onRevertPayment: (m: MilestoneDto) => void;
  onOpenConfirmModal: (m: MilestoneDto) => void;
  onOpenDisputeModal: (m: MilestoneDto) => void;
  onViewCertificate: (m: MilestoneDto) => void;
  onViewIpDeed: (m: MilestoneDto) => void;
}

export function MilestoneTimelineNode({
  milestone: m,
  isTr,
  isLoadingIpDeed,
  onOpenDeliverableModal,
  onAcceptDeliverable,
  onOpenPaymentModal,
  onRevertPayment,
  onOpenConfirmModal,
  onOpenDisputeModal,
  onViewCertificate,
  onViewIpDeed,
}: MilestoneTimelineNodeProps) {
  const getUrlTypeIcon = (type: MilestoneDeliverableUrlType | null) => {
    switch (type) {
      case "CODE_REPO":
        return <Code2 className="h-3 w-3 text-cyan-400" />;
      case "STAGING_URL":
        return <Globe className="h-3 w-3 text-emerald-400" />;
      case "DESIGN_PROTOTYPE":
        return <Palette className="h-3 w-3 text-purple-400" />;
      case "DOC_WORKSPACE":
        return <FileText className="h-3 w-3 text-amber-400" />;
      default:
        return <ExternalLink className="h-3 w-3 text-slate-400" />;
    }
  };

  const getDeliverableStatusBadge = (status: DeliverableStatus) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" />
            {isTr ? "Onaylandı" : "Accepted"}
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {isTr ? "İnceleniyor" : "Submitted"}
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
            {isTr ? "Geliştiriliyor" : "In Progress"}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            {isTr ? "Beklemede" : "Not Started"}
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status: PaymentLedgerStatus) => {
    switch (status) {
      case "CONFIRMED_PAID":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="h-2.5 w-2.5" />
            {isTr ? "Tahsilat Teyitli" : "Payment Confirmed"}
          </span>
        );
      case "MARKED_PAID":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" />
            {isTr ? "İşveren Ödedi" : "Marked Paid"}
          </span>
        );
      case "DISPUTED_PAID":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <AlertTriangle className="h-2.5 w-2.5" />
            {isTr ? "Ödeme İtirazı" : "Payment Disputed"}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800/80 text-slate-400 border border-slate-700/80">
            {isTr ? "Ödenmedi" : "Unpaid"}
          </span>
        );
    }
  };

  let formattedTransferDate = "-";
  if (m.transferDate) {
    formattedTransferDate = m.transferDate;
  } else if (m.paidMarkedAt) {
    formattedTransferDate = new Date(m.paidMarkedAt).toLocaleDateString("tr-TR");
  }

  return (
    <div
      className={`p-5 rounded-2xl border transition-all space-y-3 ${getMilestoneCardBgClass(m.deliverableStatus)}`}
    >
      {/* Milestone Top Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            className={`h-7 w-7 rounded-xl font-bold font-mono text-xs flex items-center justify-center border shrink-0 ${getMilestoneSeqBadgeClass(m.deliverableStatus)}`}
          >
            {m.sequenceNumber}
          </span>

          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              {m.title}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">{m.description}</p>
          </div>
        </div>

        {/* Financial Tag & Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="font-mono font-bold text-xs text-emerald-400">
              {m.amount.toLocaleString("tr-TR")} {m.currency}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              %{m.percentage.toFixed(0)}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1">
            {getDeliverableStatusBadge(m.deliverableStatus)}
            {getPaymentStatusBadge(m.paymentStatus)}
          </div>
        </div>
      </div>

      {/* Criteria & Private Link Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {m.deliverableCriteria && (
            <span className="text-[11px] text-slate-400">
              🎯{" "}
              <strong className="text-slate-300">{isTr ? "Kriter:" : "Criteria:"}</strong>{" "}
              {m.deliverableCriteria}
            </span>
          )}
        </div>

        {/* Private Deliverable Link */}
        {m.deliverableUrl && (
          <a
            href={m.deliverableUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-[11px] text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            title={
              isTr
                ? "Yalnızca taraflara açık gizli çalışma bağlantısı"
                : "Confidential link"
            }
          >
            {getUrlTypeIcon(m.deliverableUrlType)}
            <span className="truncate max-w-[180px]">{m.deliverableUrl}</span>
            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
          </a>
        )}
      </div>

      {/* Deliverable Note if present */}
      {m.deliverableNote && (
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300">
          💬 <strong>{isTr ? "Teslimat Notu:" : "Handover Note:"}</strong>{" "}
          {m.deliverableNote}
        </div>
      )}

      {/* BILATERAL HANDSHAKE BANNER: Payment Declared State */}
      {m.paymentStatus === "MARKED_PAID" && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5 text-xs animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs sm:text-sm">
              <Clock className="h-4 w-4 shrink-0 text-amber-400" />
              {isTr
                ? `${m.amount.toLocaleString("tr-TR")} ${m.currency} transfer bildirildi. Bankanızı kontrol edip onaylayın.`
                : `${m.amount.toLocaleString("en-US")} ${m.currency} transfer declared. Please check your bank and confirm.`}
            </span>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/30">
              {m.transferChannel || "FAST"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 pt-1 border-t border-amber-500/15">
            <div>
              <span className="text-slate-500 text-[10px] block">Gönderen Banka:</span>
              <strong className="text-slate-200">{m.senderBank || "Garanti BBVA"}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">
                Banka Ref / Sorgu No:
              </span>
              <strong className="font-mono text-amber-200">
                {m.paymentReference || "N/A"}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Transfer Zamanı:</span>
              <span>
                {formattedTransferDate} {m.transferTime || ""}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">
                İşlem / Teyit Modu:
              </span>
              <span className="text-emerald-400 text-xs font-medium">
                {isTr ? "Doğrudan Banka Beyanı" : "Direct Bank Settlement"}
              </span>
            </div>
          </div>

          {m.timingGuidance?.warningTr && (
            <div className="p-2 rounded-xl bg-amber-950/50 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                {isTr ? m.timingGuidance.warningTr : m.timingGuidance.warningEn}
              </span>
            </div>
          )}
        </div>
      )}

      {/* BILATERAL HANDSHAKE BANNER: Payment Disputed State */}
      {m.paymentStatus === "DISPUTED_PAID" && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              {isTr
                ? "Ödeme İtirazı Aktif: Para Hesaba Geçmedi"
                : "Payment Disputed: Funds Not Received"}
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-200 border border-rose-500/30">
              {m.disputeReason || "FUNDS_NOT_RECEIVED"}
            </span>
          </div>
          {m.disputeNote && (
            <p className="text-[11px] text-slate-300 bg-black/40 p-2 rounded-xl border border-rose-500/20">
              💬 <strong>{isTr ? "Yazılımcı Açıklaması:" : "Specialist Note:"}</strong>{" "}
              {m.disputeNote}
            </p>
          )}
          <p className="text-[10px] text-rose-200/80">
            {isTr
              ? "🔒 TBK m. 470 uyarınca teslimat ve telif devri yükümlülüğü dondurulmuştur. İşverenin banka sorgu numarasını kontrol etmesi veya ödemeyi tekrar teyit etmesi bekleniyor."
              : "🔒 Delivery obligations frozen under contract terms until payment receipt is verified."}
          </p>
        </div>
      )}

      {/* BILATERAL HANDSHAKE BANNER: Confirmed Paid State (Dual-Seal + Certificate) */}
      {m.paymentStatus === "CONFIRMED_PAID" && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold block text-slate-200">
                {isTr
                  ? "Tahsilat Teyit Edildi & Karşılıklı İtfa Sağlandı"
                  : "Payment Settled & Discharged"}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                HMK m. 193 Dual-Seal:{" "}
                {m.dualSeal ? `${m.dualSeal.slice(0, 20)}...` : "VERIFIED_SEAL"}
                {m.invoiceNumber && ` • SMM/Fatura: ${m.invoiceNumber}`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewCertificate(m)}
              className="text-xs text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/15 gap-1.5 shadow-sm shadow-emerald-500/10 cursor-pointer"
            >
              <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isTr ? "Tahkikat & İtfa Belgesi" : "Settlement Certificate"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewIpDeed(m)}
              disabled={isLoadingIpDeed}
              className="text-xs text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/15 gap-1.5 shadow-sm shadow-cyan-500/10 font-medium cursor-pointer"
            >
              <ScrollText className="h-3.5 w-3.5 text-cyan-400" />
              <span>{isTr ? "📜 FSEK IP Devir Belgesi" : "📜 IP Assignment Deed"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
        {/* Freelancer Deliverable Action */}
        {m.deliverableStatus !== "ACCEPTED" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenDeliverableModal(m)}
            className="text-xs text-blue-300 border-blue-500/30 hover:bg-blue-500/10 gap-1.5 cursor-pointer"
          >
            <Send className="h-3 w-3" />
            <span>{isTr ? "Teslim Et & Link Güncelle" : "Submit Deliverable"}</span>
          </Button>
        )}

        {/* Employer Accept Action */}
        {m.deliverableStatus === "SUBMITTED" && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAcceptDeliverable(m)}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>{isTr ? "Teslimatı Onayla" : "Accept Deliverable"}</span>
          </Button>
        )}

        {/* Employer Payment Actions (Mark Paid) */}
        {m.paymentStatus === "UNPAID" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenPaymentModal(m)}
            className="text-xs text-teal-300 border-teal-500/30 hover:bg-teal-500/10 gap-1.5 cursor-pointer"
          >
            <DollarSign className="h-3 w-3" />
            <span>{isTr ? "Ödeme Bankadan Yapıldı" : "Declare Bank Payment"}</span>
          </Button>
        )}

        {/* Disputed State: Employer can revert or re-declare */}
        {m.paymentStatus === "DISPUTED_PAID" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRevertPayment(m)}
            className="text-xs text-amber-300 border-amber-500/30 hover:bg-amber-500/10 gap-1 cursor-pointer"
          >
            <Undo2 className="h-3 w-3" />
            <span>
              {isTr ? "Ödeme İşaretini Geri Al & Tekrar Dene" : "Revert & Retry Payment"}
            </span>
          </Button>
        )}

        {/* Marked Paid State Actions: Revert, Dispute, Confirm Receipt */}
        {m.paymentStatus === "MARKED_PAID" && (
          <>
            <button
              type="button"
              onClick={() => onRevertPayment(m)}
              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer pr-2 transition-colors"
            >
              <Undo2 className="h-2.5 w-2.5" />
              <span>{isTr ? "İşareti Geri Al" : "Revert"}</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDisputeModal(m)}
              className="text-xs text-rose-300 border-rose-500/40 hover:bg-rose-500/10 gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>{isTr ? "Ödeme Ulaşmadı / İtiraz Et" : "Dispute Payment"}</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenConfirmModal(m)}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{isTr ? "Ödeme Hesabıma Geçti" : "Confirm Receipt"}</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
