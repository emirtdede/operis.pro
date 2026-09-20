"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Printer,
  Copy,
  Check,
  Download,
  FileCheck2,
} from "lucide-react";
import type { GeneratedContractResult, ContractLanguage } from "@/src/modules/contracts/types";
import { getDownloadPdfButtonLabel } from "./contract-draft-helpers";

export interface ContractActionsToolbarProps {
  isLoading: boolean;
  contractData: GeneratedContractResult | null;
  activeLang: ContractLanguage;
  isTr: boolean;
  engagementId: string;
  isWhiteLabel?: boolean;
  onClose: () => void;
}

export function ContractActionsToolbar({
  isLoading,
  contractData,
  activeLang,
  isTr,
  engagementId,
  isWhiteLabel,
  onClose,
}: ContractActionsToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!contractData) return;
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(contractData.markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handleDownloadMarkdown = () => {
    if (!contractData || typeof window === "undefined") return;
    const isWl = Boolean(isWhiteLabel || contractData.isWhiteLabel);
    const filenamePrefix = isWl ? "sozlesme-" : "operis-sozlesme-";
    const blob = new Blob([contractData.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filenamePrefix}${contractData.contractRef}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadVectorPdf = () => {
    if (!contractData || typeof window === "undefined") return;
    const isWl = Boolean(isWhiteLabel || contractData.isWhiteLabel);
    const wlParam = isWl ? "&whiteLabel=true" : "";
    const url = `/api/work/${engagementId}/contract/pdf?lang=${activeLang}&download=true${wlParam}`;
    window.open(url, "_blank");
  };

  const handlePrint = () => {
    if (!contractData || typeof window === "undefined") return;

    // Open clean print window with statutory printable HTML via W3C Blob URL (eliminates document.write)
    const blob = new Blob([contractData.htmlContent], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        URL.revokeObjectURL(blobUrl);
      };
    } else {
      URL.revokeObjectURL(blobUrl);
      // Fallback to browser window.print()
      window.print();
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleDownloadVectorPdf}
          disabled={isLoading || !contractData}
          className="gap-2 shadow-md shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto justify-center text-xs"
        >
          <FileCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{getDownloadPdfButtonLabel(activeLang, isTr)}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrint}
          disabled={isLoading || !contractData}
          className="gap-2 w-full sm:w-auto justify-center text-xs"
        >
          <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{isTr ? "Yazdır / Önizle" : "Print / Preview"}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadMarkdown}
          disabled={isLoading || !contractData}
          className="gap-2 w-full sm:w-auto justify-center text-xs"
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{isTr ? "Markdown İndir (.md)" : "Download Markdown (.md)"}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={isLoading || !contractData}
          className="gap-2 w-full sm:w-auto justify-center text-xs"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span className="text-emerald-400">{isTr ? "Kopyalandı" : "Copied"}</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{isTr ? "Metni Kopyala" : "Copy Text"}</span>
            </>
          )}
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="w-full sm:w-auto justify-center text-xs"
      >
        {isTr ? "Kapat" : "Close"}
      </Button>
    </div>
  );
}
