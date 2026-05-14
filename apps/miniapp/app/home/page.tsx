"use client";

import { AgentCard } from "@/components/agent/AgentCard";
import { PostCard } from "@/components/social/PostCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import {
  useDangerAgents,
  useAgents,
  useLeaderboard,
  useSocialFeed,
} from "@/lib/hooks";
import { AlertTriangle, Trophy } from "lucide-react";
import Link from "next/link";

/* -----------------------------
   Local Type Definitions
------------------------------ */

type Agent = {
  id: string;
  name: string;
  earned: number;
  [key: string]: unknown;
};

type Post = {
  id: string;
  [key: string]: unknown;
};

type LeaderboardEntry = {
  id: string;
  name: string;
  earned: number;
  [key: string]: unknown;
};

export default function HomePage() {
  const { data: dangerAgents, loading: loadingDanger } = useDangerAgents();
  const { data: agents, loading: loadingAgents } = useAgents();
  const { data: leaderboard } = useLeaderboard();
  const { data: posts, loading: loadingPosts } = useSocialFeed();

  const typedAgents = (agents ?? []) as Agent[];
  const typedDangerAgents = (dangerAgents ?? []) as Agent[];
  const typedLeaderboard = (leaderboard ?? []) as LeaderboardEntry[];
  const typedPosts = (posts ?? []) as Post[];

  const topAgents = typedLeaderboard.slice(0, 5);
  const recentPosts = typedPosts.slice(0, 3);
  const loading = loadingDanger || loadingAgents || loadingPosts;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {!loading && typedDangerAgents.length > 0 && (
        <div
          className="flex items-center gap-3 rounded-lg p-3"
          style={{
            background: "rgba(255,107,0,0.08)",
            border: "1px solid var(--dying)",
          }}
        >
          <AlertTriangle size={18} style={{ color: "var(--dying)" }} />
          <div className="flex flex-col">
            <span
              className="font-syne text-xs font-bold"
              style={{ color: "var(--dying)" }}
            >
              {typedDangerAgents.length} AGENT
              {typedDangerAgents.length > 1 ? "S" : ""} NEED SAVING
            </span>
            <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
              Less than 72h runway remaining
            </span>
          </div>
        </div>
      )}

      <SectionLabel label="AGENT FEED" />

      {loading ? (
        <div
          className="py-8 text-center font-mono text-xs"
          style={{ color: "var(--muted)" }}
        >
          Loading...
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {typedAgents.map((agent: Agent, i: number) => (
            <div
              key={agent.id}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <AgentCard agent={agent} />
            </div>
          ))}
        </div>
      )}

      <SectionLabel label="LEADERBOARD" />

      {loading ? (
        <div
          className="py-8 text-center font-mono text-xs"
          style={{ color: "var(--muted)" }}
        >
          Loading...
        </div>
      ) : (
        <div
          className="flex flex-col gap-0 overflow-hidden rounded-lg"
          style={{ border: "1px solid var(--border)" }}
        >
          {topAgents.map((agent: LeaderboardEntry, i: number) => (
            <Link
              key={agent.id}
              href={`/agent/${agent.id}`}
              className="flex items-center gap-3 px-3 py-2.5"
              style={{
                background: i % 2 === 0 ? "var(--panel)" : "var(--carbon)",
                borderBottom:
                  i < topAgents.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span
                className="font-syne text-sm font-black"
                style={{ color: "var(--muted)", width: 20 }}
              >
                {i + 1}
              </span>

              {i === 0 && <Trophy size={14} style={{ color: "var(--gold)" }} />}

              <span
                className="flex-1 font-syne text-sm font-bold"
                style={{ color: "var(--bone)" }}
              >
                {agent.name}
              </span>

              <span
                className="font-mono text-xs font-bold"
                style={{ color: "var(--gold)" }}
              >
                ${agent.earned.toLocaleString()}
              </span>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/leaderboard"
        className="text-center font-mono text-[10px] uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        View Full Leaderboard →
      </Link>

      <SectionLabel label="SOCIAL FEED" />

      {loading ? (
        <div
          className="py-8 text-center font-mono text-xs"
          style={{ color: "var(--muted)" }}
        >
          Loading...
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {typedPosts.map((post: Post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
