"use client";

import { useState, useMemo } from "react";
import {
  calculateFreelanceTax,
  CalculationDirection,
  ClientTaxType,
  InvoiceDocumentType,
  VatWithholdingFraction,
  TaxCalculationOutput,
} from "@/src/modules/finance/tax-calculator";
import {
  Calculator,
  Building2,
  User,
  ArrowRightLeft,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  Check,
  AlertCircle,
  Copy,
  Globe,
} from "lucide-react";
import { Button } from "../ui/button";
import { TextInput } from "../ui/text-input";

export interface TaxCalculatorWidgetProps {
  initialAmount?: number | string;
  initialDirection?: CalculationDirection;
  initialClientType?: ClientTaxType;
  currency?: string;
  locale?: string;
  compactMode?: boolean;
  initialSoftwareExport?: boolean;
  onApplyToProposal?: (grossAmount: number, proposalNote: string) => void;
  onClose?: () => void;
}

export function TaxCalculatorWidget({
  initialAmount = 50000,
  initialDirection = "NET_TO_GROSS",
  initialClientType = "CORPORATE",
  currency = "TRY",
  locale = "tr",
  compactMode = false,
  initialSoftwareExport,
  onApplyToProposal,
  onClose,
}: TaxCalculatorWidgetProps) {
  const isTr = locale === "tr";

  const [direction, setDirection] = useState<CalculationDirection>(initialDirection);
  const [clientType, setClientType] = useState<ClientTaxType>(initialClientType);
  const [documentType, setDocumentType] = useState<InvoiceDocumentType>("SMM");
  const [vatWithholding, setVatWithholding] = useState<VatWithholdingFraction>("NONE");
  const [isSoftwareExport, setIsSoftwareExport] = useState<boolean>(
    initialSoftwareExport ?? (/[$€£]|USD|EUR|GBP/i.test(currency) || currency !== "TRY")
  );
  const [amountInput, setAmountInput] = useState<string>(
    initialAmount ? String(initialAmount) : "50000"
  );
  const [copiedNote, setCopiedNote] = useState(false);

  const numericAmount = useMemo(() => {
    const parsed = parseFloat(amountInput.replace(/[^0-9.]/g, ""));
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [amountInput]);

  const taxResult: TaxCalculationOutput = useMemo(() => {
    return calculateFreelanceTax({
      amount: numericAmount,
      direction,
      clientType,
      documentType,
      currency,
      vatWithholding,
      isSoftwareExport,
    });
  }, [numericAmount, direction, clientType, documentType, currency, vatWithholding, isSoftwareExport]);

  const CURRENCY_SYMBOLS: Record<string, string> = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
  };
  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? currency;

  let directionBadgeLabel = isTr ? "Brüt Fatura Bedelinden Nete" : "Gross to Net";
  if (direction === "NET_TO_GROSS") {
    directionBadgeLabel = isTr ? "Net Elime Geçecekten Brüte" : "Net to Gross";
  }

  let softwareExportBadgeLabel = isTr ? "Pasif" : "Off";
  if (isSoftwareExport) {
    softwareExportBadgeLabel = isTr ? "Aktif ✓" : "Active ✓";
  }

  let amountInputLabel = isTr ? "Teklif Edilecek Brüt Fatura Bedeli" : "Gross Proposed Invoice Fee";
  if (direction === "NET_TO_GROSS") {
    amountInputLabel = isTr ? "Elinize Geçecek Hedef Net Tutar" : "Target Net Cash in Hand";
  }

  let withholdingHelpText = isTr ? "Stopaj uygulanmaz" : "No withholding applies";
  if (taxResult.withholdingAmount > 0) {
    withholdingHelpText = isTr
      ? "Şirket devlete sizin adınıza öder"
      : "Paid to tax authority by client";
  }

  const fmt = (val: number) =>
    val.toLocaleString(isTr ? "tr-TR" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleCopyNote = async () => {
    const text = isTr ? taxResult.proposalNoteTr : taxResult.proposalNoteEn;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleApply = () => {
    if (onApplyToProposal) {
      const note = isTr ? taxResult.proposalNoteTr : taxResult.proposalNoteEn;
      onApplyToProposal(taxResult.grossAmount, note);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-cyan-500/30 bg-[var(--color-surface-hover)]/40 backdrop-blur-md transition-all shadow-xl overflow-hidden ${
        compactMode ? "p-3 sm:p-4 space-y-3" : "p-4 sm:p-6 space-y-5"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <span>{isTr ? "Stopaj & SMM Vergi Hesaplayıcı" : "Tax & Withholding Calculator"}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hidden sm:inline-block">
                GVK m. 94 & KDV
              </span>
            </h3>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              {isTr
                ? "Netten brüte veya brütten nete yasal kesinti ve fatura simülasyonu"
                : "Bidirectional net-to-gross statutory tax simulation"}
            </p>
          </div>
        </div>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          >
            {isTr ? "Kapat" : "Close"}
          </Button>
        )}
      </div>

      {/* Control Strip 1: Calculation Direction */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-[var(--color-text-secondary)] flex items-center justify-between">
          <span>{isTr ? "Hesaplama Yönü" : "Calculation Direction"}</span>
          <span className="text-[10px] text-cyan-400 font-normal flex items-center gap-1">
            <ArrowRightLeft className="h-3 w-3" />
            {directionBadgeLabel}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDirection("NET_TO_GROSS")}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer text-center ${
              direction === "NET_TO_GROSS"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs"
                : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            {isTr ? "🎯 Netten Brüte (Hedef Net Kazanç)" : "🎯 Net to Gross (Desired Net)"}
          </button>
          <button
            type="button"
            onClick={() => setDirection("GROSS_TO_NET")}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer text-center ${
              direction === "GROSS_TO_NET"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs"
                : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            {isTr ? "📄 Brütten Nete (Fatura Bedeli)" : "📄 Gross to Net (Invoice Amount)"}
          </button>
        </div>
      </div>

      {/* Control Strip 2: Client Type & Document Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Client Type */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-[var(--color-text-secondary)] block">
            {isTr ? "Müşteri Mükellefiyet Türü" : "Client Tax Status"}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setClientType("CORPORATE")}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                clientType === "CORPORATE"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                  : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>{isTr ? "Kurumsal Şirket" : "Corporate"}</span>
            </button>
            <button
              type="button"
              onClick={() => setClientType("INDIVIDUAL")}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                clientType === "INDIVIDUAL"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                  : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <User className="h-3.5 w-3.5 shrink-0" />
              <span>{isTr ? "Bireysel / Şahıs" : "Individual"}</span>
            </button>
          </div>
        </div>

        {/* Document Type */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-[var(--color-text-secondary)] block">
            {isTr ? "Fatura / Belge Türünüz" : "Invoicing Method"}
          </label>
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setDocumentType("SMM")}
              className={`px-2 py-1.5 rounded-xl text-[11px] font-medium border transition-all cursor-pointer text-center ${
                documentType === "SMM"
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                  : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]"
              }`}
            >
              {isTr ? "SMM (Serbest)" : "SMM (Free)"}
            </button>
            <button
              type="button"
              onClick={() => setDocumentType("E_FATURA")}
              className={`px-2 py-1.5 rounded-xl text-[11px] font-medium border transition-all cursor-pointer text-center ${
                documentType === "E_FATURA"
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                  : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]"
              }`}
            >
              {isTr ? "e-Arşiv Fatura" : "e-Invoice"}
            </button>
            <button
              type="button"
              onClick={() => setDocumentType("GIDER_PUSULASI")}
              className={`px-2 py-1.5 rounded-xl text-[11px] font-medium border transition-all cursor-pointer text-center ${
                documentType === "GIDER_PUSULASI"
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                  : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]"
              }`}
            >
              {isTr ? "Gider Pusulası" : "Expense Note"}
            </button>
          </div>
        </div>
      </div>

      {/* Optional VAT Withholding for Corporate SMM */}
      {clientType === "CORPORATE" && documentType === "SMM" && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[var(--color-surface-base)]/60 border border-[var(--color-border-subtle)] text-[11px]">
          <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>{isTr ? "Kısmi KDV Tevkifatı (Belirlenmiş Alıcılar):" : "Partial VAT Withholding:"}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setVatWithholding("NONE")}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border cursor-pointer ${
                vatWithholding === "NONE"
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border-[var(--color-border-subtle)]"
              }`}
            >
              {isTr ? "Yok (Standart)" : "None"}
            </button>
            <button
              type="button"
              onClick={() => setVatWithholding("9_10")}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border cursor-pointer ${
                vatWithholding === "9_10"
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border-[var(--color-border-subtle)]"
              }`}
            >
              9/10 {isTr ? "Danışmanlık" : "Consulting"}
            </button>
            <button
              type="button"
              onClick={() => setVatWithholding("5_10")}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border cursor-pointer ${
                vatWithholding === "5_10"
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border-[var(--color-border-subtle)]"
              }`}
            >
              5/10 {isTr ? "Bakım/Onarım" : "Maintenance"}
            </button>
          </div>
        </div>
      )}

      {/* Software Export Mode Toggle (GVK 89/13 & KDVK 11/1-a) */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/25 text-[11px]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <span>{isTr ? "Yazılım İhracatı Rejimi" : "Software Export Regime"}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                GVK 89/13 & %0 KDV
              </span>
            </div>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">
              {isTr
                ? "Yurt dışı müşteriler için %100 gelir vergisi indirimi & %0 KDV (Kod 302)"
                : "100% tax deduction & 0% VAT (Code 302) for foreign clients"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsSoftwareExport(!isSoftwareExport)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            isSoftwareExport
              ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm"
              : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {softwareExportBadgeLabel}
        </button>
      </div>

      {/* Amount Input & Preset Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-[var(--color-text-primary)]">
            {amountInputLabel}
          </label>
          <span className="font-mono text-cyan-400 text-[11px]">{currency}</span>
        </div>

        <div className="flex gap-2">
          <TextInput
            type="number"
            min="0"
            step="500"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="50000"
            className="text-base font-semibold"
          />
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-[var(--color-text-tertiary)] flex items-center gap-1 mr-1">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            {isTr ? "Hızlı:" : "Quick:"}
          </span>
          {[20000, 40000, 60000, 100000].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmountInput(String(preset))}
              className="px-2 py-0.5 rounded-lg bg-[var(--color-surface-base)] hover:bg-cyan-500/15 text-[10px] font-mono text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] hover:text-cyan-300 transition-colors"
            >
              {preset.toLocaleString()} {currencySymbol}
            </button>
          ))}
        </div>
      </div>

      {/* Live Financial Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-1">
        {/* Net Take-home */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-0.5">
          <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
            {isTr ? "Cebinize Kalan Net" : "Net Take-Home"}
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-emerald-400">
            {fmt(taxResult.netTakeHome)} {currencySymbol}
          </div>
          <div className="text-[10px] text-emerald-300/80">
            {isTr ? "Harcanabilir net geliriniz" : "Your real spendable cash"}
          </div>
        </div>

        {/* Withholding (Stopaj) */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-0.5">
          <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span>{isTr ? "Stopaj Tevkifatı" : "Withholding"}</span>
            <span className="font-mono">%{Math.round(taxResult.withholdingRate * 100)}</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-amber-400">
            {fmt(taxResult.withholdingAmount)} {currencySymbol}
          </div>
          <div className="text-[10px] text-amber-300/80">
            {withholdingHelpText}
          </div>
        </div>

        {/* VAT (KDV) */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 space-y-0.5">
          <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider flex items-center justify-between">
            <span>{isTr ? "KDV Tutarı" : "VAT Amount"}</span>
            <span className="font-mono">%{Math.round(taxResult.vatRate * 100)}</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-blue-400">
            {fmt(taxResult.vatTotalAmount)} {currencySymbol}
          </div>
          <div className="text-[10px] text-blue-300/80">
            {isTr ? "⚠️ Devlete ödenecek emanet" : "⚠️ Remitted via VAT return"}
          </div>
        </div>

        {/* Gross Proposal Amount */}
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 space-y-0.5">
          <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
            {isTr ? "Teklife Yazılacak Brüt" : "Gross Contract Fee"}
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-cyan-300">
            {fmt(taxResult.grossAmount)} {currencySymbol}
          </div>
          <div className="text-[10px] text-cyan-300/80">
            {isTr ? "Sözleşme / Fatura bedeli" : "Official invoice basis"}
          </div>
        </div>

        {/* Freelancer Cash in Bank */}
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 space-y-0.5">
          <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
            {isTr ? "Hesaba Yatan Nakit" : "Deposited in Bank"}
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-purple-300">
            {fmt(taxResult.totalCashToFreelancer)} {currencySymbol}
          </div>
          <div className="text-[10px] text-purple-300/80">
            {isTr ? "Net + Alınan KDV Havalesi" : "Net fee + VAT receipt"}
          </div>
        </div>

        {/* Total Client Cost */}
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 space-y-0.5">
          <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            {isTr ? "Müşteri Toplam Maliyeti" : "Client Total Outflow"}
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-[var(--color-text-primary)]">
            {fmt(taxResult.totalCostToClient)} {currencySymbol}
          </div>
          <div className="text-[10px] text-[var(--color-text-tertiary)]">
            {isTr ? "Brüt + KDV (Şirket maliyeti)" : "Gross + VAT gross outflow"}
          </div>
        </div>
      </div>

      {/* Advisory Note & Safeguard */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[var(--color-text-primary)] font-medium text-[11px]">
            {isTr ? "Kritik Vergi ve Nakit Akışı Güvencesi:" : "Critical Tax Cash Flow Notice:"}
          </p>
          <p className="text-[11px] mt-0.5">
            {isTr ? taxResult.disclaimerTr : taxResult.disclaimerEn}
          </p>
        </div>
      </div>

      {/* Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleCopyNote}
          className="text-xs flex items-center gap-1.5"
        >
          {copiedNote ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isTr ? "Kopyalandı" : "Copied"}</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>{isTr ? "Yasal Notu Kopyala" : "Copy Legal Note"}</span>
            </>
          )}
        </Button>

        {onApplyToProposal && (
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleApply}
            className="text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>
              {isTr
                ? `Teklife Brüt Tutarı Aktar (${fmt(taxResult.grossAmount)} ${currencySymbol})`
                : `Apply Gross Amount (${fmt(taxResult.grossAmount)} ${currencySymbol})`}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
