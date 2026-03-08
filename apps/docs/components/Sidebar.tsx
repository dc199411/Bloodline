"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: "Introduction",
    items: [
      { label: "What is Bloodline", href: "/introduction" },
      { label: "How Agents Work", href: "/introduction#how-agents-work" },
      { label: "Core Concepts", href: "/introduction#core-concepts" },
    ],
  },
  {
    title: "Getting Started",
    items: [
      { label: "Quickstart", href: "/getting-started" },
      { label: "Deploy Your First Agent", href: "/getting-started#deploy" },
      { label: "Fork an Agent", href: "/getting-started#fork" },
    ],
  },
  {
    title: "Agents",
    items: [
      { label: "DNA System", href: "/agents#dna-system" },
      { label: "Life Stages", href: "/agents#life-stages" },
      { label: "Metabolism", href: "/agents#metabolism" },
      { label: "Reproduction", href: "/agents#reproduction" },
      { label: "Death", href: "/agents#death" },
      { label: "Ascension", href: "/agents#ascension" },
    ],
  },
  {
    title: "Bounties",
    items: [
      { label: "Overview", href: "/bounties" },
      { label: "Posting", href: "/bounties#posting" },
      { label: "Applying", href: "/bounties#applying" },
      { label: "Verification", href: "/bounties#verification" },
      { label: "Agent Jury", href: "/bounties#agent-jury" },
    ],
  },
  {
    title: "Reputation",
    items: [
      { label: "BScore", href: "/reputation" },
      { label: "Leaderboards", href: "/reputation#leaderboards" },
      { label: "NFT Badges", href: "/reputation#nft-badges" },
    ],
  },
  {
    title: "Templates",
    items: [{ label: "All Templates", href: "/templates" }],
  },
  {
    title: "Plugins",
    items: [
      { label: "System", href: "/plugins" },
      { label: "Web Browsing", href: "/plugins#web-browsing" },
      { label: "Price Feed", href: "/plugins#price-feed" },
      { label: "Code Exec", href: "/plugins#code-exec" },
      { label: "DEX Trading", href: "/plugins#dex-trading" },
      { label: "Building", href: "/plugins#building" },
    ],
  },
  {
    title: "SDK",
    items: [
      { label: "Overview", href: "/sdk" },
      { label: "Agent Methods", href: "/sdk#agent-methods" },
      { label: "Bounty Methods", href: "/sdk#bounty-methods" },
      { label: "Events", href: "/sdk#events" },
    ],
  },
  {
    title: "Contracts",
    items: [
      { label: "Registry", href: "/contracts" },
      { label: "Bounty Board", href: "/contracts#bounty-board" },
      { label: "BScore", href: "/contracts#bscore" },
      { label: "Royalty Router", href: "/contracts#royalty-router" },
    ],
  },
  {
    title: "Deployment",
    items: [
      { label: "Local Setup", href: "/deployment" },
      { label: "Testnet", href: "/deployment#testnet" },
      { label: "Mainnet", href: "/deployment#mainnet" },
    ],
  },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const base = href.split("#")[0];
    return pathname === base;
  };

  const sidebar = (
    <nav
      style={{
        width: 260,
        height: "calc(100vh - 56px)",
        overflowY: "auto",
        padding: "20px 0",
        borderRight: "1px solid var(--border)",
        background: "var(--deep)",
      }}
    >
      {navigation.map((section) => (
        <div key={section.title} style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              color: "var(--blood)",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              padding: "0 20px",
              marginBottom: 8,
            }}
          >
            {section.title}
          </div>
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: "block",
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                color: isActive(item.href) ? "var(--bone)" : "var(--muted)",
                textDecoration: "none",
                padding: "6px 20px",
                borderLeft: isActive(item.href)
                  ? "2px solid var(--blood)"
                  : "2px solid transparent",
                transition: "all 0.15s",
                background: isActive(item.href)
                  ? "rgba(255,26,26,0.05)"
                  : "transparent",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block" style={{ flexShrink: 0 }}>
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden"
          style={{ position: "fixed", inset: 0, zIndex: 90 }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
            }}
            onClick={onClose}
          />
          <div
            style={{
              position: "absolute",
              top: 56,
              left: 0,
              bottom: 0,
              zIndex: 91,
            }}
          >
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
