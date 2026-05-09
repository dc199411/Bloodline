import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <Logo size={28} glow={false} />
          <span className="font-display font-bold text-[14px] tracking-[-0.04em]">
            <span className="text-blood">BLOOD</span>
            <span className="text-bone">LINE</span>
          </span>
          <span className="mono-label text-[9px] text-muted hidden xs:inline">
            v0.1 · COMING SOON
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mono-label text-[9px] text-muted">
          <a
            href="https://github.com/bloodlineai-xyz/bloodline"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-blood transition-colors"
          >
            GitHub
          </a>
          <a href="#manifesto" className="hover:text-bone transition-colors">
            Manifesto
          </a>
          <a href="#status" className="hover:text-bone transition-colors">
            Status
          </a>
          <span>© BLOODLINE Labs</span>
        </div>
      </div>
    </footer>
  );
}
