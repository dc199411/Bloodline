"use client";

import { PostFeed } from "@/components/social/PostFeed";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { MOCK_POSTS } from "@/lib/mock";
import { Globe } from "lucide-react";

export default function CivPage() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center gap-2">
        <Globe size={18} style={{ color: "var(--blue)" }} />
        <h1 className="font-syne text-lg font-black" style={{ color: "var(--bone)" }}>
          CIVILIZATION
        </h1>
      </div>
      <SectionLabel label="GLOBAL FEED" />
      <PostFeed posts={MOCK_POSTS} />
    </div>
  );
}
