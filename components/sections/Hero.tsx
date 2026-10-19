"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { ease, stagger } from "@/lib/tokens";
import { useSectionTone } from "@/components/theme/ThemeProvider";
import MagneticButton from "@/components/motion/MagneticButton";
import CursorSpotlight from "@/components/motion/CursorSpotlight";

const BlueprintField = dynamic(
  () => import("@/components/three/BlueprintField"),
  { ssr: false }
);

const LINE_ONE = "Build Beyond".split(" ");
const LINE_TWO = "The Classroom.".split(" ");

function RevealLine({
  words,
  delayOffset,
}: {
  words: string[];
  delayOffset: number;
}) {
  return (
    <span className="block overflow-hidden">
      {words.map((word, i) => (
        <span key={word} className="inline-block overflow-hidden mr-[0.28em]">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{
              duration: 0.9,
              delay: delayOffset + i * stagger.word,
              ease: ease.out,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  // Hero is dark by default; in light mode it flips to paper, same as
  // every other section — see useSectionTone.
  const tone = useSectionTone(true);

  return (
    <section
      id="top"
      className={`relative min-h-[100svh] w-full overflow-hidden noise-overlay flex flex-col justify-center transition-colors duration-500 ${tone.bg}`}
    >
      <div
        className={`absolute inset-0 ${
          tone.isDark ? "blueprint-grid" : "blueprint-grid-dark"
        } opacity-[0.06]`}
      />
      <div className="absolute inset-0 overflow-hidden">
        <div className={tone.isDark ? "aurora-mesh" : "aurora-mesh-light"} />
      </div>
      <BlueprintField dark={tone.isDark} />
      <CursorSpotlight opacity={tone.isDark ? 0.18 : 0.1} />

      {/* Vignette so type stays legible over the particle field */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: tone.isDark
            ? "radial-gradient(120% 90% at 50% 40%, transparent 0%, rgba(10,10,10,0.55) 70%, rgba(10,10,10,0.92) 100%)"
            : "radial-gradient(120% 90% at 50% 40%, transparent 0%, rgba(245,243,239,0.55) 70%, rgba(245,243,239,0.92) 100%)",
        }}
      />

      <div className="relative z-10 max-w-[1440px] mx-auto w-full px-6 md:px-10 pt-32 pb-20">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-mono text-[13px] uppercase tracking-[0.18em] text-signal mb-6"
        >
          System.Status — Building
        </motion.p>

        <h1
          className={`font-display font-bold text-hero-mobile md:text-hero lg:text-hero-lg ${tone.text}`}
        >
          <RevealLine words={LINE_ONE} delayOffset={0.25} />
          <RevealLine words={LINE_TWO} delayOffset={0.55} />
        </h1>

        <div className="mt-10 md:mt-14 grid md:grid-cols-2 gap-8 md:gap-16 max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.05, ease: ease.out }}
            className={`font-display text-xl md:text-2xl leading-snug ${tone.text} opacity-90`}
          >
            Engineering is more than learning concepts. It is solving
            problems, building products, collaborating with technology, and
            continuously growing.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: ease.out }}
            className={`text-base md:text-lg leading-relaxed ${tone.sub}`}
          >
            A modern engineering ecosystem helping students transform
            academic knowledge into practical, industry-ready skills through
            software engineering, artificial intelligence, projects,
            mentorship and career development.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.4, ease: ease.out }}
          className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <MagneticButton
            href="#ecosystem"
            className="inline-flex items-center gap-2 rounded-full bg-signal px-7 py-4 font-mono text-[13px] uppercase tracking-wide text-paper"
          >
            Explore The Ecosystem
          </MagneticButton>
          <MagneticButton
            href="#vision"
            className={`inline-flex items-center gap-2 rounded-full border px-7 py-4 font-mono text-[13px] uppercase tracking-wide transition-colors duration-300 ${
              tone.isDark
                ? "border-white/25 text-paper hover:border-white/60"
                : "border-ink/20 text-ink hover:border-ink/50"
            }`}
          >
            Our Vision
          </MagneticButton>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.9 }}
        className={`relative z-10 mx-auto mb-10 flex flex-col items-center gap-3 ${tone.sub}`}
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
          Scroll
        </span>
        <span className="h-10 w-px bg-gradient-to-b from-current to-transparent animate-pulse opacity-60" />
      </motion.div>
    </section>
  );
}
