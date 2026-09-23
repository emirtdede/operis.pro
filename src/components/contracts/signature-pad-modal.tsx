"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { PenTool, Upload, RotateCcw, AlertCircle, ShieldCheck, Loader2 } from "lucide-react";

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  role: "CLIENT" | "CONTRACTOR";
  defaultSignerName: string;
  selectedContracts: string[];
  expectedVersion?: number;
  locale?: string;
  onSignatureSuccess: () => void;
}

export function SignaturePadModal({
  isOpen,
  onClose,
  engagementId,
  role,
  defaultSignerName,
  selectedContracts,
  expectedVersion,
  locale = "tr",
  onSignatureSuccess,
}: SignaturePadModalProps) {
  const isTr = locale === "tr";
  const [activeTab, setActiveTab] = useState<"DRAW" | "UPLOAD">("DRAW");
  const [signerName, setSignerName] = useState(defaultSignerName || "");
  const [legalAcknowledged, setLegalAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Initialize canvas context
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High-DPI scaling
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = "#0284c7"; // Brand cyan-blue
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === "DRAW") {
      setTimeout(initCanvas, 50);
    }
  }, [isOpen, activeTab, initCanvas]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { clientX: number; clientY: number } | null => {
    if ("touches" in e) {
      const touch = e.touches[0] ?? e.changedTouches?.[0];
      if (!touch) return null;
      return { clientX: touch.clientX, clientY: touch.clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const { clientX, clientY } = coords;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const rect = canvas.getBoundingClientRect();
    const { clientX, clientY } = coords;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Image Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(isTr ? "İmza görseli en fazla 5 MB olabilir." : "Image must be under 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedDataUrl(result);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!signerName.trim()) {
      setErrorMessage(isTr ? "Lütfen imzalayan isim ve unvanını girin." : "Please enter signer name.");
      return;
    }

    if (!legalAcknowledged) {
      setErrorMessage(
        isTr
          ? "Sözleşmeyi imzalamak için Operis Platform Sorumsuzluk ve Dava Muafiyeti klozunu onaylamanız gerekmektedir."
          : "You must accept the platform liability waiver."
      );
      return;
    }

    let finalDataUrl: string;
    if (activeTab === "DRAW") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        setErrorMessage(isTr ? "Lütfen ekrana imzanızı çizin." : "Please draw your signature.");
        return;
      }
      finalDataUrl = canvas.toDataURL("image/png");
    } else {
      if (!uploadedDataUrl) {
        setErrorMessage(isTr ? "Lütfen bir imza veya kaşe görseli yükleyin." : "Please upload a signature image.");
        return;
      }
      finalDataUrl = uploadedDataUrl;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/work/${engagementId}/contract/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          signerName: signerName.trim(),
          signatureType: activeTab === "DRAW" ? "DRAWN" : "UPLOADED",
          signatureDataUrl: finalDataUrl,
          legalAcknowledged: true,
          selectedContracts,
          expectedVersion,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 409) {
          throw new Error(
            isTr
              ? "Sözleşme paketi başka bir işlem tarafından güncellendi. Lütfen sayfayı yenileyip güncel durumu inceleyin."
              : "Contract package was updated by another process. Please refresh to review the latest package."
          );
        }
        throw new Error(data.error || (isTr ? "İmza kaydedilemedi." : "Failed to submit signature."));
      }

      onSignatureSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={isTr ? "E-İmza & Kaşe Onayı" : "Digital Signature & Stamp Approval"}>
      <div className="space-y-4 max-w-lg mx-auto">
        <p className="text-xs text-[var(--color-text-muted)]">
          {isTr
            ? "İmzanız seçili tüm sözleşmelere ve eklere otomatik olarak uygulanacaktır. Görsel Cloudflare R2 geçici alanında saklanacak, işlem tamamlanıp sözleşme tanzim edilince silinecektir."
            : "Your signature will automatically be applied to all selected agreements. Stored ephemerally in R2 until document compilation."}
        </p>

        {/* Tab Selection */}
        <div className="flex rounded-lg bg-[var(--color-surface-subtle)] p-1 border border-[var(--color-border-subtle)]">
          <button
            type="button"
            onClick={() => setActiveTab("DRAW")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "DRAW"
                ? "bg-indigo-600 text-white shadow"
                : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            <span>{isTr ? "Ekranda Çiz" : "Draw on Screen"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("UPLOAD")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "UPLOAD"
                ? "bg-indigo-600 text-white shadow"
                : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{isTr ? "İmza / Kaşe Görseli Yükle" : "Upload Image / Stamp"}</span>
          </button>
        </div>

        {/* Signer Name Input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            {isTr ? "İmzalayan Adı Soyadı / Şirket Unvanı:" : "Signer Full Name / Entity:"}
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder={isTr ? "Örn: Ahmet Yılmaz veya Şirket Yetkilisi" : "e.g. John Doe"}
            className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Tab 1: Draw on Canvas */}
        {activeTab === "DRAW" && (
          <div className="space-y-2">
            <div className="relative rounded-xl border border-dashed border-indigo-500/40 bg-zinc-950 p-2 overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-36 touch-none cursor-crosshair bg-transparent"
              />
              {!hasDrawn && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
                  {isTr ? "İmzanızı bu alana çizin (dokunmatik veya fare)" : "Draw your signature here"}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{isTr ? "Temizle" : "Clear"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Upload signature image */}
        {activeTab === "UPLOAD" && (
          <div className="space-y-2">
            <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-4 text-center">
              <input
                type="file"
                id="signature-file-upload"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploadedDataUrl ? (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <img
                      src={uploadedDataUrl}
                      alt="Uploaded signature"
                      className="max-h-28 max-w-full object-contain rounded border border-zinc-800 p-1 bg-white"
                    />
                  </div>
                  <label
                    htmlFor="signature-file-upload"
                    className="inline-block text-xs text-indigo-400 hover:underline cursor-pointer"
                  >
                    {isTr ? "Farklı bir görsel seç" : "Choose different image"}
                  </label>
                </div>
              ) : (
                <label htmlFor="signature-file-upload" className="cursor-pointer block space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-zinc-500" />
                  <div className="text-xs text-zinc-300 font-medium">
                    {isTr ? "İmza veya Şirket Kaşesi Seçin" : "Select Signature or Stamp Image"}
                  </div>
                  <div className="text-[10px] text-zinc-500">PNG, WebP veya JPG (Maks. 5 MB)</div>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Mandatory Platform Safe Harbor & Bilateral Agreement Checkbox */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={legalAcknowledged}
              onChange={(e) => setLegalAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-[11px] leading-relaxed text-amber-200">
              {isTr ? (
                <>
                  <strong>Platform Sorumsuzluğu ve Dava Muafiyeti Onayı (TBK m. 115 & HMK m. 193):</strong> Operis
                  platformunun bu sözleşmenin tarafı olmadığını, yalnızca iki tarafı bir araya getiren bağımsız bir yer
                  sağlayıcı olduğunu; sözleşmenin %100 opsiyonel olduğunu ve doğabilecek her türlü hukuki, cezai ve mali
                  ihtilafın münhasıran karşı tarafla aramda çözümleneceğini peşinen kabul ve taahhüt ediyorum.
                </>
              ) : (
                <>
                  <strong>Platform Liability Waiver & Safe Harbor Acknowledgment:</strong> I acknowledge that Operis is
                  not a party to this agreement and merely acts as an independent venue provider. All liabilities and
                  disputes remain strictly bilateral between Client and Contractor.
                </>
              )}
            </span>
          </label>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            {isTr ? "Vazgeç" : "Cancel"}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !legalAcknowledged}
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isTr ? "İmza Mühürleniyor..." : "Sealing Signature..."}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>{isTr ? "İmzala ve Paketi Onayla" : "Sign & Execute Package"}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
