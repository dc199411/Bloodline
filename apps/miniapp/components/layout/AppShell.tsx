"use client";

import { usePathname } from "next/navigation";
import { StatusBar } from "./StatusBar";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return (
      <>
        <LandingStatusBar />
        <main className="relative z-[1] min-h-screen pt-14">{children}</main>
      </>
    );
  }

  return (
    <>
      <StatusBar />
      <main className="relative z-[1] pb-20 pt-14 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </>
  );
}

function LandingStatusBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 mx-auto max-w-[430px]">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: "rgba(8,8,8,0.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            color: "var(--blood)",
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: -0.5,
            fontFamily: "'Syne', sans-serif",
          }}
        >
          BLOODLINE
        </span>
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            letterSpacing: 2,
            color: "var(--live)",
            background: "rgba(0,255,135,0.08)",
            border: "1px solid rgba(0,255,135,0.2)",
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full animate-blink"
            style={{ background: "var(--live)" }}
          />
          BASE MAINNET
        </div>
      </div>
    </header>
  );
}
