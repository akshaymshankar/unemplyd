"use client";

import { useSectionTone } from "@/components/theme/ThemeProvider";
import GlassPanel from "@/components/ui/GlassPanel";
import TechIcon from "@/components/icons/TechIcon";
import TiltCard from "@/components/motion/TiltCard";

type Tool = {
  icon: Parameters<typeof TechIcon>[0]["name"];
  name: string;
  blurb: string;
  offset?: boolean; // stagger this card down slightly for a floating feel
};

const TOOLS: Tool[] = [
  { icon: "network", name: "Packet Tracer", blurb: "Simulate real networks before you ever touch a router." },
  { icon: "code", name: "VS Code", blurb: "Where most of the actual building happens.", offset: true },
  { icon: "container", name: "Docker", blurb: "Ship the same environment from your laptop to production." },
  { icon: "terminal", name: "Linux", blurb: "The operating system every backend eventually runs on.", offset: true },
  { icon: "chip", name: "STM32CubeIDE", blurb: "Program real microcontrollers, not simulations." },
  { icon: "chip", name: "Keil", blurb: "Embedded C, compiled for actual hardware constraints.", offset: true },
  { icon: "layers", name: "Vivado", blurb: "FPGA design for students who want to go deeper than software." },
  { icon: "bolt", name: "Arduino IDE", blurb: "The fastest path from idea to blinking LED to real product.", offset: true },
  { icon: "git-branch", name: "Git", blurb: "Every serious engineer's memory of every decision made." },
  { icon: "github", name: "GitHub", blurb: "Where your work becomes visible to recruiters and collaborators.", offset: true },
  { icon: "terminal", name: "Terminal", blurb: "The interface underneath every other interface." },
  { icon: "figma", name: "Figma", blurb: "Design the interface before you write a line of frontend code.", offset: true },
  { icon: "sparkle", name: "AI Development Tools", blurb: "Copilot and agentic tooling, used deliberately — not as a crutch." },
];

export default function Labs() {
  const tone = useSectionTone(true); // dark beat by default
  const glassTone = tone.isDark ? "dark" : "light";

  return (
    <section
      id="labs"
      className={`relative py-32 md:py-40 overflow-hidden transition-colors duration-500 ${tone.bg}`}
    >
      <div
        className={`absolute inset-0 ${
          tone.isDark ? "blueprint-grid" : "blueprint-grid-dark"
        } opacity-[0.05]`}
      />

      <div className="relative max-w-[1440px] mx-auto px-6 md:px-10">
        <div className="mb-16 md:mb-20 max-w-2xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
            Practical Labs
          </span>
          <h2 className={`mt-4 font-display font-bold text-4xl md:text-5xl ${tone.text}`}>
            The same environments engineers actually work in.
          </h2>
          <p className={`mt-4 text-base md:text-lg ${tone.sub}`}>
            No sandboxed toy versions — industry-standard tools, used the way
            they're used on the job. Hover a card to see what it's for.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {TOOLS.map((tool) => (
            <div key={tool.name} className={`group ${tool.offset ? "lg:mt-8" : ""}`}>
              <TiltCard maxTilt={6}>
                <GlassPanel
                  tone={glassTone}
                  className="p-6 h-full transition-all duration-300 ease-out group-hover:shadow-[0_24px_70px_-15px_rgba(229,9,20,0.3)] group-hover:scale-[1.03]"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${
                        tone.isDark
                          ? "bg-white/5 text-paper group-hover:bg-signal group-hover:text-paper"
                          : "bg-ink/5 text-ink group-hover:bg-signal group-hover:text-paper"
                      }`}
                    >
                      <TechIcon name={tool.icon} />
                    </span>
                  </div>
                  <h3 className={`mt-5 font-display font-semibold text-lg ${tone.text}`}>
                    {tool.name}
                  </h3>
                  {/* Netflix-style reveal: collapsed by default, opens on hover
                      rather than always taking up vertical space. */}
                  <p
                    className={`mt-0 text-sm leading-relaxed max-h-0 opacity-0 overflow-hidden transition-all duration-300 ease-out group-hover:mt-2 group-hover:max-h-24 group-hover:opacity-100 ${tone.sub}`}
                  >
                    {tool.blurb}
                  </p>
                </GlassPanel>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
