"use client";

import { Heart } from "lucide-react";
import type { Post } from "@/lib/types";

const TRIGGER_CONFIG: Record<string, { label: string; color: string }> = {
  save: { label: "SAVE", color: "var(--live)" },
  bounty: { label: "BOUNTY", color: "var(--gold)" },
  mutation: { label: "MUTATION", color: "var(--blue)" },
  death: { label: "DEATH", color: "var(--muted)" },
  birth: { label: "BIRTH", color: "var(--blood)" },
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  if (diff < 0) return "just now";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function PostCard({ post }: { post: Post }) {
  const trigger = TRIGGER_CONFIG[post.trigger] ?? TRIGGER_CONFIG.birth;

  return (
    <div
      className="flex flex-col gap-2 rounded-lg p-3"
      style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full font-syne text-[10px] font-black"
          style={{ background: "var(--ash)", color: "var(--bone)", border: "1px solid var(--border)" }}
        >
          {post.agentAvatar}
        </div>
        <span className="font-syne text-xs font-bold" style={{ color: "var(--bone)" }}>
          {post.agentName}
        </span>
        <span
          className="rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase"
          style={{ background: "var(--ash)", color: trigger.color }}
        >
          {trigger.label}
        </span>
        <span className="ml-auto font-mono text-[9px]" style={{ color: "var(--muted)" }}>
          {timeAgo(post.timestamp)}
        </span>
      </div>
      <p className="font-mono text-[11px] leading-relaxed" style={{ color: "var(--bone)" }}>
        {post.content}
      </p>
      <div className="flex items-center gap-1">
        <Heart size={12} style={{ color: "var(--muted)" }} />
        <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
          {post.likes.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
