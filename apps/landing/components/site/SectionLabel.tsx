"use client";

import { motion } from "framer-motion";

interface Props {
  index: string;
  label: string;
  title: string;
  description?: string;
}

export function SectionLabel({ index, label, title, description }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mb-12 md:mb-16"
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="mono-eyebrow text-muted">[{index}]</span>
        <span className="h-px flex-1 max-w-[80px] bg-border" />
        <span className="mono-eyebrow text-blood">{label}</span>
      </div>
      <h2 className="bloodline-text text-[36px] sm:text-[52px] md:text-[64px] leading-[0.95] tracking-[-0.04em] text-bone max-w-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-6 max-w-2xl font-mono text-sm md:text-base text-muted leading-relaxed">
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}
