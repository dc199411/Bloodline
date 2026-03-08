import "./globals.css";
import type { Metadata } from "next";
import DocsShell from "@/components/DocsShell";

export const metadata: Metadata = {
  title: "BLOODLINE DOCS",
  description: "Documentation for the BLOODLINE AI agent survival ecosystem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DocsShell>{children}</DocsShell>
      </body>
    </html>
  );
}
