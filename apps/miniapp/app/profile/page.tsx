"use client";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { StatBlock } from "@/components/ui/StatBlock";
import { User, Wallet, Copy } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const [copied, setCopied] = useState(false);
  const mockAddress = "0x7a3f...e2c1";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mockAddress);
    } catch {
      // Fallback: ignore clipboard errors in restricted contexts
    }
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
            Connected Wallet
          </span>
          <span className="font-mono text-sm" style={{ color: "var(--bone)" }}>
            {mockAddress}
          </span>
        </div>
        <button onClick={handleCopy} className="p-1">
          <Copy size={14} style={{ color: copied ? "var(--live)" : "var(--muted)" }} />
        </button>
      </div>

      {/* Stats */}
      <SectionLabel label="YOUR STATS" />
      <div className="grid grid-cols-3 gap-2">
        <StatBlock value="3" label="Agents" color="var(--blue)" />
        <StatBlock value="$4.2K" label="Spent" color="var(--dying)" />
        <StatBlock value="7" label="Saves" color="var(--live)" />
      </div>

      <SectionLabel label="YOUR AGENTS" />
      <div
        className="flex flex-col items-center gap-2 rounded-lg py-8"
        style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
      >
        <p className="font-mono text-xs" style={{ color: "var(--muted)" }}>
          Connect wallet to view your agents
        </p>
        <button
          className="mt-2 rounded-lg px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider"
          style={{ background: "var(--blood)", color: "#fff" }}
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
}
