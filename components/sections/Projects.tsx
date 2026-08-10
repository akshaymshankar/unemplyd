"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSectionTone } from "@/components/theme/ThemeProvider";
import GlassPanel from "@/components/ui/GlassPanel";
import { ease } from "@/lib/tokens";

type Project = {
  name: string;
  oneLiner: string;
  problem: string;
  solution: string;
  stack: string[];
  concepts: string[];
  applications: string;
};

// Illustrative examples of the kind of work the ecosystem produces —
// swap for real student/founder projects as they're ready.
const PROJECTS: Project[] = [
  {
    name: "Campus Connect",
    oneLiner: "Placement coordination, without the spreadsheet drift.",
    problem:
      "Placement cells track hundreds of students and companies across spreadsheets that fall out of sync within a week.",
    solution:
      "A shared platform where placement officers, recruiters and students see the same real-time pipeline — from eligibility to offer.",
    stack: ["Next.js", "PostgreSQL", "Prisma", "Tailwind CSS"],
    concepts: ["Relational data modeling", "Role-based access control", "Real-time sync"],
    applications:
      "The same pattern behind any ATS or CRM handling many-to-many relationships at scale.",
  },
  {
    name: "PathFinder AI",
    oneLiner: "DSA practice that knows where you're actually stuck.",
    problem:
      "Students grind random DSA problems with no sense of which weak spot they're actually closing.",
    solution:
      "A recommender that tracks solve patterns and suggests the next problem based on where a student's reasoning breaks down.",
    stack: ["Python", "FastAPI", "PyTorch", "Redis"],
    concepts: ["Embeddings & similarity search", "Spaced repetition", "API design"],
    applications:
      "The same recommendation logic behind adaptive learning platforms and content-ranking systems.",
  },
  {
    name: "SentryNode",
    oneLiner: "An early-warning system for the server room.",
    problem:
      "Small labs and server rooms get no early warning before a cooling failure becomes a hardware failure.",
    solution:
      "A battery-backed sensor node that reports temperature, humidity and vibration over MQTT, with on-device anomaly detection.",
    stack: ["STM32", "C", "MQTT", "TinyML"],
    concepts: ["Real-time systems", "Low-power design", "Sensor fusion"],
    applications:
      "The same architecture behind industrial IoT monitoring and predictive maintenance.",
  },
  {
    name: "DeployKit",
    oneLiner: "From Dockerfile to live URL, in one command.",
    problem:
      "Students can build something that works locally, then lose days figuring out how to actually ship it.",
    solution:
      "A CLI that takes a project from a Dockerfile to a live URL on a real cloud provider in one command, with sane defaults.",
    stack: ["Go", "Docker", "Terraform", "AWS"],
    concepts: ["Infrastructure as code", "CI/CD", "Container orchestration basics"],
    applications:
      "The exact deployment literacy expected on day one of most backend and DevOps roles.",
  },
];

export default function Projects() {
  const tone = useSectionTone(false); // light beat, alternating after Labs
  const glassTone = tone.isDark ? "dark" : "light";
  const [active, setActive] = useState(0);
  const project = PROJECTS[active];

  return (
    <section
      id="projects"
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
            Project Showcase
          </span>
          <h2 className={`mt-4 font-display font-bold text-4xl md:text-5xl ${tone.text}`}>
            Proof of work, not just proof of concept.
          </h2>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6 lg:gap-10">
          {/* Selector rail */}
          <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {PROJECTS.map((p, i) => {
              const isActive = i === active;
              return (
                <li key={p.name} className="shrink-0 lg:shrink">
                  <button
                    onClick={() => setActive(i)}
                    className={`w-full text-left rounded-xl border px-5 py-4 transition-colors duration-300 ${
                      isActive
                        ? "border-signal bg-signal/10"
                        : tone.isDark
                        ? "border-white/10 hover:border-white/25"
                        : "border-ink/10 hover:border-ink/25"
                    }`}
                  >
                    <span className={`font-mono text-[11px] ${tone.sub}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className={`mt-1 font-display font-semibold text-base whitespace-nowrap lg:whitespace-normal ${tone.text}`}>
                      {p.name}
                    </h3>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Detail panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={project.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: ease.out }}
            >
              <GlassPanel tone={glassTone} className="p-8 md:p-10">
                <h3 className={`font-display font-bold text-2xl md:text-3xl ${tone.text}`}>
                  {project.name}
                </h3>
                <p className="mt-1 text-signal font-mono text-sm">{project.oneLiner}</p>

                <div className="mt-8 grid sm:grid-cols-2 gap-8">
                  <div>
                    <span className={`font-mono text-[11px] uppercase tracking-[0.15em] ${tone.sub}`}>
                      Problem
                    </span>
                    <p className={`mt-2 text-sm leading-relaxed ${tone.text} opacity-90`}>
                      {project.problem}
                    </p>
                  </div>
                  <div>
                    <span className={`font-mono text-[11px] uppercase tracking-[0.15em] ${tone.sub}`}>
                      Solution
                    </span>
                    <p className={`mt-2 text-sm leading-relaxed ${tone.text} opacity-90`}>
                      {project.solution}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <span className={`font-mono text-[11px] uppercase tracking-[0.15em] ${tone.sub}`}>
                    Tech Stack
                  </span>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {project.stack.map((s) => (
                      <li
                        key={s}
                        className={`font-mono text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-full ${
                          tone.isDark ? "bg-white/5 text-paper" : "bg-ink/5 text-ink"
                        }`}
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <span className={`font-mono text-[11px] uppercase tracking-[0.15em] ${tone.sub}`}>
                    Engineering Concepts
                  </span>
                  <ul className={`mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm ${tone.text} opacity-90`}>
                    {project.concepts.map((c) => (
                      <li key={c}>— {c}</li>
                    ))}
                  </ul>
                </div>

                <div
                  className={`mt-8 pt-6 border-t text-sm leading-relaxed ${
                    tone.isDark ? "border-white/10 text-fog" : "border-ink/10 text-graphite"
                  }`}
                >
                  <span className={`font-mono text-[11px] uppercase tracking-[0.15em] block mb-2 ${tone.sub}`}>
                    Industry Applications
                  </span>
                  {project.applications}
                </div>
              </GlassPanel>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
