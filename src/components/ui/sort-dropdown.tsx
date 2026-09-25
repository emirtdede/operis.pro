"use client";

import { ArrowUpDown, ChevronDown } from "lucide-react";

export interface SortOption {
  value: string;
  label: string;
}

export interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  locale: string;
  className?: string;
}

export function SortDropdown({ value, onChange, locale, className = "" }: SortDropdownProps) {
  const isTr = locale === "tr";

  const options: SortOption[] = [
    { value: "newest", label: isTr ? "En Yeni (En Taze İlanlar)" : "Newest (Fresh First)" },
    { value: "expiring_soon", label: isTr ? "Kapanışa En Az Kalan" : "Expiring Soonest" },
    { value: "budget_desc", label: isTr ? "Bütçe: Yüksekten Düşüğe" : "Budget: High to Low" },
    { value: "budget_asc", label: isTr ? "Bütçe: Düşükten Yükseğe" : "Budget: Low to High" },
    { value: "proposals_desc", label: isTr ? "En Çok Teklif Alanlar" : "Most Proposals" },
  ];

  return (
    <div className={`group relative inline-flex items-center ${className}`}>
      <label htmlFor="operis-sort-select" className="sr-only">
        {isTr ? "İlan Sıralama" : "Sort Listings"}
      </label>
      {/* Sol Sıralama SVG İkonu (Tema renkleri ile dinamik uyumlu) */}
      <div className="pointer-events-none absolute left-3 flex items-center text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
        <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
      </div>
      <select
        id="operis-sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] pl-8 pr-8 text-xs font-medium text-[var(--color-text-primary)] shadow-2xs hover:border-[var(--color-border-strong)] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-[var(--color-surface-base)] text-[var(--color-text-primary)] dark:bg-[#1c1e23] dark:text-[#f2f3f5]"
          >
            {opt.label}
          </option>
        ))}
      </select>
      {/* Sağ Açılır Ok SVG İkonu */}
      <div className="pointer-events-none absolute right-2.5 flex items-center text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors">
        <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
      </div>
    </div>
  );
}
