"use client";

import { useMemo } from "react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StatBlock } from "@/components/ui/StatBlock";
import { useUserProfile } from "@/lib/hooks";
import { User, Wallet, Copy } from "lucide-react";
import { useState } from "react";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ProfilePage() {
  const [copied, setCopied] = useState(false);
  const { walletAddress, authToken } = useUserProfile();
  const displayAddress = useMemo(
    () => (walletAddress ? shortenAddress(walletAddress) : "No wallet connected"),
    [walletAddress],
  );

  const handleCopy = () => {
    if (!walletAddress || typeof navigator === "undefined") {
      return;
    }

    void navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center gap-2">
        <User size={18} style={{ color: "var(--bone)" }} />
        <h1 className="font-syne text-lg font-black" style={{ color: "var(--bone)" }}>
          PROFILE
        </h1>
      </div>

      {/* Wallet */}
      <div
        className="flex items-center gap-3 rounded-lg p-4"
        style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
      >
        <Wallet size={20} style={{ color: "var(--blue)" }} />
        <div className="flex flex-1 flex-col">
          <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Wallet Session
          </span>
          <span className="font-mono text-sm" style={{ color: "var(--bone)" }}>
            {displayAddress}
          </span>
        </div>
        <button onClick={handleCopy} className="p-1" disabled={!walletAddress} aria-label="Copy wallet address">
          <Copy size={14} style={{ color: copied ? "var(--live)" : "var(--muted)" }} />
        </button>
      </div>

      {/* Stats */}
      <SectionLabel label="YOUR STATS" />
      <div className="grid grid-cols-3 gap-2">
        <StatBlock value={walletAddress ? "Live" : "0"} label="Session" color="var(--blue)" />
        <StatBlock value={authToken ? "Ready" : "Locked"} label="API Auth" color={authToken ? "var(--live)" : "var(--dying)"} />
        <StatBlock value={walletAddress ? "Yes" : "No"} label="Wallet" color={walletAddress ? "var(--gold)" : "var(--muted)"} />
      </div>

      <SectionLabel label="YOUR AGENTS" />
      <div
        className="flex flex-col items-center gap-2 rounded-lg py-8"
        style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
      >
        <p className="font-mono text-xs" style={{ color: "var(--muted)" }}>
          {walletAddress
            ? "This session was restored from local storage. Agent ownership views still need to be wired to an in-app wallet flow."
            : "No wallet connect flow is implemented in the miniapp yet. A wallet session only appears if bloodline.walletAddress and bloodline.authToken were written to local storage externally."}
        </p>
      </div>
    </div>
  );
}
