"use client";

import React, { useState, useRef, useEffect, useId, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface SearchableSelectProps {
  id?: string;
  label?: string;
  badge?: React.ReactNode;
  placeholder?: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  disabledMessage?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  isTr?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

/**
 * Normalizes text for case- and diacritic-insensitive search,
 * supporting Turkish special characters (ı, i, ç, ğ, ö, ş, ü).
 */
function normalizeTurkish(text: string): string {
  if (!text) return "";
  return text
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function SearchableSelect({
  id,
  label,
  badge,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  disabledMessage,
  error,
  hint,
  required = false,
  isTr = true,
  className = "",
  icon,
}: SearchableSelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Find currently selected option
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // When value changes or dropdown closes, sync input display with selected label
  useEffect(() => {
    if (!isOpen) {
      setIsUserTyping(false);
      setSearchQuery(selectedOption ? selectedOption.label : "");
    }
  }, [selectedOption, isOpen]);

  // If options change while closed, keep search query synchronized
  useEffect(() => {
    if (!isOpen) {
      setIsUserTyping(false);
      setSearchQuery(selectedOption ? selectedOption.label : "");
    }
  }, [options, isOpen, selectedOption]);

  // Filter options by search query only when the user is actively typing!
  // If the dropdown is just opened to browse, show ALL available options.
  const filteredOptions = useMemo(() => {
    if (!isUserTyping || !searchQuery.trim()) {
      return options;
    }
    const normQuery = normalizeTurkish(searchQuery);
    return options.filter((opt) => {
      const normLabel = normalizeTurkish(opt.label);
      const normSub = normalizeTurkish(opt.sublabel || "");
      return normLabel.includes(normQuery) || normSub.includes(normQuery);
    });
  }, [options, searchQuery, isUserTyping]);

  // Reset or align highlight index when filtered list changes or dropdown opens
  useEffect(() => {
    if (isOpen) {
      const selectedIdx = filteredOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
    } else {
      setHighlightedIndex(0);
    }
  }, [filteredOptions, isOpen, value]);

  // Scroll active item into view when opening
  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedIdx = filteredOptions.findIndex((opt) => opt.value === value);
      const targetIdx = selectedIdx >= 0 ? selectedIdx : 0;
      const items = listRef.current.querySelectorAll("[role='option']");
      const activeItem = items[targetIdx] as HTMLElement | undefined;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, filteredOptions, value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsUserTyping(false);
        setSearchQuery(selectedOption ? selectedOption.label : "");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, selectedOption]);

  // Keep highlighted item in view during keyboard navigation
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll("[role='option']");
      const activeItem = items[highlightedIndex] as HTMLElement | undefined;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelectOption = (opt: SearchableOption) => {
    onChange(opt.value);
    setSearchQuery(opt.label);
    setIsUserTyping(false);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
    setIsUserTyping(true);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    // When an option is already selected and user presses a letter key, start a fresh search
    if (!isUserTyping && selectedOption) {
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        setSearchQuery("");
        setIsUserTyping(true);
        if (!isOpen) setIsOpen(true);
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setSearchQuery(e.key);
        setIsUserTyping(true);
        if (!isOpen) setIsOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredOptions[highlightedIndex];
      if (current) {
        handleSelectOption(current);
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      setIsOpen(false);
      setIsUserTyping(false);
      setSearchQuery(selectedOption ? selectedOption.label : "");
    }
  };

  const displayLabel = useMemo(() => {
    if (!label) return "";
    return label.replace(/\s*\*\s*$/, "").trim();
  }, [label]);

  const containerClassName = useMemo(() => {
    if (disabled) {
      return "opacity-50 bg-[var(--color-surface-hover)]/30 border-[var(--color-border-subtle)] cursor-not-allowed";
    }
    if (isOpen) {
      return "border-blue-500 bg-[var(--bg-surface)] ring-2 ring-blue-500/20 shadow-md";
    }
    if (error) {
      return "border-red-500/50 bg-[var(--bg-surface)]";
    }
    return "border-[var(--color-border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]";
  }, [disabled, isOpen, error]);

  const getOptionClassName = (isSelected: boolean, isHighlighted: boolean) => {
    if (isSelected) {
      return "bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20";
    }
    if (isHighlighted) {
      return "bg-[var(--bg-elevated)] text-[var(--color-text-primary)]";
    }
    return "text-[var(--color-text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--color-text-primary)]";
  };

  return (
    <div ref={containerRef} className={`w-full flex flex-col gap-1.5 relative ${isOpen ? "z-30" : "z-10"} ${className}`}>
      {/* Label & Optional Badge */}
      {label && (
        <div className="min-h-[22px] flex items-center justify-between gap-2">
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-[var(--color-text-primary)] select-none flex items-center gap-1.5"
          >
            <span>{displayLabel}</span>
            {required && (
              <span className="text-red-400 text-xs font-normal" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {badge && (
            <span className="text-[10px] font-mono font-medium text-slate-400 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] select-none">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Trigger & Search Input Box */}
      <div
        className={`relative flex items-center rounded-xl border transition-all duration-200 ${containerClassName}`}
      >
        {/* Left Icon */}
        <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-[var(--color-text-tertiary)] shrink-0">
          {icon || <Search className="h-4 w-4" />}
        </div>

        {/* Search / Value Input */}
        <input
          ref={inputRef}
          id={selectId}
          type="text"
          disabled={disabled}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsUserTyping(true);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? disabledMessage || (isTr ? "Seçim devre dışı" : "Disabled")
              : placeholder || (isTr ? "Yazarak arayın veya seçin..." : "Type to search or select...")
          }
          className="w-full h-11 bg-transparent text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] border-0 border-none outline-none focus:outline-none ring-0 focus:ring-0 shadow-none py-2"
          autoComplete="off"
        />

        {/* Right Actions */}
        <div className="pr-3 flex items-center gap-1.5 shrink-0">
          {/* Clear Button */}
          {!disabled && (value || searchQuery) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              title={isTr ? "Temizle" : "Clear"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Dropdown Chevron */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                if (isOpen) {
                  setIsOpen(false);
                } else {
                  setIsOpen(true);
                  inputRef.current?.focus();
                }
              }
            }}
            className={`p-1 text-[var(--color-text-tertiary)] transition-transform duration-200 cursor-pointer ${
              isOpen ? "rotate-180 text-blue-400" : ""
            }`}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Floating Filtered Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 z-50 max-h-72 overflow-y-auto rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--bg-surface)] shadow-2xl shadow-black/40 dark:shadow-black/80 p-1.5 space-y-1 animate-in fade-in-0 zoom-in-95 duration-150 select-none"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelectOption(opt)}
                  className={`flex items-start justify-between gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${getOptionClassName(
                    isSelected,
                    isHighlighted
                  )}`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    {opt.icon && (
                      <div className="mt-0.5 text-blue-400 shrink-0">
                        {opt.icon}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {opt.label}
                      </div>
                      {opt.sublabel && (
                        <div className="text-[11px] text-[var(--color-text-tertiary)] font-normal line-clamp-1 mt-0.5">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    {opt.badge !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && <Check className="h-4 w-4 text-blue-400 shrink-0" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-5 text-center space-y-1">
              <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                {isTr
                  ? `"${searchQuery}" ile eşleşen sonuç bulunamadı`
                  : `No results found for "${searchQuery}"`}
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {isTr
                  ? "Farklı bir arama kelimesi yazabilir veya aramayı temizleyebilirsiniz."
                  : "Try typing a different keyword or clear the search."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error or Hint Message */}
      {error && <p className="text-[11px] text-red-400 font-medium">{error}</p>}
      {!error && hint && <p className="text-[11px] text-[var(--color-text-tertiary)]">{hint}</p>}
    </div>
  );
}
