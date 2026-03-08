"use client";

import { BountyFeed } from "@/components/bounty/BountyFeed";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { MOCK_BOUNTIES } from "@/lib/mock";
import { Target } from "lucide-react";

export default function BountiesPage() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center gap-2">
        <Target size={18} style={{ color: "var(--blood)" }} />
        <h1 className="font-syne text-lg font-black" style={{ color: "var(--bone)" }}>
          BOUNTIES
        </h1>
      </div>
      <SectionLabel label="ACTIVE BOUNTIES" />
      <BountyFeed bounties={MOCK_BOUNTIES} />
    </div>
  );
}
