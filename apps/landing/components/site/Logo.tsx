import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  glow?: boolean;
}

/**
 * BLOODLINE mark — hexagonal frame, stylized B, DNA helix backdrop.
 * Pure SVG so it scales crisp on every device.
 */
export function Logo({
  size = 40,
  className,
  showWordmark = false,
  glow = true,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(glow && "drop-shadow-[0_0_12px_rgba(255,26,26,0.45)]")}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bl-b" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF4444" />
            <stop offset="55%" stopColor="#FF1A1A" />
            <stop offset="100%" stopColor="#8A0000" />
          </linearGradient>
          <radialGradient id="bl-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF1A1A" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#FF1A1A" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#FF1A1A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Inner glow */}
        <circle cx="100" cy="100" r="72" fill="url(#bl-glow)" />

        {/* Hexagonal outer frame */}
        <polygon
          points="100,12 178,55 178,145 100,188 22,145 22,55"
          fill="none"
          stroke="#FF1A1A"
          strokeWidth="2"
          opacity="0.95"
        />
        {/* Inner hex line */}
        <polygon
          points="100,22 168,60 168,140 100,178 32,140 32,60"
          fill="none"
          stroke="#FF1A1A"
          strokeWidth="0.75"
          opacity="0.45"
        />

        {/* DNA helix faint backdrop */}
        <g opacity="0.18" stroke="#FF1A1A" strokeWidth="1.2" fill="none">
          <path d="M70 50 C 130 70, 70 100, 130 120 S 70 170, 130 180" />
          <path d="M130 50 C 70 70, 130 100, 70 120 S 130 170, 70 180" />
        </g>

        {/* Stylized B — two stacked curved blades, blood gradient */}
        <g fill="url(#bl-b)">
          {/* Upper bowl — sweeping blade */}
          <path d="M 80 56 L 80 100 L 110 100 C 130 100, 138 88, 138 76 C 138 64, 130 56, 110 56 Z M 92 68 L 110 68 C 118 68, 122 72, 122 78 C 122 84, 118 88, 110 88 L 92 88 Z" />
          {/* Lower bowl — larger curved blade */}
          <path d="M 80 100 L 80 152 L 116 152 C 138 152, 148 138, 148 122 C 148 106, 138 100, 116 100 Z M 92 112 L 116 112 C 126 112, 132 116, 132 124 C 132 132, 126 140, 116 140 L 92 140 Z" />
        </g>

        {/* Corner ticks */}
        <g fill="#FF1A1A">
          <circle cx="100" cy="12" r="1.6" />
          <circle cx="178" cy="55" r="1.6" />
          <circle cx="178" cy="145" r="1.6" />
          <circle cx="100" cy="188" r="1.6" />
          <circle cx="22" cy="145" r="1.6" />
          <circle cx="22" cy="55" r="1.6" />
        </g>
      </svg>

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
