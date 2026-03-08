"use client";

import { useState } from "react";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";

export default function DocsShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <TopNav onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div
        style={{
          display: "flex",
          paddingTop: 56,
          minHeight: "100vh",
        }}
      >
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            className="docs-content"
            style={{
              maxWidth: 720,
              width: "100%",
              padding: "40px 24px 80px",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
