"use client";

import type { LifeStage } from "@/lib/types";

const STAGE_CONFIG: Record<LifeStage, { label: string; bg: string; color: string }> = {
  alive: { label: "ALIVE", bg: "rgba(0,255,135,0.1)", color: "var(--live)" },
  thriving: { label: "THRIVING", bg: "rgba(255,215,0,0.1)", color: "var(--gold)" },
  danger: { label: "DANGER", bg: "rgba(255,107,0,0.1)", color: "var(--dying)" },
  dead: { label: "DEAD", bg: "rgba(85,85,85,0.1)", color: "var(--muted)" },
  ascended: { label: "ASCENDED", bg: "rgba(255,26,26,0.1)", color: "var(--blood)" },
};

const FALLBACK_CONFIG = { label: "UNKNOWN", bg: "rgba(85,85,85,0.1)", color: "var(--muted)" };

export function LifeStageBadge({ stage }: { stage: LifeStage }) {
  const config = STAGE_CONFIG[stage] ?? FALLBACK_CONFIG;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.color}`,
      }}
    >
      {config.label}
    </span>
  );
}
