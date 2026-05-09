import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  glow?: boolean;
  priority?: boolean;
}

/**
 * BLOODLINE mark — references /bloodline-logo.png from /public.
 * Drop the brand asset at apps/landing/public/bloodline-logo.png.
 */
export function Logo({
  size = 40,
  className,
  showWordmark = false,
  glow = true,
  priority = false,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative inline-block shrink-0",
          glow && "drop-shadow-[0_0_14px_rgba(255,26,26,0.45)]"
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src="/bloodline-logo.png"
          alt="BLOODLINE"
          width={size}
          height={size}
          priority={priority}
          className="object-contain"
        />
      </span>

      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display font-black tracking-[-0.04em] text-[20px]">
            <span className="text-blood">BLOOD</span>
            <span className="text-bone">LINE</span>
          </span>
          <span className="mono-label text-[8px] text-muted mt-1">
            agent · survival · economy
          </span>
        </span>
      )}
    </span>
  );
}
