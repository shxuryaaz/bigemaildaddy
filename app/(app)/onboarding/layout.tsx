import {
  IBM_Plex_Mono,
  Playfair_Display,
} from "next/font/google";
import type { ReactNode } from "react";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: true,
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
  adjustFontFallback: true,
});

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${playfair.variable} ${plexMono.variable} min-h-full bg-[#f2efe8] text-[#1c1b17]`}
    >
      {children}
    </div>
  );
}
