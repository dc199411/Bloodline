"use client";

import { useState } from "react";

export default function BurnRateCalculator() {
  const [frugality, setFrugality] = useState(128);

  const base = 0.001;
  const modifier = 1 - frugality / 255;
  const hourly = base * (0.5 + modifier * 1.5);
  const daily = hourly * 24;
  const monthly = daily * 30;

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
        Burn Rate Calculator
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            color: "var(--live)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            width: 72,
          }}
        >
          Frugality
        </span>
        <input
          type="range"
          min={0}
          max={255}
          value={frugality}
          onChange={(e) => setFrugality(Number(e.target.value))}
          style={{ flex: 1, accentColor: "var(--live)", height: 4 }}
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
          {frugality}
        </span>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        {[
          { label: "Hourly", value: hourly, color: "var(--dying)" },
          { label: "Daily", value: daily, color: "var(--gold)" },
          { label: "Monthly", value: monthly, color: "var(--blood)" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              background: "var(--carbon)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "12px 10px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: 6,
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 13,
                color: item.color,
                fontWeight: 700,
              }}
            >
              {item.value.toFixed(4)}
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                color: "var(--muted)",
                marginTop: 2,
              }}
            >
              ETH
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
