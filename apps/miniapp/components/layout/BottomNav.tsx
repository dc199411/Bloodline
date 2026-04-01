"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Target, Rocket, Globe, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Bounties", href: "/bounties", icon: Target },
  { label: "Deploy", href: "/deploy", icon: Rocket },
  { label: "Civ", href: "/civ", icon: Globe },
  { label: "Profile", href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px]"
      style={{ background: "var(--deep)", borderTop: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-2 py-1"
            >
              <Icon
                size={20}
                style={{ color: isActive ? "var(--blood)" : "var(--muted)" }}
              />
              <span
                className="font-mono text-[9px] uppercase tracking-wider"
                style={{ color: isActive ? "var(--blood)" : "var(--muted)" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
