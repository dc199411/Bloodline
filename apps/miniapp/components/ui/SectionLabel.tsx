"use client";

interface SectionLabelProps {
  label: string;
}

export function SectionLabel({ label }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span
        className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
    </div>
  );
}
