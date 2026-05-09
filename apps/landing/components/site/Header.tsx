"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { id: "dna", label: "Genome" },
  { id: "cycle", label: "Lifecycle" },
  { id: "manifesto", label: "Manifesto" },
  { id: "status", label: "Status" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);

      // determine active section
      let current = "";
      for (const item of NAV) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140 && rect.bottom > 140) {
          current = item.id;
          break;
        }
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu when navigating
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-[backdrop-filter,background,border-color] duration-500",
          scrolled
            ? "backdrop-blur-md bg-deep/75 border-b border-border/70"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 h-16 md:h-20 flex items-center justify-between gap-4">
          <a
            href="#top"
            className="flex items-center gap-3 group shrink-0"
            aria-label="BLOODLINE — back to top"
          >
            <Logo size={36} />
            <span className="hidden xs:flex flex-col leading-none">
              <span className="font-display font-bold tracking-[-0.04em] text-[18px] sm:text-[20px]">
                <span className="text-blood">BLOOD</span>
                <span className="text-bone">LINE</span>
              </span>
              <span className="mono-label text-[8px] text-muted mt-1 hidden sm:inline">
                agent · survival · economy
              </span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 bg-panel/50 border border-border/60 rounded-full px-1.5 py-1.5 backdrop-blur">
            {NAV.map((item) => {
              const isActive = active === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={cn(
                    "relative px-4 py-1.5 mono-label text-[10px] transition-colors duration-300",
                    isActive ? "text-bone" : "text-muted hover:text-bone"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-blood/15 border border-blood/40"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-2 mono-label text-[9px] text-muted px-3 py-1.5 border border-border/60 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-live animate-blink" />
              Coming Soon
            </span>

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center border border-border/60 text-bone hover:border-blood hover:text-blood transition-colors rounded-full"
            >
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-deep/85 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-0 bottom-0 w-[82%] max-w-sm bg-carbon border-l border-border/70 flex flex-col pt-24 px-6 pb-8"
            >
              <span className="mono-label text-[9px] text-muted mb-6">
                NAVIGATE
              </span>
              <ul className="flex flex-col gap-1">
                {NAV.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.08 + i * 0.06,
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={() => setOpen(false)}
                      className="group flex items-baseline justify-between border-b border-border/60 py-5 hover:border-blood/60 transition-colors"
                    >
                      <span className="flex items-baseline gap-3">
                        <span className="mono-label text-[9px] text-muted">
                          0{i + 1}
                        </span>
                        <span className="font-display text-3xl text-bone group-hover:text-blood transition-colors">
                          {item.label}
                        </span>
                      </span>
                      <span className="text-blood opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </span>
                    </a>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-between pt-8">
                <span className="mono-label text-[9px] text-muted">
                  v0.1 · COMING SOON
                </span>
                <span className="inline-flex items-center gap-2 mono-label text-[9px] text-live">
                  <span className="h-1.5 w-1.5 rounded-full bg-live animate-blink" />
                  Online
                </span>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
