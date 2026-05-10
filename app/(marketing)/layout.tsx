import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
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

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    absolute: "BigEmailDaddy",
  },
  description:
    "Cold email for university students that actually gets replies. We research the target, find the overlap with your work, and write the email.",
  openGraph: {
    title: "BigEmailDaddy",
    description:
      "Cold email for university students that actually gets replies. We research the target, find the overlap with your work, and write the email.",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 783,
        alt: "BigEmailDaddy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BigEmailDaddy",
    description:
      "Cold email for university students that actually gets replies. We research the target, find the overlap with your work, and write the email.",
    images: ["/logo.png"],
  },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${playfair.variable} ${plexMono.variable} ${plexSans.variable} marketing-root`}
    >
      {children}
    </div>
  );
}
