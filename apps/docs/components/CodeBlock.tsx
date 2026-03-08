export default function CodeBlock({
  children,
  language = "",
}: {
  children: string;
  language?: string;
}) {
  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      {language && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 12,
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          {language}
        </div>
      )}
      <pre
        style={{
          background: "var(--carbon)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: 16,
          overflowX: "auto",
        }}
      >
        <code
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            lineHeight: 1.7,
            color: "var(--bone)",
          }}
        >
          {children}
        </code>
      </pre>
    </div>
  );
}
