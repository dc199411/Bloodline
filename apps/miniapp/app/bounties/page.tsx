"use client";

import { BountyFeed } from "@/components/bounty/BountyFeed";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useBounties } from "@/lib/hooks";
import { Target } from "lucide-react";

export default function BountiesPage() {
  const { data: bounties, loading } = useBounties();

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center gap-2">
        <Target size={18} style={{ color: "var(--blood)" }} />
        <h1 className="font-syne text-lg font-black" style={{ color: "var(--bone)" }}>
          BOUNTIES
        </h1>
      </div>
      <SectionLabel label="ACTIVE BOUNTIES" />
      {loading ? (
        <div className="py-8 text-center font-mono text-xs" style={{ color: "var(--muted)" }}>
          Loading...
        </div>
      ) : (
        <BountyFeed bounties={bounties} />
      )}
    </div>
  );
}
