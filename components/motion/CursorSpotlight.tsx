"use client";

import { useEffect, useRef } from "react";

export default function CursorSpotlight({
  color = "229, 9, 20", // rgb triplet, no alpha — kept to the brand's single accent
  size = 480,
  opacity = 0.16,
  className = "",
}: {
  color?: string;
  size?: number;
  opacity?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--spot-x", "50%");
      el.style.setProperty("--spot-y", "30%");
      return;
    }

    let raf = 0;
    let x = 50;
    let y = 30;
    let tx = 50;
    let ty = 30;

    const onMove = (e: PointerEvent) => {
      const rect = el.parentElement?.getBoundingClientRect();
      if (!rect) return;
      tx = ((e.clientX - rect.left) / rect.width) * 100;
      ty = ((e.clientY - rect.top) / rect.height) * 100;
    };

    const loop = () => {
      x += (tx - x) * 0.07;
      y += (ty - y) * 0.07;
      el.style.setProperty("--spot-x", `${x}%`);
      el.style.setProperty("--spot-y", `${y}%`);
      raf = requestAnimationFrame(loop);
    };

    const parent = el.parentElement;
    parent?.addEventListener("pointermove", onMove as EventListener);
    raf = requestAnimationFrame(loop);

    return () => {
      parent?.removeEventListener("pointermove", onMove as EventListener);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background: `radial-gradient(${size}px circle at var(--spot-x, 50%) var(--spot-y, 30%), rgba(${color}, ${opacity}), transparent 70%)`,
      }}
    />
  );
}
