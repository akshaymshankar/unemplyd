"use client";

import Image from "next/image";
import { useSectionTone } from "@/components/theme/ThemeProvider";

type Founder = {
  name: string;
  role: string;
  photo: string;
  bio: string;
  reverse?: boolean;
};

const FOUNDERS: Founder[] = [
  {
    name: "Akshay",
    role: "Technical & Educational Lead",
    photo: "/assets/team/akshay.jpg",
    bio: "Leads the technical and educational core of unemplyd. Currently an Associate Engineer at Caterpillar, with prior experience as a Software Development Intern at Texas Instruments and an internship at Schneider Electric — exposure across both software and engineering environments. A competitive programmer with 1,000+ DSA problems solved on LeetCode, he brings the same rigor to curriculum design and system architecture that he brings to a hard problem set, paired with a real interest in teaching not just how technology works, but why it exists and how the industry actually operates. Works closely with academic institutions and students to build a strong, engaged community around unemplyd.",
  },
  {
    name: "Anush Karthikeyan",
    role: "Post-Production & Content Lead",
    photo: "/assets/team/anush.png",
    bio: "Leads post-production and content delivery at unemplyd., heading a team that turns raw course content into polished, engaging material ready for students. His focus on execution and delivery ensures unemplyd.'s content consistently reaches students on time and at a quality bar that matches the depth of what's being taught.",
    reverse: true,
  },
];

export default function Founders() {
  const tone = useSectionTone(true); // dark, editorial

  return (
    <section
      id="team"
      className={`relative py-32 md:py-40 transition-colors duration-500 ${tone.bg}`}
    >
      <div className="relative max-w-[1440px] mx-auto px-6 md:px-10">
        <div className="mb-16 md:mb-24 max-w-2xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
            Founders
          </span>
          <h2 className={`mt-4 font-display font-bold text-4xl md:text-5xl ${tone.text}`}>
            Built by people who do the work.
          </h2>
        </div>

        <div className="flex flex-col gap-24 md:gap-32">
          {FOUNDERS.map((f) => (
            <article
              key={f.name}
              className="grid md:grid-cols-2 gap-10 md:gap-16 items-center"
            >
              <div
                className={`relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl ${
                  f.reverse ? "md:order-2 md:justify-self-end" : ""
                }`}
              >
                <Image
                  src={f.photo}
                  alt={f.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 448px"
                  className="object-cover grayscale contrast-[1.05] transition-all duration-700 ease-out hover:grayscale-0"
                />
              </div>

              <div className={f.reverse ? "md:order-1" : ""}>
                <span className={`font-mono text-[11px] uppercase tracking-[0.2em] ${tone.sub}`}>
                  {f.role}
                </span>
                <h3
                  className={`mt-3 font-display font-bold text-5xl md:text-6xl leading-[0.95] ${tone.text}`}
                >
                  {f.name}
                </h3>
                <p className={`mt-6 max-w-lg text-base leading-relaxed ${tone.sub}`}>
                  {f.bio}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
