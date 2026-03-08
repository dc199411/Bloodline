"use client";

import { useState } from "react";

const TRAITS = [
  { name: "Curiosity", key: "curiosity", color: "#4FC3F7" },
  { name: "Resilience", key: "resilience", color: "#FF6B00" },
  { name: "Aggression", key: "aggression", color: "#FF1A1A" },
  { name: "Frugality", key: "frugality", color: "#00FF87" },
  { name: "Sociability", key: "sociability", color: "#FFD700" },
  { name: "Creativity", key: "creativity", color: "#E040FB" },
  { name: "Loyalty", key: "loyalty", color: "#4FC3F7" },
  { name: "Volatility", key: "volatility", color: "#FF1744" },
];

function computeBurnRate(frugality: number): number {
  const base = 0.001;
  const modifier = 1 - frugality / 255;
  return base * (0.5 + modifier * 1.5);
}

function computeRarity(values: number[]): string {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const extremes = values.filter((v) => v > 220 || v < 35).length;
  if (extremes >= 5) return "LEGENDARY";
  if (extremes >= 3) return "RARE";
  if (avg > 180 || avg < 75) return "UNCOMMON";
  return "COMMON";
}

export default function DNAVisualizer() {
  const [values, setValues] = useState<number[]>(
    TRAITS.map(() => 128)
  );

  const update = (i: number, v: number) => {
    setValues((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  const burnRate = computeBurnRate(values[3]);
  const rarity = computeRarity(values);

  const rarityColor: Record<string, string> = {
    COMMON: "var(--muted)",
    UNCOMMON: "var(--blue)",
    RARE: "var(--gold)",
    LEGENDARY: "var(--blood)",
  };

  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 14,
          color: "var(--bone)",
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        DNA Visualizer
      </div>

      {TRAITS.map((trait, i) => (
        <div
          key={trait.key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              color: trait.color,
              width: 80,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {trait.name}
          </span>
          <input
            type="range"
            min={0}
            max={255}
            value={values[i]}
            onChange={(e) => update(i, Number(e.target.value))}
            style={{
              flex: 1,
              accentColor: trait.color,
              height: 4,
            }}
          />
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              color: "var(--muted)",
              width: 32,
              textAlign: "right",
            }}
          >
            {values[i]}
          </span>
        </div>
      ))}

      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: 4,
            }}
          >
            Burn Rate
          </div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 14,
              color: "var(--dying)",
              fontWeight: 700,
            }}
          >
            {burnRate.toFixed(5)} ETH/hr
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: 4,
            }}
          >
            Rarity
          </div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 14,
              fontWeight: 800,
              color: rarityColor[rarity],
            }}
          >
            {rarity}
          </div>
        </div>
      </div>
    </div>
  );
}
