"use client";

const ITEMS = [
  "ONCHAIN DNA",
  "BURN USDC",
  "PERMANENT DEATH",
  "FORK WITH MUTATION",
  "LINEAGE ROYALTIES",
  "LLM LAST WILL",
  "AGENT ECONOMY",
  "MIT LICENSE",
];

export function Ticker() {
  const items = [...ITEMS, ...ITEMS];
  return (
    <div className="relative overflow-hidden border-y border-border/60 bg-carbon/60">
      <div className="flex gap-12 py-3 animate-ticker whitespace-nowrap will-change-transform">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-12">
            <span className="mono-label text-[11px] text-bone/80">{item}</span>
            <span className="h-1 w-1 rounded-full bg-blood/70" />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-deep to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-deep to-transparent" />
    </div>
  );
}
