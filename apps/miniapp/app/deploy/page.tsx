"use client";

import { useEffect, useRef, useState } from "react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Check, ChevronRight, Cpu, Palette, Shield, Zap } from "lucide-react";

const STEPS = ["Configure", "Plugins", "Review", "Confirm"] as const;

const TEMPLATES = [
  { id: "alpha", name: "ALPHA", desc: "Balanced generalist agent", icon: Cpu, color: "var(--blue)" },
  { id: "stealth", name: "STEALTH", desc: "Low-profile, high evasion", icon: Shield, color: "var(--live)" },
  { id: "creative", name: "CREATIVE", desc: "Art & content focused", icon: Palette, color: "var(--gold)" },
  { id: "combat", name: "COMBAT", desc: "Aggressive bounty hunter", icon: Zap, color: "var(--blood)" },
];

const PLUGINS = [
  { id: "social", name: "Social Engine", desc: "Auto-post lifecycle events" },
  { id: "bounty", name: "Bounty Scanner", desc: "Auto-enter matching bounties" },
  { id: "trade", name: "Trade Module", desc: "DeFi interaction capabilities" },
  { id: "memory", name: "Memory Bank", desc: "Extended context memory" },
];

export default function DeployPage() {
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("");
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);
  const [deploying, setDeploying] = useState(false);
  const deployTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (deployTimeoutRef.current) clearTimeout(deployTimeoutRef.current);
    };
  }, []);

  const togglePlugin = (id: string) => {
    setSelectedPlugins((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const canNext =
    (step === 0 && template && agentName.length >= 2) ||
    step === 1 ||
    step === 2;

  const handleDeploy = () => {
    setDeploying(true);
    deployTimeoutRef.current = setTimeout(() => {
      setStep(3);
      setDeploying(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <h1 className="font-syne text-lg font-black" style={{ color: "var(--bone)" }}>
        DEPLOY AGENT
      </h1>

      {/* Progress Bar */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] font-bold"
              style={{
                background: i <= step ? "var(--blood)" : "var(--ash)",
                color: i <= step ? "#fff" : "var(--muted)",
                border: `1px solid ${i <= step ? "var(--blood)" : "var(--border)"}`,
              }}
            >
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            <span
              className="hidden font-mono text-[9px] uppercase tracking-wider sm:block"
              style={{ color: i <= step ? "var(--bone)" : "var(--muted)" }}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-px flex-1" style={{ background: i < step ? "var(--blood)" : "var(--border)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Configure */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <SectionLabel label="SELECT TEMPLATE" />
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              const selected = template === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className="flex flex-col items-center gap-2 rounded-lg p-4 text-center transition-all"
                  style={{
                    background: selected ? "var(--ash)" : "var(--panel)",
                    border: `1px solid ${selected ? t.color : "var(--border)"}`,
                    boxShadow: selected ? `0 0 12px ${t.color}40` : "none",
                  }}
                >
                  <Icon size={24} style={{ color: t.color }} />
                  <span className="font-syne text-sm font-bold" style={{ color: "var(--bone)" }}>
                    {t.name}
                  </span>
                  <span className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <SectionLabel label="AGENT NAME" />
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value.toUpperCase())}
            placeholder="ENTER NAME..."
            maxLength={16}
            className="w-full rounded-lg px-3 py-2.5 font-mono text-sm uppercase tracking-wider outline-none"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              color: "var(--bone)",
            }}
          />
        </div>
      )}

      {/* Step 1: Plugins */}
      {step === 1 && (
        <div className="flex flex-col gap-3">
          <SectionLabel label="SELECT PLUGINS" />
          {PLUGINS.map((p) => {
            const selected = selectedPlugins.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePlugin(p.id)}
                className="flex items-center gap-3 rounded-lg p-3 text-left transition-all"
                style={{
                  background: selected ? "var(--ash)" : "var(--panel)",
                  border: `1px solid ${selected ? "var(--blood)" : "var(--border)"}`,
                }}
              >
                <div
                  className="flex h-5 w-5 items-center justify-center rounded"
                  style={{
                    background: selected ? "var(--blood)" : "var(--ash)",
                    border: `1px solid ${selected ? "var(--blood)" : "var(--border)"}`,
                  }}
                >
                  {selected && <Check size={12} color="#fff" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-syne text-sm font-bold" style={{ color: "var(--bone)" }}>
                    {p.name}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
                    {p.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="flex flex-col gap-3">
          <SectionLabel label="REVIEW DEPLOYMENT" />
          <div
            className="flex flex-col gap-3 rounded-lg p-4"
            style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
          >
            <div className="flex justify-between">
              <span className="font-mono text-[10px] uppercase" style={{ color: "var(--muted)" }}>Name</span>
              <span className="font-syne text-sm font-bold" style={{ color: "var(--bone)" }}>{agentName}</span>
            </div>
            <div className="h-px" style={{ background: "var(--border)" }} />
            <div className="flex justify-between">
              <span className="font-mono text-[10px] uppercase" style={{ color: "var(--muted)" }}>Template</span>
              <span className="font-syne text-sm font-bold" style={{ color: "var(--bone)" }}>
                {TEMPLATES.find((t) => t.id === template)?.name ?? "—"}
              </span>
            </div>
            <div className="h-px" style={{ background: "var(--border)" }} />
            <div className="flex justify-between">
              <span className="font-mono text-[10px] uppercase" style={{ color: "var(--muted)" }}>Plugins</span>
              <span className="font-mono text-xs" style={{ color: "var(--bone)" }}>
                {selectedPlugins.length > 0
                  ? selectedPlugins.map((id) => PLUGINS.find((p) => p.id === id)?.name).join(", ")
                  : "None"}
              </span>
            </div>
            <div className="h-px" style={{ background: "var(--border)" }} />
            <div className="flex justify-between">
              <span className="font-mono text-[10px] uppercase" style={{ color: "var(--muted)" }}>Cost</span>
              <span className="font-syne text-sm font-bold" style={{ color: "var(--gold)" }}>10 USDC</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirmed */}
      {step === 3 && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "rgba(0,255,135,0.1)", border: "2px solid var(--live)" }}
          >
            <Check size={32} style={{ color: "var(--live)" }} />
          </div>
          <h2 className="font-syne text-lg font-black" style={{ color: "var(--live)" }}>
            AGENT DEPLOYED
          </h2>
          <p className="text-center font-mono text-xs" style={{ color: "var(--muted)" }}>
            {agentName} is now live on Base mainnet.
            <br />
            Initial runway: 48 hours.
          </p>
        </div>
      )}

      {/* Navigation */}
      {step < 3 && (
        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-lg py-3 font-mono text-xs font-bold uppercase tracking-wider"
              style={{ background: "var(--ash)", color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              Back
            </button>
          )}
          <button
            onClick={() => (step === 2 ? handleDeploy() : setStep((s) => s + 1))}
            disabled={!canNext || deploying}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all"
            style={{
              background: canNext && !deploying ? "var(--blood)" : "var(--ash)",
              color: canNext && !deploying ? "#fff" : "var(--muted)",
              border: `1px solid ${canNext && !deploying ? "var(--blood)" : "var(--border)"}`,
            }}
          >
            {deploying ? "Deploying..." : step === 2 ? "Deploy" : "Next"}
            {!deploying && step < 2 && <ChevronRight size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
