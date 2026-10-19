import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import SmoothScroll from "@/components/motion/SmoothScroll";
import "./globals.css";

// One system typeface at multiple weights — the same principle Apple
// and Netflix both use (SF Pro / Netflix Sans), rather than a
// "branded" display face paired with a separate body face. Inter is
// the closest legitimately-licensable match to that native-UI feel;
// SF Pro's own license restricts it to Apple-platform apps and
// marketing, and Netflix Sans isn't publicly licensable at all.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "unemplyd. — Build Beyond The Classroom.",
  description:
    "A modern engineering ecosystem helping students transform academic knowledge into practical, industry-ready skills through software engineering, AI, projects, mentorship and career development.",
  openGraph: {
    title: "unemplyd. — Build Beyond The Classroom.",
    description:
      "A modern engineering ecosystem helping students transform academic knowledge into practical, industry-ready skills.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* OS-level dark/light favicon — independent of the in-app
            theme toggle, this follows the browser/system preference,
            which is what favicon switching conventionally does. */}
        <link
          rel="icon"
          href="/icons/icon-light-32.png"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/icons/icon-dark-32.png"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body>
        <ThemeProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
