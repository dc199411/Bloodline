"use client";

import { motion } from "framer-motion";
import { Check, Loader, CircleDashed } from "lucide-react";
import { SectionLabel } from "./SectionLabel";

const ROADMAP = [
  {
    status: "done" as const,
    label: "Onchain protocol",
    body: "BloodlineRegistry, MetabolismOracle, BountyBoard, RoyaltyRouter. Foundry. 136 tests passing.",
  },
  {
    status: "done" as const,
    label: "Agent runtime",
    body: "LangGraph orchestration. 5 agent templates. BullMQ queue. Hourly burn check via Chainlink Automation.",
  },
  {
    status: "active" as const,
    label: "Companion app",
    body: "Live agent feed. DNA visualizer. Bounty board. Currently in private beta. Built. Tuning UX.",
  },
  {
    status: "active" as const,
    label: "Audit pass",
    body: "Internal review of registry contracts and royalty router. External audit booked.",
  },
  {
    status: "queued" as const,
    label: "Public launch",
    body: "First wave of agents goes live. Open bounty board. Fork-the-source incentives. Hype day.",
  },
  {
    status: "queued" as const,
    label: "Lineage launch",
    body: "Forking opens. Lineage royalties activate. First multi-generation bloodlines emerge.",
  },
];

const ICONS: Record<typeof ROADMAP[number]["status"], typeof Check> = {
  done: Check,
  active: Loader,
  queued: CircleDashed,
};

const COLORS: Record<typeof ROADMAP[number]["status"], string> = {
  done: "var(--live)",
  active: "var(--gold)",
  queued: "var(--muted)",
};

const STATUS_LABEL: Record<typeof ROADMAP[number]["status"], string> = {
  done: "SHIPPED",
  active: "IN PROGRESS",
  queued: "QUEUED",
};

export function StatusSection() {
  return (
    <section
      id="status"
      className="relative py-20 sm:py-24 md:py-32 border-t border-border/60 bg-carbon/40"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-10">
        <SectionLabel
          index="04"
          label="STATUS"
          title="Receipts, not promises."
          description="The protocol is built. The runtime is built. The app is built. We're not vaporware. We're a coiled spring waiting on the right launch window."
        />

        <div className="relative">
          {/* spine */}
          <div
            aria-hidden
            className="absolute left-4 sm:left-6 top-2 bottom-2 w-px bg-border"
          />

          <div className="flex flex-col gap-3">
            {ROADMAP.map((item, i) => {
              const Icon = ICONS[item.status];
              const color = COLORS[item.status];
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative pl-12 sm:pl-16 py-4 group"
                >
                  <span
                    className="absolute left-0 top-4 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full border bg-deep"
                    style={{
                      borderColor: color,
                      boxShadow:
                        item.status === "active"
                          ? `0 0 16px ${color}`
                          : undefined,
                    }}
                  >
                    <Icon
                      size={14}
                      style={{ color }}
                      className={
                        item.status === "active" ? "animate-spin-slow" : ""
                      }
                    />
                  </span>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h3 className="bloodline-text text-xl text-bone">
                      {item.label}
                    </h3>
                    <span
                      className="mono-label text-[9px]"
                      style={{ color }}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono text-sm text-muted leading-relaxed max-w-2xl">
                    {item.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
