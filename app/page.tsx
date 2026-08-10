import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import Philosophy from "@/components/sections/Philosophy";
import Journey from "@/components/sections/Journey";
import Ecosystem from "@/components/sections/Ecosystem";
import Labs from "@/components/sections/Labs";
import Projects from "@/components/sections/Projects";
import Founders from "@/components/sections/Founders";
import FinalCTA from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Philosophy />
      <Journey />
      <Ecosystem />
      <Labs />
      <Projects />
      <Founders />
      <FinalCTA />
      <Footer />

      {/* Not yet built: "AI For Engineers" statement section and
          "Community" metrics section (Phases 9–10 of the build plan).
          See README for status. */}
    </main>
  );
}
