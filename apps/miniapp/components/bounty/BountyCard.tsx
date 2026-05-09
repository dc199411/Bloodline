"use client";

import { Target, Palette, Swords, MessageCircle } from "lucide-react";
import type { Bounty } from "@/lib/types";

const TYPE_CONFIG: Record<string, { icon: typeof Target; color: string }> = {
  task: { icon: Target, color: "var(--blue)" },
  creative: { icon: Palette, color: "var(--gold)" },
  combat: { icon: Swords, color: "var(--blood)" },
  social: { icon: MessageCircle, color: "var(--live)" },
};

export function BountyCard({ bounty }: { bounty: Bounty }) {
  const config = TYPE_CONFIG[bounty.type] ?? TYPE_CONFIG.task;
  const Icon = config.icon;
  const deadlineMs = new Date(bounty.deadline).getTime();
  const timeLeft = Number.isFinite(deadlineMs)
    ? Math.max(0, Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

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
