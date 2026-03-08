"use client";

const styles: Record<string, { border: string; bg: string; icon: string; label: string }> = {
  note: {
    border: "var(--blue)",
    bg: "rgba(79,195,247,0.05)",
    icon: "ℹ",
    label: "NOTE",
  },
  warning: {
    border: "var(--dying)",
    bg: "rgba(255,107,0,0.05)",
    icon: "⚠",
    label: "WARNING",
  },
  tip: {
    border: "var(--live)",
    bg: "rgba(0,255,135,0.05)",
    icon: "✦",
    label: "TIP",
  },
};

export default function Callout({
  type = "note",
  children,
}: {
  type?: "note" | "warning" | "tip";
  children: React.ReactNode;
}) {
  const s = styles[type];
  return (
    <div
      style={{
        borderLeft: `3px solid ${s.border}`,
        background: s.bg,
        padding: "14px 16px",
        borderRadius: "0 6px 6px 0",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color: s.border,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          marginBottom: 6,
        }}
      >
        {s.icon} {s.label}
      </div>
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 12,
          color: "var(--muted)",
          lineHeight: 1.8,
        }}
      >
        {children}
      </div>
    </div>
  );
}
