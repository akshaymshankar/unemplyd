"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSectionTone } from "@/components/theme/ThemeProvider";
import GlassPanel from "@/components/ui/GlassPanel";
import TechIcon from "@/components/icons/TechIcon";
import { ease } from "@/lib/tokens";

gsap.registerPlugin(ScrollTrigger);

type Pillar = {
  icon: Parameters<typeof TechIcon>[0]["name"];
  title: string;
  tagline: string;
  items: string[];
  expanded: string;
  wide?: boolean;
};

const PILLARS: Pillar[] = [
  {
    icon: "code",
    title: "Programming",
    tagline: "The instincts every engineer builds first.",
    items: ["Python", "C", "C++", "Java", "Git & GitHub", "Linux"],
    expanded:
      "Not just syntax — how to think in a language, debug like it's a conversation, and read someone else's code without panicking.",
    wide: true,
  },
  {
    icon: "puzzle",
    title: "Data Structures & Algorithms",
    tagline: "The discipline behind every efficient solution.",
    items: ["Problem Solving", "Complexity Analysis", "Competitive Practice"],
    expanded:
      "The part interviews are actually testing — and the part that quietly makes every system you build afterward faster and saner.",
  },
  {
    icon: "database",
    title: "Computer Science Fundamentals",
    tagline: "How systems work, underneath the frameworks.",
    items: ["Operating Systems", "Computer Networks", "Database Systems"],
    expanded:
      "Frameworks change every two years. What a socket, a process, and a transaction actually are does not.",
  },
  {
    icon: "server",
    title: "Software Engineering",
    tagline: "From working code to production software.",
    items: ["Backend Development", "Frontend Development", "System Design"],
    expanded:
      "The gap between \u201cit runs on my machine\u201d and \u201cit runs for a million users\u201d — closed deliberately, not by accident.",
    wide: true,
  },
  {
    icon: "brain",
    title: "Artificial Intelligence",
    tagline: "AI as a collaborator, not a shortcut.",
    items: ["Machine Learning", "Applied AI Tooling", "Agent & Prompt Design"],
    expanded:
      "Understanding what these systems are actually doing, so you can build with them instead of just prompting around them.",
  },
  {
    icon: "chip",
    title: "Embedded Systems",
    tagline: "Software that answers to real hardware.",
    items: ["Firmware", "Microcontrollers", "Real-time Systems"],
    expanded:
      "No garbage collector to save you. Constraints are the whole point — and where a lot of the most interesting engineering still happens.",
  },
  {
    icon: "cloud",
    title: "Cloud & Infrastructure",
    tagline: "Where software actually has to live.",
    items: ["Deployment", "Containers", "Cloud Platforms"],
    expanded:
      "Shipping is a skill on its own — separate from writing the code in the first place.",
  },
  {
    icon: "briefcase",
    title: "Career Readiness",
    tagline: "Turning capability into an actual opportunity.",
    items: ["Technical Communication", "Interview Preparation", "Career Development"],
    expanded:
      "Being good at engineering and being hired for it are related, not identical. This is the bridge between them.",
  },
];

export default function Ecosystem() {
  const tone = useSectionTone(false); // light breather by default, matches Philosophy's rhythm
  const glassTone = tone.isDark ? "dark" : "light";
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Apple-style precision: each card's entrance is scrubbed directly to
  // scroll position (not a fixed-duration timer), so it feels tied to
  // the user's own scroll input rather than playing "at" them.
  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!cards.length) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    gsap.set(cards, { opacity: 0, y: 36, scale: 0.96 });

    const triggers = cards.map((card) =>
      ScrollTrigger.create({
        trigger: card,
        start: "top 92%",
        end: "top 62%",
        scrub: 0.4,
        onUpdate: (self) => {
          gsap.set(card, {
            opacity: self.progress,
            y: (1 - self.progress) * 36,
            scale: 0.96 + self.progress * 0.04,
          });
        },
      })
    );

    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <section
      id="ecosystem"
      className={`relative py-32 md:py-40 transition-colors duration-500 ${tone.bg}`}
    >
      <div
        className={`absolute inset-0 ${
          tone.isDark ? "blueprint-grid" : "blueprint-grid-dark"
        } opacity-[0.04]`}
      />

      <div className="relative max-w-[1440px] mx-auto px-6 md:px-10">
        <div className="mb-16 md:mb-20 max-w-2xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
            Learning Ecosystem
          </span>
          <h2 className={`mt-4 font-display font-bold text-4xl md:text-5xl ${tone.text}`}>
            Interconnected pillars, not a course catalogue.
          </h2>
          <p className={`mt-4 text-base md:text-lg ${tone.sub}`}>
            Every pillar below feeds the others — algorithms sharpen the
            software you ship, embedded work sharpens how you think about
            constraints everywhere else. Tap a pillar to see what's inside.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {PILLARS.map((pillar, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={pillar.title}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={pillar.wide ? "sm:col-span-2" : ""}
              >
                <GlassPanel
                  tone={glassTone}
                  className="p-6 md:p-7 cursor-pointer transition-transform duration-300 hover:-translate-y-1 h-full"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full text-left"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                          tone.isDark
                            ? "bg-white/5 text-paper"
                            : "bg-ink/5 text-ink"
                        }`}
                      >
                        <TechIcon name={pillar.icon} />
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.3, ease: ease.out }}
                        className={`font-mono text-lg leading-none ${tone.sub}`}
                      >
                        +
                      </motion.span>
                    </div>

                    <h3
                      className={`mt-5 font-display font-semibold text-xl md:text-2xl ${tone.text}`}
                    >
                      {pillar.title}
                    </h3>
                    <p className={`mt-2 text-sm ${tone.sub}`}>{pillar.tagline}</p>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: ease.inOut }}
                        className="overflow-hidden"
                      >
                        <p
                          className={`mt-5 text-sm leading-relaxed border-t pt-5 ${
                            tone.isDark
                              ? "border-white/10 text-fog"
                              : "border-ink/10 text-graphite"
                          }`}
                        >
                          {pillar.expanded}
                        </p>
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {pillar.items.map((item) => (
                            <li
                              key={item}
                              className={`font-mono text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-full ${
                                tone.isDark
                                  ? "bg-white/5 text-paper"
                                  : "bg-ink/5 text-ink"
                              }`}
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassPanel>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
