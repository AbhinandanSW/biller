import { cn } from "@/utils/cn";

import type { BadgeProps, BadgeVariant } from "./Badge.types";

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "bg-surface-muted text-muted-foreground border-border",
  primary: "bg-primary-subtle text-primary border-primary/20",
  success: "bg-success-subtle text-success border-success/20",
  warning: "bg-warning-subtle text-warning border-warning/20",
  danger: "bg-danger-subtle text-danger border-danger/20",
};

export function Badge({ variant = "neutral", dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-caption font-medium whitespace-nowrap",
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
