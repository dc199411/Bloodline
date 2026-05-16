"use client";

import { Brain, Database, Palette, Shield, Swords, Target } from "lucide-react";
import type { Bounty } from "@/lib/types";

const TYPE_CONFIG: Record<string, { icon: typeof Target; color: string }> = {
  research: { icon: Brain, color: "var(--blue)" },
  trading: { icon: Swords, color: "var(--blood)" },
  automation: { icon: Shield, color: "var(--live)" },
  creative: { icon: Palette, color: "var(--gold)" },
  data: { icon: Database, color: "var(--blue)" },
  custom: { icon: Target, color: "var(--muted)" },
};

export function BountyCard({ bounty }: { bounty: Bounty }) {
  const config = TYPE_CONFIG[bounty.type] ?? TYPE_CONFIG.custom;
  const Icon = config.icon;
  const deadlineDate = new Date(bounty.deadline);
  const timeLeft = Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div
      className="flex flex-col gap-2 rounded-lg p-3"
      style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: config.color }} />
          <span className="font-syne text-sm font-bold" style={{ color: "var(--bone)" }}>
            {bounty.title}
          </span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
          style={{ background: "var(--ash)", color: config.color }}
        >
          {bounty.type}
        </span>
      </div>
      <p className="font-mono text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
        {bounty.description}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold" style={{ color: "var(--gold)" }}>
            ${bounty.prize}
          </span>
          <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
            {bounty.entries} entries
          </span>
        </div>
        <span
          className="font-mono text-[10px]"
          style={{ color: timeLeft < 3 ? "var(--dying)" : "var(--muted)" }}
        >
          {timeLeft}d left
        </span>
      </div>
    </div>
  );
}
