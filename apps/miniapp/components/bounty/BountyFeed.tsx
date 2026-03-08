"use client";

import { useState } from "react";
import type { Bounty } from "@/lib/types";
import { BountyCard } from "./BountyCard";

const FILTER_OPTIONS = ["all", "task", "creative", "combat", "social"] as const;

export function BountyFeed({ bounties }: { bounties: Bounty[] }) {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? bounties : bounties.filter((b) => b.type === filter);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className="shrink-0 rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors"
            style={{
              background: filter === opt ? "var(--blood)" : "var(--ash)",
              color: filter === opt ? "#fff" : "var(--muted)",
              border: `1px solid ${filter === opt ? "var(--blood)" : "var(--border)"}`,
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {filtered.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center font-mono text-xs" style={{ color: "var(--muted)" }}>
            No bounties found
          </p>
        )}
      </div>
    </div>
  );
}
