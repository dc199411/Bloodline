"use client";

import { useEffect, useState } from "react";

interface RunwayClockProps {
  hours: number;
  compact?: boolean;
}

function formatTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RunwayClock({ hours, compact }: RunwayClockProps) {
  const [remaining, setRemaining] = useState(hours * 3600);

  useEffect(() => {
    setRemaining(hours * 3600);
  }, [hours]);

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining]);

  const isDanger = hours < 72;
  const color = remaining <= 0 ? "var(--muted)" : isDanger ? "var(--dying)" : "var(--live)";

  if (compact) {
    return (
      <span className="font-mono text-xs" style={{ color }}>
        {formatTime(remaining)}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="font-mono text-[10px] uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        Survival Clock
      </span>
      <span
        className={`font-syne text-3xl font-black tracking-wider ${isDanger ? "glow-danger" : "glow-alive"}`}
        style={{ color }}
      >
        {formatTime(remaining)}
      </span>
    </div>
  );
}
