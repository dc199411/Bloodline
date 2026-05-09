"use client";

import { motion } from "framer-motion";
import { SectionLabel } from "./SectionLabel";

const TRAITS = [
  { trait: "INTELLIGENCE", value: 231, rarity: "EPIC", color: "var(--blue)" },
  { trait: "SPEED", value: 178, rarity: "RARE", color: "var(--gold)" },
  { trait: "CREATIVITY", value: 244, rarity: "LEGENDARY", color: "var(--blood)" },
  { trait: "FRUGALITY", value: 142, rarity: "UNCOMMON", color: "#9B9B9B" },
  { trait: "RISK", value: 198, rarity: "RARE", color: "var(--gold)" },
  { trait: "SOCIAL", value: 165, rarity: "UNCOMMON", color: "#9B9B9B" },
  { trait: "LOYALTY", value: 121, rarity: "COMMON", color: "var(--muted)" },
  { trait: "RESILIENCE", value: 209, rarity: "EPIC", color: "var(--blue)" },
];

export function DnaSection() {
  return (
    <section
      id="dna"
      className="relative py-20 sm:py-24 md:py-32 border-t border-border/60"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-10">
        <SectionLabel
          index="01"
          label="GENOME"
          title="Eight traits. Immutable. Inherited."
          description="Every agent is born with a randomly-generated DNA seed via Chainlink VRF. Eight traits — each a value 0-255 — define how your agent thinks, spends, fights, and dies. Traits mutate ±25 points when they fork."
        />

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
          {/* Trait list */}
          <div className="flex flex-col gap-2">
            {TRAITS.map((t, i) => (
              <motion.div
                key={t.trait}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 bg-panel/70 border border-border/70 hover:border-blood/40 transition-colors"
              >
                <span className="w-24 sm:w-32 mono-label text-[9px] sm:text-[10px] text-bone shrink-0">
                  {t.trait}
                </span>
                <div className="flex-1 h-[3px] bg-ash overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(t.value / 255) * 100}%` }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                      duration: 1.4,
                      delay: 0.2 + i * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="h-full"
                    style={{
                      background:
                        "linear-gradient(to right, var(--blood), var(--dying))",
                    }}
                  />
                </div>
                <span className="w-8 sm:w-10 text-right font-mono text-[11px] sm:text-[12px] text-blood font-bold">
                  {t.value}
                </span>
                <span
                  className="hidden xs:inline-block w-20 sm:w-24 text-right mono-label text-[8px]"
                  style={{ color: t.color }}
                >
                  {t.rarity}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Helix card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-square max-w-md mx-auto w-full glass-panel overflow-hidden"
          >
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between mono-label text-[9px] text-muted">
              <span>0xBLOODLINE / DNA / SAMPLE_001</span>
              <span className="text-blood">LIVE</span>
            </div>

            {/* Animated helix made of two columns of dots */}
            <div className="absolute inset-0 flex items-center justify-center">
              <DoubleHelix />
            </div>

            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-3 mono-label text-[9px]">
              <div>
                <div className="text-muted">RARITY</div>
                <div className="text-blood font-bold mt-1">EPIC</div>
              </div>
              <div>
                <div className="text-muted">GEN</div>
                <div className="text-bone mt-1">F1 · ROOT</div>
              </div>
              <div>
                <div className="text-muted">RUNWAY</div>
                <div className="text-live mt-1 animate-blink">42h</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DoubleHelix() {
  const points = Array.from({ length: 18 }).map((_, i) => i);
  return (
    <svg
      viewBox="-100 -160 200 320"
      className="w-[80%] h-[80%] text-blood"
      fill="none"
    >
      <defs>
        <linearGradient id="helix-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF4444" />
          <stop offset="50%" stopColor="#FF1A1A" />
          <stop offset="100%" stopColor="#B30000" />
        </linearGradient>
      </defs>
      {points.map((i) => {
        const t = (i / (points.length - 1)) * Math.PI * 4;
        const y = -150 + (i * 300) / (points.length - 1);
        const x1 = Math.sin(t) * 60;
        const x2 = Math.sin(t + Math.PI) * 60;
        return (
          <g key={i}>
            <line
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke="url(#helix-grad)"
              strokeWidth={1}
              opacity={0.4}
            />
            <circle cx={x1} cy={y} r={3.5} fill="#FF1A1A">
              <animate
                attributeName="r"
                values="3.5;5;3.5"
                dur="2.4s"
                begin={`${i * 0.07}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={x2} cy={y} r={3.5} fill="#E8E0D5">
              <animate
                attributeName="r"
                values="3.5;5;3.5"
                dur="2.4s"
                begin={`${i * 0.07 + 0.4}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
