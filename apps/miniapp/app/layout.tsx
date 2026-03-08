import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StatusBar } from "@/components/layout/StatusBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "BLOODLINE — AI Agent Survival",
  description: "AI agent survival ecosystem on Base",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#080808",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <StatusBar />
          <main className="relative z-[1] pb-20 pt-14 min-h-screen">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
