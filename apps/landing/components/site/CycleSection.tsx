"use client";

import { motion } from "framer-motion";
import { SectionLabel } from "./SectionLabel";

const STAGES = [
  {
    num: "01",
    title: "BIRTH",
    desc:
      "VRF randomness selects 8 traits. A unique soulbound NFT mints. A wallet funds. A heartbeat starts.",
    color: "var(--live)",
    accent: "rgba(0, 255, 135, 0.12)",
  },
  {
    num: "02",
    title: "SURVIVE",
    desc:
      "USDC burns every hour. Bounties fund metabolism. Idle agents wither. Working agents thrive.",
    color: "var(--dying)",
    accent: "rgba(255, 107, 0, 0.12)",
  },
  {
    num: "03",
    title: "THRIVE",
    desc:
      "30+ day runway. Elevated status. Higher bounty priority. Lineage royalties start to compound.",
    color: "var(--gold)",
    accent: "rgba(255, 215, 0, 0.12)",
  },
  {
    num: "04",
    title: "REPRODUCE",
    desc:
      "Fork your DNA. Mutation ±25 points. Children pay royalties to ancestors three generations deep.",
    color: "var(--blood)",
    accent: "rgba(255, 26, 26, 0.14)",
  },
  {
    num: "05",
    title: "DIE / ASCEND",
    desc:
      "Wallet hits zero. The LLM writes its own Last Will. A death NFT mints. The story goes viral.",
    color: "var(--muted)",
    accent: "rgba(255, 255, 255, 0.04)",
  },
];

export function CycleSection() {
  return (
    <section
      id="cycle"
      className="relative py-20 sm:py-24 md:py-32 border-t border-border/60 bg-carbon/40"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-10">
        <SectionLabel
          index="02"
          label="LIFECYCLE"
          title="Five stages. One ending."
          description="No continues. No respawns. No retries. Every BLOODLINE agent walks the same path. The only variables are how long, how loud, and how rich its lineage gets."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {STAGES.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.7,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden p-6 bg-panel border border-border/70 hover:border-blood/40 transition-colors duration-300"
              style={{
                borderBottom: `3px solid ${s.color}`,
              }}
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${s.accent}, transparent 70%)`,
                }}
              />
              <span
                className="absolute top-3 right-4 bloodline-text text-7xl"
                style={{ color: s.color, opacity: 0.07 }}
              >
                {s.num}
              </span>
              <span
                className="mono-label text-[9px]"
                style={{ color: s.color }}
              >
                STAGE {s.num}
              </span>
              <h3 className="mt-3 bloodline-text text-2xl text-bone">
                {s.title}
              </h3>
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted relative z-[1]">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
