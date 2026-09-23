interface BrandLogoProps {
  className?: string;
  size?: number | "sm" | "md" | "lg";
  showText?: boolean;
}

function getLogoNumericHeight(size: number | "sm" | "md" | "lg"): number {
  if (typeof size === "number") {
    return size;
  }
  if (size === "sm") {
    return 24;
  }
  if (size === "lg") {
    return 40;
  }
  return 32;
}

const SIZE_CLASSES = {
  sm: { icon: "w-6 h-6", full: "h-6 w-[75px]" },
  md: { icon: "w-8 h-8", full: "h-8 w-[100px]" },
  lg: { icon: "w-10 h-10", full: "h-10 w-[125px]" },
} as const;

function getLogoSizeClass(size: number | "sm" | "md" | "lg", showText: boolean): string {
  if (size === "sm" || (typeof size === "number" && size <= 24)) {
    return showText ? SIZE_CLASSES.sm.full : SIZE_CLASSES.sm.icon;
  }
  if (size === "lg" || (typeof size === "number" && size >= 40)) {
    return showText ? SIZE_CLASSES.lg.full : SIZE_CLASSES.lg.icon;
  }
  return showText ? SIZE_CLASSES.md.full : SIZE_CLASSES.md.icon;
}

export function BrandLogo({ className = "", size = "md", showText = true }: BrandLogoProps) {
  const numericHeight = getLogoNumericHeight(size);
  const numericWidth = Math.round(numericHeight * (350 / 112));
  const sizeClass = getLogoSizeClass(size, showText);

  if (!showText) {
    return (
      <div
        className={`inline-flex items-center justify-center select-none ${sizeClass} ${className}`}
      >
        <svg
          width={numericHeight}
          height={numericHeight}
          viewBox="0 0 150 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="shrink-0 text-[var(--color-text-primary)]"
        >
          {/* 1. Dış Akış Şeridi */}
          <path
            d="M 25.50 124.50 A 70 70 0 0 1 124.50 25.50"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          {/* 2. Merkez Akış Şeridi */}
          <path
            d="M 36.11 113.89 A 55 55 0 0 1 113.89 36.11"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          {/* 3. İç Akış Şeridi */}
          <path
            d="M 46.72 103.28 A 40 40 0 0 1 103.28 46.72"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          {/* 4. Birleşik Monolitik Gövde */}
          <path
            d="M 113.89 36.11 A 55 55 0 0 1 36.11 113.89"
            stroke="currentColor"
            strokeWidth="40"
            strokeLinecap="butt"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center select-none ${sizeClass} ${className}`}
    >
      {/* Light Theme Logo (#09090B on transparent background) */}
      <img
        src="/operis-logo-acik.svg"
        alt="Operis"
        width={numericWidth}
        height={numericHeight}
        className="block [html[data-theme='dark']_&]:hidden [html[data-theme='black']_&]:hidden dark:hidden object-contain max-w-none"
        loading="eager"
        decoding="sync"
      />
      {/* Dark / OLED Theme Logo (#FAFAFA on transparent background) */}
      <img
        src="/operis-logo-koyu.svg"
        alt="Operis"
        width={numericWidth}
        height={numericHeight}
        className="hidden [html[data-theme='dark']_&]:block [html[data-theme='black']_&]:block dark:block object-contain max-w-none"
        loading="eager"
        decoding="sync"
      />
    </div>
  );
}
