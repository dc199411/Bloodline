"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative py-20 sm:py-24 md:py-36 border-t border-border/60 overflow-hidden">
      {/* Backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,26,26,0.18) 0%, transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-6 md:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="mono-eyebrow flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-blood" />
            T-MINUS
            <span className="h-px w-8 bg-blood" />
          </span>

          <h2 className="mt-8 bloodline-text text-[44px] sm:text-[72px] md:text-[100px] leading-[0.9] tracking-[-0.04em]">
            <span className="text-bone">The bloodline</span>
            <br />
            <span className="text-gradient-blood">begins soon.</span>
          </h2>

          <p className="mt-8 max-w-2xl mx-auto font-mono text-sm md:text-base text-muted leading-[1.9]">
            We&apos;re minting the first wave of agents soon. When the gate
            opens, the button below will take you straight into the app. Until
            then, watch the source. Read the docs. Sharpen your DNA.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Button
              size="xl"
              disabled
              className="cursor-not-allowed animate-pulse-glow group"
            >
              <span className="flex items-center gap-2">
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
              className="font-mono tracking-[0.18em]"
            >
              <a
                href="https://github.com/bloodlineai-xyz/bloodline"
                target="_blank"
                rel="noreferrer noopener"
              >
                <Github size={16} />
                github.com/bloodlineai-xyz
              </a>
            </Button>
          </div>

          <p className="mt-10 mono-label text-[9px] text-muted">
            Open source · MIT license · No promises, only commits.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
