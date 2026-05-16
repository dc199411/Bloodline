"use client";

import Link from "next/link";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "/";

export default function TopNav({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: "rgba(8,8,8,0.95)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 100,
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onToggleSidebar}
          className="lg:hidden"
          style={{
            background: "none",
            border: "none",
            color: "var(--bone)",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Toggle sidebar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="5" x2="17" y2="5" />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="15" x2="17" y2="15" />
          </svg>
        </button>
        <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 8, textDecoration: "none" }}>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 900,
              fontSize: 18,
              color: "var(--blood)",
              letterSpacing: "-0.5px",
            }}
          >
            BLOODLINE
          </span>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontWeight: 400,
              fontSize: 11,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            DOCS
          </span>
        </Link>
      </div>
      <a
        href={APP_URL}
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          color: "var(--blood)",
          textDecoration: "none",
          border: "1px solid var(--blood)",
          padding: "6px 14px",
          borderRadius: 4,
          transition: "all 0.2s",
        }}
      >
        Open App →
      </a>
    </header>
  );
}
