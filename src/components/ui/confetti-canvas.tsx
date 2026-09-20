"use client";

import { useEffect, useRef } from "react";

interface ConfettiCanvasProps {
  durationMs?: number;
  particleCount?: number;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  shape: "rect" | "circle";
  alpha: number;
}

const PALETTE = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber/Gold
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
];

export function ConfettiCanvas({
  durationMs = 3500,
  particleCount = 120,
  onComplete,
}: ConfettiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Accessibility check: skip heavy particle animation if user prefers reduced motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onComplete?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Initialize confetti particles from top-center burst
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI / 4) + Math.random() * (Math.PI / 2); // Spread downwards
      const speed = 4 + Math.random() * 12;
      particles.push({
        x: width * 0.5 + (Math.random() - 0.5) * 200,
        y: height * 0.15 + (Math.random() - 0.5) * 50,
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1) + (Math.random() - 0.5) * 4,
        vy: -Math.abs(Math.sin(angle) * speed * 0.8), // Initial upward pop
        size: 6 + Math.random() * 6,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)]!,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        wobble: Math.random() * 10,
        wobbleSpeed: 0.05 + Math.random() * 0.08,
        shape: Math.random() > 0.3 ? "rect" : "circle",
        alpha: 1,
      });
    }

    let animationFrameId: number;
    const startTime = performance.now();

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;

      for (const p of particles) {
        p.x += p.vx;
        p.vy += 0.32; // Gravity
        p.vx *= 0.98; // Air resistance
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;

        // Fade out during the last 20% of duration
        if (progress > 0.8) {
          p.alpha = Math.max(0, 1 - (progress - 0.8) / 0.2);
        }

        if (p.y < height + 40 && p.alpha > 0) {
          aliveCount++;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x + Math.sin(p.wobble) * 4, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;

          if (p.shape === "rect") {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      if (progress < 1 && aliveCount > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        onComplete?.();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [durationMs, particleCount, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
}
