type GlassPanelProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "dark" | "light"; // the surface it's floating on, not the global theme
};

export default function GlassPanel({
  children,
  className = "",
  tone = "dark",
}: GlassPanelProps) {
  const toneClasses =
    tone === "dark"
      ? "border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
      : "border-ink/10 bg-ink/[0.03] shadow-[inset_0_1px_0_0_rgba(10,10,10,0.05)]";

  return (
    <div
      className={`relative rounded-2xl border backdrop-blur-md ${toneClasses} ${className}`}
    >
      {children}
    </div>
  );
}
