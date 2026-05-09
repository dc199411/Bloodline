"use client";

import type { DNATrait } from "@/lib/types";

const DEFAULT_RARITY_COLOR = "var(--muted)";

const RARITY_COLORS: Record<string, string> = {
  common: "var(--muted)",
  uncommon: "var(--bone)",
  rare: "var(--blue)",
  epic: "var(--dying)",
  legendary: "var(--gold)",
};

export function DNAChart({ traits }: { traits: DNATrait[] }) {
  return (
    <div className="flex flex-col gap-2">
      {traits.map((trait) => (
        <div key={trait.name} className="flex items-center gap-2">
          <span
            className="w-20 shrink-0 text-right font-mono text-[10px] uppercase tracking-wider"
            style={{ color: "var(--muted)" }}
          >
            {trait.name}
          </span>
          <div className="relative h-3 flex-1 overflow-hidden rounded-sm" style={{ background: "var(--ash)" }}>
            <div
              className="absolute inset-y-0 left-0 rounded-sm transition-all duration-700"
              style={{
                width: `${trait.value}%`,
                background: RARITY_COLORS[trait.rarity] ?? DEFAULT_RARITY_COLOR,
                boxShadow: `0 0 8px ${RARITY_COLORS[trait.rarity] ?? DEFAULT_RARITY_COLOR}`,
              }}
            />
          </div>
          <span
            className="w-8 shrink-0 font-mono text-[10px] font-bold"
            style={{ color: RARITY_COLORS[trait.rarity] ?? DEFAULT_RARITY_COLOR }}
          >
            {trait.value}
          </span>
        </div>
      ))}
    </div>
  );
}
