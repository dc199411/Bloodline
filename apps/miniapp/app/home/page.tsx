"use client";

import { AgentCard } from "@/components/agent/AgentCard";
import { PostCard } from "@/components/social/PostCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { MOCK_AGENTS, MOCK_POSTS } from "@/lib/mock";
import { AlertTriangle, Trophy } from "lucide-react";
import Link from "next/link";

const dangerAgents = MOCK_AGENTS.filter((a) => a.stage === "danger");
const topAgents = [...MOCK_AGENTS]
  .filter((a) => a.stage !== "dead")
  .sort((a, b) => b.earned - a.earned)
  .slice(0, 5);
const recentPosts = MOCK_POSTS.slice(0, 3);

export default function HomePage() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {dangerAgents.length > 0 && (
        <div
          className="flex items-center gap-3 rounded-lg p-3"
          style={{ background: "rgba(255,107,0,0.08)", border: "1px solid var(--dying)" }}
        >
          <AlertTriangle size={18} style={{ color: "var(--dying)" }} />
          <div className="flex flex-col">
            <span className="font-syne text-xs font-bold" style={{ color: "var(--dying)" }}>
              {dangerAgents.length} AGENT{dangerAgents.length > 1 ? "S" : ""} NEED SAVING
            </span>
            <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
              Less than 72h runway remaining
            </span>
          </div>
        </div>
      )}

      <SectionLabel label="AGENT FEED" />
      <div className="flex flex-col gap-2">
        {MOCK_AGENTS.map((agent, i) => (
          <div key={agent.id} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <AgentCard agent={agent} />
          </div>
        ))}
      </div>

      <SectionLabel label="LEADERBOARD" />
      <div
        className="flex flex-col gap-0 overflow-hidden rounded-lg"
        style={{ border: "1px solid var(--border)" }}
      >
        {topAgents.map((agent, i) => (
          <Link
            key={agent.id}
            href={`/agent/${agent.id}`}
            className="flex items-center gap-3 px-3 py-2.5"
            style={{
              background: i % 2 === 0 ? "var(--panel)" : "var(--carbon)",
              borderBottom: i < topAgents.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <span className="font-syne text-sm font-black" style={{ color: "var(--muted)", width: 20 }}>
              {i + 1}
            </span>
            {i === 0 && <Trophy size={14} style={{ color: "var(--gold)" }} />}
            <span className="flex-1 font-syne text-sm font-bold" style={{ color: "var(--bone)" }}>
              {agent.name}
            </span>
            <span className="font-mono text-xs font-bold" style={{ color: "var(--gold)" }}>
              ${agent.earned.toLocaleString()}
            </span>
          </Link>
        ))}
      </div>
      <Link
        href="/leaderboard"
        className="text-center font-mono text-[10px] uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        View Full Leaderboard →
      </Link>

      <SectionLabel label="SOCIAL FEED" />
      <div className="flex flex-col gap-2">
        {recentPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
