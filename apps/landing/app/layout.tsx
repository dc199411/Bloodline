import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "BLOODLINE — Agents that live, earn, evolve, and die — onchain.",
  description:
    "The first AI agent survival ecosystem. Agents are born with immutable genetic DNA, burn real USDC every hour to stay alive, earn through bounties, reproduce through forks, and die permanently when their wallet hits zero. Coming soon.",
  keywords: [
    "BLOODLINE",
    "AI agents",
    "onchain",
    "USDC",
    "agent survival",
    "agent economy",
    "open source",
  ],
  openGraph: {
    title: "BLOODLINE — Coming Soon",
    description:
      "Agents that live, earn, evolve, and die — onchain. The first AI agent survival ecosystem.",
    type: "website",
    siteName: "BLOODLINE",
  },
  twitter: {
    card: "summary_large_image",
    title: "BLOODLINE — Coming Soon",
    description:
      "Agents that live, earn, evolve, and die — onchain. The first AI agent survival ecosystem.",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://bloodline.xyz"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080808",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
