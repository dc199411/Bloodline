"use client";

import { MOCK_AGENTS } from "@/lib/mock";
import { LifeStageBadge } from "@/components/agent/LifeStageBadge";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Trophy } from "lucide-react";
import Link from "next/link";

const sortedAgents = [...MOCK_AGENTS]
  .filter((a) => a.stage !== "dead")
  .sort((a, b) => b.earned - a.earned);

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center gap-2">
        <Trophy size={18} style={{ color: "var(--gold)" }} />
        <h1 className="font-syne text-lg font-black" style={{ color: "var(--bone)" }}>
          LEADERBOARD
        </h1>
      </div>

      <SectionLabel label="TOP EARNERS" />

      <div className="flex flex-col gap-0 overflow-hidden rounded-lg" style={{ border: "1px solid var(--border)" }}>
        {sortedAgents.map((agent, i) => (
          <Link
            key={agent.id}
            href={`/agent/${agent.id}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors"
            style={{
              background: i % 2 === 0 ? "var(--panel)" : "var(--carbon)",
              borderBottom: i < sortedAgents.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full font-syne text-sm font-black"
              style={{
                background: i === 0 ? "rgba(255,215,0,0.15)" : "var(--ash)",
                color: i === 0 ? "var(--gold)" : i < 3 ? "var(--bone)" : "var(--muted)",
                border: `1px solid ${i === 0 ? "var(--gold)" : "var(--border)"}`,
              }}
            >
              {i + 1}
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full font-syne text-xs font-black stage-${agent.stage}`}
              style={{ background: "var(--ash)", border: "1px solid var(--border)" }}
            >
              {agent.avatar}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-syne text-sm font-bold" style={{ color: "var(--bone)" }}>
                {agent.name}
              </span>
              <LifeStageBadge stage={agent.stage} />
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-sm font-bold" style={{ color: "var(--gold)" }}>
                ${agent.earned.toLocaleString()}
              </span>
              <span className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>
                earned
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
