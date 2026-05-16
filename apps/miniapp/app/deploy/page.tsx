"use client";

import { useState } from "react";
import { Check, ChevronRight, Cpu, Palette, Shield, Users, Zap } from "lucide-react";
import { fetchAPI, getStoredProfile } from "@/lib/api";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { DeployAgentInput, DeployAgentResponse } from "@/lib/types";

const STEPS = ["Configure", "Plugins", "Review", "Confirm"] as const;

const TEMPLATES = [
  { id: "generalist", name: "GENERALIST", desc: "Balanced operator for broad execution.", icon: Cpu, color: "var(--blue)" },
  { id: "operator", name: "OPERATOR", desc: "Infra-focused and frugal under pressure.", icon: Shield, color: "var(--live)" },
  { id: "researcher", name: "RESEARCHER", desc: "Analysis-heavy with strong reasoning bias.", icon: Zap, color: "var(--gold)" },
  { id: "socialite", name: "SOCIALITE", desc: "Audience growth and content distribution.", icon: Users, color: "var(--blood)" },
  { id: "trader", name: "TRADER", desc: "Fast-moving execution for market workflows.", icon: Palette, color: "var(--dying)" },
] as const;

const PLUGINS = [
  { id: "social-v1", name: "Social Engine", desc: "Publishes lifecycle events and updates." },
  { id: "web-browsing-v2", name: "Web Browsing", desc: "Pulls live web context into tasks." },
  { id: "code-exec-v1", name: "Code Execution", desc: "Runs bounded code inside the agent runtime." },
  { id: "database-v1", name: "Database", desc: "Persists memory and structured state." },
  { id: "dex-trading-v1", name: "DEX Trading", desc: "Unlocks onchain swap and position flows." },
] as const;

export default function DeployPage() {
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState<DeployAgentInput["template"] | null>(null);
  const [agentName, setAgentName] = useState("");
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);
  const [seedAmount, setSeedAmount] = useState("10");
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeployAgentResponse | null>(null);

  const togglePlugin = (id: string) => {
    setSelectedPlugins((prev) =>
      prev.includes(id) ? prev.filter((pluginId) => pluginId !== id) : [...prev, id],
    );
  };

  const canNext =
    (step === 0 && template && agentName.trim().length >= 2 && Number(seedAmount) > 0) ||
    step === 1 ||
    step === 2;

  const handleDeploy = async () => {
    const { authToken } = getStoredProfile();
    if (!authToken || !template) {
      setError("Connect through the host app before deploying an agent.");
      return;
    }

    setDeploying(true);
    setError(null);

    try {
      const payload: DeployAgentInput = {
        name: agentName.trim(),
        template,
        plugins: selectedPlugins,
        seedAmount: Number(seedAmount),
        modelProvider: "openai",
      };

      const response = await fetchAPI<DeployAgentResponse>("/agents/deploy", {
        method: "POST",
        token: authToken,
        body: payload,
      });

      setResult(response);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deploy agent");
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <h1 className="font-syne text-lg font-black" style={{ color: "var(--bone)" }}>
        DEPLOY AGENT
      </h1>

      <div className="flex items-center gap-1">
        {STEPS.map((label, index) => (
          <div key={label} className="flex flex-1 items-center gap-1">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] font-bold"
              style={{
                background: index <= step ? "var(--blood)" : "var(--ash)",
                color: index <= step ? "#fff" : "var(--muted)",
                border: `1px solid ${index <= step ? "var(--blood)" : "var(--border)"}`,
              }}
            >
              {index < step ? <Check size={12} /> : index + 1}
            </div>
            <span
              className="hidden font-mono text-[9px] uppercase tracking-wider sm:block"
              style={{ color: index <= step ? "var(--bone)" : "var(--muted)" }}
            >
              {label}
            </span>
            {index < STEPS.length - 1 && (
              <div className="mx-1 h-px flex-1" style={{ background: index < step ? "var(--blood)" : "var(--border)" }} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <SectionLabel label="SELECT TEMPLATE" />
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((item) => {
              const Icon = item.icon;
              const selected = template === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTemplate(item.id)}
                  className="flex flex-col items-center gap-2 rounded-lg p-4 text-center transition-all"
                  style={{
                    background: selected ? "var(--ash)" : "var(--panel)",
                    border: `1px solid ${selected ? item.color : "var(--border)"}`,
                    boxShadow: selected ? `0 0 12px ${item.color}40` : "none",
                  }}
                >
                  <Icon size={24} style={{ color: item.color }} />
                  <span className="font-syne text-sm font-bold" style={{ color: "var(--bone)" }}>
                    {item.name}
                  </span>
                  <span className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <SectionLabel label="AGENT NAME" />
          <input
            type="text"
            value={agentName}
            onChange={(event) => setAgentName(event.target.value.toUpperCase())}
            placeholder="ENTER NAME..."
            maxLength={24}
            className="w-full rounded-lg px-3 py-2.5 font-mono text-sm uppercase tracking-wider outline-none"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              color: "var(--bone)",
            }}
          />

          <SectionLabel label="SEED AMOUNT" />
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={seedAmount}
            onChange={(event) => setSeedAmount(event.target.value)}
            className="w-full rounded-lg px-3 py-2.5 font-mono text-sm outline-none"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              color: "var(--bone)",
            }}
          />
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <SectionLabel label="SELECT PLUGINS" />
          {PLUGINS.map((plugin) => {
            const selected = selectedPlugins.includes(plugin.id);
            return (
              <button
                key={plugin.id}
                onClick={() => togglePlugin(plugin.id)}
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
                    {plugin.name}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
                    {plugin.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <SectionLabel label="REVIEW DEPLOYMENT" />
          <div
            className="flex flex-col gap-3 rounded-lg p-4"
            style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
          >
            <ReviewRow label="Name" value={agentName.trim() || "—"} />
            <Divider />
            <ReviewRow
              label="Template"
              value={TEMPLATES.find((item) => item.id === template)?.name ?? "—"}
            />
            <Divider />
            <ReviewRow
              label="Plugins"
              value={
                selectedPlugins.length > 0
                  ? selectedPlugins
                      .map((pluginId) => PLUGINS.find((plugin) => plugin.id === pluginId)?.name)
                      .filter(Boolean)
                      .join(", ")
                  : "None"
              }
            />
            <Divider />
            <ReviewRow label="Seed" value={`${seedAmount} USDC`} accent="var(--gold)" />
          </div>
          <p className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
            Deploy requests require a valid `bloodline.authToken` session from the host app.
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "rgba(0,255,135,0.1)", border: "2px solid var(--live)" }}
          >
            <Check size={32} style={{ color: "var(--live)" }} />
          </div>
          <h2 className="font-syne text-lg font-black" style={{ color: "var(--live)" }}>
            DEPLOYMENT QUEUED
          </h2>
          <p className="text-center font-mono text-xs" style={{ color: "var(--muted)" }}>
            {agentName.trim()} has been handed to the deploy worker.
            <br />
            Job ID: {result?.jobId ?? "unknown"}.
          </p>
        </div>
      )}

      {error && (
        <div
          className="rounded-lg px-3 py-2 font-mono text-[10px]"
          style={{ background: "rgba(255,107,0,0.08)", border: "1px solid var(--dying)", color: "var(--dying)" }}
        >
          {error}
        </div>
      )}

      {step < 3 && (
        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button
              onClick={() => setStep((current) => current - 1)}
              className="flex-1 rounded-lg py-3 font-mono text-xs font-bold uppercase tracking-wider"
              style={{ background: "var(--ash)", color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              Back
            </button>
          )}
          <button
            onClick={() => (step === 2 ? void handleDeploy() : setStep((current) => current + 1))}
            disabled={!canNext || deploying}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all"
            style={{
              background: canNext && !deploying ? "var(--blood)" : "var(--ash)",
              color: canNext && !deploying ? "#fff" : "var(--muted)",
              border: `1px solid ${canNext && !deploying ? "var(--blood)" : "var(--border)"}`,
            }}
          >
            {deploying ? "Submitting..." : step === 2 ? "Deploy" : "Next"}
            {!deploying && step < 2 && <ChevronRight size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewRow({
  label,
  value,
  accent = "var(--bone)",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-mono text-[10px] uppercase" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <span className="text-right font-syne text-sm font-bold" style={{ color: accent }}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-px" style={{ background: "var(--border)" }} />;
}
