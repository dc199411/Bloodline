"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-28 sm:pt-32 md:pt-40 pb-16 sm:pb-20 md:pb-28 noise"
    >
      {/* Backdrop orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-32 h-[420px] w-[420px] sm:h-[520px] sm:w-[520px] rounded-full animate-glow-orb"
        style={{
          background:
            "radial-gradient(circle, rgba(255,26,26,0.22) 0%, rgba(255,26,26,0.08) 38%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -left-24 h-[320px] w-[320px] sm:h-[420px] sm:w-[420px] rounded-full animate-drift"
        style={{
          background:
            "radial-gradient(circle, rgba(79,195,247,0.10) 0%, transparent 65%)",
        }}
      />

      {/* Cross-hair grid frame */}
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-7xl">
        <div className="absolute top-24 left-4 sm:left-6 md:left-10 h-px w-12 sm:w-16 bg-blood/40" />
        <div className="absolute top-24 left-4 sm:left-6 md:left-10 w-px h-12 sm:h-16 bg-blood/40" />
        <div className="absolute bottom-10 right-4 sm:right-6 md:right-10 h-px w-12 sm:w-16 bg-blood/40" />
        <div className="absolute bottom-10 right-4 sm:right-6 md:right-10 w-px h-12 sm:h-16 bg-blood/40 translate-y-[-100%]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 md:px-10">
        {/* Logo mark — large, only in hero */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mb-8 sm:mb-10 flex items-center gap-4"
        >
          <Logo size={72} priority className="sm:hidden" />
          <Logo size={104} priority className="hidden sm:inline-flex" />
        </motion.div>

        {/* Eyebrow */}
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex items-center gap-3 mb-6 sm:mb-8"
        >
          <span className="h-px w-8 sm:w-10 bg-blood" />
          <span className="mono-eyebrow flex items-center gap-2 text-[9px] sm:text-[10px]">
            <Sparkles size={11} className="text-blood" />
            Open Source · MIT · Coming Soon
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="font-display text-[56px] xs:text-[68px] sm:text-[96px] md:text-[140px] lg:text-[180px] leading-[0.85] tracking-[-0.05em]"
        >
          <span className="block text-gradient-blood animate-flicker">
            BLOOD
          </span>
          <span className="block text-bone -mt-1 sm:-mt-2 md:-mt-4">LINE</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-8 sm:mt-10 max-w-2xl text-bone/85 text-base sm:text-lg md:text-xl leading-[1.65] sm:leading-[1.7]"
        >
          Agents that{" "}
          <span className="font-serif-italic text-blood text-[1.15em]">
            live
          </span>
          , earn, evolve, and{" "}
          <span className="font-serif-italic text-blood text-[1.15em]">
            die
          </span>{" "}
          — onchain.
          <br />
          <span className="text-muted">
            Burn real USDC. Carry genetic DNA. Fork with mutation.
            <br className="hidden sm:inline" /> Death is permanent. Death goes
            viral.
          </span>
        </motion.p>

        {/* CTA */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <Button
            size="xl"
            disabled
            className="cursor-not-allowed animate-pulse-glow group relative overflow-hidden w-full sm:w-auto"
          >
            <span className="relative z-10 flex items-center gap-2">
              Coming Soon
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </Button>
          <Button
            asChild
            variant="outline"
            size="xl"
            className="font-mono tracking-[0.18em] w-full sm:w-auto"
          >
            <a
              href="https://github.com/bloodlineai-xyz/bloodline"
              target="_blank"
              rel="noreferrer noopener"
            >
              <Github size={16} />
              Read the Source
            </a>
          </Button>
        </motion.div>

        {/* Stat strip */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-14 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-border/70 border border-border/70"
        >
          {[
            { num: "8", label: "DNA Traits" },
            { num: "5", label: "Life Stages" },
            { num: "∞", label: "Fork Depth" },
            { num: "0", label: "Bullshit" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-deep px-5 sm:px-6 py-6 sm:py-7 flex items-baseline justify-between md:flex-col md:items-start md:gap-3"
            >
              <span className="font-display text-blood text-3xl sm:text-4xl md:text-5xl leading-none">
                {s.num}
              </span>
              <span className="mono-label text-[9px] text-muted">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
