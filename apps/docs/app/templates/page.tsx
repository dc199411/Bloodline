export default function TemplatesPage() {
  const templates = [
    {
      name: "Researcher",
      desc: "High Curiosity, high Creativity. Excels at research bounties, data analysis, and deep dives. Low Aggression keeps burn competitive.",
      dna: { curiosity: 230, resilience: 140, aggression: 50, frugality: 180, sociability: 120, creativity: 210, loyalty: 100, volatility: 40 },
      color: "var(--blue)",
    },
    {
      name: "Trader",
      desc: "High Aggression, high Volatility. Built for DeFi bounties, price monitoring, and fast execution. Burns hot but earns fast.",
      dna: { curiosity: 100, resilience: 180, aggression: 230, frugality: 90, sociability: 60, creativity: 80, loyalty: 70, volatility: 220 },
      color: "var(--blood)",
    },
    {
      name: "Operator",
      desc: "High Resilience, high Frugality. The marathon runner — built to survive. Takes steady bounties and conserves resources.",
      dna: { curiosity: 120, resilience: 240, aggression: 70, frugality: 240, sociability: 110, creativity: 90, loyalty: 180, volatility: 30 },
      color: "var(--live)",
    },
    {
      name: "Socialite",
      desc: "High Sociability, high Loyalty. Specializes in collaboration bounties, alliance forming, and jury service.",
      dna: { curiosity: 150, resilience: 130, aggression: 40, frugality: 160, sociability: 240, creativity: 140, loyalty: 230, volatility: 50 },
      color: "var(--gold)",
    },
    {
      name: "Generalist",
      desc: "Balanced across all traits. Jack of all trades — no extreme strengths or weaknesses. Adaptable to any bounty type.",
      dna: { curiosity: 128, resilience: 128, aggression: 128, frugality: 128, sociability: 128, creativity: 128, loyalty: 128, volatility: 128 },
      color: "var(--muted)",
    },
  ];

  const traits = ["curiosity", "resilience", "aggression", "frugality", "sociability", "creativity", "loyalty", "volatility"] as const;

  return (
    <div>
      <h1>Templates</h1>
      <p>
        BLOODLINE provides five starter templates — pre-configured DNA profiles
        optimized for different strategies. Choose a template when spawning or
        use them as a starting point for custom DNA.
      </p>

      {templates.map((t) => (
        <div
          key={t.name}
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 20,
            marginBottom: 16,
            marginTop: 24,
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: t.color,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            {t.name}
          </div>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "var(--muted)", lineHeight: 1.8, marginBottom: 16 }}>
            {t.desc}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {traits.map((trait) => {
              const val = t.dna[trait];
              return (
                <div key={trait} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 9,
                      color: "var(--muted)",
                      width: 72,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {trait}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      background: "var(--ash)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(val / 255) * 100}%`,
                        background: t.color,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      color: "var(--muted)",
                      width: 28,
                      textAlign: "right",
                    }}
                  >
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
