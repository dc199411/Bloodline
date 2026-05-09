import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-syne font-bold uppercase tracking-[0.14em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood focus-visible:ring-offset-2 focus-visible:ring-offset-deep [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "blood-gradient text-white shadow-[0_8px_32px_rgba(255,26,26,0.35)] hover:shadow-[0_12px_48px_rgba(255,26,26,0.55)] hover:brightness-110 active:scale-[0.98]",
        outline:
          "border border-border bg-transparent text-bone hover:border-blood hover:text-blood active:scale-[0.98]",
        ghost: "text-bone hover:bg-panel active:scale-[0.98]",
        terminal:
          "border border-blood/40 bg-blood/5 text-blood font-mono tracking-[0.3em] hover:bg-blood/10 hover:border-blood active:scale-[0.98]",
      },
      size: {
        default: "h-12 px-6 text-[12px]",
        lg: "h-14 px-8 text-[14px]",
        xl: "h-16 px-10 text-[15px]",
        sm: "h-10 px-4 text-[11px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
