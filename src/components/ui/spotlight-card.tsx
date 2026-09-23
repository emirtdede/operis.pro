"use client";

import React, { useRef, useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  spotlightColor?: string;
  borderColor?: string;
}

export function SpotlightCard({
  children,
  className,
  contentClassName,
  spotlightColor = "rgba(56, 189, 248, 0.1)",
  borderColor = "rgba(129, 140, 248, 0.35)",
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [opacity, setOpacity] = useState<number>(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={twMerge(
        clsx(
          "relative overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] backdrop-blur-md transition-all duration-300 hover:border-[var(--color-border-strong)] hover:shadow-lg flex flex-col h-full",
          className
        )
      )}
      {...props}
    >
      {/* Interactive Radial Spotlight Sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] !m-0 m-0 transition-opacity duration-300 select-none"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {/* Subtle Border Spotlight Line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] !m-0 m-0 transition-opacity duration-300 select-none"
        style={{
          opacity,
          background: `radial-gradient(300px circle at ${position.x}px ${position.y}px, ${borderColor}, transparent 60%)`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      />
      <div
        className={twMerge(
          "relative z-10 flex flex-col justify-between h-full flex-1",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
