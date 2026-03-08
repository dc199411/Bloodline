"use client";

interface StatBlockProps {
  value: string | number;
  label: string;
  color?: string;
}

export function StatBlock({ value, label, color }: StatBlockProps) {
  return (
    <div
      className="flex flex-col items-center rounded-lg px-3 py-2.5"
      style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
    >
      <span
        className="font-syne text-lg font-bold"
        style={{ color: color ?? "var(--bone)" }}
      >
        {value}
      </span>
      <span
        className="font-mono text-[9px] uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
    </div>
  );
}
