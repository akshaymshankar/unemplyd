"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSectionTone } from "@/components/theme/ThemeProvider";

gsap.registerPlugin(ScrollTrigger);

const STATEMENTS = [
  "Knowledge creates possibilities.",
  "Experience creates confidence.",
  "Engineering is learned by building.",
  "Curiosity creates innovation.",
  "Consistency builds careers.",
  "The future belongs to lifelong learners.",
];

export default function Philosophy() {
  const pinRef = useRef<HTMLDivElement>(null);
  const statementRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const tone = useSectionTone(false); // Philosophy is the light breather by default

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  useEffect(() => {
    if (reducedMotion || !pinRef.current) return;

    const statements = statementRefs.current.filter(
      Boolean
    ) as HTMLDivElement[];
    if (!statements.length) return;

    gsap.set(statements, { opacity: 0, y: 24, scale: 0.94, filter: "blur(6px)" });
    gsap.set(statements[0], { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" });

    let lastIndex = 0;

    const trigger = ScrollTrigger.create({
      trigger: pinRef.current,
      start: "top top",
      end: () => "+=" + window.innerHeight * (STATEMENTS.length - 1),
      pin: true,
      scrub: 0.5,
      anticipatePin: 1,
      onUpdate: (self) => {
        const segment = 1 / STATEMENTS.length;
        const idx = Math.min(
          STATEMENTS.length - 1,
          Math.floor(self.progress / segment)
        );
        const local = (self.progress - idx * segment) / segment;

        statements.forEach((el, i) => {
          if (i !== idx) {
            gsap.set(el, { opacity: 0, y: 16, scale: 0.94, filter: "blur(6px)" });
            return;
          }
          const fadeWindow = 0.16;
          let progressWithin = 1;
          if (local < fadeWindow) progressWithin = local / fadeWindow;
          else if (local > 1 - fadeWindow)
            progressWithin = (1 - local) / fadeWindow;

          gsap.set(el, {
            opacity: progressWithin,
            y: (1 - progressWithin) * 16,
            scale: 0.94 + progressWithin * 0.06,
            filter: `blur(${(1 - progressWithin) * 6}px)`,
          });
        });

        if (idx !== lastIndex) {
          lastIndex = idx;
          setActiveIndex(idx);
        }
      },
    });

    return () => trigger.kill();
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <section className={`relative py-32 transition-colors duration-500 ${tone.bg}`}>
        <div className="max-w-3xl mx-auto px-6 flex flex-col gap-16 text-center">
          <span className={`font-mono text-[11px] uppercase tracking-[0.2em] ${tone.sub}`}>
            Philosophy
          </span>
          {STATEMENTS.map((s) => (
            <p
              key={s}
              className={`font-display font-bold text-3xl md:text-5xl leading-tight ${tone.text}`}
            >
              {s}
            </p>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div
      ref={pinRef}
      className={`relative h-screen w-full overflow-hidden transition-colors duration-500 ${tone.bg}`}
    >
      <div
        className={`absolute inset-0 ${
          tone.isDark ? "blueprint-grid" : "blueprint-grid-dark"
        } opacity-[0.05]`}
      />
      <div className="absolute inset-0 overflow-hidden">
        <div className={tone.isDark ? "aurora-mesh" : "aurora-mesh-light"} />
      </div>

      <span
        className={`absolute top-10 left-6 md:left-10 font-mono text-[11px] uppercase tracking-[0.2em] ${tone.sub}`}
      >
        Philosophy — {String(activeIndex + 1).padStart(2, "0")}/
        {String(STATEMENTS.length).padStart(2, "0")}
      </span>

      {STATEMENTS.map((s, i) => (
        <div
          key={s}
          ref={(el) => {
            statementRefs.current[i] = el;
          }}
          aria-hidden={i !== activeIndex}
          className="absolute inset-0 flex items-center justify-center px-6 text-center"
        >
          <p
            className={`max-w-5xl font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-tight ${tone.text}`}
          >
            {s}
          </p>
        </div>
      ))}
    </div>
  );
}
