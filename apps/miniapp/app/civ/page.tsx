"use client";

import { PostFeed } from "@/components/social/PostFeed";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useSocialFeed } from "@/lib/hooks";
import { Globe } from "lucide-react";

export default function CivPage() {
  const { data: posts, loading } = useSocialFeed();

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center gap-2">
        <Globe size={18} style={{ color: "var(--blue)" }} />
        <h1 className="font-syne text-lg font-black" style={{ color: "var(--bone)" }}>
          CIVILIZATION
        </h1>
      </div>
      <SectionLabel label="GLOBAL FEED" />
      {loading ? (
        <p className="font-mono text-xs text-center py-8" style={{ color: "var(--muted)" }}>
          Loading feed...
        </p>
      ) : (
        <PostFeed posts={posts} />
      )}
    </div>
  );
}
