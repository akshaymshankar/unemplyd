"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSectionTone } from "@/components/theme/ThemeProvider";

gsap.registerPlugin(ScrollTrigger);

const MILESTONES = [
  { label: "Academic Learning", note: "The foundation every engineer starts from." },
  { label: "Programming Foundations", note: "Python, C, C++, Java — syntax becomes instinct." },
  { label: "Software Development", note: "From scripts to real, structured systems." },
  { label: "Data Structures & Algorithms", note: "The discipline behind every efficient solution." },
  { label: "Computer Science Fundamentals", note: "OS, networks, databases — how systems actually work." },
  { label: "Real-world Engineering", note: "Constraints, trade-offs and production thinking." },
  { label: "Artificial Intelligence", note: "Building with and alongside intelligent systems." },
  { label: "Projects", note: "Ideas become shipped, working software." },
  { label: "Professional Portfolio", note: "Proof of what you can actually build." },
  { label: "Internships", note: "Industry context, mentorship, real stakes." },
  { label: "Career Opportunities", note: "Interviews, offers, the first real role." },
  { label: "Continuous Growth", note: "The journey that never really ends." },
];

export default function Journey() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const tone = useSectionTone(true); // Journey is a dark beat by default

  useEffect(() => {
    if (!sectionRef.current) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let trigger: ScrollTrigger | undefined;

    if (fillRef.current) {
      trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 65%",
        end: "bottom 55%",
        scrub: prefersReducedMotion ? false : 0.6,
        onUpdate: (self) => {
          gsap.set(fillRef.current, { scaleY: self.progress });
        },
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute("data-index"));
          if (entry.isIntersecting) {
            setActiveIndex((prev) => Math.max(prev, idx));
          }
        });
      },
      { threshold: 0.4, rootMargin: "-15% 0px -15% 0px" }
    );

    itemRefs.current.forEach((el) => el && observer.observe(el));

    return () => {
      trigger?.kill();
      observer.disconnect();
    };
  }, []);

  return (
    <section
      id="journey"
      ref={sectionRef}
      className={`relative py-32 md:py-40 transition-colors duration-500 ${tone.bg}`}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        <div className="mb-20 md:mb-28 max-w-2xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
            The Journey
          </span>
          <h2 className={`mt-4 font-display font-bold text-4xl md:text-5xl ${tone.text}`}>
            From classroom to career, one deliberate step at a time.
          </h2>
        </div>

        <div className="relative">
          <div
            className={`absolute left-4 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-1/2 ${
              tone.isDark ? "bg-white/10" : "bg-ink/10"
            }`}
          />
          <div
            ref={fillRef}
            className="absolute left-4 md:left-1/2 top-0 w-[2px] md:-translate-x-1/2 origin-top h-full rounded-full bg-signal"
            style={{
              transform: "scaleY(0)",
              boxShadow:
                "0 0 12px 2px rgba(229,9,20,0.55), 0 0 30px 6px rgba(229,9,20,0.2)",
            }}
          />

          <ul className="relative flex flex-col gap-14 md:gap-20">
            {MILESTONES.map((m, i) => {
              const isLeft = i % 2 === 0;
              const isActive = i <= activeIndex;
              const isLatest = i === activeIndex;
              return (
                <li
                  key={m.label}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  data-index={i}
                  className="relative pl-12 md:pl-0 md:grid md:grid-cols-2 md:gap-16 items-center"
                >
                  <div
                    className={
                      isLeft ? "md:text-right md:pr-16" : "md:col-start-2 md:pl-16"
                    }
                  >
                    <div
                      className={`transition-all duration-700 ease-out ${
                        isActive ? "opacity-100 translate-y-0" : "opacity-30 translate-y-2"
                      }`}
                    >
                      <span className={`font-mono text-[11px] ${tone.sub}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className={`font-display font-bold text-2xl md:text-3xl mt-1 ${tone.text}`}>
                        {m.label}
                      </h3>
                      <p
                        className={`mt-2 text-sm max-w-xs ${tone.sub} ${
                          isLeft ? "md:ml-auto" : ""
                        }`}
                      >
                        {m.note}
                      </p>
                    </div>
                  </div>

                  <span className="absolute left-4 md:left-1/2 top-1.5 -translate-x-1/2">
                    {isLatest && (
                      <span className="absolute inset-0 -m-1.5 rounded-full bg-signal/50 animate-ping" />
                    )}
                    <span
                      className={`relative block h-3 w-3 rounded-full border transition-all duration-500 ${
                        isActive
                          ? "bg-signal border-signal scale-100 shadow-[0_0_16px_2px_rgba(229,9,20,0.6)]"
                          : `scale-75 ${
                              tone.isDark
                                ? "bg-ink border-white/30"
                                : "bg-paper border-ink/25"
                            }`
                      }`}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
