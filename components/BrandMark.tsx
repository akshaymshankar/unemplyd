"use client";

import Image from "next/image";

const SRC = {
  dark: "/assets/logo-on-dark.png", // white wordmark — place on dark/ink surfaces
  light: "/assets/logo-on-light.png", // black wordmark — place on light/paper surfaces
} as const;

// Natural pixel aspect ratio of each cropped source file, so next/image
// can reserve the right box and avoid layout shift while it loads.
const RATIO = {
  dark: 1929 / 419,
  light: 1816 / 399,
} as const;

export default function BrandMark({
  tone = "dark",
  height = 22,
  className = "",
  priority = false,
}: {
  tone?: "dark" | "light";
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round(height * RATIO[tone]);

  return (
    <Image
      src={SRC[tone]}
      alt="unemplyd."
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
