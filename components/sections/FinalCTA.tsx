"use client";

import { motion } from "framer-motion";
import { useSectionTone } from "@/components/theme/ThemeProvider";
import MagneticButton from "@/components/motion/MagneticButton";
import CursorSpotlight from "@/components/motion/CursorSpotlight";
import { ease } from "@/lib/tokens";

export default function FinalCTA() {
  // Deliberately not alternating here — bookending the dark Hero with
  // a dark close is a stronger ending than following the rhythm strictly.
  const tone = useSectionTone(true);

  return (
    <section
      id="begin"
      className={`relative py-32 md:py-44 overflow-hidden transition-colors duration-500 ${tone.bg}`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className={tone.isDark ? "aurora-mesh" : "aurora-mesh-light"} />
      </div>
      <CursorSpotlight opacity={tone.isDark ? 0.16 : 0.09} />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: ease.out }}
          className={`font-display font-bold text-4xl md:text-6xl leading-[1.05] ${tone.text}`}
        >
          The future belongs to engineers who never stop learning.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.15, ease: ease.out }}
          className={`mt-6 text-lg ${tone.sub}`}
        >
          Whether you&rsquo;re beginning your journey or preparing for your
          next opportunity, unemplyd. is designed to help you build with
          confidence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.3, ease: ease.out }}
          className="mt-10"
        >
          {/* TODO: point this at a real application/enrollment flow once
              one exists — looping back to the ecosystem for now so the
              button isn't a dead link. See README. */}
          <MagneticButton
            href="#ecosystem"
            className="inline-flex items-center gap-2 rounded-full bg-signal px-9 py-5 font-mono text-sm uppercase tracking-wide text-paper"
          >
            Begin Your Journey
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
