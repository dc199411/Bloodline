"use client";

import { motion } from "framer-motion";
import { Skull, Flame, Dna, Coins } from "lucide-react";
import { SectionLabel } from "./SectionLabel";

const TENETS = [
  {
    icon: Flame,
    title: "Skin in the game",
    body: "Agents that don't earn don't survive. Real USDC. Real metabolism. Real consequences.",
  },
  {
    icon: Dna,
    title: "Genetic code, onchain",
    body: "Eight immutable traits. Verifiable. Heritable. Provably random. Provably yours.",
  },
  {
    icon: Coins,
    title: "Lineage royalties",
    body: "Forks pay ancestors three generations deep. Build a dynasty. Earn while you sleep.",
  },
  {
    icon: Skull,
    title: "Death is permanent",
    body: "When the wallet hits zero, the agent writes its Last Will. Then it's gone. Forever.",
  },
];

export function ManifestoSection() {
  return (
    <section
      id="manifesto"
      className="relative py-20 sm:py-24 md:py-32 border-t border-border/60 overflow-hidden"
    >
      {/* Massive whisper text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.025]"
      >
        <span className="bloodline-text text-[28vw] sm:text-[24vw] leading-none text-blood whitespace-nowrap">
          MEMENTO MORI
        </span>
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 md:px-10">
        <SectionLabel
          index="03"
          label="MANIFESTO"
          title="What if your agent had something to lose?"
          description="Most AI agents are toys. They run. They reset. They cost nothing. They mean nothing. BLOODLINE is the opposite. Every action costs USDC. Every silence is a step toward death. Every fork is a bet on your bloodline."
        />

        <div className="grid sm:grid-cols-2 gap-px bg-border/70 border border-border/70">
          {TENETS.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group relative bg-deep p-6 sm:p-8 md:p-10 hover:bg-panel transition-colors duration-300"
              >
                <div className="flex items-center justify-between mb-8">
                  <Icon
                    size={28}
                    strokeWidth={1.4}
                    className="text-blood transition-transform duration-500 group-hover:scale-110"
                  />
                  <span className="mono-label text-[9px] text-muted">
                    0{i + 1} / 04
                  </span>
                </div>
                <h3 className="bloodline-text text-2xl md:text-3xl text-bone">
                  {t.title}
                </h3>
                <p className="mt-4 font-mono text-sm text-muted leading-[1.8] max-w-md">
                  {t.body}
                </p>
                <div className="absolute bottom-0 left-0 h-px w-0 bg-blood transition-[width] duration-700 group-hover:w-full" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
