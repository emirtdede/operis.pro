"use client";

import { useState } from "react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Printer, Copy, Check, Shield, Layers } from "lucide-react";

export interface ContractDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  listingTitle: string;
  category: string;
  matchedAt: string | Date;
  offerMessage: string;
  budgetLabel: string | null;
  timelineLabel: string | null;
  counterparty: {
    displayName: string;
    handle: string;
    email: string;
    phone: string | null;
  };
  currentUser: {
    displayName?: string;
    email?: string;
  };
  isOwner: boolean;
  locale: string;
}

export function ContractDraftModal({
  isOpen,
  onClose,
  engagementId,
  listingTitle,
  category,
  matchedAt,
  offerMessage,
  budgetLabel,
  timelineLabel,
  counterparty,
  currentUser,
  isOwner,
  locale,
}: ContractDraftModalProps) {
  const isTr = locale === "tr";
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(matchedAt).toLocaleDateString(isTr ? "tr-TR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const clientName = isOwner
    ? currentUser.displayName || currentUser.email || "İşveren"
    : counterparty.displayName;
  const clientEmail = isOwner ? currentUser.email || "—" : counterparty.email;

  const contractorName = isOwner
    ? counterparty.displayName
    : currentUser.displayName || currentUser.email || "Yüklenici";
  const contractorEmail = isOwner ? counterparty.email : currentUser.email || "—";

  const contractText = `BAĞIMSIZ YAZILIM VE TEKNOLOJİ HİZMET SÖZLEŞMESİ TASLAĞI
Referans Kodu: OPR-ENG-${engagementId.slice(0, 8).toUpperCase()}
Tanzim Tarihi: ${formattedDate}

MADDE 1: TARAFLAR
1.1. İŞVEREN (Müşteri):
     Adı / Unvanı : ${clientName}
     E-posta      : ${clientEmail}
1.2. YÜKLENİCİ (Yazılım / Teknoloji Uzmanı):
     Adı / Unvanı : ${contractorName}
     E-posta      : ${contractorEmail}

MADDE 2: SÖZLEŞMENİN KONUSU VE KAPSAMI
İşbu sözleşmenin konusu, Yüklenici tarafından İşveren'e sunulacak olan "${listingTitle}" projesine ilişkin yazılım geliştirme, tasarım ve teknoloji hizmetlerinin ifasıdır.
- Kategori        : ${category}
- Kapsam Özeti    : ${offerMessage.replace(/\n+/g, " ")}

MADDE 3: PROJE BEDELİ VE ÖDEME ŞARTLARI
3.1. Kararlaştırılan Proje Bedeli: ${budgetLabel || "Karşılıklı belirlenecektir"}
3.2. Ödeme Şekli: Bedel, doğrudan İşveren tarafından Yüklenici'nin bildireceği banka hesabına (IBAN) veya fatura karşılığı ödenecektir.
3.3. Platform Aracılığı Kesinlikle Yoktur: Operis platformu hiçbir surette emanet hesabı (escrow) tutmaz, komisyon almaz ve ödeme aracılığı yapmaz.
3.4. Tavsiye Edilen 3 Aşamalı Kilometre Taşı & Avans Çizelgesi:
     - 1. Aşama: Tasarım ve Mimari Onayı (%30 avans)
     - 2. Aşama: Fonksiyonel Demo ve Test (%40 ara hak ediş)
     - 3. Aşama: Kaynak Kod Teslimi ve Canlıya Alma (%30 son ödeme ve mülkiyet devri)

MADDE 4: TESLİMAT VE SÜRE
4.1. Öngörülen Teslimat Süresi: ${timelineLabel || "Karşılıklı anlaşma ile belirlenecektir"}
4.2. İşveren, teslimatı takip eden 7 (yedi) iş günü içerisinde test ve incelemelerini tamamlayarak kabul veya revizyon talebini bildirmekle yükümlüdür.

MADDE 5: FİKRİ MÜLKİYET VE TELİF HAKLARI (5846 SAYILI FSEK)
Proje bedelinin tamamı Yüklenici'ye ödendiği anda, üretilen tüm kaynak kodlar, belgeler ve tasarımlar üzerindeki mali haklar (5846 sayılı Fikri ve Sanat Eserleri Kanunu tahtında işleme, çoğaltma, yayma, temsil ve kamuya iletim hakları) gayrikabili rücu olarak İşveren'e devredilmiş sayılır.

MADDE 6: GİZLİLİK VE TİCARİ SIRLAR (NDA)
Taraflar, proje süresince edindikleri gizli bilgi, kaynak kod, veri ve ticari sırları karşı tarafın yazılı onayı olmaksızın üçüncü şahıslara açıklayamaz.

MADDE 7: OPERİS PLATFORMU SORUMSUZLUK VE DAVA MUAFİYETİ
İşbu sözleşme münhasıran İşveren ile Yüklenici arasında bağımsız olarak akdedilmiştir. Operis platformu (ve bağlı işleticisi); kar amacı gütmeyen, ücretsiz bir aracı ve yer sağlayıcı olup işbu sözleşmenin tarafı, garantörü, kefili veya temsilcisi değildir. Taraflar arasındaki ödeme yapılmaması, ayıplı ifa, dolandırıcılık veya gecikme hallerinde Operis'e hiçbir hukuki veya cezai sorumluluk rücu edilemez; Operis aleyhine dava açılamaz.

MADDE 8: ARABULUCULUK VE DOĞRUDAN UYUŞMAZLIK ÇÖZÜMÜ
Taraflar, işbu sözleşmeden doğabilecek her türlü uyuşmazlıkta dava açmadan önce 6325 sayılı Hukuk Uyuşmazlıklarında Arabuluculuk Kanunu uyarınca doğrudan arabuluculuk yoluna başvurmayı peşinen kabul ve taahhüt ederler. İhtilafın arabuluculukla çözülememesi durumunda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.

İŞVEREN KAŞE / İMZA:                      YÜKLENİCİ KAŞE / İMZA:
___________________________               ___________________________`;

  const handleCopy = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(contractText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      {/* Global print style */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #opr-printable-contract,
          #opr-printable-contract * {
            visibility: visible;
          }
          #opr-printable-contract {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt;
            line-height: 1.5;
            font-family: monospace;
          }
        }
      `}</style>

      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={
          isTr
            ? "1-Tıkla Resmi Hizmet & Fikri Mülkiyet Devir Sözleşmesi"
            : "1-Click Service & IP Transfer Contract"
        }
        description={
          isTr
            ? "5846 sayılı FSEK telif devri ve 6325 sayılı arabuluculuk hükümleriyle tarafları doğrudan koruyan resmi sözleşme."
            : "Official bilateral contract draft with IP transfer and mediation clauses for full legal self-protection."
        }
      >
        <div className="space-y-5">
          {/* Notice Badge */}
          <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {isTr
                  ? "Hukuki Koruma ve Arabuluculuk Zırhı: "
                  : "Legal Armor & Direct Mediation: "}
              </span>
              {isTr
                ? "Operis emanet para tutmaz; taraflar arasında 5846 sayılı FSEK ve 6325 sayılı kanun güvencesi sağlar. Bu sözleşmeyi PDF olarak kaydedip imzalayarak doğrudan yürürlüğe koyabilirsiniz."
                : "Operis operates zero escrow. Print or save this official PDF contract to establish binding legal and IP rights directly between parties."}
            </div>
          </div>

          {/* Lightweight 3-Step Milestone Schedule Recommendation */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-xs text-[var(--color-text-primary)]">
                <Layers className="h-4 w-4 text-blue-400" aria-hidden="true" />
                <span>
                  {isTr
                    ? "Tavsiye Edilen 3 Adımlı Kilometre Taşı & Avans Çizelgesi"
                    : "Recommended 3-Step Milestone Schedule"}
                </span>
              </div>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                {isTr ? "Platform para tutmaz" : "No escrow"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1">
                <div className="flex items-center justify-between font-bold text-emerald-400 text-xs">
                  <span>{isTr ? "1. Aşama" : "Phase 1"}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 font-mono text-[10px]">
                    %30
                  </span>
                </div>
                <div className="font-semibold text-[var(--color-text-primary)] text-[11px]">
                  {isTr ? "Tasarım & Mimari Onayı" : "Design & Architecture"}
                </div>
                <p className="text-[10px] text-[var(--color-text-secondary)] leading-normal">
                  {isTr
                    ? "Arayüz onayı ve altyapı kurulumu sonrası avans."
                    : "Initial advance upon architecture approval."}
                </p>
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 space-y-1">
                <div className="flex items-center justify-between font-bold text-blue-400 text-xs">
                  <span>{isTr ? "2. Aşama" : "Phase 2"}</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 font-mono text-[10px]">
                    %40
                  </span>
                </div>
                <div className="font-semibold text-[var(--color-text-primary)] text-[11px]">
                  {isTr ? "Fonksiyonel Demo & Test" : "Functional Demo & Test"}
                </div>
                <p className="text-[10px] text-[var(--color-text-secondary)] leading-normal">
                  {isTr
                    ? "Çalışan prototip ve test sürümünün sunumuyla ara ödeme."
                    : "Interim payment upon working prototype demo."}
                </p>
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 space-y-1">
                <div className="flex items-center justify-between font-bold text-purple-400 text-xs">
                  <span>{isTr ? "3. Aşama" : "Phase 3"}</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 font-mono text-[10px]">
                    %30
                  </span>
                </div>
                <div className="font-semibold text-[var(--color-text-primary)] text-[11px]">
                  {isTr ? "Kaynak Kod & FSEK Devri" : "Source Code & IP Transfer"}
                </div>
                <p className="text-[10px] text-[var(--color-text-secondary)] leading-normal">
                  {isTr
                    ? "Canlıya alma, kod teslimi ve mülkiyet devriyle son ödeme."
                    : "Final payment upon repository handover & launch."}
                </p>
              </div>
            </div>
          </div>

          {/* Contract Paper Viewer */}
          <div
            id="opr-printable-contract"
            className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] p-5 sm:p-6 font-mono text-[11px] sm:text-xs text-[var(--color-text-primary)] leading-relaxed max-h-[360px] overflow-y-auto whitespace-pre-wrap select-all shadow-inner"
          >
            {contractText}
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pt-2 border-t border-[var(--color-border-subtle)]">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handlePrint}
                className="gap-2 shadow-md shadow-blue-500/20 w-full sm:w-auto justify-center text-xs"
              >
                <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {isTr ? "Resmi PDF Sözleşmesi Oluştur & Yazdır" : "Generate & Print Official PDF"}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
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

            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="w-full sm:w-auto justify-center text-xs">
              {isTr ? "Kapat" : "Close"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
