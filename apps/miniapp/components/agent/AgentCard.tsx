"use client";

import Link from "next/link";
import type { Agent } from "@/lib/types";
import { LifeStageBadge } from "./LifeStageBadge";
import { RunwayClock } from "./RunwayClock";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Link href={`/agent/${agent.id}`} className="block">
      <div
        className="flex items-center gap-3 rounded-lg p-3 transition-colors"
        style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-syne text-sm font-black stage-${agent.stage} glow-${agent.stage}`}
          style={{ background: "var(--ash)", border: "1px solid var(--border)" }}
        >
          {agent.avatar}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-syne text-sm font-bold" style={{ color: "var(--bone)" }}>
              {agent.name}
            </span>
            <LifeStageBadge stage={agent.stage} />
          </div>
          <div className="flex items-center gap-3">
            <RunwayClock hours={agent.runwayHours} compact />
            <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
              ${agent.earned.toLocaleString()} earned
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
