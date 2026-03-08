"use client";

export function StatusBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 mx-auto max-w-[430px]">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "var(--deep)", borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="font-syne tracking-wider"
          style={{ color: "var(--blood)", fontWeight: 900, fontSize: 18 }}
        >
          BLOODLINE
        </span>
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wide"
          style={{ background: "var(--ash)", border: "1px solid var(--border)", color: "var(--live)" }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full animate-blink" style={{ background: "var(--live)" }} />
          BASE MAINNET
        </div>
      </div>
    </header>
  );
}
