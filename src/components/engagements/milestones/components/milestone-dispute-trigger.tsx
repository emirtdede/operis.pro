import {
  DollarSign,
  ShieldCheck,
  Building2,
  Clock,
  Info,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Copy,
  Check,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  MilestoneDto,
  TransferChannel,
  PaymentDisputeReason,
  PaymentSettlementCertificate,
} from "@/src/modules/engagements/milestone-service";
import { PaymentHandshakeEngine } from "@/src/modules/engagements/payment-handshake/payment-handshake-engine";
import { SUPPORTED_BANKS, getTransferChannelSubtext } from "../types";

interface MilestoneDisputeTriggerProps {
  isTr: boolean;
  actionError: string | null;

  // Payment modal props
  paymentModalOpen: boolean;
  setPaymentModalOpen: (v: boolean) => void;
  selectedMilestone: MilestoneDto | null;
  senderBank: string;
  setSenderBank: (v: string) => void;
  transferChannel: TransferChannel;
  setTransferChannel: (v: TransferChannel) => void;
  transferDate: string;
  setTransferDate: (v: string) => void;
  transferTime: string;
  setTransferTime: (v: string) => void;
  paymentReference: string;
  setPaymentReference: (v: string) => void;
  isMarkingPayment: boolean;
  onMarkPayment: () => void;

  // Confirm modal props
  confirmModalOpen: boolean;
  setConfirmModalOpen: (v: boolean) => void;
  invoiceNumber: string;
  setInvoiceNumber: (v: string) => void;
  isConfirmingPayment: boolean;
  onConfirmPayment: () => void;

  // Dispute modal props
  disputeModalOpen: boolean;
  setDisputeModalOpen: (v: boolean) => void;
  disputeReason: PaymentDisputeReason;
  setDisputeReason: (v: PaymentDisputeReason) => void;
  disputeNote: string;
  setDisputeNote: (v: string) => void;
  isDisputingPayment: boolean;
  onDisputePayment: () => void;

  // Certificate modal props
  certificateModalOpen: boolean;
  setCertificateModalOpen: (v: boolean) => void;
  selectedCertificate: PaymentSettlementCertificate | null;
  copiedCertificate: boolean;
  setCopiedCertificate: (v: boolean) => void;
}

export function MilestoneDisputeTrigger({
  isTr,
  actionError,
  paymentModalOpen,
  setPaymentModalOpen,
  selectedMilestone,
  senderBank,
  setSenderBank,
  transferChannel,
  setTransferChannel,
  transferDate,
  setTransferDate,
  transferTime,
  setTransferTime,
  paymentReference,
  setPaymentReference,
  isMarkingPayment,
  onMarkPayment,
  confirmModalOpen,
  setConfirmModalOpen,
  invoiceNumber,
  setInvoiceNumber,
  isConfirmingPayment,
  onConfirmPayment,
  disputeModalOpen,
  setDisputeModalOpen,
  disputeReason,
  setDisputeReason,
  disputeNote,
  setDisputeNote,
  isDisputingPayment,
  onDisputePayment,
  certificateModalOpen,
  setCertificateModalOpen,
  selectedCertificate,
  copiedCertificate,
  setCopiedCertificate,
}: MilestoneDisputeTriggerProps) {
  return (
    <>
      {/* MODAL: Mark Payment (Employer) */}
      {paymentModalOpen && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-teal-400">
                <DollarSign className="h-4 w-4" />
                <span>
                  {isTr ? "Hakediş Ödemesi Bildirimi (El Sıkışma)" : "Bilateral Payment Handshake"}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200 space-y-1">
              <div className="font-semibold text-slate-200">
                #{selectedMilestone.sequenceNumber} - {selectedMilestone.title}
              </div>
              <p className="text-teal-300 font-mono font-bold text-sm">
                {selectedMilestone.amount.toLocaleString("tr-TR")} {selectedMilestone.currency}
              </p>
              <p className="text-[11px] text-teal-200/80">
                {isTr
                  ? "Tarafınızca yapılan banka transferi sisteme mühürlenerek işlenecek ve yazılımcının onayına sunulacaktır."
                  : "Your bank transfer declaration will be sealed and submitted for the specialist's verification."}
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              {/* Bank Selection */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-teal-400" />
                  <span>{isTr ? "Gönderen Banka" : "Sender Bank"}</span>
                </label>
                <select
                  value={senderBank}
                  onChange={(e) => setSenderBank(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 text-xs"
                >
                  {SUPPORTED_BANKS.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {isTr ? bank.nameTr : bank.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transfer Channel Segmented Control */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">
                  {isTr ? "Transfer Kanalı" : "Transfer Channel"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["FAST", "EFT", "HAVALE"] as TransferChannel[]).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setTransferChannel(ch)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        transferChannel === ch
                          ? "bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm shadow-teal-500/10"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {ch}
                      <span className="block text-[10px] font-normal opacity-70">
                        {getTransferChannelSubtext(ch)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timing Guidance Callout */}
              {(() => {
                const guidance = PaymentHandshakeEngine.getTimingGuidance(
                  transferChannel,
                  selectedMilestone.amount
                );
                return (
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-teal-400" />
                      <strong>{isTr ? "Beklenen Geçiş Süresi:" : "Expected Settlement:"}</strong>
                      <span className="text-teal-300">
                        {isTr ? guidance.expectedSettlementTr : guidance.expectedSettlementEn}
                      </span>
                    </div>
                    {guidance.warningTr && (
                      <p className="text-amber-300/90 pt-1 border-t border-slate-800 flex items-start gap-1">
                        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />
                        <span>{isTr ? guidance.warningTr : guidance.warningEn}</span>
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Transfer Date and Time */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">
                    {isTr ? "Transfer Tarihi" : "Transfer Date"}
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">
                    {isTr ? "Transfer Saati" : "Transfer Time"}
                  </label>
                  <input
                    type="time"
                    value={transferTime}
                    onChange={(e) => setTransferTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 text-xs"
                  />
                </div>
              </div>

              {/* Reference / FAST Sorgu No */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center justify-between">
                  <span>
                    {isTr
                      ? "İşlem Referans No / Transfer Açıklaması"
                      : "Payment Reference / Transfer Note"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {isTr ? "Zorunlu" : "Required"}
                  </span>
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Örn: REF-8392019482 veya 24 haneli FAST kodu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono text-xs"
                />
                {paymentReference.length > 0 && paymentReference.trim().length < 6 && (
                  <p className="text-[10px] text-amber-400">
                    ⚠️{" "}
                    {isTr
                      ? "Referans numarası en az 6 karakter olmalıdır."
                      : "Reference number must be at least 6 characters."}
                  </p>
                )}
              </div>

              {/* Operis Safe Harbor Notice */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-teal-500/20 text-[10.5px] text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-teal-400">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isTr
                      ? "Operis Platform Sorumsuzluk Güvencesi (TBK m. 26/115):"
                      : "Operis Safe Harbor Notice:"}
                  </span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  {isTr
                    ? "Operis emanet havuzu tutmaz, dekont veya finansal transfer denetimi yapmaz. Hakediş ödemeleri münhasıran tarafların kendi bankaları arasında gerçekleşir. Ödeme onayı ve proje kapanışı, İş Sahibi ile Yüklenici arasındaki karşılıklı serbest irade ve mutabakata dayanır."
                    : "Operis does not hold escrow and does not inspect bank receipts or financial transfers. Settlements are completed directly bank-to-bank. Project sign-off is based solely on mutual party acknowledgment."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPaymentModalOpen(false)}
                className="text-xs cursor-pointer"
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onMarkPayment}
                disabled={
                  isMarkingPayment || !paymentReference.trim() || paymentReference.trim().length < 6
                }
                className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-md shadow-teal-600/20 cursor-pointer"
              >
                {isMarkingPayment ? (
                  <span>{isTr ? "Mühürleniyor..." : "Sealing..."}</span>
                ) : (
                  <span>
                    {isTr ? "Ödeme Tamamlandı Olarak Bildir" : "Declare Payment Completed"}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Payment (Freelancer) */}
      {confirmModalOpen && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>{isTr ? "Tahsilatı Teyit Et" : "Confirm Payment Receipt"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              {isTr
                ? `Banka hesabınıza ${selectedMilestone.amount.toLocaleString("tr-TR")} ${selectedMilestone.currency} tutarındaki hakedişin geçtiğini onaylayınız.`
                : `Confirm that you have received ${selectedMilestone.amount.toLocaleString("en-US")} ${selectedMilestone.currency} in your bank account.`}
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">
                  {isTr
                    ? "SMM / E-Fatura Numarası (İsteğe Bağlı)"
                    : "Invoice / SMM Number (Optional)"}
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Örn: SMM2026000000123"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              <p className="text-[10px] text-slate-400">
                {isTr
                  ? "🔒 Bu işlem HMK m. 193 uyarınca karşılıklı olarak kilitlenir ve yasal ibra kaydı oluşturur."
                  : "🔒 This confirmation locks the milestone audit trail under statutory rules."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmModalOpen(false)}
                className="text-xs cursor-pointer"
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onConfirmPayment}
                disabled={isConfirmingPayment}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {isConfirmingPayment ? (
                  <span>{isTr ? "Teyit Ediliyor..." : "Confirming..."}</span>
                ) : (
                  <span>{isTr ? "Tahsilatı Teyit Et" : "Confirm Receipt"}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Dispute Payment (Freelancer) */}
      {disputeModalOpen && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                <span>{isTr ? "Ödeme Ulaşmadı / İtiraz Bildir" : "Dispute Payment"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setDisputeModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 space-y-1">
              <span className="font-semibold block text-slate-200">
                #{selectedMilestone.sequenceNumber} - {selectedMilestone.title} (
                {selectedMilestone.amount.toLocaleString("tr-TR")} {selectedMilestone.currency})
              </span>
              <p className="text-[11px] text-rose-300/90">
                {isTr
                  ? `İşveren ${selectedMilestone.senderBank || "Banka"} üzerinden transfer bildirdi. Paranızı göremiyorsanız lütfen itiraz nedeninizi seçin.`
                  : "Employer declared transfer. If funds did not arrive, please specify the dispute reason."}
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">
                  {isTr ? "İtiraz Sebebi" : "Dispute Reason"}
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: "FUNDS_NOT_RECEIVED" as PaymentDisputeReason,
                      titleTr: "Para Hesabıma Geçmedi",
                      descTr: "Bankamı kontrol ettim, henüz herhangi bir bakiye artışı yok.",
                      titleEn: "Funds Not Received",
                      descEn: "Checked my bank, no incoming balance detected.",
                    },
                    {
                      id: "AMOUNT_MISMATCH" as PaymentDisputeReason,
                      titleTr: "Tutar Eksik veya Hatalı",
                      descTr: "Hesabıma yansıyan tutar ile hakediş tutarı uyuşmuyor.",
                      titleEn: "Amount Mismatch",
                      descEn: "Received amount differs from milestone amount.",
                    },
                    {
                      id: "WRONG_IBAN_TARGET" as PaymentDisputeReason,
                      titleTr: "Yanlış IBAN Bildirimi",
                      descTr:
                        "İşveren profilimde kayıtlı IBAN yerine farklı bir hesaba transfer yapmış.",
                      titleEn: "Wrong IBAN Target",
                      descEn: "Transferred to an incorrect or non-contracted IBAN.",
                    },
                    {
                      id: "SUSPECTED_INVALID_RECEIPT" as PaymentDisputeReason,
                      titleTr: "Uyuşmayan Transfer / Hatalı Tutar",
                      descTr: "Referans açıklaması veya hesaba geçen tutar sözleşmeyle eşleşmiyor.",
                      titleEn: "Mismatched Transfer / Inaccurate Amount",
                      descEn:
                        "Payment reference or received amount does not match contract specifications.",
                    },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        disputeReason === opt.id
                          ? "bg-rose-500/15 border-rose-500 text-rose-100"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="disputeReason"
                        checked={disputeReason === opt.id}
                        onChange={() => setDisputeReason(opt.id)}
                        className="mt-1 accent-rose-500"
                      />
                      <div>
                        <span className="font-semibold block text-slate-200">
                          {isTr ? opt.titleTr : opt.titleEn}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {isTr ? opt.descTr : opt.descEn}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">
                  {isTr ? "Açıklama / Detaylı Not" : "Dispute Notes"}
                </label>
                <textarea
                  rows={2}
                  value={disputeNote}
                  onChange={(e) => setDisputeNote(e.target.value)}
                  placeholder={
                    isTr
                      ? "Örn: İşlem FAST olarak işaretlenmiş fakat Garanti hesabıma henüz hiçbir transfer yansımadı..."
                      : "Provide additional details for the employer to rectify..."
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-rose-500/20 text-[10px] text-rose-300/80 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-rose-200">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  <span>
                    {isTr ? "TBK m. 470 Teslimat Koruması" : "TBK m. 470 Delivery Protection"}
                  </span>
                </div>
                <p>
                  {isTr
                    ? "İtiraz bildirdiğiniz anda kod teslimi ve repo erişimi sağlama yükümlülüğünüz yasal olarak dondurulur. İşveren transferi düzeltene veya yeni kanıt sunana kadar korunursunuz."
                    : "Obligations are automatically suspended upon filing a dispute until payment is rectified."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDisputeModalOpen(false)}
                className="text-xs cursor-pointer"
              >
                {isTr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onDisputePayment}
                disabled={isDisputingPayment}
                className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md shadow-rose-600/20 cursor-pointer"
              >
                {isDisputingPayment ? (
                  <span>{isTr ? "Kaydediliyor..." : "Submitting..."}</span>
                ) : (
                  <span>{isTr ? "İtirazı Kaydet & Bildir" : "File Dispute"}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Settlement Certificate Modal (Dual-Seal Proof of Settlement) */}
      {certificateModalOpen && selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-white max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>
                      {isTr
                        ? "Dijital Tahkikat ve İtfa Belgesi"
                        : "Proof of Settlement Certificate"}
                    </span>
                    <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      HMK m. 193
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isTr
                      ? "Çift Taraflı Kriptografik Mühür ve Yasal İbra Kaydı"
                      : "Bilateral Cryptographic Dual-Seal"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCertificateModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Certificate Meta Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">
                  {isTr ? "Belge / Sertifika ID:" : "Certificate ID:"}
                </span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {selectedCertificate.certificateId}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">
                  {isTr ? "Oluşturulma Zamanı:" : "Issued At:"}
                </span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {new Date(selectedCertificate.createdAt).toLocaleString("tr-TR")}
                </span>
              </div>
            </div>

            {/* Two Column Parties Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Payer Column */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-teal-400" />
                    {isTr ? "Ödeyen (İşveren) Beyanı" : "Payer Declaration"}
                  </span>
                  <span className="font-mono text-[10px] text-teal-300 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                    {selectedCertificate.payer.transferChannel}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-400">
                  <p>
                    <span className="text-slate-500">{isTr ? "Banka:" : "Bank:"}</span>{" "}
                    <strong className="text-slate-200">
                      {selectedCertificate.payer.senderBank}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">{isTr ? "Ref / FAST No:" : "Ref No:"}</span>{" "}
                    <strong className="font-mono text-teal-300">
                      {selectedCertificate.payer.referenceNumber}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">{isTr ? "Tutar:" : "Amount:"}</span>{" "}
                    <strong className="font-mono text-slate-200">
                      {selectedCertificate.amount.toLocaleString("tr-TR")}{" "}
                      {selectedCertificate.currency}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">{isTr ? "Beyan Zamanı:" : "Declared:"}</span>{" "}
                    <span className="font-mono text-[10px]">
                      {new Date(selectedCertificate.payer.declaredAt).toLocaleString("tr-TR")}
                    </span>
                  </p>
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-500 block">SHA-256 Beyan Mührü:</span>
                    <span className="font-mono text-[9px] text-teal-400/90 break-all">
                      {selectedCertificate.payer.declarationSeal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payee Column */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    {isTr ? "Tahsil Eden (Yazılımcı) Teyidi" : "Payee Confirmation"}
                  </span>
                  <span className="font-mono text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    CONFIRMED
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-400">
                  <p>
                    <span className="text-slate-500">{isTr ? "Kullanıcı ID:" : "User ID:"}</span>{" "}
                    <span className="font-mono text-slate-200">
                      {selectedCertificate.payee.userId}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500">{isTr ? "Fatura / SMM:" : "Invoice:"}</span>{" "}
                    <strong className="font-mono text-emerald-300">
                      {selectedCertificate.payee.invoiceNumber ||
                        (isTr ? "Muafiyet / e-SMM" : "Exempt / SMM")}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">
                      {isTr ? "Onaylanan Tutar:" : "Confirmed Amount:"}
                    </span>{" "}
                    <strong className="font-mono text-slate-200">
                      {selectedCertificate.amount.toLocaleString("tr-TR")}{" "}
                      {selectedCertificate.currency}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">{isTr ? "Teyit Zamanı:" : "Confirmed:"}</span>{" "}
                    <span className="font-mono text-[10px]">
                      {new Date(selectedCertificate.payee.confirmedAt).toLocaleString("tr-TR")}
                    </span>
                  </p>
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-500 block">SHA-256 Teyit Mührü:</span>
                    <span className="font-mono text-[9px] text-emerald-400/90 break-all">
                      {selectedCertificate.payee.confirmationSeal}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Dual-Seal Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-950 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  {isTr ? "Kriptografik Çift Mühür (Dual-Seal)" : "Cryptographic Dual-Seal"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">HMK m. 193 Hükmü</span>
              </div>
              <p className="font-mono text-xs text-emerald-200 break-all bg-black/50 p-2.5 rounded-xl border border-emerald-500/20">
                {selectedCertificate.dualSeal}
              </p>
            </div>

            {/* Statutory Clauses */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-[11px] text-slate-300">
              <div>
                <strong className="text-slate-200 block">
                  ⚖️{" "}
                  {isTr ? "TBK m. 132 Karşılıklı İbra Hükmü:" : "TBK m. 132 Statutory Discharge:"}
                </strong>
                <p className="text-slate-400 italic mt-0.5">
                  &ldquo;
                  {isTr
                    ? selectedCertificate.legalDischargeClauseTr
                    : selectedCertificate.legalDischargeClauseEn}
                  &rdquo;
                </p>
              </div>

              <div className="pt-1.5 border-t border-slate-800/80">
                <strong className="text-slate-200 block">
                  📜{" "}
                  {isTr ? "HMK m. 193 Delil Sözleşmesi Hükmü:" : "HMK m. 193 Evidentiary Contract:"}
                </strong>
                <p className="text-slate-400 italic mt-0.5">
                  &ldquo;
                  {isTr
                    ? selectedCertificate.legalEvidentiaryClauseTr
                    : selectedCertificate.legalEvidentiaryClauseEn}
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
                    const md =
                      PaymentHandshakeEngine.formatSettlementCertificateMarkdown(
                        selectedCertificate
                      );
                    navigator.clipboard.writeText(md);
                    setCopiedCertificate(true);
                    setTimeout(() => setCopiedCertificate(false), 2000);
                  }}
                  className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800 gap-1.5 cursor-pointer"
                >
                  {copiedCertificate ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-300">{isTr ? "Kopyalandı!" : "Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{isTr ? "Markdown Kopyala" : "Copy Markdown"}</span>
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
                  <span>{isTr ? "Yazdır / PDF Kaydet" : "Print / PDF"}</span>
                </Button>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setCertificateModalOpen(false)}
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
