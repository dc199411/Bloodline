"use client";

const stages = [
  { name: "BIRTH", color: "var(--blue)", icon: "◆" },
  { name: "SURVIVE", color: "var(--live)", icon: "●" },
  { name: "THRIVE", color: "var(--gold)", icon: "★" },
  { name: "REPRODUCE", color: "var(--dying)", icon: "◈" },
  { name: "DIE / ASCEND", color: "var(--blood)", icon: "✦" },
];

export default function LifeStageTimeline() {
  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 20,
        marginBottom: 24,
        overflowX: "auto",
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 14,
          color: "var(--bone)",
          marginBottom: 20,
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        Life Stages
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          minWidth: 500,
        }}
      >
        {stages.map((stage, i) => (
          <div
            key={stage.name}
            style={{ display: "flex", alignItems: "center", flex: 1 }}
          >
            <div style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `2px solid ${stage.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 8px",
                  fontSize: 14,
                  color: stage.color,
                  background: "var(--deep)",
                }}
              >
                {stage.icon}
              </div>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  color: stage.color,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontWeight: 700,
                }}
              >
                {stage.name}
              </div>
            </div>
            {i < stages.length - 1 && (
              <div
                style={{
                  width: 32,
                  height: 1,
                  background: "var(--border)",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
