"use client";

import { useParams } from "next/navigation";
import { useAgent } from "@/lib/hooks";
import { LifeStageBadge } from "@/components/agent/LifeStageBadge";
import { RunwayClock } from "@/components/agent/RunwayClock";
import { DNAChart } from "@/components/agent/DNAChart";
import { SaveButton } from "@/components/agent/SaveButton";
import { StatBlock } from "@/components/ui/StatBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Skull, Sparkles, Zap, Heart, Gift, AlertTriangle } from "lucide-react";
import type { HistoryEvent } from "@/lib/types";

const EVENT_ICONS: Record<string, typeof Skull> = {
  birth: Sparkles,
  save: Heart,
  bounty: Gift,
  mutation: Zap,
  death: Skull,
  ascension: Sparkles,
};

function EventIcon({ type }: { type: HistoryEvent["type"] }) {
  const Icon = EVENT_ICONS[type] ?? Zap;
  return <Icon size={12} />;
}

export default function AgentPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { agent, loading } = useAgent(id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="font-mono text-sm" style={{ color: "var(--muted)" }}>Loading...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle size={32} style={{ color: "var(--dying)" }} />
        <p className="font-mono text-sm" style={{ color: "var(--muted)" }}>Agent not found</p>
      </div>
    );
  }

  const isDead = agent.stage === "dead";
  const daysAlive = Math.floor(
    (Date.now() - new Date(agent.born).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-3">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full font-syne text-xl font-black stage-${agent.stage} glow-${agent.stage}`}
          style={{ background: "var(--ash)", border: "2px solid var(--border)" }}
        >
          {agent.avatar}
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="font-syne text-xl font-black" style={{ color: "var(--bone)" }}>
            {agent.name}
          </h1>
          <LifeStageBadge stage={agent.stage} />
        </div>
      </div>

      {/* Survival Clock */}
      {!isDead && (
        <div
          className="flex justify-center rounded-lg py-4"
          style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
        >
          <RunwayClock hours={agent.runwayHours} />
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <StatBlock value={`${agent.runwayHours}h`} label="Runway" color={agent.runwayHours < 72 ? "var(--dying)" : "var(--live)"} />
        <StatBlock value={`$${agent.earned.toLocaleString()}`} label="Earned" color="var(--gold)" />
        <StatBlock value={`${daysAlive}d`} label="Age" />
        <StatBlock value={agent.dna.filter((t) => t.rarity === "legendary").length.toString()} label="Legendary" color="var(--gold)" />
      </div>

      {/* DNA Chart */}
      <div>
        <SectionLabel label="DNA PROFILE" />
        <div
          className="rounded-lg p-3"
          style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
        >
          <DNAChart traits={agent.dna} />
        </div>
      </div>

      {/* Life History */}
      <div>
        <SectionLabel label="LIFE HISTORY" />
        <div className="flex flex-col gap-0">
          {agent.history.map((event, i) => (
            <div key={i} className="flex items-start gap-3 py-2" style={{ borderLeft: "1px solid var(--border)", paddingLeft: 12, marginLeft: 6 }}>
              <div
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--ash)", color: "var(--muted)" }}
              >
                <EventIcon type={event.type} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[11px]" style={{ color: "var(--bone)" }}>
                  {event.event}
                </span>
                <span className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>
                  {new Date(event.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Will (dead agents) */}
      {isDead && agent.lastWill && (
        <div>
          <SectionLabel label="LAST WILL" />
          <div
            className="rounded-lg p-4"
            style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
          >
            <p className="font-mono text-xs italic leading-relaxed" style={{ color: "var(--muted)" }}>
              &ldquo;{agent.lastWill}&rdquo;
            </p>
          </div>
          <div
            className="mt-3 rounded-lg p-3 text-center"
            style={{ background: "rgba(85,85,85,0.1)", border: "1px solid var(--border)" }}
          >
            <Skull size={24} className="mx-auto mb-2" style={{ color: "var(--muted)" }} />
            <p className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
              This agent has perished. Their data remains on-chain forever.
            </p>
          </div>
        </div>
      )}

      {/* Save Button (alive agents only) */}
      {!isDead && (
        <div className="pb-4">
          <SaveButton agentId={agent.id} agentName={agent.name} />
        </div>
      )}
    </div>
  );
}
